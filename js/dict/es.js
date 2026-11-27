'use strict';
// The Spanish dictionary pack (Latin American Spanish), FLUENT.md. DICT.register('es', make): make() parses the word
// lists below (ES_LISTS, in es_words chunks at the end of this file), conjugates every verb and indexes every form.
// Vosotros forms are read (and accepted) but never produced: inflect() gives ustedes for "you all" unless asked.
// Checks: conj, agree, serestar, gustar, tense, accent (minor), contract (a el → al), prep (personal «a», «en el
// lunes», depender de…), article (me gusta café → el café; soy un estudiante → soy estudiante, minor).
// Word-list codes (the lemma|code|en|extras lines; see latin.js):
//   nouns   m · f · mf (both: estudiante) · m~ (a feminine by rule or f:…: amigo/amiga, profesor/profesora)
//           f* (feminine with el/un: el agua) · mpl / fpl (plural only, the lemma given in the plural)
//   verbs   v, or v.ie v.ue v.i (pedir) v.iei (sentir) v.ueu (dormir) v.zc v.y (construir) v.í (enviar) v.ú (continuar)
//           the irregulars are in IRR (by lemma); a lemma in -se is reflexive (levantarse)
//   adj     a (rojo/roja, azul, inglés/inglesa) · a= (no feminine: mejor, cortés)
//   others  adv prep conj pron det num int phrase name; X:form=fkey,form=fkey gives explicit forms (closed words)
//   extras  pl:… f:… pp:… (participle) alt:a,b n:5 (a number) st (estar-only adjective) nat (nationality) per
//           (a person: «a mi madre») work (a job) place (a place: «en la playa») coll (collective: la gente)
//           country (Soy de México) time:past|future|present dep (describes the subject: llegué cansada)

(() => {
  if (typeof LATIN === 'undefined' || typeof DICT === 'undefined') return;
  const { key, low, feat, EN, ROM, likeCase, capF } = LATIN;

  // ------------------------------------------------------------ sounds and accents
  const VOW = 'aeiouáéíóúü', STRONG = 'aeoáéíóú';
  const ACC = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }, DEACC = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
  const isV = ch => VOW.indexOf(ch) >= 0;
  // syllable nuclei: [[start, end]] (vowel runs, split between two strong vowels: «le-er», but «cie», «au» stay one)
  function nuclei(w) {
    const out = []; let cur = null;
    for (let i = 0; i < w.length; i++) {
      const ch = w[i].toLowerCase();
      if (!isV(ch)) { cur = null; continue; }
      if (ch === 'u' && i > 0 && /[gq]/i.test(w[i - 1]) && i + 1 < w.length && /[eiéí]/i.test(w[i + 1])) continue;   // the u of «que», «gui»
      if (cur && !(STRONG.indexOf(ch) >= 0 && STRONG.indexOf(w[cur[1]].toLowerCase()) >= 0)) { cur[1] = i; continue; }
      cur = [i, i]; out.push(cur);
    }
    return out;
  }
  const hasAcc = w => /[áéíóú]/.test(w);
  // which nucleus is stressed (index from the end, 1 = last)
  function stressFromEnd(w) {
    const N = nuclei(w);
    for (let n = 0; n < N.length; n++) for (let i = N[n][0]; i <= N[n][1]; i++) if (DEACC[w[i]]) return N.length - n;
    if (N.length < 2) return 1;
    return /[aeiouns]$/i.test(w) ? 2 : 1;
  }
  function stripAcc(w) { let o = ''; for (const ch of w) o += DEACC[ch] || ch; return o; }
  // put the written accent on the nucleus n from the end (on its strong vowel)
  function accentAt(w, fromEnd) {
    const N = nuclei(w), nu = N[N.length - fromEnd]; if (!nu) return w;
    let pos = -1;
    for (let i = nu[0]; i <= nu[1]; i++) if ('aeo'.indexOf(w[i].toLowerCase()) >= 0) pos = i;
    if (pos < 0) pos = nu[1];
    const ch = w[pos].toLowerCase(); if (!ACC[ch]) return w;
    return w.slice(0, pos) + ACC[ch] + w.slice(pos + 1);
  }
  // a word with syllables added at the end keeps its stress: write the accent the new word needs
  function respell(base, added, addSyl) {
    const s = stressFromEnd(base) + addSyl;
    const plain = stripAcc(base) + added;
    const def = /[aeiouns]$/i.test(plain) ? 2 : 1;
    return s === def && nuclei(plain).length > 1 ? plain : (nuclei(plain).length === 1 ? plain : accentAt(plain, s));
  }
  const accLastVowel = w => { for (let i = w.length - 1; i >= 0; i--) if (ACC[w[i]]) return w.slice(0, i) + ACC[w[i]] + w.slice(i + 1); return w; };
  function deaccentLast(w) {
    const m = /([áéíóú])([^aeiouáéíóú]*)$/.exec(w); if (!m) return w;
    const i = m.index;
    if ((w[i] === 'í' || w[i] === 'ú') && i > 0 && /[aeo]/.test(w[i - 1])) return w;   // país → países
    return w.slice(0, i) + DEACC[w[i]] + w.slice(i + 1);
  }

  // ------------------------------------------------------------ nouns and adjectives
  function plural(w) {
    if (/[aeiouáéó]$/i.test(w)) return w + 's';
    if (/[íú]$/i.test(w)) return w + 'es';
    if (/z$/i.test(w)) return w.slice(0, -1) + 'ces';
    if (/y$/i.test(w)) return w + 'es';
    const accLast = /[áéíóú][^aeiouáéíóú]*$/.test(w);
    if (/[sx]$/i.test(w)) { if (accLast) return deaccentLast(w) + 'es'; if (nuclei(w).length === 1) return w + 'es'; return w; }
    if (/n$/i.test(w)) { if (accLast) return deaccentLast(w) + 'es'; if (nuclei(w).length >= 2 && !hasAcc(w)) return accentAt(w, 2) + 'es'; return w + 'es'; }
    return w + 'es';
  }
  function feminine(w) {
    if (/o$/.test(w)) return w.slice(0, -1) + 'a';
    if (/(or|ón|ín|án|és|ol)$/.test(w)) return deaccentLast(w) + 'a';
    return w;
  }

  // ------------------------------------------------------------ verbs
  const E = {
    ar: { pres: ['o', 'as', 'a', 'amos', 'áis', 'an'], past: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'], impf: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
      subj: ['e', 'es', 'e', 'emos', 'éis', 'en'], ger: 'ando', part: 'ado', vt: 'ad' },
    er: { pres: ['o', 'es', 'e', 'emos', 'éis', 'en'], past: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], impf: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      subj: ['a', 'as', 'a', 'amos', 'áis', 'an'], ger: 'iendo', part: 'ido', vt: 'ed' },
    ir: { pres: ['o', 'es', 'e', 'imos', 'ís', 'en'], past: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], impf: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      subj: ['a', 'as', 'a', 'amos', 'áis', 'an'], ger: 'iendo', part: 'ido', vt: 'id' },
  };
  const FUT = ['é', 'ás', 'á', 'emos', 'éis', 'án'], COND = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
  const STRONGP = ['e', 'iste', 'o', 'imos', 'isteis', 'ieron'];
  const PN = ['1s', '2s', '3s', '1p', '2p', '3p'];
  const STRESSED = [true, true, true, false, false, true];
  // the irregular verbs: p (present, all six) · y (the yo form: tengo → tenga) · st (stem change) · pr (preterite stem:
  // tuv-) · pf (the preterite, all six) · f (future stem) · s (present subjunctive) · i (imperfect) · im (the tú
  // command) · g (gerund) · pp (participle) · vos (the vos present) · zc
  const IRR_TEXT = `ser|p:soy,eres,es,somos,sois,son vos:sos pf:fui,fuiste,fue,fuimos,fuisteis,fueron i:era,eras,era,éramos,erais,eran s:sea,seas,sea,seamos,seáis,sean im:sé g:siendo pp:sido
estar|p:estoy,estás,está,estamos,estáis,están pr:estuv s:esté,estés,esté,estemos,estéis,estén im:está
ir|p:voy,vas,va,vamos,vais,van vos:vas pf:fui,fuiste,fue,fuimos,fuisteis,fueron i:iba,ibas,iba,íbamos,ibais,iban s:vaya,vayas,vaya,vayamos,vayáis,vayan im:ve g:yendo imv:andá
haber|p:he,has,ha,hemos,habéis,han pr:hub f:habr s:haya,hayas,haya,hayamos,hayáis,hayan im:he
tener|y:tengo st:ie pr:tuv f:tendr im:ten
venir|y:vengo st:ie pr:vin f:vendr im:ven g:viniendo
poner|y:pongo pr:pus f:pondr im:pon pp:puesto
salir|y:salgo f:saldr im:sal
valer|y:valgo f:valdr
hacer|y:hago pr:hic f:har im:haz pp:hecho
decir|y:digo st:i pr:dij f:dir im:di g:diciendo pp:dicho
traer|y:traigo pr:traj
caer|y:caigo
oír|p:oigo,oyes,oye,oímos,oís,oyen
poder|st:ue pr:pud f:podr g:pudiendo
querer|st:ie pr:quis f:querr
saber|y:sé pr:sup f:sabr s:sepa,sepas,sepa,sepamos,sepáis,sepan
caber|y:quepo pr:cup f:cabr
dar|p:doy,das,da,damos,dais,dan pf:di,diste,dio,dimos,disteis,dieron s:dé,des,dé,demos,deis,den
ver|y:veo pf:vi,viste,vio,vimos,visteis,vieron i:veía,veías,veía,veíamos,veíais,veían pp:visto
andar|pr:anduv
reír|p:río,ríes,ríe,reímos,reís,ríen pf:reí,reíste,rio,reímos,reísteis,rieron s:ría,rías,ría,riamos,riais,rían g:riendo pp:reído im:ríe
freír|p:frío,fríes,fríe,freímos,freís,fríen pf:freí,freíste,frio,freímos,freísteis,frieron s:fría,frías,fría,friamos,friais,frían g:friendo pp:frito im:fríe
oler|p:huelo,hueles,huele,olemos,oléis,huelen s:huela,huelas,huela,olamos,oláis,huelan im:huele
ducir|zc pr:duj`;
  const IRR = {};
  for (const line of IRR_TEXT.split('\n')) {
    const [lemma, rest] = line.split('|'); const o = {};
    for (const x of rest.split(' ')) { const c = x.indexOf(':'); if (c < 0) o[x] = true; else o[x.slice(0, c)] = x.slice(c + 1).includes(',') ? x.slice(c + 1).split(',') : x.slice(c + 1); }
    IRR[lemma] = o;
  }
  // compounds that conjugate like their base (mantener like tener)
  const DERIV = {};
  'mantener obtener contener detener sostener entretener retener convenir prevenir intervenir provenir componer proponer suponer disponer exponer oponer reponer imponer deshacer rehacer satisfacer:hacer predecir:decir contradecir:decir atraer distraer contraer extraer sonreír:reír conducir:ducir producir:ducir traducir:ducir reducir:ducir introducir:ducir deducir:ducir'
    .split(' ').forEach(x => {
      const [d, b0] = x.split(':');
      const b = b0 || ['tener', 'venir', 'poner', 'hacer', 'traer'].find(v => d.endsWith(v));
      if (b) DERIV[d] = { base: b, pre: d.slice(0, d.length - b.length) };
    });
  if (DERIV.satisfacer) DERIV.satisfacer.pre = 'satis';

  function chg(stem, from, to) {
    const i = stem.lastIndexOf(from); if (i < 0) return stem;
    let rep = to;
    if (i === 0 && to === 'ue') rep = 'hue';
    if (i === 0 && to === 'ie') rep = 'ye';
    if (from === 'o' && to === 'ue' && stem[i - 1] === 'g') rep = 'üe';
    return stem.slice(0, i) + rep + stem.slice(i + 1);
  }
  // stem + ending with the spelling rules (busqué, llegué, empecé, cojo, sigo, venzo, conozco, construyo, leyó, leí…)
  // (each verb's spelling rules are worked out once: ortho(inf, cls))
  const OC = new Map();
  function ortho(inf, cls) {
    const k = inf + '|' + cls; let O = OC.get(k);
    if (O) return O;
    O = {
      front: /guar$/.test(inf) ? ['gu', 'gü'] : /car$/.test(inf) ? ['c', 'qu'] : /gar$/.test(inf) ? ['g', 'gu'] : /zar$/.test(inf) ? ['z', 'c'] : null,
      back: /g[eií]r$/.test(inf) ? ['g', 'j'] : /guir$/.test(inf) ? ['gu', 'g'] : /quir$/.test(inf) ? ['qu', 'c'] : cls === 'zc' ? ['c', 'zc'] : /[^aeiou]c[ei]r$/.test(inf) ? ['c', 'z'] : null,
      uir: /[^gq]uir$/.test(inf) || inf === 'huir',
      vinf: /[eií]r$/.test(inf),
    };
    OC.set(k, O);
    return O;
  }
  function join(stem, end, inf, cls) {
    const O = ortho(inf, cls), e0 = end[0];
    if (O.front && (e0 === 'e' || e0 === 'é')) { if (stem.endsWith(O.front[0])) stem = stem.slice(0, -O.front[0].length) + O.front[1]; }
    else if (O.back && (e0 === 'a' || e0 === 'o' || e0 === 'á' || e0 === 'ó') && stem.endsWith(O.back[0])) stem = stem.slice(0, -O.back[0].length) + O.back[1];
    // vowel stems: leyó, leyendo, leí, leíste, leído; construyo, construyó
    if (O.vinf) {
      const l = stem[stem.length - 1];
      if (l === 'a' || l === 'e' || l === 'o' || (O.uir && l === 'u')) {
        const e1 = end[1];
        if (e0 === 'i' && (e1 === 'a' || e1 === 'e' || e1 === 'o' || e1 === 'ó')) end = 'y' + end.slice(1);
        else if (!O.uir && e0 === 'i') end = 'í' + end.slice(1);
        else if (O.uir && 'aeoáéó'.indexOf(e0) >= 0) end = 'y' + end;
      }
    }
    return stem + end;
  }
  // every form of a verb: [[form, fkey]]
  const CJ = new Map();
  function conj(lemma, cls, pp) {
    const ck = lemma + '|' + (cls || '') + '|' + (pp || '');
    if (CJ.has(ck)) return CJ.get(ck);
    let out;
    const d = DERIV[lemma] || (/ducir$/.test(lemma) && lemma !== 'ducir' ? { base: 'ducir', pre: lemma.slice(0, -5) } : null);
    if (d) {
      out = conj0(d.base, d.base === 'ducir' ? 'zc' : cls, null, lemma).map(([f, k]) => {
        let w = d.pre + f;
        if (k === 'imp.2s' && /^(ten|ven|pon)$/.test(f)) w = d.pre + f.replace(/[eo]/, m => ACC[m]);
        if (/\.vo$/.test(k) || k === 'inf') return null;
        return [w, k];
      }).filter(Boolean);
      // the vos forms and the infinitive from the compound itself
      const vroot = stripAcc(lemma).slice(0, -1).replace(/[aeiou]$/, m => ACC[m]);
      out.push([lemma, 'inf'], [vroot + 's', 'pres.ind.2s.vo'], [vroot, 'imp.2s.vo']);
      if (pp) out = out.filter(x => !/^part/.test(x[1])).concat(partForms(pp));
    } else out = conj0(lemma, cls, pp, lemma);
    CJ.set(ck, out);
    return out;
  }
  function partForms(pp) { const st = pp.slice(0, -1); return [[pp, 'part.m.s'], [st + 'a', 'part.f.s'], [st + 'os', 'part.m.p'], [st + 'as', 'part.f.p']]; }
  function conj0(inf, cls, pp, lemma) {
    const X = IRR[inf] || {};
    const out = []; const add = (w, k) => { if (w) out.push([w, k]); };
    const t = inf.slice(-2) === 'ír' ? 'ir' : inf.slice(-2);
    if (!E[t]) return out;
    const V = E[t];
    const stem = inf.slice(0, -2);
    const st = X.st || cls;
    // the stressed stem (pienso), the -ir stem with e → i / o → u (pidió, durmió, sintamos)
    const strong = s => st === 'ie' || st === 'iei' ? chg(s, 'e', 'ie') : st === 'ue' || st === 'ueu' ? (inf === 'jugar' ? chg(s, 'u', 'ue') : chg(s, 'o', 'ue')) : st === 'i' ? chg(s, 'e', 'i') : s;
    const weak = s => (st === 'i' || st === 'iei') && t === 'ir' ? chg(s, 'e', 'i') : st === 'ueu' && t === 'ir' ? chg(s, 'o', 'u') : s;
    const accU = s => { if (cls !== 'í' && cls !== 'ú') return s; const v = cls === 'í' ? 'i' : 'u'; const i = s.lastIndexOf(v); return i < 0 ? s : s.slice(0, i) + ACC[v] + s.slice(i + 1); };
    // present
    let pres;
    if (X.p) pres = X.p.slice();
    else {
      pres = V.pres.map((en, n) => join(STRESSED[n] ? accU(strong(stem)) : stem, en, inf, cls));
      if (X.y) pres[0] = X.y;
    }
    pres.forEach((w, n) => add(w, 'pres.ind.' + PN[n]));
    if (inf === 'haber') add('hay', 'pres.ind.3s');
    add(X.vos || join(stem, ({ ar: 'ás', er: 'és', ir: 'ís' })[t], inf, cls), 'pres.ind.2s.vo');
    // preterite
    let past;
    if (X.pf) past = X.pf.slice();
    else if (X.pr) {
      const j = /j$/.test(X.pr);
      past = STRONGP.map((en, n) => { let s = X.pr; if (n === 2 && /c$/.test(s)) s = s.replace(/c$/, 'z'); return s + (j && n === 5 ? 'eron' : en); });
    } else {
      past = V.past.map((en, n) => join((n === 2 || n === 5) ? weak(stem) : stem, en, inf, cls));
    }
    past.forEach((w, n) => add(w, 'past.ind.' + PN[n]));
    // imperfect
    const impf = X.i ? X.i.slice() : V.impf.map(en => join(stem, en, inf, cls));
    impf.forEach((w, n) => add(w, 'impf.ind.' + PN[n]));
    // future, conditional
    const fs = X.f || stripAcc(inf);
    FUT.forEach((en, n) => add(fs + en, 'fut.ind.' + PN[n]));
    COND.forEach((en, n) => add(fs + en, 'cond.ind.' + PN[n]));
    // present subjunctive: from the yo form (tengo → tenga), or its own
    let subj;
    if (X.s) subj = X.s.slice();
    else {
      const yo = pres[0], ys = yo.replace(/o$/, '');
      const sEnd = t === 'ar' ? E.ar.subj : E.er.subj;
      if (X.y || X.p) subj = sEnd.map(en => ys + en);
      else subj = sEnd.map((en, n) => join(STRESSED[n] ? accU(strong(stem)) : weak(stem), en, inf, cls));
      if (X.y && !X.p) subj = sEnd.map(en => ys + en);
    }
    subj.forEach((w, n) => add(w, 'pres.subj.' + PN[n]));
    // imperfect subjunctive, from the 3rd plural preterite (tuvieron → tuviera, tuviese)
    const b = past[5].replace(/ron$/, '');
    ['ra', 'ras', 'ra', 'ramos', 'rais', 'ran'].forEach((en, n) => add((n === 3 ? accLastVowel(b) : b) + en, 'impf.subj.' + PN[n]));
    ['se', 'ses', 'se', 'semos', 'seis', 'sen'].forEach((en, n) => add((n === 3 ? accLastVowel(b) : b) + en, 'impf.subj.' + PN[n]));
    // commands
    add(X.im || pres[2], 'imp.2s');
    add(X.imv || (inf === 'ir' ? null : stripAcc(inf).slice(0, -1).replace(/.$/, m => ACC[m] || m)), 'imp.2s.vo');
    add(subj[2], 'imp.2s.fo'); add(subj[5], 'imp.2p.fo');
    add(inf === 'ir' ? 'vamos' : subj[3], 'imp.1p');
    add(stripAcc(inf).slice(0, -1) + 'd', 'imp.2p.vt');
    // gerund, participle, infinitive
    add(X.g || join(weak(stem), V.ger, inf, cls), 'ger');
    const part = pp || X.pp || join(stem, V.part, inf, cls);
    partForms(part).forEach(([w, k]) => add(w, k));
    add(lemma || inf, 'inf');
    return out;
  }

  // ------------------------------------------------------------ headwords
  const POS = { m: 'n', f: 'n', mf: 'n', 'm~': 'n', 'f*': 'n', mpl: 'n', fpl: 'n', v: 'v', a: 'adj', 'a=': 'adj', adj: 'adj', adv: 'adv', prep: 'prep',
    conj: 'conj', pron: 'pron', det: 'det', num: 'num', int: 'int', phrase: 'phrase', name: 'name' };
  const FLAGS = ['art', 'indef', 'dem', 'poss', 'quant', 'predet', 'inv', 'subj', 'clitic', 'obj', 'formal', 'vos', 'vt', 'tu', 'prp', 'neg', 'sub', 'coord', 'q',
    'st', 'nat', 'dep', 'per', 'work', 'place', 'coll', 'country', 'transport'];
  function entry(e, raw) {
    let code = raw.code; const ex = raw.ex;
    let explicit = null;
    const ci = code.indexOf(':');
    if (ci > 0) { explicit = code.slice(ci + 1); code = code.slice(0, ci); }
    let cls = '';
    if (/^v(\.|$)/.test(code)) { cls = code.slice(2); code = 'v'; }
    e.pos = POS[code] || 'phrase';
    for (const k of FLAGS) if (ex[k]) e[k] = true;
    if (ex.time) e.time = ex.time;
    if (ex.n != null) e.num = +ex.n;
    if (ex.alt) e.alt = String(ex.alt).split(',');
    if (e.pos === 'det') e.det = true;
    if (e.pos === 'n') {
      e.g = code === 'm~' || code === 'mpl' ? 'm' : code === 'f*' || code === 'fpl' ? 'f' : code === 'mf' ? 'mf' : code;
      if (code === 'm~') e.fem = ex.f || feminine(e.lemma);
      if (code === 'f*') e.elf = true;
      if (code === 'mpl' || code === 'fpl') e.plOnly = true;
      if (ex.pl) e.pl = ex.pl;
      if (raw.tags.includes('work') && (e.per || code === 'm~' || code === 'mf')) e.work = true;
      if ((raw.tags.includes('place') || raw.tags.includes('town')) && !e.transport) e.place = true;
      // (a person, for the personal «a»: flagged |per, m~ / mf in these lists, or a group of people (gente, familia); a family list's
      // other nouns aren't people: «conoce el nombre», «pregunto la edad»)
      if (raw.tags.includes('family') || raw.tags.includes('people')) e.per = e.per || code === 'm~' || code === 'mf' || (raw.tags.includes('family') && !!e.coll);
    } else if (e.pos === 'v') {
      e.cls = cls; if (ex.pp) e.pp = ex.pp;
      if (/se$/.test(e.lemma) && /(ar|er|ir|ír)$/.test(e.lemma.slice(0, -2))) { e.refl = true; e.base = e.lemma.slice(0, -2); }
      if (e.lemma === 'ser' || e.lemma === 'estar') e.copula = e.lemma;
    } else if (e.pos === 'adj') {
      if (code === 'a=') e.invG = true;
      if (ex.f) e.fem = ex.f;
      if (ex.ap) e.ap = ex.ap;
    }
    if (explicit) e.forms = explicit.split(',').map(x => { const q = x.indexOf('='); return q < 0 ? [x, ''] : [x.slice(0, q), x.slice(q + 1)]; });
    if (ex.lex) e.lex = ex.lex;
  }
  function adjForms(e) {
    const m = e.lemma, f = e.invG ? m : (e.fem || feminine(m));
    if (f === m) return [[m, 'mf.s'], [plural(m), 'mf.p']];
    return [[m, 'm.s'], [f, 'f.s'], [plural(m), 'm.p'], [plural(f), 'f.p']];
  }
  function forms(e, add) {
    if (e.forms) { e.forms.forEach(([w, k]) => add(w, k)); if (!e.forms.some(x => x[0] === e.lemma)) add(e.lemma, ''); }
    else if (e.pos === 'n') {
      const g = e.g === 'mf' ? '' : e.g + '.';
      if (e.plOnly) add(e.lemma, g + 'p');
      else if (e.fem) {
        add(e.lemma, 'm.s'); add(e.pl || plural(e.lemma), 'm.p');
        add(e.fem, 'f.s'); add(plural(e.fem), 'f.p');
      } else { add(e.lemma, g + 's'); add(e.pl || plural(e.lemma), g + 'p'); }
    } else if (e.pos === 'adj') {
      adjForms(e).forEach(([w, k]) => add(w, k));
      if (e.ap) add(e.ap, (e.invG || feminine(e.lemma) === e.lemma ? 'mf' : 'm') + '.s.ap');
    } else if (e.pos === 'v') {
      for (const [w, k] of conj(e.refl ? e.base : e.lemma, e.cls, e.pp)) add(w, k);
    } else add(e.lemma, '');
    if (e.alt) for (const a of e.alt) add(a, e.pos === 'n' ? (e.g === 'mf' ? 's' : e.g + '.s') : '');
  }

  // ------------------------------------------------------------ clitics joined to a verb (lánzate, dámelo, comérselo, vámonos)
  const CLIT = ['me', 'te', 'se', 'lo', 'la', 'le', 'nos', 'os', 'los', 'las', 'les'];
  function expand(tk, P) {
    const raw = tk.t, k = key(raw), out = [];
    const clEntry = c => { const rs = P.IX.get(c) || []; const r = rs.find(x => x.e.clitic); return r ? r.e : null; };
    const tryBase = (bk, cls) => {
      let rs = P.IX.get(bk) || [], dropS = false;
      if ((cls[0] === 'nos' || cls[0] === 'se') && P.IX.get(bk + 's')) { rs = rs.concat(P.IX.get(bk + 's')); dropS = true; }
      for (const r of rs) {
        if (r.e.pos !== 'v') continue;
        const f = r.f;
        const firstP = f.mood === 'subj' && f.tense === 'pres' && f.person === 1 && f.number === 'p';
        if (!(f.form === 'inf' || f.form === 'ger' || (f.mood === 'imp' && !f.neg) || firstP)) continue;
        if (cls.includes('os') && f.form !== 'inf') continue;      // («os» is Spain's; «dios» is not «di» + «os»)
        let base = r.w;
        if ((firstP || f.mood === 'imp') && /mos$/.test(base) && (cls[0] === 'nos' || cls[0] === 'se')) base = base.slice(0, -1);
        else if (dropS && key(base) === bk + 's') continue;
        if (f.vosotros && cls[0] === 'os') base = base.slice(0, -1);
        const added = cls.join('');
        const w = /[aeo][íú]|[íú][aeo]/.test(base) ? base + added : respell(base, added, cls.length);
        const cl = cls.map(clEntry).filter(Boolean);
        out.push({ e: r.e, f: r.f, w, exact: low(w) === low(raw), via: 'clitic', cl });
      }
    };
    for (const c1 of CLIT) {
      if (!k.endsWith(c1) || k.length - c1.length < 2) continue;
      const b1 = k.slice(0, -c1.length);
      tryBase(b1, [c1]);
      for (const c2 of CLIT) if (b1.endsWith(c2) && b1.length - c2.length >= 2) tryBase(b1.slice(0, -c2.length), [c2, c1]);
    }
    // the reflexive headword too (levantarse for levantar + me); the context pass picks it
    if (!P.reflOf) { P.reflOf = new Map(); for (const e of P.entries.values()) if (e.refl) P.reflOf.set(e.base, e); }
    const more = [];
    for (const c of out) { const re = P.reflOf.get(c.e.lemma); if (re) more.push(Object.assign({}, c, { e: re })); }
    const all = out.concat(more);
    return all.length ? all : (dims(tk, P) || all);
  }
  // diminutives (DX-B2): -ito / -ita / -cito / -ecito (+ s) on a noun or adjective the list knows, for a word the index doesn't:
  // casita, perrito, amiguito (g → gu), chiquito (c → qu), agüita, cafecito, mujercita, jovencito, florecita, lucecita (z → c),
  // papelito, arbolito. A noun keeps its gender («el problemita»); an adjective takes the ending's. Never a capitalized word
  // (a name: «Rosita», «Juanito»).
  // (a game word, LEX's, keeps its own headword: «abriguito», «palita»)
  function lexWord(P, k) {
    if (typeof LEX === 'undefined' || !LEX.ids) return false;
    const ids = LEX.ids();
    if (!P._lexW || P._lexWN !== ids.length) {
      P._lexW = new Set(); P._lexWN = ids.length;
      for (const id of ids) { const it = LEX.item(id); if (!it || !it[P.lang]) continue; for (const w of [String(it[P.lang])].concat((it.alt && it.alt[P.lang]) || [])) { const c = String(w).replace(/[¡!¿?.,;:…"«»“”()]/g, '').trim(); if (c && c.indexOf(' ') < 0) P._lexW.add(key(c)); } }
    }
    return P._lexW.has(k);
  }
  function dims(tk, P) {
    const raw = tk.t;
    if (raw.length < 5 || raw[0] !== raw[0].toLowerCase()) return null;
    const k = key(raw), m = /it([oa])(s?)$/.exec(k); if (!m || lexWord(P, k)) return null;
    const stem = k.slice(0, m.index), g = m[1] === 'a' ? 'f' : 'm', n = m[2] ? 'p' : 's';
    const bases = [], put = b => { if (b.length >= 3 && !bases.includes(b)) bases.push(b); };
    const v = g === 'f' ? 'a' : 'o', st = stem.replace(/qu$/, 'c').replace(/gu$/, 'g');
    put(st + v); put(stem + v);
    if (/c$/.test(stem)) { const s2 = stem.slice(0, -1); put(s2); if (/e$/.test(s2)) { const s3 = s2.slice(0, -1); put(s3); if (/c$/.test(s3)) put(s3.slice(0, -1) + 'z'); } }
    put(stem);
    const res = [], seen = new Set();
    for (const b of bases) for (const r of P.IX.get(b) || []) {
      const e = r.e;
      if ((e.pos !== 'n' && e.pos !== 'adj') || (e.auto && !(e.pos === 'n' && e.g)) || seen.has(e.id)) continue;
      seen.add(e.id);
      const gg = e.pos === 'n' && (e.g === 'm' || e.g === 'f') && !e.fem ? e.g : g;
      res.push({ e, f: feat(gg + '.' + n), w: raw, exact: true, via: 'dim' });
    }
    return res.length ? res : null;
  }

  // ------------------------------------------------------------ scoring (which reading, in context)
  const PRI = { det: 1, prep: 1.2, conj: 1.1, pron: 0.9, adv: 0.8, n: 0.6, adj: 0.4, v: 0.5, num: 0.8, int: 0.3, phrase: 0.1, name: 0.2 };
  const QW = new Set(['que', 'como', 'donde', 'cuando', 'quien', 'quienes', 'cual', 'cuales', 'cuanto', 'cuanta', 'cuantos', 'cuantas', 'adonde']);
  function prior(c) {
    let s = PRI[c.e.pos] || 0;
    if (c.via) s -= 0.6;
    if (c.e.refl) s -= 0.3;
    if (c.e.pos === 'v' && LATIN.finite(c.f)) s += 0.2;
    if (c.e.auto) s -= 0.2;
    return s;
  }
  function clauseFinite(W, i, ctxPrev) {
    // a finite verb elsewhere in this clause: chosen before, or a word after that can only be one
    for (let k = i - 1; k >= 0; k--) { const w = W[k]; if (w.punct || (w._r && (w._r.e.sub || w._r.e.coord))) break; if (w._r && w._r.e.pos === 'v' && LATIN.finite(w._r.f)) return true; }
    for (let k = i + 1; k < W.length; k++) {
      const w = W[k]; if (w.punct) break;
      if (w._c.some(c => c.e.sub || (c.e.coord && c.exact))) break;
      if (w._c.length && w._c.some(c => c.exact && c.e.pos === 'v' && LATIN.finite(c.f)) && !w._c.some(c => c.exact && (c.e.pos === 'n' || c.e.det || c.e.art || c.e.pos === 'prep'))) return true;
    }
    return false;
  }
  function score(c, i, W, ctx) {
    const e = c.e, f = c.f, k = key(c.w);
    let s = 0;
    const nx = ctx.next || [], pv = ctx.prev;
    const nxFin = nx.some(n => n.e.pos === 'v' && LATIN.finite(n.f)), nxNoun = nx.some(n => ['n', 'adj', 'num'].includes(n.e.pos) && n.exact);
    const question = W.some(w => w.punct && /[?¿]/.test(w.t));
    if (e.subj && !c.exact && !e.clitic) s += nxFin && !nxNoun ? 2.5 : (pv && pv.e.pos === 'prep' && !nx.length ? 1.5 : -1);
    if (k === 'si' && e.pos === 'adv' && !c.exact) s += !nx.length ? 3 : -1;
    if (e.q && !c.exact && QW.has(k)) s += question && (ctx.first || (pv && pv.e.pos === 'prep')) ? 4.5 : -1.5;
    if (e.pos === 'v' && LATIN.finite(f) && !clauseFinite(W, i)) s += 1.2;
    if ((e.det || e.art) && e.pos !== 'prep' && pv && (pv.e.pos === 'n' || pv.e.subj)) s -= 2;
    if (e.pos === 'prep' && nx.some(n => n.e.det || n.e.art || n.e.pos === 'n' || n.e.prp || (n.e.pos === 'v' && n.f.form === 'inf'))) s += 1.5;
    if (e.clitic && !c.exact) s -= 2;
    if (e.prp && !c.exact && pv && pv.e.pos === 'prep' && !nxNoun) s += 2;
    if (e.pos === 'v' && f.mood === 'imp' && pv && (pv.e.subj || pv.e.clitic)) s -= 1;
    if (e.pos === 'v' && f.form === 'part' && pv && pv.e.lemma === 'haber') s += 3;
    if (e.pos === 'v' && f.form === 'inf' && pv && LATIN.finite(pv.f) && pv.e.pos === 'v') s += 1;
    if (e.time === 'future' && k === 'manana' && pv && (pv.e.det || pv.e.art || pv.e.pos === 'prep' && key(pv.w) !== 'hasta' && key(pv.w) !== 'para')) s -= 3;
    // an adjective right after a noun it agrees with («las voces juntas»), unless an object follows (then it's a verb:
    // «el agua limpia la ropa»)
    if (e.pos === 'adj' && pv && pv.e.pos === 'n' && !nx.some(n => n.e.det || n.e.art || n.e.clitic)) {
      const pg = pv.f.gender || pv.e.g, pn = pv.f.number || 's';
      if ((f.number || 's') === pn && (!f.gender || f.gender === 'mf' || !pg || pg === 'mf' || f.gender === pg)) s += 2;
      else if ((f.number || 's') === pn && c.exact && clauseFinite(W, i)) s += 1.5;   // «una sala lleno de voces»: a clash of gender, still not a second verb
    }
    // fui / fue: ir before «a», ser before what something was
    if (e.lemma === 'ir' && (f.tense === 'past' || f.mood === 'subj') && nx.some(n => /^(a|al)$/.test(key(n.w)))) s += 1;
    if (e.lemma === 'ser' && (f.tense === 'past' || f.mood === 'subj') && nx.some(n => n.e.pos === 'adj' || n.e.det || n.e.art || key(n.w) === 'de')) s += 0.6;
    // (DX-B2) never a finite verb right after ser / estar: «el examen fue duro» (not durar), «la ropa está seca» (not secar),
    // «el cuarto está limpio» (not limpiar)
    if (e.pos === 'v' && LATIN.finite(f) && pv && pv.e.copula) s -= 2;
    // (DX-B2) a clitic never comes right after a preposition: «en la tarde», «de la casa» are the article and a noun (not
    // «la» + tardar / casar)
    if (e.clitic && !e.art && pv && pv.e.pos === 'prep' && !pv.e.art) s -= 3;
    // (DX-B2) after a determiner and an adjective, a word that can be a noun is the noun: «la mejor parte», «el primer paso»,
    // «un buen uso», «mi mayor deseo» (not partir, pasar, usar, desear)
    // (only a noun that agrees with them: «el viejo cocina bien» keeps the verb)
    if (e.pos === 'v' && LATIN.finite(f) && pv && pv.e.pos === 'adj' && i >= 2 && !W[i - 1].punct && W[i - 2] && W[i - 2]._r && (W[i - 2]._r.e.det || W[i - 2]._r.e.art) && nounAgrees(W, i, W[i - 2]._r) && nounAgrees(W, i, pv)) s -= 2.5;
    // (DX-B2) a second finite verb right after an adjective, in a clause that has its verb: unlikely («tiene buen gusto»)
    else if (e.pos === 'v' && LATIN.finite(f) && pv && pv.e.pos === 'adj' && nounAgrees(W, i, pv) && clauseFinite(W, i)) s -= 1.5;
    return s;
  }
  // a noun reading of word i that agrees in gender and number with the reading r (a determiner or an adjective before it)
  function nounAgrees(W, i, r) {
    const g = r.f.gender, n = r.f.number || 's';
    return W[i]._c.some(x => { if (x.e.pos !== 'n') return false; const xg = x.f.gender || x.e.g, xn = x.f.number || 's'; return xn === n && (!g || g === 'mf' || !xg || xg === 'mf' || xg === g); });
  }

  // ------------------------------------------------------------ the shared Romance config
  const DAYS = 'lunes|martes|miercoles|jueves|viernes|sabado|domingo';
  const UNITS = 'semana|mes|ano|fin de semana|verano|invierno|otono|primavera|' + DAYS;
  const NUMW = '(?:un|una|unos|unas|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cuarenta|cincuenta|cien|mil|\\d+|muchos|muchas|pocos|pocas|varios|varias)';
  const R = {
    lang: 'es',
    skipAdv: new Set(['tambien', 'siempre', 'ya', 'todavia', 'aun', 'solo', 'casi', 'nunca', 'tampoco', 'jamas', 'realmente', 'normalmente', 'generalmente', 'solamente', 'apenas', 'ahora', 'hoy', 'ayer', 'manana', 'todavia', 'ahorita']),
    objClitics: new Set(['lo', 'la', 'los', 'las', 'le', 'les']),
    refl: { '1s': 'me', '2s': 'te', '3s': 'se', '1p': 'nos', '2p': 'os', '3p': 'se' },
    reflAny: new Set(['me', 'te', 'se', 'nos', 'os']),
    clauseStart: new Set(['y', 'e', 'o', 'u', 'pero', 'que', 'porque', 'cuando', 'si', 'aunque', 'mientras', 'pues', 'entonces', 'luego', 'despues', 'tambien', 'hoy', 'ayer', 'manana', 'ahora', 'siempre', 'nunca', 'donde', 'ni', 'sino', 'asi', 'ahorita', 'antes', 'tampoco']),
    coord: new Set(['y', 'e', 'o', 'u', 'ni']),
    and: new Set(['y', 'e']),
    ofPrep: new Set(['de', 'del']),
    gustar: new Set(['gustar', 'encantar', 'fascinar', 'doler', 'interesar', 'importar', 'molestar', 'faltar']),
    gustar1: new Set(['gustar', 'encantar', 'fascinar']),
    perfAux: new Set(['haber']),
    irA: true, inversion: true, tu3: false, copSkip: true,
    subBreak: new Set(['que', 'porque', 'cuando', 'si', 'aunque', 'mientras', 'pero', 'donde', 'ni', 'sino']),
    ifWord: new Set(['si']),
    degree: new Set(['muy', 'tan', 'bastante', 'mas', 'menos', 'demasiado', 'super', 're', 'algo', 'medio', 'totalmente', 'completamente', 'un', 'poco', 'tambien', 'siempre', 'todavia', 'ya', 'casi', 'no', 'nada', 'realmente', 'bien', 'muchisimo', 'mucho']),
    here: new Set(['aqui', 'aca', 'alli', 'alla', 'ahi']),
    inWord: 'en',
    indef: new Set(['un', 'una']),
    noTense: new Set(['haber', 'soler']),
    elfDet: { el: 'el', un: 'un', alguno: 'algún', ninguno: 'ningún' },
    elfOk: () => false,
    timePatterns: [
      { re: new RegExp(`\\b(?:el|la) (?:${UNITS}) pasad[oa]\\b`, 'g'), t: 'past' },
      { re: /\bel otro dia\b/g, t: 'past' },
      { re: new RegExp(`(?<!desde )\\bhace ${NUMW} (?:segundos?|minutos?|horas?|dias?|semanas?|mes|meses|anos?|siglos?|rato|ratito)\\b`, 'g'), t: 'past', hace: true },
      // (but «hace mucho calor / frío / sol / viento» is the weather, not «ago»)
      { re: /(?<!desde )\bhace (?:mucho|poco|un rato|un ratito)(?: tiempo)?\b(?! (?:calor|frio|sol|viento|fresco|aire|bochorno|humedad|buen|mal|calorcito|friito|tiempo))/g, t: 'past', hace: true },
      { re: /\bpasado manana\b/g, t: 'future' },
      { re: new RegExp(`\\b(?:el|la) (?:${UNITS}) que viene\\b`, 'g'), t: 'future' },
      { re: new RegExp(`\\b(?:el|la) proxim[oa] (?:${UNITS})\\b`, 'g'), t: 'future' },
      { re: new RegExp(`\\b(?:el|la) (?:${UNITS}) proxim[oa]\\b`, 'g'), t: 'future' },
      { re: new RegExp(`\\bdentro de ${NUMW} (?:minutos?|horas?|dias?|semanas?|mes|meses|anos?|rato)\\b`, 'g'), t: 'future' },
      { re: /\ben el futuro\b/g, t: 'future' },
    ],
  };
  const GADV = new Set(['mucho', 'mas', 'menos', 'tambien', 'bastante', 'tanto', 'muchisimo', 'poco', 'nada', 'demasiado', 'siempre', 'realmente', 'todavia', 'ya', 'tampoco']);
  // the verbs whose subject, a general noun, takes the definite article (me gustan los plátanos, me duele la cabeza)
  const ART_NEED = new Set(['gustar', 'encantar', 'fascinar', 'interesar', 'importar', 'doler', 'molestar']);
  // a present subjunctive needs something before it (que, ojalá, quizás, cuando…); without it, an accent slip on a
  // preterite is likelier («Hoy desayune pan» → desayuné)
  R.subjTrig = new Set(['que', 'ojala', 'quizas', 'quiza', 'vez', 'cuando', 'aunque', 'mientras', 'hasta', 'sin', 'para', 'antes', 'despues', 'si', 'como', 'donde', 'quien', 'cual']);
  R.negs = new Set(['no', 'nunca', 'jamas', 'tampoco', 'ni']);
  const P2CL = { yo: 'me', 'tú': 'te', tu: 'te', vos: 'te', 'él': 'le', el: 'le', ella: 'le', usted: 'le', nosotros: 'nos', nosotras: 'nos', vosotros: 'os', vosotras: 'os', ellos: 'les', ellas: 'les', ustedes: 'les' };
  const P2A = { yo: 'a mí', 'tú': 'a ti', tu: 'a ti', vos: 'a vos', 'él': 'a él', el: 'a él', ella: 'a ella', usted: 'a usted', nosotros: 'a nosotros', nosotras: 'a nosotras', vosotros: 'a vosotros', vosotras: 'a vosotras', ellos: 'a ellos', ellas: 'a ellas', ustedes: 'a ustedes' };
  const A2CL = { mi: 'me', ti: 'te', vos: 'te', el: 'le', ella: 'le', usted: 'le', nosotros: 'nos', nosotras: 'nos', vosotros: 'os', vosotras: 'os', ellos: 'les', ellas: 'les', ustedes: 'les' };
  // gustar: «Yo gusto el café» → «Me gusta el café»; «Yo me gusta» → «A mí me gusta»; «Me gusta los perros» → gustan;
  // «A mí gusta» → «A mí me gusta»; «Me gusta café» → «Me gusta el café» (article)
  R.gustarCheck = (W, P, infl, push, done, H) => {
    const { rd, nx, pv, lk, npFrom, err, isFin } = H;
    for (const w of W) {
      const c = w._r; if (!isFin(c) || !R.gustar.has(lk(c)) || done.has(w.i)) continue;
      let j = nx(W, w.i);
      while (j >= 0 && rd(W, j) && (GADV.has(lk(rd(W, j))) || (key(W[j].t) === 'un' && key((W[nx(W, j)] || {}).t || '') === 'poco'))) j = nx(W, j);
      let num = null, bare = -1;
      const jc = rd(W, j);
      if (jc && key(W[j].t) !== 'de') {
        if (jc.e.pos === 'v' && jc.f.form === 'inf') num = 's';
        else if ((jc.e.det || jc.e.art) && !jc.e.inv) {
          const np = npFrom(W, j);
          // «las uvas y el pan»: plural; «el pan y el queso»: either is heard (agreeing with the nearest), so no flag
          if (np && rd(W, np.head)) { num = rd(W, np.head).f.number || (rd(W, np.det) && rd(W, np.det).f.number) || 's'; const k2 = nx(W, np.e); if (k2 >= 0 && R.and.has(key(W[k2].t)) && num === 's') num = null; }
        } else if (jc.e.pos === 'n' && !W[j].name && !jc.e.plOnly) { num = jc.f.number || 's'; bare = j; const k2 = nx(W, j); if (k2 >= 0 && R.and.has(key(W[k2].t)) && num === 's') num = null; }
        else if (jc.e.dem && jc.f.gender === 'n') num = 's';
      }
      // who likes: the words before the verb
      let p = pv(W, w.i); const negs = [];
      while (p >= 0 && rd(W, p) && (rd(W, p).e.neg || R.skipAdv.has(lk(rd(W, p))))) { negs.unshift(W[p].t); p = pv(W, p); }
      const pc = rd(W, p);
      const third = c.f.person === 3;
      const want = num || (third ? c.f.number : 's');
      if (pc && pc.e.subj && !pc.e.clitic && R.gustar1.has(lk(c)) && key((W[nx(W, w.i)] || {}).t || '') !== 'de') {
        const cl = P2CL[key(W[p].t)] || P2CL[W[p].t.toLowerCase()];
        if (cl && !(c.f.person === 3 && /^(el|ella|usted|ellos|ellas|ustedes)$/.test(key(W[p].t)) && false)) {
          const v = infl(c.e, { tense: c.f.tense, mood: c.f.mood === 'imp' ? 'ind' : c.f.mood, person: 3, number: want });
          const fx = negs.concat([cl, v]).join(' ').toLowerCase();
          push(err('gustar', 'major', [p, w.i], fx, `With «${c.e.lemma}», the thing you like is the subject: «${capF(cl)} ${v}…» (not «${W[p].t.toLowerCase()} ${w.t}»).`));
          continue;
        }
      }
      if (pc && pc.e.clitic && !pc.e.subj) {
        const pp = pv(W, p), ppc = rd(W, pp);
        const ck = key(W[p].t);
        // «Yo me gusta»: the pronoun with «a»
        if (ppc && ppc.e.subj && !ppc.e.clitic && P2CL[key(W[pp].t)] === ck && third && R.gustar1.has(lk(c))) {
          const fx = P2A[key(W[pp].t)] || ('a ' + W[pp].t.toLowerCase());
          push(err('gustar', 'major', [pp, pp], fx, `Say who likes it with «a»: «${capF(fx)} ${ck} ${w.t}» (or just «${capF(ck)} ${w.t}»).`));
        }
        // the verb's number goes with what is liked; a bare noun gets its article («Me gusta plátanos» → «Me gustan
        // los plátanos»: one fix for both)
        let v = null;
        if (num && (c.f.number !== num || !third) && !(c.f.person !== 3 && !jc)) {
          v = infl(c.e, { tense: c.f.tense, mood: c.f.mood === 'imp' ? 'ind' : c.f.mood, person: 3, number: num });
          if (!v || key(v) === key(w.t)) v = null;
        }
        if (bare >= 0 && !done.has(bare) && ART_NEED.has(lk(c))) {
          const hc = rd(W, bare);
          const art = infl(P.entries.get('es:el'), { gender: hc.e.elf && (hc.f.number || 's') === 's' ? 'm' : (hc.f.gender || hc.e.g || 'm') === 'mf' ? 'm' : (hc.f.gender || hc.e.g || 'm'), number: hc.f.number || 's' });
          if (art) {
            const mid = W.slice(w.i + 1, bare).filter(x => !x.punct).map(x => x.t);
            if (v) push(err('gustar', 'major', [w.i, bare], [v].concat(mid, [art, W[bare].t]).join(' '), `What you like takes «${art}», and the verb goes with it: «${ck} ${v} ${art} ${W[bare].t}».`));
            else push(err('article', 'major', [bare, bare], art + ' ' + W[bare].t, `With «${c.e.lemma}», name things with «el / la / los / las»: «${art} ${W[bare].t}».`));
            continue;
          }
        }
        if (v) push(err('gustar', 'major', [w.i, w.i], v, num === 'p' ? `What you like is plural, so «${ck} ${v}».` : `What you like is one thing (or an action), so «${ck} ${v}».`));
        continue;
      }
      // «A mí gusta»: keep the «me» too
      if (pc && (pc.e.prp || pc.e.subj) && key((W[pv(W, p)] || {}).t || '') === 'a' && R.gustar1.has(lk(c))) {
        const cl = A2CL[key(W[p].t)];
        if (cl) push(err('gustar', 'major', [w.i, w.i], cl + ' ' + w.t, `Keep the «${cl}» too: «a ${W[p].t} ${cl} ${w.t}».`));
      }
    }
  };
  R.checkMore = (a, W, opts, P, push, done, H) => {
    const { rd, nx, pv, lk, npFrom, err, infl, isFin } = H;
    for (const w of W) {
      if (w.punct || done.has(w.i)) continue;
      const c = w._r, k = key(w.t);
      // a el → al, de el → del (contract)
      if ((k === 'a' || k === 'de') && c && c.e.pos === 'prep') {
        const j = nx(W, w.i); const jc = rd(W, j);
        if (jc && key(W[j].t) === 'el' && W[j].t !== 'El' && (jc.e.art || jc.e.det)) {
          const fx = k === 'a' ? 'al' : 'del';
          push(err('contract', 'major', [w.i, j], fx, `«${k} + el» is always «${fx}»: «${fx} ${(W[nx(W, j)] || {}).t || ''}».`.replace(/ »/, '»')));
          continue;
        }
      }
      // days take no «en»: en el lunes → el lunes
      if (k === 'en' && c && c.e.pos === 'prep') {
        let j = nx(W, w.i); let jc = rd(W, j); let det = null;
        if (jc && (jc.e.art) && /^(el|los)$/.test(key(W[j].t))) { det = W[j].t; j = nx(W, j); jc = rd(W, j); }
        if (jc && new RegExp('^(' + DAYS + ')$').test(key(W[j].t))) {
          const fx = (det || (jc.f.number === 'p' ? 'los' : 'el')) + ' ' + W[j].t;
          push(err('prep', 'major', [w.i, j], fx, `Days don’t take «en»: «${fx}».`));
          continue;
        }
      }
      if (!isFin(c)) continue;
      const lem = lk(c);
      // personal «a»: Visito a mi abuela
      if (PERSONAL_A.has(lem) && !(lem === 'llamar' && rd(W, pv(W, w.i)) && rd(W, pv(W, w.i)).e.clitic)) {
        const j = nx(W, w.i); const jc = rd(W, j);
        if (jc && (jc.e.art || jc.e.det) && !jc.e.indef && !jc.e.quant && !jc.e.q) {
          const np = npFrom(W, j);
          const hc = np && rd(W, np.head);
          if (hc && hc.e.pos === 'n' && hc.e.per && !done.has(j)) {
            const fx = key(W[j].t) === 'el' ? 'al' : 'a ' + W[j].t;
            push(err('prep', 'major', [j, j], fx, `A person you ${EN.first(c.e.en)} takes «a»: «${w.t} ${fx} ${W[np.head].t}».`));
            continue;
          }
        } else if (j >= 0 && W[j].name && !NAME_SKIP.has(lem)) {
          push(err('prep', 'major', [j, j], 'a ' + W[j].t, `A person you ${EN.first(c.e.en)} takes «a»: «${w.t} a ${W[j].t}».`));
          continue;
        }
      }
      // depender de, enamorarse de, soñar con, casarse con
      const j = nx(W, w.i);
      if (j >= 0 && PREPS[lem] && PREPS[lem].bad.includes(key(W[j].t)) && !done.has(j)) {
        const good = PREPS[lem].good, d = nx(W, j);
        const contr = (good === 'de' || good === 'a') && d >= 0 && W[d].t === 'el';
        const fx = contr ? (good === 'de' ? 'del' : 'al') : good;
        push(err('prep', 'major', contr ? [j, d] : [j, j], fx, `«${c.e.lemma}» goes with «${good}»: «${w.t} ${fx}…».`));
        continue;
      }
      // ir en la playa → ir a la playa
      if (lem === 'ir' && key((W[j] || {}).t || '') === 'en') {
        const d = nx(W, j), dc = rd(W, d); const h = dc && (dc.e.art || dc.e.det) ? nx(W, d) : d; const hc = rd(W, h);
        if (hc && hc.e.pos === 'n' && hc.e.place && !hc.e.transport) {
          const fx = dc && key(W[d].t) === 'el' ? 'al' : 'a';
          push(err('prep', 'major', fx === 'al' ? [j, d] : [j, j], fx, `Going somewhere takes «a»: «${w.t} ${fx}${fx === 'a' && h !== d ? '' : ''} …».`));
          continue;
        }
      }
      // soy un estudiante → soy estudiante (minor)
      if (c.e.copula === 'ser' && R.indef.has(key((W[j] || {}).t || ''))) {
        const h = nx(W, j), hc = rd(W, h), after = rd(W, nx(W, h));
        if (hc && hc.e.pos === 'n' && hc.e.work && !(after && (after.e.pos === 'adj' || key(W[nx(W, h)].t) === 'de' || key(W[nx(W, h)].t) === 'que'))) {
          push(err('article', 'minor', [j, j], '', `A job after «ser» takes no «un / una»: «${w.t} ${W[h].t}».`));
        }
      }
    }
    // «a» for «ha» before a participle: Ella a comido → ha comido
    for (const w of W) {
      if (w.punct || done.has(w.i) || key(w.t) !== 'a') continue;
      const j = nx(W, w.i), jc = rd(W, j);
      if (!jc || jc.e.pos !== 'v' || jc.f.form !== 'part' || jc.f.gender !== 'm' || jc.f.number !== 's' || jc.w.length < 4) continue;
      if (W[j]._c.some(x => x.e.pos === 'n' || x.e.pos === 'adj')) continue;
      const p = pv(W, w.i), pc = rd(W, p);
      if (p >= 0 && !(pc && (pc.e.subj || pc.e.pos === 'n' || pc.e.neg)) && !W[p].name) continue;
      push(err('spell', 'minor', [w.i, w.i], 'ha', `«ha» (from haber) before «${W[j].t}»: «ha ${W[j].t}».`));
    }
    // ¿Porque…? → ¿Por qué…? (a question's first word)
    if (a.question) {
      const i0 = W.findIndex(x => !x.punct);
      if (i0 >= 0 && key(W[i0].t) === 'porque' && !done.has(i0)) push(err('accent', 'minor', [i0, i0], likeCase('por qué', W[i0].t), 'Asking why: «¿Por qué…?» (two words, with an accent). «Porque» answers it.'));
      else if (i0 >= 0 && key(W[i0].t) === 'por' && W[i0 + 1] && W[i0 + 1].t === 'que') push(err('accent', 'minor', [i0, i0 + 1], likeCase('por qué', W[i0].t), 'Asking why: «¿Por qué…?»'));
    }
  };
  const PERSONAL_A = new Set(['visitar', 'ver', 'conocer', 'ayudar', 'llamar', 'invitar', 'extrañar', 'abrazar', 'besar', 'querer', 'amar', 'escuchar', 'esperar', 'buscar', 'cuidar', 'saludar', 'mirar', 'odiar', 'entender', 'respetar', 'admirar', 'acompañar', 'despertar', 'conocer', 'echar de menos']);
  const NAME_SKIP = new Set(['ver', 'mirar', 'escuchar', 'buscar', 'querer', 'esperar', 'entender']);
  const PREPS = { depender: { bad: ['en'], good: 'de' }, enamorarse: { bad: ['con'], good: 'de' }, 'soñar': { bad: ['de'], good: 'con' }, casarse: { bad: ['a'], good: 'con' }, consistir: { bad: ['de'], good: 'en' } };

  // ------------------------------------------------------------ numbers said in words (veinticinco, dos mil veinte)
  function numbers(W) {
    const out = []; let total = 0, cur = 0, on = false;
    const flush = () => { if (on) out.push(total + cur); on = false; total = 0; cur = 0; };
    for (let i = 0; i < W.length; i++) {
      const w = W[i];
      if (w.punct) { flush(); continue; }
      if (w.num != null && !w._r) { flush(); out.push(w.num); continue; }
      const c = w._r, v = c && c.e.pos === 'num' ? c.e.num : null;
      const nk = W[i + 1] && !W[i + 1].punct ? key(W[i + 1].t) : '';
      if (v == null) {
        if (on && key(w.t) === 'y' && W[i + 1] && W[i + 1]._r && W[i + 1]._r.e.pos === 'num') continue;
        if (c && /^(un|una)$/.test(key(w.t)) && /^(mil|millon|millones)$/.test(nk)) { flush(); on = true; cur = 1; continue; }
        flush(); continue;
      }
      on = true;
      if (v === 1000) { total += (cur || 1) * 1000; cur = 0; }
      else if (v >= 1e6) { total = (total + (cur || 1)) * v; cur = 0; }
      else cur += v;
    }
    flush();
    return out;
  }

  // ------------------------------------------------------------ glosses and inflection
  const TN = { pres: 'present', past: 'preterite', impf: 'imperfect', fut: 'future', cond: 'conditional', perf: 'perfect' };
  const WHO = { '1s': 'I', '2s': 'you', '3s': 'he/she', '1p': 'we', '2p': 'you all', '3p': 'they' };
  const gnText = f => [f.gender === 'f' ? 'feminine' : f.gender === 'm' && f.number === 'p' ? 'masculine' : '', f.number === 'p' ? 'plural' : ''].filter(Boolean).join(' ');
  function describe(c) {
    const e = c.e, f = c.f || {}, pn = f.person ? f.person + f.number : '';
    if (e.pos === 'v') {
      let s;
      if (f.form === 'inf') s = 'infinitive';
      else if (f.form === 'ger') s = 'gerund';
      else if (f.form === 'part') s = 'participle' + (gnText(f) && (f.gender === 'f' || f.number === 'p') ? ', ' + gnText(f) : '');
      else if (f.mood === 'imp') s = 'command, ' + (f.formal ? (f.number === 'p' ? 'you all' : 'you (usted)') : f.vos ? 'you (vos)' : f.vosotros ? 'you all (vosotros)' : WHO[pn]);
      else if (f.mood === 'subj') s = (f.tense === 'impf' ? 'imperfect' : 'present') + ' subjunctive, ' + WHO[pn];
      else s = TN[f.tense] + ', ' + (f.vos ? 'you (vos)' : WHO[pn] + (pn === '3s' ? ' (or usted)' : pn === '3p' ? ' (or ustedes)' : ''));
      if (c.cl && c.cl.length) s += ' + ' + c.cl.map(x => x.lemma).join(' + ');
      return s;
    }
    if (low(c.w) === low(e.lemma)) return '';
    if (c.via === 'dim') return 'diminutive' + (f.number === 'p' ? ', plural' : '');
    if (e.pos === 'n') return e.fem && f.gender === 'f' ? 'feminine' + (f.number === 'p' ? ' plural' : '') : f.number === 'p' ? 'plural' : '';
    if (e.pos === 'adj' || e.pos === 'det' || e.pos === 'pron') return f.apoc ? 'short form, before a noun' : gnText(f);
    return '';
  }
  function enGloss(c) {
    const e = c.e, f = c.f || {};
    if (e.pos === 'v' && (f.mood || f.form)) return EN.verb(e.en, f);
    const m = /^([^/,;()]+)\/([^,;()]+)(.*)$/.exec(e.en || '');
    let en = m ? (f.gender === 'f' ? m[2] : m[1]) + m[3] : e.en;
    if (c.via === 'dim' && e.pos === 'n') en = 'little ' + en;
    if (e.pos === 'n' && f.number === 'p' && !e.plOnly) return EN.plural(en);
    return en;
  }
  function slot(f) {
    if (f.form === 'inf') return 'inf';
    if (f.form === 'ger') return 'ger';
    if (f.form === 'part') return 'part.' + (f.gender === 'f' ? 'f' : 'm') + '.' + (f.number === 'p' ? 'p' : 's');
    let person = f.person || 3, number = f.number || 's';
    if (f.mood === 'imp') {
      if (f.neg) { if (f.formal || (person === 2 && number === 'p' && !f.vosotros)) person = 3; return 'pres.subj.' + person + number; }
      if (f.formal) return 'imp.2' + number + '.fo';
      if (person === 1) return 'imp.1p';
      if (number === 'p') return f.vosotros ? 'imp.2p.vt' : 'imp.2p.fo';
      return f.vos ? 'imp.2s.vo' : 'imp.2s';
    }
    if (f.formal) person = 3;
    if (person === 2 && number === 'p' && !f.vosotros) person = 3;
    const t = f.tense || 'pres', m = f.mood || 'ind';
    if (f.vos && person === 2 && number === 's' && t === 'pres' && m === 'ind') return 'pres.ind.2s.vo';
    return t + '.' + m + '.' + person + number;
  }
  function inflect(e, f, P) {
    if (e.pos === 'v') {
      const list = conj(e.refl ? e.base : e.lemma, e.cls, e.pp);
      if (f.tense === 'perf') {
        const he = inflect(P.entries.get('es:haber'), Object.assign({}, f, { tense: 'pres' }), P);
        const pt = list.find(x => x[1] === 'part.m.s');
        return he && pt ? he + ' ' + pt[0] : null;
      }
      if (f.form === 'inf' && e.refl) return e.lemma;
      const want = slot(f);
      const hit = list.find(x => x[1] === want);
      return hit ? hit[0] : null;
    }
    if (e.forms) {
      const ok = ([w, k]) => { const g = feat(k); return (!f.gender || !g.gender || g.gender === f.gender || g.gender === 'mf') && (!f.number || (g.number || 's') === f.number) && (!f.person || !g.person || g.person === f.person); };
      const exact = e.forms.find(x => ok(x) && (!f.gender || feat(x[1]).gender === f.gender)) || e.forms.find(ok);
      return exact ? exact[0] : null;
    }
    if (e.pos === 'n') {
      let w = f.gender === 'f' && e.fem ? e.fem : e.lemma;
      if (f.number === 'p' && !e.plOnly) w = w === e.lemma ? (e.pl || plural(w)) : plural(w);
      return w;
    }
    if (e.pos === 'adj') {
      const fs = adjForms(e); const g = f.gender === 'f' ? 'f' : 'm', n = f.number === 'p' ? 'p' : 's';
      const hit = fs.find(([, k]) => k === g + '.' + n) || fs.find(([, k]) => k === 'mf.' + n);
      return hit ? hit[0] : e.lemma;
    }
    return e.lemma;
  }

  // ------------------------------------------------------------ function words
  const CLOSED = `
@1
el|det:el=m.s,la=f.s,los=m.p,las=f.p,lo=n.s|the|art
un|det:un=m.s,una=f.s,unos=m.p,unas=f.p|a, an; some (plural)|art indef
al|prep:al=m.s|to the (a + el)|art
del|prep:del=m.s|of the, from the (de + el)|art
este|det:este=m.s,esta=f.s,estos=m.p,estas=f.p,esto=n.s|this; these|dem
ese|det:ese=m.s,esa=f.s,esos=m.p,esas=f.p,eso=n.s|that; those|dem
mi|det:mi=mf.s,mis=mf.p|my|poss
tu|det:tu=mf.s,tus=mf.p|your|poss
su|det:su=mf.s,sus=mf.p|his, her, its, their, your (usted)|poss
nuestro|det:nuestro=m.s,nuestra=f.s,nuestros=m.p,nuestras=f.p|our|poss
mucho|det:mucho=m.s,mucha=f.s,muchos=m.p,muchas=f.p|a lot of, many|quant
mucho#adv|adv|a lot, very much
poco|det:poco=m.s,poca=f.s,pocos=m.p,pocas=f.p|little, few|quant
poco#adv|adv|little, not much
todo|det:todo=m.s,toda=f.s,todos=m.p,todas=f.p|all, every, the whole|predet quant
todo#pron|pron|everything
otro|det:otro=m.s,otra=f.s,otros=m.p,otras=f.p|other, another|quant
cada|det:cada=mf.s|each, every|inv quant
yo|pron:yo=1s|I|subj
tú|pron:tú=2s|you|subj tu
él|pron:él=3s.m|he; him (after a preposition)|subj
ella|pron:ella=3s.f|she; her (after a preposition)|subj
usted|pron:usted=2s.fo|you (formal)|subj formal
nosotros|pron:nosotros=1p.m,nosotras=1p.f|we; us (after a preposition)|subj
ellos|pron:ellos=3p.m,ellas=3p.f|they; them (after a preposition)|subj
ustedes|pron:ustedes=2p.fo|you all|subj formal
me|pron:me=1s|me, to me, myself|clitic
te|pron:te=2s|you, to you, yourself|clitic
lo#pron|pron:lo=3s.m|him, it|clitic obj
la#pron|pron:la=3s.f|her, it|clitic obj
le|pron:le=3s|to him, to her, to you|clitic obj
nos|pron:nos=1p|us, to us, ourselves|clitic
los#pron|pron:los=3p.m|them|clitic obj
las#pron|pron:las=3p.f|them|clitic obj
les|pron:les=3p|to them, to you all|clitic obj
se|pron:se=3|himself, herself, themselves; (to) him, her (before lo, la)|clitic
mí|pron:mí=1s|me (after a preposition)|prp
ti|pron:ti=2s|you (after a preposition)|prp
conmigo|pron|with me|
contigo|pron|with you|
a|prep|to, at|
con|prep|with|
de|prep|of, from|
desde|prep|from, since|
en|prep|in, on, at|
entre|prep|between, among|
hasta|prep|until, up to; even|
para|prep|for, to, in order to|
por|prep|for, by, through, because of|
sin|prep|without|
sobre|prep|on, about|
y|conj|and|coord
e|conj|and (before i-, hi-)|coord
o|conj|or|coord
pero|conj|but|coord
que|conj|that, which, who|sub
porque|conj|because|sub
si|conj|if, whether|sub
cuando|conj|when|sub
como|conj|like, as; since|sub
donde|conj|where|sub
qué|pron|what, which|q
quién|pron:quién=s,quiénes=p|who|q
cuál|pron:cuál=s,cuáles=p|which, which one|q
cuánto|det:cuánto=m.s,cuánta=f.s,cuántos=m.p,cuántas=f.p|how much, how many|q
cómo|adv|how|q
dónde|adv|where|q
cuándo|adv|when|q
no|adv|no, not|neg
sí|adv|yes|
también|adv|also, too|
muy|adv|very|
más|adv|more, most|
menos|adv|less, fewer|
bien|adv|well, fine|
mal|adv|badly|
ya|adv|already; now|
siempre|adv|always|
nunca|adv|never|neg
aquí|adv|here|
allí|adv|there|
hoy|adv|today|time:present
ayer|adv|yesterday|time:past
mañana|adv|tomorrow|time:future
ahora|adv|now|time:present
después|adv|after, afterwards, later|
luego|adv|then, later|
antes|adv|before, earlier|
algo|pron|something|
nada|pron|nothing; (not) at all|neg
alguien|pron|someone|
nadie|pron|nobody|neg
hola|int|hello, hi|
adiós|int|goodbye|
gracias|int|thank you, thanks|
perdón|int|sorry, excuse me|
ok|int|OK|alt:okay,okey
por favor|phrase|please|
de nada|phrase|you’re welcome|
buenos días|phrase|good morning|
buenas tardes|phrase|good afternoon|
buenas noches|phrase|good evening, good night|
hasta luego|phrase|see you later|
hasta mañana|phrase|see you tomorrow|
lo siento|phrase|I’m sorry|
qué tal|phrase|how’s it going?|
mucho gusto|phrase|nice to meet you|
muy bien|phrase|very well, very good|
un poco|phrase|a little|
a veces|phrase|sometimes|
por qué|phrase|why|
todos los días|phrase|every day|
cero|num|zero|n:0
uno|num:uno=m.s,una=f.s|one|n:1
dos|num|two|n:2
tres|num|three|n:3
cuatro|num|four|n:4
cinco|num|five|n:5
seis|num|six|n:6
siete|num|seven|n:7
ocho|num|eight|n:8
nueve|num|nine|n:9
diez|num|ten|n:10
once|num|eleven|n:11
doce|num|twelve|n:12
trece|num|thirteen|n:13
catorce|num|fourteen|n:14
quince|num|fifteen|n:15
dieciséis|num|sixteen|n:16
diecisiete|num|seventeen|n:17
dieciocho|num|eighteen|n:18
diecinueve|num|nineteen|n:19
veinte|num|twenty|n:20
treinta|num|thirty|n:30
cuarenta|num|forty|n:40
cincuenta|num|fifty|n:50
cien|num|a hundred|n:100
mil|num|a thousand|n:1000
primero|a|first|ap:primer
segundo#ord|a|second
tercero|a|third|ap:tercer
último|a|last
@2
aquel|det:aquel=m.s,aquella=f.s,aquellos=m.p,aquellas=f.p,aquello=n.s|that (over there)|dem
vuestro|det:vuestro=m.s,vuestra=f.s,vuestros=m.p,vuestras=f.p|your (you all, Spain)|poss
mío|adj:mío=m.s,mía=f.s,míos=m.p,mías=f.p|mine|
tuyo|adj:tuyo=m.s,tuya=f.s,tuyos=m.p,tuyas=f.p|yours|
suyo|adj:suyo=m.s,suya=f.s,suyos=m.p,suyas=f.p|his, hers, theirs, yours|
alguno|det:algún=m.s,alguna=f.s,algunos=m.p,algunas=f.p,alguno=m.s|some, any|quant
ninguno|det:ningún=m.s,ninguna=f.s,ningunos=m.p,ningunas=f.p,ninguno=m.s|no, none|quant neg
varios|det:varios=m.p,varias=f.p|several|quant
tanto|det:tanto=m.s,tanta=f.s,tantos=m.p,tantas=f.p|so much, so many|quant
tanto#adv|adv|so much|
demasiado|det:demasiado=m.s,demasiada=f.s,demasiados=m.p,demasiadas=f.p|too much, too many|quant
demasiado#adv|adv|too, too much|
mismo|a|same; -self (yo mismo)|
vos|pron:vos=2s|you (Argentina, Central America)|subj vos
vosotros|pron:vosotros=2p.m,vosotras=2p.f|you all (Spain)|subj vt
os|pron:os=2p|you all, to you all (Spain)|clitic
consigo|pron|with himself, with herself|
ante|prep|before, in front of|
bajo#prep|prep|under|
contra|prep|against|
durante|prep|during|
hacia|prep|towards|
según|prep|according to|
tras|prep|after, behind|
u|conj|or (before o-)|coord
ni|conj|nor, not even|coord neg
sino|conj|but rather|coord
aunque|conj|although, even if|sub
mientras|conj|while|sub
pues|conj|well, so; since|
quien|pron:quien=s,quienes=p|who (that)|
adónde|adv|where (to)|q
tampoco|adv|neither, not either|neg
jamás|adv|never (ever)|neg
todavía|adv|still, yet|
aún|adv|still, yet|
casi|adv|almost|
solo|adv|only, just|alt:sólo
solamente|adv|only|
acá|adv|here|
ahí|adv|there (near you)|
allá|adv|over there|
cerca|adv|near, close|
lejos|adv|far|
arriba|adv|up, upstairs, above|
abajo|adv|down, downstairs, below|
adelante|adv|forward, ahead|
atrás|adv|back, behind|
dentro|adv|inside|
fuera|adv|outside|
afuera|adv|outside|
anoche|adv|last night|time:past
anteayer|adv|the day before yesterday|time:past alt:antier
ahorita|adv|right now, in a moment|time:present
pronto|adv|soon|
tarde#adv|adv|late|
temprano|adv|early|
entonces|adv|then, so|
así|adv|like this, like that, so|
tan|adv|so, as|
bastante|adv|quite, enough|
además|adv|besides, also|
quizás|adv|maybe, perhaps|alt:quizá
despacio|adv|slowly|
juntos|adv|together|
claro|int|of course, sure|
bueno#int|int|well, OK|
oye|int|hey, listen|
ojalá|int|I hope, hopefully|
ay|int|oh, ouch|
vale|int|OK (Spain)|
chao|int|bye|alt:chau
bienvenido|a|welcome|
nos vemos|phrase|see you|
con permiso|phrase|excuse me (to get past)|
por eso|phrase|that’s why, so|
sin embargo|phrase|however|
por ejemplo|phrase|for example|
así que|phrase|so, so that’s why|
ya que|phrase|since, because|
en cambio|phrase|on the other hand|
para que|phrase|so that|
hasta que|phrase|until|
antes de|phrase|before|
después de|phrase|after|
al lado de|phrase|next to|
cerca de|phrase|near|
lejos de|phrase|far from|
delante de|phrase|in front of|
detrás de|phrase|behind|
encima de|phrase|on top of|
debajo de|phrase|under|
al final|phrase|in the end|
por fin|phrase|at last|
tal vez|phrase|maybe|
de acuerdo|phrase|OK, agreed|
creo que|phrase|I think that|
pienso que|phrase|I think that|
me parece que|phrase|it seems to me that|
en mi opinión|phrase|in my opinion|
hay que|phrase|you have to, one must|
a lo mejor|phrase|maybe|
en serio|phrase|seriously, really|
la verdad|phrase|honestly, the truth is|
de vez en cuando|phrase|from time to time|
o sea|phrase|I mean, that is|
es decir|phrase|that is to say|
veintiuno|num:veintiuno,veintiún,veintiuna|twenty-one|n:21
veintidós|num|twenty-two|n:22
veintitrés|num|twenty-three|n:23
veinticuatro|num|twenty-four|n:24
veinticinco|num|twenty-five|n:25
veintiséis|num|twenty-six|n:26
veintisiete|num|twenty-seven|n:27
veintiocho|num|twenty-eight|n:28
veintinueve|num|twenty-nine|n:29
sesenta|num|sixty|n:60
setenta|num|seventy|n:70
ochenta|num|eighty|n:80
noventa|num|ninety|n:90
ciento|num|(one) hundred (ciento veinte)|n:100
doscientos|num:doscientos=m,doscientas=f|two hundred|n:200
trescientos|num:trescientos=m,trescientas=f|three hundred|n:300
cuatrocientos|num:cuatrocientos=m,cuatrocientas=f|four hundred|n:400
quinientos|num:quinientos=m,quinientas=f|five hundred|n:500
seiscientos|num:seiscientos=m,seiscientas=f|six hundred|n:600
setecientos|num:setecientos=m,setecientas=f|seven hundred|n:700
ochocientos|num:ochocientos=m,ochocientas=f|eight hundred|n:800
novecientos|num:novecientos=m,novecientas=f|nine hundred|n:900
millón|num:millón=s,millones=p|million|n:1000000
cuarto#ord|a|fourth
quinto|a|fifth
sexto|a|sixth
séptimo|a|seventh
octavo|a|eighth
noveno|a|ninth
décimo|a|tenth
@3
cuyo|det:cuyo=m.s,cuya=f.s,cuyos=m.p,cuyas=f.p|whose|
cierto|a|certain; true|
mediante|prep|by means of|
apenas|adv|barely, hardly|
incluso|adv|even|
sobre todo|phrase|above all, especially|
a pesar de|phrase|despite|
en vez de|phrase|instead of|
gracias a|phrase|thanks to|
acerca de|phrase|about|
a través de|phrase|through, across|
alrededor de|phrase|around|
dentro de|phrase|inside, within|
fuera de|phrase|outside|
desde que|phrase|since|
mientras que|phrase|while, whereas|
por lo tanto|phrase|therefore|
en cuanto|phrase|as soon as|
aun así|phrase|even so|
a la vez|phrase|at the same time|
de hecho|phrase|in fact|
en realidad|phrase|actually|
por supuesto|phrase|of course|
`;
  const LISTS = [CLOSED];

  LISTS.push(`
@1 people,family
persona|f|person|per
gente|f|people|coll
hombre|m|man|per
mujer|f|woman; wife|per
niño|m~|boy/girl, child|per
chico|m~|boy/girl, kid|per
bebé|mf|baby|per
amigo|m~|friend|per
familia|f|family|coll
padre|m|father|per
madre|f|mother|per
papá|m|dad|per
mamá|f|mom|per
padres|mpl|parents|per
hijo|m~|son/daughter|per
hermano|m~|brother/sister|per
abuelo|m~|grandfather/grandmother|per
tío|m~|uncle/aunt|per
primo|m~|cousin|per
esposo|m~|husband/wife|per
novio|m~|boyfriend/girlfriend|per
señor|m~|Mr., sir, gentleman/Mrs., madam, lady|per
don|m|Mr. (a respectful title before a first name: don Fello)|per
doña|f|Mrs., Ms. (a respectful title before a first name: doña Rosa)|per
vecino|m~|neighbor|per
nombre|m|name
edad|f|age
@1 work,people
trabajo|m|work, job
profesor|m~|teacher, professor|per
maestro|m~|teacher|per
estudiante|mf|student|per
alumno|m~|student, pupil|per
médico|m~|doctor|per
doctor|m~|doctor|per
enfermero|m~|nurse|per
policía|mf|police officer|per
cocinero|m~|cook|per
panadero|m~|baker|per
cartero|m~|mail carrier|per
jardinero|m~|gardener|per
músico|m~|musician|per f:música
granjero|m~|farmer|per
pescador|m~|fisher|per
vendedor|m~|seller, salesperson|per
mesero|m~|waiter/waitress|per
jefe|m~|boss|per f:jefa
artista|mf|artist|per
cantante|mf|singer|per
escritor|m~|writer|per
@1 body,health
cuerpo|m|body
cabeza|f|head
cara|f|face
ojo|m|eye
oreja|f|ear
nariz|f|nose
boca|f|mouth
diente|m|tooth
pelo|m|hair
mano|f|hand
brazo|m|arm
dedo|m|finger, toe
pierna|f|leg
pie|m|foot
espalda|f|back
estómago|m|stomach
corazón|m|heart
salud|f|health
enfermo|a|sick, ill
dolor|m|pain, ache|-
medicina|f|medicine
hospital|m|hospital|place
@1 food
comida|f|food; meal
desayuno|m|breakfast
almuerzo|m|lunch
cena|f|dinner, supper
pan|m|bread
manzana|f|apple
naranja|f|orange
plátano|m|banana
fresa|f|strawberry
uva|f|grape
pera|f|pear
limón|m|lemon
fruta|f|fruit
verdura|f|vegetable
tomate|m|tomato
papa|f|potato
cebolla|f|onion
ensalada|f|salad
arroz|m|rice
frijol|m|bean
maíz|m|corn|alt:choclo,elote
carne|f|meat
pollo|m|chicken
pescado|m|fish (food)
huevo|m|egg
queso|m|cheese
leche|f|milk
mantequilla|f|butter
azúcar|m|sugar
sal|f|salt
sopa|f|soup
pizza|f|pizza
taco|m|taco
tortilla|f|tortilla
galleta|f|cookie, cracker
pastel|m|cake
dulce|m|candy, sweet|alt:caramelo
chocolate|m|chocolate
helado|m|ice cream
miel|f|honey
@1 drink,food
agua|f*|water
café|m|coffee; café|alt:cafecito
té|m|tea
jugo|m|juice|alt:zumo
refresco|m|soda, soft drink|alt:gaseosa
vaso|m|glass
taza|f|cup, mug
plato|m|plate; dish
botella|f|bottle
@1 home
casa|f|house, home|place
cuarto|m|room; quarter
cocina|f|kitchen; cooking|place
baño|m|bathroom; bath|place
sala|f|living room|place
jardín|m|garden|place
puerta|f|door
ventana|f|window
mesa|f|table
silla|f|chair
cama|f|bed
lámpara|f|lamp
llave|f|key
libro|m|book
papel|m|paper
foto|f|photo|alt:fotografía
reloj|m|clock, watch
teléfono|m|phone
celular|m|cell phone
computadora|f|computer
televisión|f|television|alt:tele
radio|mf|radio
@1 town
ciudad|f|city|place
pueblo|m|village, town|place
calle|f|street|place
plaza|f|square, plaza|place
parque|m|park|place
tienda|f|shop, store|place
mercado|m|market|place
escuela|f|school|place
biblioteca|f|library|place
iglesia|f|church|place
banco|m|bank; bench|place
restaurante|m|restaurant|place
cine|m|movie theater, the movies|place
museo|m|museum|place
oficina|f|office|place
estación|f|station; season|place
@1 nature,place
playa|f|beach|place
mar|m|sea|place
río|m|river|place
lago|m|lake|place
montaña|f|mountain|place
bosque|m|forest, woods|place
campo|m|field; countryside|place
isla|f|island|place
puente|m|bridge|place
torre|f|tower; rook (chess)|place
camino|m|path, way
país|m|country|place
mundo|m|world
lugar|m|place|place
@1 nature
árbol|m|tree
flor|f|flower
hoja|f|leaf; sheet of paper
planta|f|plant
piedra|f|stone, rock
tierra|f|earth, land, soil
fuego|m|fire
sol|m|sun
luna|f|moon
estrella|f|star
cielo|m|sky
@1 weather
lluvia|f|rain
nieve|f|snow
viento|m|wind
nube|f|cloud
calor|m|heat (hace calor: it’s hot)
frío#n|m|cold (hace frío: it’s cold)
llover|v.ue|rain
nevar|v.ie|snow
@1 animal
animal|m|animal
perro|m~|dog
gato|m~|cat|alt:gatito
pájaro|m|bird
pez|m|fish (alive)
caballo|m|horse; knight (chess)
vaca|f|cow
cerdo|m|pig; pork
oveja|f|sheep
gallina|f|hen, chicken
pato|m|duck
ratón|m|mouse
conejo|m|rabbit
zorro|m|fox
oso|m|bear
rana|f|frog
abeja|f|bee
mariposa|f|butterfly
@1 time
tiempo|m|time; weather
hora|f|hour; time
minuto|m|minute
día|m|day
semana|f|week
mes|m|month
año|m|year
mañana#n|f|morning
tarde|f|afternoon, evening
noche|f|night
lunes|m|Monday
martes|m|Tuesday
miércoles|m|Wednesday
jueves|m|Thursday
viernes|m|Friday
sábado|m|Saturday
domingo|m|Sunday
momento|m|moment
vez|f|time (once, twice), turn
cumpleaños|m|birthday
fiesta|f|party; holiday
vacaciones|fpl|vacation, holidays
fin de semana|phrase|weekend
@1 school,language
clase|f|class
lección|f|lesson
examen|m|exam, test
tarea|f|homework; task
cuaderno|m|notebook
lápiz|m|pencil
pregunta|f|question
respuesta|f|answer
palabra|f|word
idioma|m|language
español|m|Spanish (the language)
inglés|m|English (the language)
@1 hobby,sport,music
juego|m|game
deporte|m|sport
fútbol|m|soccer, football
música|f|music
canción|f|song
película|f|movie, film
@1 money,shop
dinero|m|money
moneda|f|coin; currency
precio|m|price
@1 transport,travel
tren|m|train|transport
carro|m|car (Latin America)|transport
coche|m|car|transport
autobús|m|bus|transport
bicicleta|f|bicycle|transport
avión|m|airplane|transport
barco|m|boat, ship|transport
viaje|m|trip, journey
@1 clothes
ropa|f|clothes
camisa|f|shirt
camiseta|f|T-shirt
pantalón|m|pants, trousers
zapato|m|shoe
sombrero|m|hat
vestido|m|dress
@1 color
color|m|color
rojo|a|red
azul|a|blue
verde|a|green
amarillo|a|yellow
blanco|a|white
negro|a|black
gris|a|gray
marrón|a=|brown
rosa#adj|a=|pink
morado|a|purple
@1 feeling
feliz|a|happy|+
contento|a|happy, glad|st +
triste|a|sad|-
enojado|a|angry|st -
cansado|a|tired|st
aburrido|a|bored; boring
lleno|a|full (lleno de: full of)
tranquilo|a|calm, quiet|+
amor|m|love|+
miedo|m|fear|-
hambre|f*|hunger (tengo hambre: I’m hungry)
sed|f|thirst (tengo sed: I’m thirsty)
sueño|m|sleepiness; dream
@1
bueno|a|good|ap:buen +
malo|a|bad|ap:mal -
grande|a|big, large; great|ap:gran
pequeño|a|small, little
alto|a|tall, high
bajo|a|short, low
largo|a|long
corto|a|short (length)
nuevo|a|new
viejo|a|old
joven|a|young
bonito|a|pretty, nice|+
lindo|a|lovely, pretty|+
feo|a|ugly|-
fácil|a|easy
difícil|a|difficult, hard
rápido|a|fast, quick
lento|a|slow
caro|a|expensive
barato|a|cheap
rico|a|delicious; rich|+
pobre|a|poor
limpio|a|clean
sucio|a|dirty
caliente|a|hot
frío|a|cold
importante|a|important
interesante|a|interesting|+
divertido|a|fun, funny|+
simpático|a|nice, friendly|+
amable|a|kind|+
mejor|a=|better, best
peor|a=|worse, worst
mayor|a=|older; bigger
menor|a=|younger; smaller
favorito|a|favorite
dormido|a|asleep|st
listo|a|ready; clever
ocupado|a|busy
libre|a|free
abierto|a|open
cerrado|a|closed
solo#adj|a|alone; lonely|dep
@1
ser|v|be (what someone or something is)
estar|v|be (how or where)
tener|v|have
haber|v|have (he comido: I have eaten); hay: there is, there are
ir|v|go
irse|v|leave, go away
venir|v|come
hacer|v|do, make
decir|v|say, tell
poder|v|can, be able to
querer|v|want; love
saber|v|know (a fact), know how to
conocer|v.zc|know (a person, a place); meet
ver|v|see; watch
mirar|v|look (at), watch
oír|v|hear
escuchar|v|listen (to)
hablar|v|speak, talk
preguntar|v|ask
contestar|v|answer
llamar|v|call
llamarse|v|be called (me llamo: my name is)
comer|v|eat
beber|v|drink
tomar|v|take; drink, have
vivir|v|live
trabajar|v|work
estudiar|v|study
aprender|v|learn
enseñar|v|teach; show
leer|v|read
escribir|v|write|pp:escrito
jugar|v.ue|play
correr|v|run
caminar|v|walk
nadar|v|swim
bailar|v|dance
cantar|v|sing
dormir|v.ueu|sleep
despertarse|v.ie|wake up
levantarse|v|get up
acostarse|v.ue|go to bed
sentarse|v.ie|sit down
abrir|v|open|pp:abierto
cerrar|v.ie|close, shut
empezar|v.ie|start, begin
terminar|v|finish, end
salir|v|go out, leave
entrar|v|go in, come in
llegar|v|arrive, get (to)
volver|v.ue|come back, return|pp:vuelto
regresar|v|come back, go back
buscar|v|look for
encontrar|v.ue|find
perder|v.ie|lose; miss
ganar|v|win; earn
pagar|v|pay (for)
comprar|v|buy
vender|v|sell
costar|v.ue|cost
necesitar|v|need
usar|v|use
llevar|v|carry, take; wear
traer|v|bring
dar|v|give
ayudar|v|help
esperar|v|wait (for); hope
pensar|v.ie|think
creer|v|believe, think
sentir|v.iei|feel; be sorry
sentirse|v.iei|feel (well, sad…)
gustar|v|please (me gusta: I like it)
encantar|v|delight (me encanta: I love it)
amar|v|love
preferir|v.iei|prefer
recordar|v.ue|remember
olvidar|v|forget
visitar|v|visit
viajar|v|travel
cocinar|v|cook
limpiar|v|clean
lavar|v|wash
tocar|v|touch; play (music)
pasar|v|pass; spend (time); happen
cambiar|v|change
poner|v|put
quitar|v|take away, take off
saltar|v|jump|alt:brincar
golpear|v|hit|alt:pegar
lanzar|v|throw
lanzarse|v|throw yourself, dive
atacar|v|attack
empujar|v|push
trepar|v|climb
subir|v|go up, climb; raise
bajar|v|go down; lower
soplar|v|blow
volar|v.ue|fly
caer|v|fall
caerse|v|fall down
mostrar|v.ue|show
explicar|v|explain
entender|v.ie|understand
comprender|v|understand
repetir|v.i|repeat
practicar|v|practice
descansar|v|rest
`);
  LISTS.push(`
@2 hush
calladito|m|hushling (a small Hush creature)
calladón|m|big hushling
silencio|m|silence; the Hush (el Silencio)
Mimo|name|Mimo (your friend)
Noa|name|Noa
Alba|name|Alba (the town)
Molinar|name|Molinar (the windmill village)
Remanso|name|Remanso (the lake village)
campana|f|bell
molino|m|mill, windmill|place
cantera|f|quarry|place
cueva|f|cave|place
pico|m|peak; beak|place
polilla|f|moth
escarabajo|m|beetle
armadillo|m|armadillo
muñeco|m|dummy, doll
grano|m|grain, kernel
palomita|f|popcorn (palomitas)
coronel|m|colonel
izquierda|f|left
derecha|f|right
medio|m|middle|alt:centro
cola|f|tail; line (queue)
caparazón|m|shell
ala|f*|wing
piedrita|f|pebble
pedrusco|m|big rock
murciélago|m|bat
bola|f|ball
remo|m|oar
farol|m|lantern|alt:linterna
cuerda|f|rope|alt:soga,mecate
espantapájaros|m|scarecrow
contraseña|f|password|alt:clave
laberinto|m|maze, labyrinth
dominó|m|dominoes|alt:domino
ficha|f|tile, game piece
colmado|m|corner store
tumba|f|grave|alt:sepultura,lápida
cementerio|m|cemetery|place
vela|f|candle
cuervo|m|crow
gong|m|gong
cristal|m|crystal; glass
canario|m|canary
girasol|m|sunflower
tulipán|m|tulip
lavanda|f|lavender
colmena|f|beehive
invernadero|m|greenhouse|place
hielo|m|ice
alfombra|f|rug, carpet|alt:tapete
horno|m|oven
tijera|f|scissors|alt:tijeras
ajedrez|m|chess
damas|fpl|checkers
peón|m|pawn
alfil|m|bishop (chess)
dama|f|queen (chess); lady|alt:reina
rey|m|king
medalla|f|medal
audífono|m|headphones|alt:audífonos,auricular,auriculares
grabadora|f|recorder
casete|m|cassette
gnomo|m|gnome|alt:enano
dado|m|die (dice)
buzón|m|mailbox
gorra|f|cap
postal|f|postcard
poema|m|poem
martillo|m|hammer
manta|f|blanket|alt:cobija,frazada
disco|m|record, disc|alt:vinilo
chicle|m|chewing gum
periódico|m|newspaper|alt:diario
cometa|f|kite|alt:papalote,barrilete,chiringa,volantín,papagayo
calaverita|f|sugar skull
fideos|mpl|noodles|alt:tallarines
rollito|m|spring roll
wantán|m|wonton|alt:wonton
jiaozi|m|jiaozi (dumplings)|alt:empanadilla
baozi|m|baozi (steamed buns)|alt:bollo
copa|f|cup, trophy; glass (for drinks)
barrio|m|neighborhood|place
suerte|f|luck|+
bolsillo|m|pocket
oro|m|gold
carta|f|letter; card
golosina|f|sweet, treat|alt:chocolatina
hongo|m|mushroom|alt:seta
norte|m|north
sur|m|south
este#n|m|east
oeste|m|west
colina|f|hill|place
costurera|f|seamstress|per alt:modista
`);
  LISTS.push(`
@2
pedir|v.i|ask for, order
servir|v.i|serve; be useful
seguir|v.i|follow; keep (doing), still be
conseguir|v.i|get, manage
vestirse|v.i|get dressed
elegir|v.i|choose
reír|v|laugh
reírse|v|laugh
sonreír|v|smile
divertirse|v.iei|have fun
mentir|v.iei|lie (tell lies)
morir|v.ueu|die|pp:muerto
contar|v.ue|count; tell
probar|v.ue|try, taste
soñar|v.ue|dream
mover|v.ue|move
devolver|v.ue|give back|pp:devuelto
resolver|v.ue|solve|pp:resuelto
doler|v.ue|hurt (me duele: it hurts)
almorzar|v.ue|have lunch
acordarse|v.ue|remember
encontrarse|v.ue|meet; be (located)
preocuparse|v|worry
quedarse|v|stay
quedar|v|remain; meet up; fit
ponerse|v|put on; become
quitarse|v|take off (clothes)
lavarse|v|wash (yourself)
ducharse|v|take a shower
bañarse|v|take a bath; go swimming
peinarse|v|comb your hair
cepillarse|v|brush (your teeth, hair)
casarse|v|get married
enamorarse|v|fall in love
enojarse|v|get angry
dormirse|v.ueu|fall asleep
desayunar|v|have breakfast
cenar|v|have dinner
preparar|v|prepare
calentar|v.ie|heat, warm up
cortar|v|cut
invitar|v|invite
celebrar|v|celebrate
regalar|v|give (as a gift)
recibir|v|receive, get
enviar|v.í|send
mandar|v|send; order
responder|v|answer, reply
dibujar|v|draw
pintar|v|paint
sacar|v|take out; take (a photo); get (a grade)
andar|v|walk; go
manejar|v|drive
conducir|v|drive
parar|v|stop
cruzar|v|cross
girar|v|turn
perderse|v.ie|get lost
mudarse|v|move (house)
alquilar|v|rent
nacer|v.zc|be born
crecer|v.zc|grow
aprobar|v.ue|pass (an exam)
reprobar|v.ue|fail (an exam)
decidir|v|decide
escoger|v|choose
intentar|v|try
tratar|v|try; treat
deber|v|must, should; owe
soler|v.ue|usually (do)
parecer|v.zc|seem
parecerse|v.zc|look like
ocurrir|v|happen
faltar|v|be missing, lack
importar|v|matter
interesar|v|interest
molestar|v|bother
preocupar|v|worry
fascinar|v|fascinate
odiar|v|hate
besar|v|kiss
abrazar|v|hug
llorar|v|cry
gritar|v|shout
callar|v|keep quiet, silence
callarse|v|go quiet, shut up
charlar|v|chat
platicar|v|chat (Mexico)
saludar|v|greet, say hi
despedirse|v.i|say goodbye
presentar|v|introduce; present
acompañar|v|go with, keep company
compartir|v|share
prestar|v|lend
ahorrar|v|save (money)
gastar|v|spend
arreglar|v|fix; tidy
romper|v|break|pp:roto
romperse|v|break
construir|v.y|build
crear|v|create
funcionar|v|work (a machine)
encender|v.ie|turn on; light
apagar|v|turn off; put out
llenar|v|fill
guardar|v|keep, put away
ordenar|v|tidy up; order
tirar|v|throw (away); pull
tirarse|v|throw yourself, jump
recoger|v|pick up, collect
agarrar|v|grab, take
dejar|v|leave; let
levantar|v|lift, raise
oler|v|smell
observar|v|watch, observe
notar|v|notice
descubrir|v|discover|pp:descubierto
esconder|v|hide
esconderse|v|hide
pescar|v|fish
entrenar|v|train
patinar|v|skate
escalar|v|climb
pasear|v|go for a walk
acampar|v|camp
relajarse|v|relax
disfrutar|v|enjoy
grabar|v|record
depender|v|depend
existir|v|exist
cuidar|v|look after, take care of
extrañar|v|miss (someone)
avisar|v|let know, warn
traducir|v|translate
significar|v|mean
pronunciar|v|pronounce
corregir|v.i|correct
equivocarse|v|make a mistake, be wrong
fallar|v|fail, miss
cumplir|v|turn (an age); keep (a promise)
aventarse|v.ie|throw yourself (Mexico)
@2 people,family
nieto|m~|grandson/granddaughter|per
sobrino|m~|nephew/niece|per
suegro|m~|father-in-law/mother-in-law|per
cuñado|m~|brother-in-law/sister-in-law|per
pareja|f|couple; partner|per
compañero|m~|classmate, partner, colleague|per
invitado|m~|guest|per
desconocido|m~|stranger|per
chavo|m~|kid, guy (Mexico)|per
muchacho|m~|boy/girl, young person|per
adulto|m~|adult|per
anciano|m~|old man/old woman|per
gemelo|m~|twin|per
@2 work,people
abogado|m~|lawyer|per
ingeniero|m~|engineer|per
bombero|m~|firefighter|per
camarero|m~|waiter/waitress|per
dueño|m~|owner|per
cliente|mf|customer, client|per
turista|mf|tourist|per
empleado|m~|employee|per
secretario|m~|secretary|per
pintor|m~|painter|per
conductor|m~|driver|per
piloto|mf|pilot|per
periodista|mf|journalist|per
programador|m~|programmer|per
dentista|mf|dentist|per
carpintero|m~|carpenter|per
herrero|m~|blacksmith|per
relojero|m~|watchmaker|per
barquero|m~|boatman|per
bibliotecario|m~|librarian|per
empresa|f|company, business
reunión|f|meeting
proyecto|m|project
sueldo|m|salary, pay
@2
cosa|f|thing
idea|f|idea
problema|m|problem
verdad|f|truth|+
mentira|f|lie|-
razón|f|reason (tener razón: be right)
parte|f|part
forma|f|form, shape; way
manera|f|way, manner
tipo|m|type, kind; guy
ejemplo|m|example
número|m|number
mitad|f|half
grupo|m|group
historia|f|story; history
noticia|f|news, piece of news
mensaje|m|message
correo|m|mail; email
regalo|m|gift, present|+
sorpresa|f|surprise
ayuda|f|help
favor|m|favor
plan|m|plan
vida|f|life
muerte|f|death|-
paz|f|peace|+
guerra|f|war|-
fin|m|end
principio|m|beginning
centro|m|center, downtown
lado|m|side
fondo|m|bottom, back
punto|m|point; dot
línea|f|line
cuenta|f|bill; account
lista|f|list
juguete|m|toy
pelota|f|ball
@2 home
habitación|f|room, bedroom|place
dormitorio|m|bedroom|place
comedor|m|dining room|place
pasillo|m|hallway|place
escalera|f|stairs; ladder
piso|m|floor; apartment
suelo|m|floor, ground
techo|m|roof; ceiling
pared|f|wall
mueble|m|piece of furniture
sofá|m|sofa
armario|m|closet, wardrobe
estante|m|shelf
espejo|m|mirror
cortina|f|curtain
almohada|f|pillow
sábana|f|sheet
toalla|f|towel
jabón|m|soap
cepillo|m|brush
basura|f|trash
refrigerador|m|refrigerator|alt:refri,nevera
estufa|f|stove
lavadora|f|washing machine
cuchara|f|spoon
cuchillo|m|knife
tenedor|m|fork
olla|f|pot
sartén|f|frying pan
caja|f|box
bolsa|f|bag
mochila|f|backpack
paraguas|m|umbrella
llavero|m|keychain
@2 clothes
falda|f|skirt
chaqueta|f|jacket
abrigo|m|coat
suéter|m|sweater
calcetín|m|sock
bota|f|boot
bufanda|f|scarf
guante|m|glove
cinturón|m|belt
lentes|mpl|glasses
anillo|m|ring
collar|m|necklace
traje|m|suit; costume
uniforme|m|uniform
pijama|f|pajamas
@2 food
aceite|m|oil
pimienta|f|pepper
harina|f|flour
ajo|m|garlic
zanahoria|f|carrot
lechuga|f|lettuce
pepino|m|cucumber
aguacate|m|avocado
piña|f|pineapple
sandía|f|watermelon
mango|m|mango
cereza|f|cherry
durazno|m|peach
coco|m|coconut
nuez|f|nut, walnut
jamón|m|ham
salchicha|f|sausage
hamburguesa|f|hamburger
sándwich|m|sandwich
pasta|f|pasta
pan dulce|phrase|sweet bread
postre|m|dessert
mermelada|f|jam
yogur|m|yogurt
cereal|m|cereal
receta|f|recipe
menú|m|menu
@2 health,body
cuello|m|neck
hombro|m|shoulder
rodilla|f|knee
uña|f|nail
labio|m|lip
lengua|f|tongue; language
garganta|f|throat
sangre|f|blood
hueso|m|bone
piel|f|skin
fiebre|f|fever
tos|f|cough
gripe|f|flu
resfriado|m|cold (illness)
pastilla|f|pill
farmacia|f|pharmacy|place
herida|f|wound
@2 town
supermercado|m|supermarket|place
panadería|f|bakery|place
hotel|m|hotel|place
universidad|f|university|place
colegio|m|school|place
aeropuerto|m|airport|place
puerto|m|port, harbor|place
esquina|f|corner|place
carretera|f|road, highway|place
avenida|f|avenue|place
edificio|m|building|place
fábrica|f|factory|place
granja|f|farm|place
teatro|m|theater|place
gimnasio|m|gym|place
piscina|f|swimming pool|place
estadio|m|stadium|place
muelle|m|dock, pier|place
faro|m|lighthouse|place
fuente|f|fountain; source|place
cárcel|f|jail|place
@2 nature
hierba|f|grass
pasto|m|grass, lawn
rama|f|branch
raíz|f|root
semilla|f|seed
roca|f|rock
arena|f|sand
ola|f|wave
costa|f|coast|place
valle|m|valley|place
selva|f|jungle|place
desierto|m|desert|place
volcán|m|volcano|place
naturaleza|f|nature
aire|m|air
humo|m|smoke
tormenta|f|storm
trueno|m|thunder
rayo|m|lightning; ray
niebla|f|fog
arcoíris|m|rainbow
clima|m|climate, weather
temperatura|f|temperature
grado|m|degree
@2 animal
mascota|f|pet
pollito|m|chick
toro|m|bull
cabra|f|goat
burro|m|donkey
lobo|m|wolf
león|m|lion
tigre|m|tiger
mono|m|monkey
elefante|m|elephant
jirafa|f|giraffe
serpiente|f|snake
araña|f|spider
mosca|f|fly
mosquito|m|mosquito
hormiga|f|ant
tortuga|f|turtle
ballena|f|whale
delfín|m|dolphin
tiburón|m|shark
águila|f*|eagle
búho|m|owl
loro|m|parrot
gusano|m|worm
caracol|m|snail
`);
  LISTS.push(`
@2 time
enero|m|January
febrero|m|February
marzo|m|March
abril|m|April
mayo|m|May
junio|m|June
julio|m|July
agosto|m|August
septiembre|m|September
octubre|m|October
noviembre|m|November
diciembre|m|December
primavera|f|spring
verano|m|summer
otoño|m|autumn, fall
invierno|m|winter
mediodía|m|noon
medianoche|f|midnight
madrugada|f|early morning, dawn
fecha|f|date
calendario|m|calendar
siglo|m|century
pasado|m|the past
futuro|m|the future
presente#n|m|the present
rato|m|while, short time
temporada|f|season
@2 school,language
asignatura|f|school subject
materia|f|school subject; matter
matemáticas|fpl|math
ciencia|f|science
geografía|f|geography
arte|m|art
educación física|phrase|PE, gym class
nota|f|grade; note
prueba|f|test, quiz
bolígrafo|m|pen|alt:pluma,boli
goma|f|eraser; rubber
regla|f|ruler; rule
pizarra|f|blackboard, whiteboard|alt:pizarrón
diccionario|m|dictionary
frase|f|sentence, phrase
oración|f|sentence; prayer
letra|f|letter (of the alphabet); lyrics
página|f|page
texto|m|text
cuento|m|story, tale
novela|f|novel
poesía|f|poetry
gramática|f|grammar
vocabulario|m|vocabulary
error|m|mistake, error
francés#n|m|French (the language)
alemán#n|m|German (the language)
portugués#n|m|Portuguese (the language)
chino#n|m|Chinese (the language)
japonés#n|m|Japanese (the language)
@2 hobby,sport,music
baloncesto|m|basketball|alt:básquetbol,básquet
béisbol|m|baseball
tenis|m|tennis
natación|f|swimming
carrera|f|race; career, degree
partido|m|game, match; party (politics)
equipo|m|team; equipment
jugador|m~|player|per
pasatiempo|m|hobby
videojuego|m|video game
guitarra|f|guitar
piano|m|piano
tambor|m|drum
violín|m|violin
flauta|f|flute
concierto|m|concert
banda|f|band
ritmo|m|rhythm
baile|m|dance
dibujo|m|drawing
pintura|f|painting; paint
serie|f|series, show
programa|m|program, show
paseo|m|walk, ride
excursión|f|trip, outing
cartas|fpl|cards (the game)
@2 travel,transport
maleta|f|suitcase
pasaporte|m|passport
boleto|m|ticket|alt:billete
mapa|m|map
metro|m|subway; meter
taxi|m|taxi|transport
camión|m|truck; bus (Mexico)|transport
moto|f|motorbike|transport
barca|f|small boat|transport
balsa|f|raft|transport
viajero|m~|traveler|per
turismo|m|tourism
vuelo|m|flight
salida|f|exit; departure
llegada|f|arrival
entrada|f|entrance; ticket
frontera|f|border
dirección|f|address; direction
@2 money,shop
tarjeta|f|card
cambio|m|change
oferta|f|offer, sale
compra|f|purchase, shopping
cajero|m~|cashier; ATM|per
kilo|m|kilo
litro|m|liter
pedazo|m|piece
paquete|m|package
recibo|m|receipt
@2 feeling
alegre|a|cheerful, happy|+
preocupado|a|worried|-
nervioso|a|nervous
emocionado|a|excited|st +
asustado|a|scared|st -
sorprendido|a|surprised|st
orgulloso|a|proud|+
celoso|a|jealous|-
enamorado|a|in love|+
avergonzado|a|embarrassed|st -
solitario|a|lonely
aburrimiento|m|boredom|-
alegría|f|joy|+
tristeza|f|sadness|-
felicidad|f|happiness|+
emoción|f|emotion; excitement
sentimiento|m|feeling
risa|f|laugh, laughter|+
beso|m|kiss|+
abrazo|m|hug|+
@2
diferente|a|different
igual|a|same, equal
parecido|a|similar
propio|a|own
único|a|only; unique
especial|a|special
normal|a|normal
raro|a|strange, weird; rare
extraño|a|strange
típico|a|typical
perfecto|a|perfect|+
terrible|a|terrible|-
horrible|a|horrible|-
maravilloso|a|wonderful|+
increíble|a|incredible, amazing|+
genial|a|great, brilliant|+
excelente|a|excellent|+
fantástico|a|fantastic|+
precioso|a|lovely, beautiful|+
hermoso|a|beautiful|+
guapo|a|good-looking|+
gordo|a|fat
delgado|a|thin, slim
flaco|a|skinny
fuerte|a|strong
débil|a|weak
inteligente|a|intelligent|+
tonto|a|silly, stupid|-
trabajador|a|hard-working|+
perezoso|a|lazy|-
serio|a|serious
gracioso|a|funny|+
tímido|a|shy
valiente|a|brave|+
generoso|a|generous|+
egoísta|a|selfish|-
educado|a|polite|+
grosero|a|rude|-
paciente|a|patient|+
callado|a|quiet, silent
ruidoso|a|noisy
peligroso|a|dangerous|-
seguro|a|safe; sure
posible|a|possible
imposible|a|impossible
necesario|a|necessary
útil|a|useful
inútil|a|useless
cómodo|a|comfortable
incómodo|a|uncomfortable
claro#adj|a|clear; light (color)
oscuro|a|dark
brillante|a|bright, shiny
suave|a|soft, smooth
duro|a|hard
pesado|a|heavy; annoying
ligero|a|light (weight)
ancho|a|wide
estrecho|a|narrow
profundo|a|deep
mojado|a|wet|st
seco|a|dry
dulce#adj|a|sweet
salado|a|salty
picante|a|spicy
amargo|a|bitter
delicioso|a|delicious|+
fresco|a|fresh; cool
tibio|a|warm
antiguo|a|old, ancient
moderno|a|modern
famoso|a|famous
popular|a|popular
público|a|public
privado|a|private
verdadero|a|true, real
falso|a|false, fake
correcto|a|correct, right
incorrecto|a|wrong
siguiente|a|next, following
anterior|a=|previous
próximo|a|next
pasado#adj|a|last (la semana pasada)
cercano|a|near, close
lejano|a|far away
entero|a|whole
medio#adj|a|half
doble|a|double
@2 color
naranja#adj|a=|orange (color)
anaranjado|a|orange (color)
café#adj|a=|brown (Latin America)
violeta|a=|violet
dorado|a|golden
plateado|a|silver
celeste|a|sky blue
@2 place,people
México|name|Mexico|country
España|name|Spain|country
Argentina|name|Argentina|country
Colombia|name|Colombia|country
Chile|name|Chile|country
Perú|name|Peru|country
Cuba|name|Cuba|country
Venezuela|name|Venezuela|country
Brasil|name|Brazil|country
Portugal|name|Portugal|country
Alemania|name|Germany|country
Francia|name|France|country
Italia|name|Italy|country
Inglaterra|name|England|country
China|name|China|country
Japón|name|Japan|country
Estados Unidos|phrase|the United States|country
Canadá|name|Canada|country
Europa|name|Europe
América|name|America
mexicano|a|Mexican|nat
español#adj|a|Spanish|nat
argentino|a|Argentinian|nat
colombiano|a|Colombian|nat
chileno|a|Chilean|nat
peruano|a|Peruvian|nat
cubano|a|Cuban|nat
venezolano|a|Venezuelan|nat
dominicano|a|Dominican|nat
puertorriqueño|a|Puerto Rican|nat
brasileño|a|Brazilian|nat
portugués#adj|a|Portuguese|nat
alemán#adj|a|German|nat
francés#adj|a|French|nat
italiano|a|Italian|nat
inglés#adj|a|English|nat
estadounidense|a|American (from the US)|nat
canadiense|a|Canadian|nat
chino#adj|a|Chinese|nat
japonés#adj|a|Japanese|nat
extranjero|a|foreign; foreigner|nat
@2 tech
internet|m|internet
pantalla|f|screen
teclado|m|keyboard
cámara|f|camera
video|m|video
red|f|network; net
página web|phrase|web page
aplicación|f|app
batería|f|battery; drums
cargador|m|charger
`);
  LISTS.push(`
@3
lograr|v|achieve, manage to
desarrollar|v|develop
mejorar|v|improve, get better
empeorar|v|get worse
aumentar|v|increase
disminuir|v.y|decrease
reducir|v|reduce
producir|v|produce
proteger|v|protect
contaminar|v|pollute
reciclar|v|recycle
salvar|v|save, rescue
rescatar|v|rescue
ofrecer|v.zc|offer
agradecer|v.zc|thank, be grateful for
merecer|v.zc|deserve
pertenecer|v.zc|belong
desaparecer|v.zc|disappear
aparecer|v.zc|appear
reconocer|v.zc|recognize; admit
obedecer|v.zc|obey
sugerir|v.iei|suggest
proponer|v|propose
suponer|v|suppose
imaginar|v|imagine
imaginarse|v|imagine, picture
opinar|v|think, have an opinion
considerar|v|consider
dudar|v|doubt
negar|v.ie|deny
aceptar|v|accept
rechazar|v|reject, turn down
discutir|v|argue; discuss
convencer|v|convince
permitir|v|allow
prohibir|v.í|forbid, ban
obligar|v|force, make (someone do)
prometer|v|promise
confiar|v.í|trust
quejarse|v|complain
alegrarse|v|be glad
sorprender|v|surprise
asustar|v|scare
asustarse|v|get scared
arrepentirse|v.iei|regret
atreverse|v|dare
acostumbrarse|v|get used to
enterarse|v|find out
fijarse|v|notice, pay attention
convertirse|v.iei|turn into, become
volverse|v.ue|become; turn around|pp:vuelto
hacerse|v|become
aprovechar|v|make the most of, take advantage of
evitar|v|avoid
impedir|v.i|prevent
suceder|v|happen
resultar|v|turn out
participar|v|take part
organizar|v|organize
planear|v|plan
alcanzar|v|reach
superar|v|overcome, get over
vencer|v|defeat, beat
fracasar|v|fail
sobrevivir|v|survive
luchar|v|fight, struggle
pelear|v|fight
defender|v.ie|defend
escapar|v|escape
huir|v.y|flee
perseguir|v.i|chase
explorar|v|explore
investigar|v|investigate, research
inventar|v|invent; make up
diseñar|v|design
destruir|v.y|destroy
invertir|v.iei|invest
contratar|v|hire
despedir|v.i|fire, dismiss; see off
renunciar|v|quit, resign
jubilarse|v|retire
recorrer|v|travel around, go through
apreciar|v|appreciate
valorar|v|value
respetar|v|respect
admirar|v|admire
criticar|v|criticize
votar|v|vote
apoyar|v|support; lean
colaborar|v|collaborate
comunicarse|v|communicate
expresar|v|express
describir|v|describe|pp:descrito
informar|v|inform
anunciar|v|announce
advertir|v.iei|warn
aconsejar|v|advise
recomendar|v.ie|recommend
insistir|v|insist
mencionar|v|mention
comentar|v|comment, mention
añadir|v|add
agregar|v|add
comparar|v|compare
demostrar|v.ue|show, prove
comprobar|v.ue|check
calcular|v|calculate
medir|v.i|measure
sumar|v|add up
cansarse|v|get tired
aburrir|v|bore
emocionar|v|excite, move
llenarse|v|fill up
vaciar|v.í|empty
cubrir|v|cover|pp:cubierto
abrigarse|v|wrap up warm
quemar|v|burn
quemarse|v|get burned
hervir|v.iei|boil
freír|v|fry
mezclar|v|mix
añorar|v|long for, miss
brillar|v|shine
sonar|v.ue|ring, sound
susurrar|v|whisper
silbar|v|whistle
temblar|v.ie|shake, tremble
respirar|v|breathe
toser|v|cough
estornudar|v|sneeze
sudar|v|sweat
doblar|v|fold; turn
@3
sociedad|f|society
cultura|f|culture
tradición|f|tradition
costumbre|f|custom, habit
celebración|f|celebration
religión|f|religion
política|f|politics; policy
gobierno|m|government
ley|f|law
derecho|m|right; law (subject)
libertad|f|freedom|+
justicia|f|justice
igualdad|f|equality
elección|f|election; choice
nación|f|nation
ciudadano|m~|citizen|per
comunidad|f|community
población|f|population
medio ambiente|phrase|the environment
contaminación|f|pollution|-
reciclaje|m|recycling
energía|f|energy
planeta|m|planet
recurso|m|resource
peligro|m|danger|-
riesgo|m|risk
seguridad|f|safety, security
enfermedad|f|illness, disease|-
tratamiento|m|treatment
dieta|f|diet
ejercicio|m|exercise
estrés|m|stress|-
descanso|m|rest, break
éxito|m|success|+
fracaso|m|failure|-
meta|f|goal
objetivo|m|aim, goal
esfuerzo|m|effort
oportunidad|f|opportunity|+
experiencia|f|experience
conocimiento|m|knowledge
habilidad|f|skill
talento|m|talent
capacidad|f|ability, capacity
carácter|m|character, personality|pl:caracteres
personalidad|f|personality
actitud|f|attitude
opinión|f|opinion
punto de vista|phrase|point of view
consejo|m|advice, piece of advice
decisión|f|decision
solución|f|solution
duda|f|doubt
causa|f|cause
consecuencia|f|consequence
resultado|m|result
efecto|m|effect
diferencia|f|difference
ventaja|f|advantage|+
desventaja|f|disadvantage|-
relación|f|relationship
amistad|f|friendship|+
confianza|f|trust, confidence
respeto|m|respect
apoyo|m|support
conflicto|m|conflict|-
discusión|f|argument; discussion
pelea|f|fight|-
acuerdo|m|agreement
recuerdo|m|memory; souvenir
memoria|f|memory
infancia|f|childhood
juventud|f|youth
adolescente|mf|teenager|per
generación|f|generation
sentido|m|sense, meaning
significado|m|meaning
mente|f|mind
alma|f*|soul
espíritu|m|spirit
fe|f|faith
esperanza|f|hope|+
deseo|m|wish, desire
pesadilla|f|nightmare|-
secreto|m|secret
misterio|m|mystery
aventura|f|adventure
destino|m|destination; fate
ruta|f|route
paisaje|m|landscape
vista|f|view; sight
ambiente|m|atmosphere, environment
ruido|m|noise
sonido|m|sound
voz|f|voice
grito|m|shout, scream
canto|m|singing, song
eco|m|echo
luz|f|light
sombra|f|shadow, shade
oscuridad|f|darkness|-
belleza|f|beauty|+
fuerza|f|strength, force
poder#n|m|power
magia|f|magic
hechizo|m|spell
leyenda|f|legend
tesoro|m|treasure
diario#n|m|diary
@3 work,money
negocio|m|business
industria|f|industry
economía|f|economy
impuesto|m|tax
deuda|f|debt
préstamo|m|loan
salario|m|salary
entrevista|f|interview
currículum|m|CV, résumé
puesto|m|position, job; stall
contrato|m|contract
horario|m|schedule
turno|m|shift; turn
@3
responsable|a|responsible
honesto|a|honest|+
sincero|a|sincere|+
justo|a|fair; just|+
injusto|a|unfair|-
independiente|a|independent
social|a|social
cultural|a|cultural
político|a|political
económico|a|economic; cheap
natural|a|natural
artificial|a|artificial
ecológico|a|ecological, eco-friendly
global|a|global
local|a|local
nacional|a|national
internacional|a|international
mundial|a|world, worldwide
actual|a|current, present-day
reciente|a|recent
tradicional|a|traditional
común|a=|common
frecuente|a|frequent
grave|a|serious, grave
enorme|a|huge
gigante|a|giant
mínimo|a|minimum, tiny
máximo|a|maximum
principal|a|main
básico|a|basic
simple|a|simple
complicado|a|complicated
complejo|a|complex
confuso|a|confusing; confused
obvio|a|obvious
evidente|a|evident
probable|a|likely
capaz|a|capable, able
dispuesto|a|willing
preparado|a|prepared, ready
disponible|a|available
ausente|a|absent
presente|a|present
satisfecho|a|satisfied|st +
decepcionado|a|disappointed|st -
frustrado|a|frustrated|st -
agradecido|a|grateful|+
impresionado|a|impressed|st
deprimido|a|depressed|st -
ansioso|a|anxious|-
estresado|a|stressed|st -
relajado|a|relaxed|st +
agotado|a|exhausted|st
harto|a|fed up|st -
ilusionado|a|excited, hopeful|st +
sano|a|healthy|+
saludable|a|healthy
vivo|a|alive; lively
muerto|a|dead|st
despierto|a|awake
silencioso|a|silent, quiet
mágico|a|magic, magical
misterioso|a|mysterious
@3
realmente|adv|really
totalmente|adv|totally
completamente|adv|completely
absolutamente|adv|absolutely
probablemente|adv|probably
posiblemente|adv|possibly
seguramente|adv|surely, probably
finalmente|adv|finally
inmediatamente|adv|immediately
rápidamente|adv|quickly
lentamente|adv|slowly
fácilmente|adv|easily
especialmente|adv|especially
generalmente|adv|generally, usually
normalmente|adv|normally, usually
actualmente|adv|currently, nowadays
últimamente|adv|lately
recientemente|adv|recently
afortunadamente|adv|fortunately
desgraciadamente|adv|unfortunately
exactamente|adv|exactly
claramente|adv|clearly
a menudo|phrase|often
de repente|phrase|suddenly
poco a poco|phrase|little by little
sin duda|phrase|without a doubt
por suerte|phrase|luckily
por desgracia|phrase|unfortunately
en general|phrase|in general
es que|phrase|the thing is
por lo menos|phrase|at least
al menos|phrase|at least
cada vez más|phrase|more and more
darse cuenta|phrase|realize
tener ganas de|phrase|feel like (doing)
tener que|phrase|have to
ir a|phrase|be going to
acabar de|phrase|have just (done)
volver a|phrase|(do) again
dejar de|phrase|stop (doing)
estar a punto de|phrase|be about to
`);
  LISTS.push(`
@3 home
herramienta|f|tool
clavo|m|nail (metal)
tornillo|m|screw
escoba|f|broom
cubeta|f|bucket|alt:balde,cubo
jarrón|m|vase
cuadro|m|painting, picture; square
marco|m|frame
cajón|m|drawer
bombilla|f|light bulb|alt:foco
enchufe|m|plug, socket
chimenea|f|fireplace, chimney
balcón|m|balcony
patio|m|patio, yard
terraza|f|terrace
garaje|m|garage
sótano|m|basement
ático|m|attic
vecindario|m|neighborhood
alquiler|m|rent
mudanza|f|move (house)
@3 food
sabor|m|taste, flavor
olor|m|smell
ingrediente|m|ingredient
cucharada|f|spoonful
pedacito|m|little piece
rebanada|f|slice
tortita|f|pancake
pan tostado|phrase|toast
salsa|f|sauce
mole|m|mole (Mexican sauce)
tamal|m|tamale
empanada|f|empanada
arepa|f|arepa
churro|m|churro
flan|m|flan
canela|f|cinnamon
vainilla|f|vanilla
licuado|m|smoothie, shake
agua fresca|phrase|fruit drink
merienda|f|afternoon snack
propina|f|tip (money)
@3 health,body
cerebro|m|brain
pulmón|m|lung
músculo|m|muscle
frente|f|forehead
mejilla|f|cheek
ceja|f|eyebrow
barba|f|beard
bigote|m|mustache
tobillo|m|ankle
muñeca|f|wrist; doll
codo|m|elbow
dolor de cabeza|phrase|headache
cita|f|appointment; date
consulta|f|doctor’s visit
vacuna|f|vaccine
cansancio|m|tiredness
lágrima|f|tear (crying)
@3 nature,weather
cascada|f|waterfall|place
charco|m|puddle
orilla|f|shore, bank|place
cumbre|f|summit|place
glaciar|m|glacier|place
pradera|f|meadow|place
pantano|m|swamp|place
helada|f|frost
granizo|m|hail
relámpago|m|lightning
amanecer|m|sunrise, dawn
atardecer|m|sunset
estación seca|phrase|dry season
huracán|m|hurricane
terremoto|m|earthquake
@3 animal
ardilla|f|squirrel
ciervo|m|deer
erizo|m|hedgehog
foca|f|seal
pingüino|m|penguin
cangrejo|m|crab
pulpo|m|octopus
paloma|f|dove, pigeon
gaviota|f|seagull
cisne|m|swan
@3 town,travel
semáforo|m|traffic light
acera|f|sidewalk|alt:banqueta
cuadra|f|block (street)
parada|f|stop (bus)|place
mapa del metro|phrase|subway map
tráfico|m|traffic
atasco|m|traffic jam|alt:trancón,embotellamiento
recepción|f|reception
equipaje|m|luggage
reserva|f|reservation|alt:reservación
habitación doble|phrase|double room
guía|mf|guide; guidebook|per
@3 media,tech,language
periodismo|m|journalism
artículo|m|article
revista|f|magazine
anuncio|m|ad, announcement
publicidad|f|advertising
noticiero|m|news (TV)
canal|m|channel
emisora|f|radio station
locutor|m~|announcer, presenter|per
oyente|mf|listener|per
lector|m~|reader|per
autor|m~|author|per
personaje|m|character (in a story)
capítulo|m|chapter
título|m|title
portada|f|cover
diálogo|m|dialogue
conversación|f|conversation
discurso|m|speech
acento|m|accent
traducción|f|translation
@3
hacer falta|phrase|be needed
dar igual|phrase|not matter (me da igual: I don’t mind)
tener éxito|phrase|be successful
tener miedo|phrase|be scared
tener razón|phrase|be right
tener suerte|phrase|be lucky
tener prisa|phrase|be in a hurry
tener cuidado|phrase|be careful
hacer caso|phrase|pay attention, listen
echar de menos|phrase|miss (someone)
pasarlo bien|phrase|have a good time
valer la pena|phrase|be worth it
estar harto|phrase|be fed up
llevarse bien|phrase|get along
@3
acostumbrado|a|used to|st
asombrado|a|amazed|st
confundido|a|confused|st
dormilón|a|sleepy-head, who loves sleep
enfadado|a|angry|st -
furioso|a|furious|-
tierno|a|tender, cute|+
amistoso|a|friendly|+
cariñoso|a|affectionate|+
travieso|a|naughty, mischievous
curioso|a|curious
despistado|a|absent-minded
puntual|a|punctual
creativo|a|creative|+
divertidísimo|a|so much fun|+
cansadísimo|a|really tired|st
@3
apurarse|v|hurry up
darse prisa|phrase|hurry up
cansar|v|tire
calmarse|v|calm down
tranquilizarse|v|calm down
equivocar|v|mix up
sentar|v.ie|seat; suit
probarse|v.ue|try on
llevarse|v|take away; get along
dedicarse|v|do for a living
ocuparse|v|take care of
soltar|v.ue|let go
atrapar|v|catch
cazar|v|hunt
alimentar|v|feed
regar|v.ie|water (plants)
plantar|v|plant
cultivar|v|grow (crops)
cosechar|v|harvest
@4
desarrollo|m|development
investigación|f|research
perspectiva|f|perspective
pensamiento|m|thought
razonamiento|m|reasoning
argumento|m|argument; plot
hipótesis|f|hypothesis
fenómeno|m|phenomenon
compromiso|m|commitment; compromise
responsabilidad|f|responsibility
desigualdad|f|inequality
pobreza|f|poverty|-
riqueza|f|wealth
bienestar|m|well-being|+
crisis|f|crisis|-
cambio climático|phrase|climate change
no obstante|phrase|nevertheless
por consiguiente|phrase|consequently
en definitiva|phrase|in short
a pesar de que|phrase|even though
siempre que|phrase|as long as; whenever
con tal de que|phrase|provided that
a menos que|phrase|unless
plantear|v|raise (an issue), pose
abordar|v|tackle, address
señalar|v|point out
destacar|v|stand out; highlight
fomentar|v|encourage, promote
evolucionar|v|evolve
surgir|v|arise
afrontar|v|face
asumir|v|assume, take on
`);

  LISTS.push(`
@2
dios|m~|god/goddess|f:diosa
juntar|v|put together, gather
juntarse|v|get together
remar|v|row
colgar|v.ue|hang (up)
cavar|v|dig
excavar|v|dig, excavate
moler|v.ue|grind
amasar|v|knead
hornear|v|bake
picar|v|chop; sting; be spicy
pelar|v|peel
sembrar|v.ie|sow, plant
cargar|v|carry, load; charge (a phone)
arrastrar|v|drag
iluminar|v|light up
adivinar|v|guess
perdonar|v|forgive
regañar|v|scold
coser|v|sew
tejer|v|knit, weave
remendar|v.ie|mend, patch
gritarse|v|shout at each other
vergüenza|f|shame, embarrassment (me da vergüenza: I’m embarrassed)|-
orgullo|m|pride
envidia|f|envy|-
culpa|f|fault, blame
rabia|f|rage, anger|-
susto|m|fright, scare
calma|f|calm|+
alivio|m|relief|+
cariño|m|affection; dear|+
ilusión|f|hope, excitement
ganas|fpl|desire (tengo ganas de: I feel like)
@2 food
chile|m|chili pepper
guacamole|m|guacamole
quesadilla|f|quesadilla
enchilada|f|enchilada
pozole|m|pozole (corn stew)
atole|m|atole (warm corn drink)
chocolate caliente|phrase|hot chocolate
concha|f|concha (sweet bun); shell
bolillo|m|bread roll
cacahuate|m|peanut|alt:maní
nopal|m|nopal cactus
frijoles|mpl|beans
pan de muerto|phrase|bread of the dead
trigo|m|wheat
masa|f|dough
costal|m|sack|alt:saco
@2 place,town
mina|f|mine|place
posada|f|inn|place
campamento|m|camp|place
pozo|m|well|place
establo|m|stable|place
corral|m|farmyard, pen|place
huerto|m|vegetable garden, orchard|place
rancho|m|ranch|place
hacienda|f|estate, ranch|place
taller|m|workshop|place
fragua|f|forge|place
herrería|f|blacksmith’s shop|place
embarcadero|m|landing, jetty|place
sendero|m|trail, path|place
refugio|m|shelter, refuge|place
cabaña|f|cabin|place
granero|m|barn, granary|place
túnel|m|tunnel|place
@2
minero|m~|miner|per
molinero|m~|miller|per
aspa|f*|sail (of a windmill), blade
rueda|f|wheel
engranaje|m|gear, gears
pala|f|shovel
carretilla|f|wheelbarrow
vagoneta|f|mine cart
casco|m|helmet
carbón|m|coal
hierro|m|iron
plata|f|silver; money (casual)
mineral|m|mineral
veta|f|vein (of ore)
polvo|m|dust
derrumbe|m|cave-in, collapse
fogata|f|campfire
tienda de campaña|phrase|tent
chamarra|f|jacket (Mexico)
rebozo|m|shawl
sarape|m|serape (blanket shawl)
huarache|m|sandal
poncho|m|poncho
gorro|m|hat, beanie
`);

  // wave 2 (2026-11-14, the es content helper): words the free-talk models and wants need (js/talk/content_es.js)
  LISTS.push(`
@2 food,drink
limonada|f|lemonade
horchata|f|horchata (a sweet rice drink)
banana|f|banana
melón|m|melon
papaya|f|papaya
kiwi|m|kiwi
caldo|m|broth, soup
pavo|m|turkey
dona|f|doughnut (Mexico)
cuerno|m|horn; crescent roll
chinola|f|passion fruit (Dominican Republic)
@2 place
estanque|m|pond|place
departamento|m|apartment (Mexico)|place
apartamento|m|apartment|place
alberca|f|swimming pool (Mexico)|place
región|f|region|place
@2
regadera|f|shower (Mexico); watering can
círculo|m|circle
leña|f|firewood
chiste|m|joke|+
pista|f|clue; track
presentación|f|presentation
educación|f|education; manners
verbo|m|verb
ferry|m|ferry|pl:ferris
lagartija|f|lizard; push-up (Mexico)
@2 sport
ciclismo|m|cycling
voleibol|m|volleyball
boxeo|m|boxing
yoga|m|yoga
@2 story
cómic|m|comic book
fantasía|f|fantasy
terror|m|terror; horror (libros de terror: horror books)|-
@2 fantasy
dragón|m|dragon
monstruo|m|monster
@2
acercar|v|bring closer
acercarse|v|come closer, approach
alejar|v|push away, move away
alejarse|v|move away, drift apart
reprobar|v.ue|fail (an exam) (Mexico)
conversar|v|talk, converse
chistoso|a|funny|+
húmedo|a|humid, damp
loco|a|crazy
regular|a=|so-so, OK; regular
fatal|a=|awful, terrible|-
súper|adv|super, really (casual)
adentro|adv|inside
poquito|adv|a little bit (poco + -ito)
ambos|det:ambos=m.p,ambas=f.p|both|quant
@3
subjuntivo|m|subjunctive
violencia|f|violence|-
`);
  // the dictionary helper, after wave 2's notes (2026-11-14): B1 words that were missing
  LISTS.push(`
@2
junto|a|together; joined (juntos, juntas)
final|a|final, last
final#n|m|end; final (match)
tal|a=|such (tal vez: maybe; ¿qué tal?: how’s it going?)
demás|pron|the others, the rest (los demás)
valor|m|value; courage
tamaño|m|size
instante|m|instant, moment
versión|f|version
meter|v|put (in)
valer|v|be worth, cost (vale la pena: it’s worth it)
vale la pena|phrase|it’s worth it
detener|v|stop; arrest
detenerse|v|stop
reunir|v.ú|gather
reunirse|v.ú|meet, get together
avanzar|v|move forward, advance
caber|v|fit
flotar|v|float
marcar|v|mark; dial; score
inmenso|a|immense, huge
distinto|a|different
quieto|a|still, not moving
`);
  // DX-B2 (2026-11-26, the B2 dictionary helper): about 1,000 B2 words by topic, plus the B1 words that were missing, so the
  // level meter (dict.js WORD_STEPS) can really reach B2. Latin American Spanish.
  LISTS.push(`
// work and careers
@4 work
empleo|m|employment, job
desempleo|m|unemployment|-
huelga|f|strike (from work)
sindicato|m|labor union
jornada|f|working day, shift (jornada laboral)
horas extras|phrase|overtime
ascenso|m|promotion; climb
aumento|m|raise, increase
vacante|f|vacancy, job opening
solicitud|f|application, request
formación|f|training, education
capacitación|f|training
práctica|f|practice; internship (prácticas)
pasantía|f|internship
beca|f|scholarship, grant
oficio|m|trade, occupation
profesión|f|profession
jubilación|f|retirement
pensión|f|pension; guesthouse
despido|m|dismissal, layoff|-
renuncia|f|resignation
plazo|m|deadline; period, term
fecha límite|phrase|deadline
informe|m|report
presupuesto|m|budget; estimate
rendimiento|m|performance, yield
productividad|f|productivity
eficiencia|f|efficiency
liderazgo|m|leadership
negociación|f|negotiation
teletrabajo|m|remote work
sede|f|headquarters
sucursal|f|branch (of a company)
comercio|m|trade, commerce; store
mercado laboral|phrase|job market
competencia|f|competition; skill
requisito|m|requirement
tiempo completo|phrase|full-time
medio tiempo|phrase|part-time
@4 work,people
gerente|mf|manager|per
director|m~|director, manager; principal|per
supervisor|m~|supervisor|per
empresario|m~|businessman/businesswoman|per
emprendedor|m~|entrepreneur|per
trabajador#n|m~|worker|per
técnico|m~|technician|per
mecánico|m~|mechanic|per
cirujano|m~|surgeon|per
psicólogo|m~|psychologist|per
especialista|mf|specialist|per
investigador|m~|researcher|per
científico|m~|scientist|per
arquitecto|m~|architect|per
fotógrafo|m~|photographer|per
reportero|m~|reporter|per
corresponsal|mf|correspondent|per
actor|m~|actor/actress|per f:actriz
escultor|m~|sculptor|per
compositor|m~|composer|per
plomero|m~|plumber|per
electricista|mf|electrician|per
albañil|mf|bricklayer, builder|per
juez|m~|judge|per f:jueza
alcalde|m~|mayor|per f:alcaldesa
@4 people
candidato|m~|candidate|per
aspirante|mf|applicant|per
colega|mf|colleague|per
becario|m~|intern; scholarship student|per
encargado|m~|person in charge, manager|per
@4 work
laboral|a=|work, labor (vida laboral: working life)
empresarial|a=|business, corporate
profesional|a=|professional
eficiente|a|efficient|+
eficaz|a=|effective|+
competitivo|a|competitive
exigente|a|demanding
calificado|a|qualified, skilled
desempleado|a|unemployed
jubilado|a|retired
solicitar|v|apply for, request
postularse|v|apply (for a job)
capacitar|v|train
ascender|v.ie|promote; go up
emplear|v|employ; use
desempeñar|v|carry out, fill (a role)
ejercer|v|practice (a profession); exercise
cobrar|v|charge; get paid
negociar|v|negotiate
competir|v.i|compete
exigir|v|demand, require
requerir|v.iei|require
encargarse|v|be in charge of, take care of
ganarse la vida|phrase|earn a living
// money and shopping
@4 money,shop
ahorros|mpl|savings
inversión|f|investment
ganancia|f|profit, gain
pérdida|f|loss
beneficio|m|benefit; profit
ingresos|mpl|income
gastos|mpl|expenses, costs
hipoteca|f|mortgage
interés|m|interest
tasa|f|rate; fee
cuota|f|fee, installment
tarifa|f|rate, fare
factura|f|bill, invoice
cuenta bancaria|phrase|bank account
tarjeta de crédito|phrase|credit card
efectivo|m|cash (en efectivo: in cash)
cajero automático|phrase|ATM
transferencia|f|transfer
consumidor|m~|consumer|per
consumo|m|consumption
descuento|m|discount
rebaja|f|price cut (las rebajas: the sales)
garantía|f|guarantee, warranty
devolución|f|return, refund
reembolso|m|refund
reclamación|f|complaint, claim
marca|f|brand; mark
calidad|f|quality
cantidad|f|amount, quantity
producto|m|product
servicio|m|service
envío|m|shipping, delivery
pedido|m|order (something you ordered)
entrega|f|delivery
a domicilio|phrase|delivered to your home
centro comercial|phrase|shopping mall
probador|m|fitting room
fila|f|line, row (hacer fila: wait in line)
costoso|a|costly, expensive
gratuito|a|free (of charge)
financiero|a|financial
bancario|a|bank, banking
comercial|a=|commercial, shopping
financiar|v|finance, fund
regatear|v|haggle
malgastar|v|waste (money, time)
desperdiciar|v|waste
consumir|v|consume, use
entregar|v|deliver, hand in
pedir prestado|phrase|borrow
`);
  LISTS.push(`
// health, the body and medicine
@4 health
síntoma|m|symptom
diagnóstico|m|diagnosis
terapia|f|therapy
cirugía|f|surgery
operación|f|operation
clínica|f|clinic|place
urgencias|fpl|emergency room|place
ambulancia|f|ambulance
dosis|f|dose
jarabe|m|syrup (medicine)
antibiótico|m|antibiotic
vitamina|f|vitamin
alergia|f|allergy
infección|f|infection
virus|m|virus
bacteria|f|bacterium, germ
epidemia|f|epidemic
pandemia|f|pandemic
contagio|m|infection, contagion
lesión|f|injury
fractura|f|fracture
moretón|m|bruise
quemadura|f|burn
mareo|m|dizziness
náuseas|fpl|nausea
presión|f|pressure (presión arterial: blood pressure)
insomnio|m|insomnia
ansiedad|f|anxiety|-
depresión|f|depression|-
salud mental|phrase|mental health
nutrición|f|nutrition
alimentación|f|diet, eating
proteína|f|protein
grasa|f|fat
caloría|f|calorie
obesidad|f|obesity
peso|m|weight
embarazo|m|pregnancy
discapacidad|f|disability
prevención|f|prevention
chequeo|m|checkup
análisis|m|analysis; (medical) test
radiografía|f|X-ray
inyección|f|injection, shot
recuperación|f|recovery
fatiga|f|fatigue
sudor|m|sweat
picazón|f|itch
picadura|f|bite, sting (insect)
seguro médico|phrase|health insurance
primeros auxilios|phrase|first aid
@4 health,people
paciente#n|mf|patient (in a hospital)|per
@4 health,body
hígado|m|liver
riñón|m|kidney
cadera|f|hip
muslo|m|thigh
pecho|m|chest
cintura|f|waist
nervio|m|nerve
@4 health
alérgico|a|allergic
contagioso|a|contagious
mareado|a|dizzy|st
embarazada|a|pregnant|st
sedentario|a|sedentary
leve|a|mild, slight
crónico|a|chronic
agudo|a|sharp; acute; high-pitched
físico|a|physical
mental|a=|mental
emocional|a=|emotional
médico#adj|a|medical
curar|v|cure, heal
curarse|v|get better, recover
recuperarse|v|recover
lastimar|v|hurt
lastimarse|v|hurt oneself
herir|v.iei|wound, hurt
torcerse|v.ue|twist, sprain
desmayarse|v|faint
marearse|v|get dizzy
vacunar|v|vaccinate
recetar|v|prescribe
operar|v|operate (on)
contagiar|v|infect, pass on (an illness)
pesar|v|weigh
// the environment, nature and climate
@4 nature,weather
calentamiento global|phrase|global warming
efecto invernadero|phrase|greenhouse effect
emisión|f|emission
carbono|m|carbon
dióxido de carbono|phrase|carbon dioxide
combustible|m|fuel
petróleo|m|oil, petroleum
gasolina|f|gasoline
gas|m|gas
energía solar|phrase|solar energy
panel solar|phrase|solar panel
residuo|m|waste (residuos)
plástico|m|plastic
cartón|m|cardboard
envase|m|container, packaging
desperdicio|m|waste
sostenibilidad|f|sustainability
ecosistema|m|ecosystem
biodiversidad|f|biodiversity
especie|f|species
extinción|f|extinction
en peligro de extinción|phrase|endangered
hábitat|m|habitat|pl:hábitats
fauna|f|wildlife, fauna
flora|f|plant life, flora
deforestación|f|deforestation
incendio|m|fire (a building on fire, a wildfire)
incendio forestal|phrase|forest fire
inundación|f|flood
desastre|m|disaster|-
catástrofe|f|catastrophe|-
desastre natural|phrase|natural disaster
atmósfera|f|atmosphere
capa de ozono|phrase|ozone layer
océano|m|ocean|place
polo|m|pole (el Polo Norte); polo shirt
nivel|m|level
nivel del mar|phrase|sea level
agua potable|phrase|drinking water
escasez|f|shortage, scarcity
huella de carbono|phrase|carbon footprint
transporte público|phrase|public transportation
campaña|f|campaign
conciencia|f|awareness; conscience
conservación|f|conservation
daño|m|damage, harm
amenaza|f|threat|-
cultivo|m|crop; growing
agricultura|f|agriculture
ganadería|f|livestock farming
pesticida|m|pesticide
llanura|f|plain|place
meseta|f|plateau|place
cordillera|f|mountain range|place
arrecife|m|reef|place
@4 people
ecologista|mf|environmentalist|per
activista|mf|activist|per
habitante|mf|inhabitant|per
@4 nature,weather
renovable|a|renewable
eólico|a|wind (energía eólica: wind power)
sostenible|a|sustainable|+
escaso|a|scarce
abundante|a|abundant
dañino|a|harmful
tóxico|a|toxic
puro|a|pure
fértil|a=|fertile
árido|a|arid, dry
tropical|a=|tropical
salvaje|a|wild
templado|a|mild, temperate
lluvioso|a|rainy
soleado|a|sunny
nublado|a|cloudy
orgánico|a|organic
agrícola|a=|agricultural
conservar|v|preserve, keep
preservar|v|preserve
dañar|v|damage, harm
amenazar|v|threaten
agotar|v|use up, exhaust
agotarse|v|run out, sell out
extinguirse|v|die out; go out (a fire)
habitar|v|inhabit, live in
reutilizar|v|reuse
concientizar|v|raise awareness
derretirse|v.i|melt
`);
  LISTS.push(`
// technology and the internet
@3 tech
tecnología|f|technology
información|f|information
máquina|f|machine
@4 tech
dispositivo|m|device
aparato|m|device, appliance
software|m|software|pl:software
archivo|m|file; archive
carpeta|f|folder
documento|m|document
perfil|m|profile
correo electrónico|phrase|email
red social|phrase|social network
redes sociales|phrase|social media
sitio web|phrase|website
navegador|m|browser
buscador|m|search engine
enlace|m|link
descarga|f|download
publicación|f|publication; post
comentario|m|comment
conexión|f|connection
en línea|phrase|online
wifi|m|wifi
dato|m|piece of information, fact (los datos: data)
base de datos|phrase|database
inteligencia|f|intelligence
inteligencia artificial|phrase|artificial intelligence
robot|m|robot|pl:robots
algoritmo|m|algorithm
código|m|code
programación|f|programming
actualización|f|update
impresora|f|printer
tableta|f|tablet
portátil|m|laptop
almacenamiento|m|storage
privacidad|f|privacy
acoso|m|harassment, bullying|-
ciberacoso|m|cyberbullying|-
noticias falsas|phrase|fake news
videollamada|f|video call
mensaje de texto|phrase|text message
tecla|f|key (on a keyboard)
clic|m|click (hacer clic: click)|pl:clics
innovación|f|innovation
avance|m|advance, breakthrough
electricidad|f|electricity
tecnológico|a|technological
digital|a=|digital
virtual|a=|virtual
electrónico|a|electronic
eléctrico|a|electric
automático|a|automatic
innovador|a|innovative|+
inalámbrico|a|wireless
@4 tech,people
usuario|m~|user|per
seguidor|m~|follower|per
@4 tech
descargar|v|download; unload
publicar|v|publish, post
suscribirse|v|subscribe|pp:suscrito
conectarse|v|connect, go online
desconectarse|v|disconnect, go offline
programar|v|program; schedule
instalar|v|install
actualizar|v|update
reiniciar|v|restart
borrar|v|delete, erase
imprimir|v|print|pp:impreso
escanear|v|scan
chatear|v|chat (online)
navegar|v|sail; browse (the internet)
// news and media
@4 media
prensa|f|the press
medios de comunicación|phrase|the media
titular|m|headline
reportaje|m|report, feature (story)
redacción|f|newsroom; writing
audiencia|f|audience
censura|f|censorship|-
libertad de expresión|phrase|freedom of speech
opinión pública|phrase|public opinion
encuesta|f|survey, poll
estadística|f|statistic, statistics
polémica|f|controversy
escándalo|m|scandal|-
chisme|m|gossip
acontecimiento|m|event
suceso|m|event, incident
evento|m|event
crónica|f|chronicle, report
propaganda|f|propaganda; advertising
documental|m|documentary
episodio|m|episode
estreno|m|premiere, release
crítica|f|criticism; review
polémico|a|controversial
subjetivo|a|subjective
imparcial|a=|impartial
confiable|a|reliable, trustworthy|+
crítico|a|critical
entrevistar|v|interview
redactar|v|write, draft
difundir|v|spread, broadcast
transmitir|v|broadcast; pass on
emitir|v|broadcast; issue
@4 media,people
espectador|m~|viewer, spectator|per
protagonista|mf|main character, protagonist|per
`);
  LISTS.push(`
// B1 words that were missing (some of them the game already used, read until now as bare quest words)
@2
madera|f|wood
botón|m|button
gratis|a=|free (of charge)
@3
acción|f|action; share (of a company)
actividad|f|activity
atención|f|attention
caso|m|case (en caso de: in case of)
control|m|control; checkpoint
costo|m|cost
estado|m|state; condition
imagen|f|image, picture
mayoría|f|majority
miembro|m|member|per
modelo|m|model
movimiento|m|movement
objeto|m|object
paso|m|step; pass (de paso: on the way)
pena|f|sorrow; penalty (¡qué pena!: what a shame!)
período|m|period|alt:periodo
posición|f|position
premio|m|prize, award|+
resto|m|rest, remainder
sitio|m|place, site
tema|m|topic, subject, theme
uso|m|use
zona|f|zone, area
área|f*|area
situación|f|situation
transporte|m|transportation
curso|m|course; school year
espacio|m|space; room
sistema|m|system
proceso|m|process
capital|f|capital (city)
gusto|m|taste; pleasure (con gusto: gladly)
sonrisa|f|smile|+
broma|f|joke
promesa|f|promise
paciencia|f|patience|+
soledad|f|loneliness, solitude
señal|f|sign, signal
alarma|f|alarm
pronóstico|m|forecast
concurso|m|contest
compañía|f|company
posibilidad|f|possibility
imaginación|f|imagination
altura|f|height
cadena|f|chain; (TV) channel
vidrio|m|glass (the material)
algodón|m|cotton
bandera|f|flag
nido|m|nest
gota|f|drop
agujero|m|hole
a partir de|phrase|starting from
en caso de|phrase|in case of
ser humano|phrase|human being
@3 people
presidente|m~|president|per f:presidenta
@3
completo|a|complete, full
directo|a|direct
humano|a|human
sencillo|a|simple, plain
fino|a|thin, fine
cuadrado|a|square
vacío|a|empty
ideal|a=|ideal
elegante|a|elegant
total|a=|total
positivo|a|positive|+
negativo|a|negative|-
exacto|a|exact
real|a=|real; royal
general|a=|general
suficiente|a|enough, sufficient
cuidadoso|a|careful
pálido|a|pale
redondo|a|round
cálido|a|warm
grueso|a|thick
blando|a|soft
colorido|a|colorful
maleducado|a|rude, bad-mannered|-
mantener|v|maintain, keep
obtener|v|obtain, get
afectar|v|affect
asistir|v|attend; assist
confirmar|v|confirm
continuar|v.ú|continue
durar|v|last
echar|v|throw; pour; throw out
incluir|v.y|include
revisar|v|check, review
separar|v|separate
tardar|v|take (time); be late
utilizar|v|use
acabar|v|finish, end up
firmar|v|sign
sufrir|v|suffer
despertar|v.ie|wake (someone) up
robar|v|steal, rob
desear|v|wish, desire
guiar|v.í|guide
barrer|v|sweep
adornar|v|decorate
abandonar|v|abandon, leave
enterrar|v.ie|bury
hundirse|v|sink
secar|v|dry
secarse|v|dry off, dry up
congelarse|v|freeze
pegar|v|stick, glue; hit
aplaudir|v|applaud, clap
@4
minoría|f|minority
multitud|f|crowd
búsqueda|f|search
superficie|f|surface
profundidad|f|depth
corriente|f|current; stream
reflejo|m|reflection; reflex
corona|f|crown
trofeo|m|trophy
grieta|f|crack
ruina|f|ruin
horizonte|m|horizon
firme|a|firm, steady
terco|a|stubborn
magnífico|a|magnificent|+
transparente|a|transparent
hondo|a|deep
hambriento|a|hungry, starving
empinado|a|steep
resbaladizo|a|slippery
concurrido|a|busy, crowded
polvoriento|a|dusty
inmóvil|a=|still, motionless
luminoso|a|bright, full of light
interior|a=|interior, inside
exterior|a=|exterior, outside; foreign
superior|a=|upper; higher; superior
inferior|a=|lower; inferior
mensual|a=|monthly
semanal|a=|weekly
anual|a=|yearly, annual
atender|v.ie|attend to, serve; answer (the phone)
extender|v.ie|extend, spread
colocar|v|place, put
dirigir|v|direct, run, manage
distinguir|v|distinguish
eliminar|v|eliminate, remove
formar|v|form, shape; train
identificar|v|identify
indicar|v|indicate, show
ocupar|v|occupy, take up
partir|v|leave; split
pretender|v|intend, aim to (not «pretend»)
realizar|v|carry out, do; fulfill
relacionar|v|relate, connect
representar|v|represent; perform
temer|v|fear
corresponder|v|correspond; be one’s turn
bastar|v|be enough
apuntar|v|note down; aim
averiguar|v|find out
poseer|v|own, possess
reconstruir|v.y|rebuild
florecer|v.zc|bloom, flourish
brotar|v|sprout, spring up
sanar|v|heal
derrumbarse|v|collapse
gotear|v|drip, leak
deslizarse|v|slide, glide
retroceder|v|move back, back down
`);
  LISTS.push(`
// society and community (local government, rights, volunteering)
@3 home
hogar|m|home, household
@4
municipio|m|municipality, town
alcaldía|f|city hall, mayor’s office|place
ayuntamiento|m|city hall, town council|place
ciudadanía|f|citizenship; the citizens
derechos humanos|phrase|human rights
deber#n|m|duty
obligación|f|obligation
voluntariado|m|volunteering, volunteer work
organización|f|organization
asociación|f|association
fundación|f|foundation
caridad|f|charity
donación|f|donation
solidaridad|f|solidarity|+
discriminación|f|discrimination|-
racismo|m|racism|-
prejuicio|m|prejudice|-
tolerancia|f|tolerance|+
diversidad|f|diversity
inclusión|f|inclusion
inmigración|f|immigration
integración|f|integration
convivencia|f|living together, getting along
vivienda|f|housing, home
manifestación|f|demonstration, protest
protesta|f|protest
participación|f|participation
voto|m|vote
autoridad|f|authority
institución|f|institution
servicio público|phrase|public service
calidad de vida|phrase|quality of life
nivel de vida|phrase|standard of living
infraestructura|f|infrastructure
solidario|a|caring, supportive|+
tolerante|a|tolerant|+
municipal|a=|municipal, city
comunitario|a|community
donar|v|donate
discriminar|v|discriminate
emigrar|v|emigrate
convivir|v|live together, get along
protestar|v|protest; complain
@4 people
voluntario|m~|volunteer|per
inmigrante|mf|immigrant|per
refugiado|m~|refugee|per
// everyday law (contracts, fines, permits)
@4
delincuencia|f|crime (in general)|-
delito|m|crime, offense|-
robo|m|robbery, theft|-
denuncia|f|report (to the police), complaint
multa|f|fine (to pay)
permiso|m|permission; permit; leave
licencia|f|license; leave
licencia de conducir|phrase|driver’s license
firma|f|signature
juicio|m|trial; judgment
tribunal|m|court
demanda|f|lawsuit; demand
castigo|m|punishment
sanción|f|penalty, sanction
norma|f|rule, standard
reglamento|m|regulations
trámite|m|procedure, paperwork
formulario|m|form (to fill in)
identificación|f|ID, identification
residencia|f|residence; residency
visa|f|visa
seguro#n|m|insurance
depósito|m|deposit; tank
cláusula|f|clause
estacionamiento|m|parking lot|place
exceso de velocidad|phrase|speeding
legal|a=|legal
ilegal|a=|illegal|-
culpable|a|guilty|-
inocente|a|innocent
obligatorio|a|compulsory, required
denunciar|v|report (a crime), denounce
multar|v|fine
demandar|v|sue; demand
acusar|v|accuse
castigar|v|punish
reclamar|v|claim, complain
estacionar|v|park
@4 people
delincuente|mf|criminal, offender|per
ladrón|m~|thief|per
víctima|f|victim|per
testigo|mf|witness|per
inquilino|m~|tenant|per
propietario|m~|owner, landlord|per
// education and science
@4 school
enseñanza|f|teaching, education
aprendizaje|m|learning
primaria|f|elementary school (la primaria)
secundaria|f|secondary school (la secundaria)
bachillerato|m|high school (diploma)
licenciatura|f|bachelor’s degree
maestría|f|master’s degree
doctorado|m|doctorate, PhD
diploma|m|diploma
facultad|f|school (of a university); ability
campus|m|campus
matrícula|f|enrollment; tuition fee
apuntes|mpl|(class) notes
resumen|m|summary
ensayo|m|essay; rehearsal
tesis|f|thesis
calificación|f|grade; qualification
promedio|m|average
semestre|m|semester
conferencia|f|lecture; conference
debate|m|debate
método|m|method
teoría|f|theory
experimento|m|experiment
laboratorio|m|laboratory|place
descubrimiento|m|discovery
conclusión|f|conclusion
evidencia|f|evidence
fórmula|f|formula
cálculo|m|calculation
química|f|chemistry
física|f|physics
biología|f|biology
filosofía|f|philosophy
literatura|f|literature
psicología|f|psychology
informática|f|computer science
ingeniería|f|engineering
concepto|m|concept
definición|f|definition
término|m|term; end
universo|m|universe
galaxia|f|galaxy
célula|f|cell (biology)
evolución|f|evolution
académico|a|academic
escolar|a=|school (vida escolar: school life)
universitario|a|university, college
educativo|a|educational
intelectual|a=|intellectual
científico#adj|a|scientific
inscribirse|v|enroll, sign up|pp:inscrito
memorizar|v|memorize
repasar|v|review, go over
analizar|v|analyze
concluir|v.y|conclude
definir|v|define
debatir|v|debate
argumentar|v|argue (make a case)
deducir|v|deduce
@4 school,people
tutor|m~|tutor|per
astronauta|mf|astronaut|per
`);
  LISTS.push(`
// arguing and explaining: the linking phrases and adverbs
@4
en primer lugar|phrase|first of all, in the first place
en segundo lugar|phrase|secondly
por último|phrase|finally, lastly
es más|phrase|what’s more
por un lado|phrase|on the one hand
por otro lado|phrase|on the other hand
en conclusión|phrase|in conclusion
en resumen|phrase|in short, to sum up
debido a|phrase|due to, because of
a causa de|phrase|because of
puesto que|phrase|since, given that
dado que|phrase|given that
con el fin de|phrase|in order to
de modo que|phrase|so (that)
de manera que|phrase|so (that)
en caso de que|phrase|in case
a no ser que|phrase|unless
sin que|phrase|without (+ subjunctive)
antes de que|phrase|before (+ subjunctive)
en cuanto a|phrase|as for, regarding
con respecto a|phrase|with regard to
en lugar de|phrase|instead of
desde mi punto de vista|phrase|from my point of view
a mi parecer|phrase|in my view
por lo general|phrase|generally, as a rule
en particular|phrase|in particular
en concreto|phrase|specifically
a largo plazo|phrase|in the long run
a corto plazo|phrase|in the short term
hoy en día|phrase|nowadays
en la actualidad|phrase|currently, nowadays
de todos modos|phrase|anyway
de todas formas|phrase|anyway
en todo caso|phrase|in any case
al fin y al cabo|phrase|after all
desde luego|phrase|of course, certainly
al contrario|phrase|on the contrary
por el contrario|phrase|on the contrary
ni siquiera|phrase|not even
más bien|phrase|rather
rara vez|phrase|rarely
más o menos|phrase|more or less
asimismo|adv|likewise, also
obviamente|adv|obviously
evidentemente|adv|evidently, obviously
aparentemente|adv|apparently
supuestamente|adv|supposedly
precisamente|adv|precisely
prácticamente|adv|practically
relativamente|adv|relatively
sumamente|adv|extremely
básicamente|adv|basically
principalmente|adv|mainly
únicamente|adv|only, solely
simplemente|adv|simply
directamente|adv|directly
personalmente|adv|personally
sinceramente|adv|honestly, sincerely
francamente|adv|frankly
definitivamente|adv|definitely
constantemente|adv|constantly
frecuentemente|adv|frequently
anteriormente|adv|previously
posteriormente|adv|later, afterwards
gradualmente|adv|gradually
igualmente|adv|equally; likewise
aproximadamente|adv|approximately
// abstract ideas
aspecto|m|aspect; appearance
factor|m|factor
elemento|m|element
asunto|m|matter, issue
cuestión|f|question, issue
condición|f|condition
circunstancia|f|circumstance
contexto|m|context
realidad|f|reality
criterio|m|criterion; judgment
creencia|f|belief
ética|f|ethics
dignidad|f|dignity
privilegio|m|privilege
influencia|f|influence
impacto|m|impact
origen|m|origin
motivo|m|reason, motive
propósito|m|purpose
intención|f|intention
logro|m|achievement|+
reto|m|challenge
desafío|m|challenge
obstáculo|m|obstacle
dificultad|f|difficulty
tendencia|f|tendency, trend
hábito|m|habit
rutina|f|routine
transformación|f|transformation
estructura|f|structure
característica|f|characteristic, feature
cualidad|f|quality (of a person)
defecto|m|flaw, defect
virtud|f|virtue|+
inconveniente|m|drawback, problem
prioridad|f|priority
necesidad|f|need, necessity
alternativa|f|alternative
opción|f|option
propuesta|f|proposal
desacuerdo|m|disagreement
equilibrio|m|balance
armonía|f|harmony|+
caos|m|chaos
orden|m|order (tidiness, sequence)
desorden|m|mess, disorder
tranquilidad|f|calm, peace and quiet|+
@4 feeling
autoestima|f|self-esteem
estado de ánimo|phrase|mood
ánimo|m|spirit, mood; encouragement (¡ánimo!: cheer up!)
humor|m|humor; mood
enojo|m|anger|-
temor|m|fear|-
angustia|f|anguish, distress|-
celos|mpl|jealousy|-
satisfacción|f|satisfaction|+
decepción|f|disappointment|-
frustración|f|frustration|-
entusiasmo|m|enthusiasm|+
pasión|f|passion
curiosidad|f|curiosity
admiración|f|admiration
empatía|f|empathy|+
compasión|f|compassion|+
certeza|f|certainty
inseguridad|f|insecurity|-
motivación|f|motivation
inspiración|f|inspiration
nostalgia|f|nostalgia
gratitud|f|gratitude|+
`);
  LISTS.push(`
// feelings, opinions and judgments: adjectives
@4 feeling
angustiado|a|distressed|st -
agobiado|a|overwhelmed|st -
desanimado|a|discouraged|st -
optimista|a|optimistic|+
pesimista|a|pessimistic|-
comprensivo|a|understanding|+
sensible|a|sensitive
sensato|a|sensible|+
maduro|a|mature; ripe
inmaduro|a|immature|-
respetuoso|a|respectful|+
humilde|a|humble|+
arrogante|a|arrogant|-
ambicioso|a|ambitious
leal|a|loyal|+
fiel|a|faithful, loyal|+
honrado|a|honest|+
irresponsable|a|irresponsible|-
@4
realista|a|realistic
razonable|a|reasonable
lógico|a|logical
coherente|a|coherent, consistent
equilibrado|a|balanced
flexible|a|flexible
digno|a|worthy, dignified
valioso|a|valuable|+
esencial|a|essential
fundamental|a|fundamental
imprescindible|a|essential, indispensable
relevante|a|relevant
significativo|a|significant
considerable|a|considerable
notable|a|remarkable, notable
adecuado|a|suitable, appropriate
apropiado|a|appropriate
conveniente|a|advisable, convenient
favorable|a|favorable|+
absurdo|a|absurd|-
ridículo|a|ridiculous|-
inevitable|a|inevitable
inesperado|a|unexpected
previsible|a|predictable
sorprendente|a|surprising
impresionante|a|impressive|+
emocionante|a|exciting|+
conmovedor|a|moving, touching
preocupante|a|worrying|-
alarmante|a|alarming|-
delicado|a|delicate, sensitive
abstracto|a|abstract
concreto|a|concrete, specific
particular|a=|particular; private
específico|a|specific
preciso|a|precise; necessary
auténtico|a|authentic
original|a=|original
habitual|a=|usual
cotidiano|a|everyday, daily
semejante|a|similar, such
similar|a=|similar
opuesto|a|opposite
contrario|a|contrary, opposite
mutuo|a|mutual
ajeno|a|someone else’s; unaware of
individual|a=|individual
colectivo|a|collective
íntimo|a|intimate, close
personal|a=|personal, private
// arguing, explaining and feeling: verbs
sostener|v|hold; maintain (an opinion)
afirmar|v|state, claim
admitir|v|admit
aclarar|v|clarify
justificar|v|justify
persuadir|v|persuade
influir|v.y|influence
cuestionar|v|question
desconfiar|v.í|distrust
reflexionar|v|reflect, think it over
evaluar|v.ú|evaluate, assess
juzgar|v|judge
interpretar|v|interpret; perform
exagerar|v|exaggerate
acertar|v.ie|get right, guess correctly
coincidir|v|agree; coincide
discrepar|v|disagree
oponerse|v|oppose, be against
favorecer|v.zc|favor, benefit
perjudicar|v|harm, damage
beneficiar|v|benefit
garantizar|v|guarantee
asegurar|v|ensure; assure; insure
asegurarse|v|make sure
comprometerse|v|commit (oneself)
implicar|v|imply, involve
consistir|v|consist (consistir en: consist of)
contribuir|v.y|contribute
aportar|v|contribute, bring
provocar|v|cause, provoke
causar|v|cause
generar|v|generate
fortalecer|v.zc|strengthen
debilitar|v|weaken
ampliar|v.í|expand, widen
limitar|v|limit
controlar|v|control
establecer|v.zc|establish, set up
adaptarse|v|adapt
enfrentar|v|face, confront
enfrentarse|v|face up to
solucionar|v|solve
tolerar|v|tolerate
soportar|v|stand, put up with
aguantar|v|put up with, bear
padecer|v.zc|suffer (from)
arriesgarse|v|take a risk
@4 feeling
animar|v|cheer up, encourage
desanimarse|v|lose heart
emocionarse|v|get excited, be moved
ofender|v|offend
ofenderse|v|take offense
molestarse|v|get annoyed; bother
avergonzarse|v.ue|be ashamed
desahogarse|v|let off steam
confesar|v.ie|confess
lamentar|v|regret, be sorry about
envidiar|v|envy
despreciar|v|despise
ignorar|v|ignore; not know
fingir|v|pretend
engañar|v|deceive, cheat
traicionar|v|betray
decepcionar|v|disappoint
impresionar|v|impress
conmover|v.ue|move (emotionally)
inspirar|v|inspire
motivar|v|motivate
desafiar|v.í|challenge, defy
`);
  LISTS.push(`
// travel, culture and the arts
@4 travel
itinerario|m|itinerary
alojamiento|m|accommodation, lodging
albergue|m|hostel|place
hostal|m|guesthouse|place
retraso|m|delay
escala|f|stopover; scale
aduana|f|customs
embajada|f|embassy|place
crucero|m|cruise
recorrido|m|tour, route
patrimonio|m|heritage
monumento|m|monument|place
catedral|f|cathedral|place
castillo|m|castle|place
palacio|m|palace|place
reservar|v|book, reserve
cancelar|v|cancel
retrasarse|v|be late, be delayed
turístico|a|tourist
pintoresco|a|picturesque|+
histórico|a|historic, historical
exótico|a|exotic
inolvidable|a|unforgettable|+
acogedor|a|cozy, welcoming|+
@4 travel,people
mochilero|m~|backpacker|per
@4 art
exposición|f|exhibition
obra|f|work (of art, of literature); construction work
obra de arte|phrase|work of art
obra de teatro|phrase|play
obra maestra|phrase|masterpiece
retrato|m|portrait
estilo|m|style
creatividad|f|creativity|+
arquitectura|f|architecture
diseño|m|design
fotografía|f|photography; photograph
espectáculo|m|show, spectacle
función|f|show, performance; function
escena|f|scene
escenario|m|stage; setting
actuación|f|performance; acting
género|m|genre; gender; kind
trama|f|plot
artesanía|f|crafts, handicrafts
folclore|m|folklore
festival|m|festival
feria|f|fair
desfile|m|parade
carnaval|m|carnival
identidad|f|identity
herencia|f|heritage; inheritance
intercambio|m|exchange
artístico|a|artistic
clásico|a|classic, classical
contemporáneo|a|contemporary
bilingüe|a|bilingual
actuar|v.ú|act; perform
componer|v|compose
intercambiar|v|exchange
exponer|v|exhibit; explain; expose
@4 art,people
poeta|mf|poet|per
novelista|mf|novelist|per
narrador|m~|narrator|per
artesano|m~|craftsman/craftswoman|per
@3 music
instrumento|m|instrument
@4 music
orquesta|f|orchestra
// housing and city life
@4 home
ascensor|m|elevator|alt:elevador
calefacción|f|heating
aire acondicionado|phrase|air conditioning
mantenimiento|m|maintenance
reparación|f|repair
construcción|f|construction; building
compañero de cuarto|phrase|roommate
metro cuadrado|phrase|square meter
amueblado|a|furnished
espacioso|a|spacious
céntrico|a|central (in location)
casero|a|homemade
reparar|v|repair, fix
renovar|v.ue|renovate; renew
ubicar|v|locate, place
ubicarse|v|be located
portero|m~|doorman; goalkeeper|per
@4 town
centro histórico|phrase|historic center
afueras|fpl|outskirts
zona verde|phrase|green space, park
paso de peatones|phrase|crosswalk
glorieta|f|traffic circle
ciclovía|f|bike lane
rascacielos|m|skyscraper
@4
tránsito|m|traffic
urbano|a|urban
rural|a=|rural
inseguro|a|unsafe; insecure|-
iluminación|f|lighting
contenedor|m|container; dumpster
poste de luz|phrase|streetlight
timbre|m|doorbell; stamp (Mexico)
peatón|m|pedestrian|per
// basics that were missing
@2
medicamento|m|medicine, medication
diversión|f|fun, entertainment
@2 time
Navidad|f|Christmas
Pascua|f|Easter
`);
  const spec = {
    lang: 'es', lists: LISTS, entry, forms, expand, prior, score, callVerb: 'llamarse',
    context: (W, P) => ROM.context(W, P, R),
    summary: (a, W, P) => ROM.summary(a, W, P, R),
    check: (a, opts, P) => ROM.check(a, opts, P, R),
    describe, enGloss, inflect, numbers,
    connectors: ['porque', 'ya que', 'pero', 'sin embargo', 'aunque', 'en cambio', 'sino', 'mientras que', 'y', 'o', 'además', 'también', 'por ejemplo',
      'así que', 'por eso', 'entonces', 'por lo tanto', 'cuando', 'mientras', 'después', 'luego', 'antes', 'al final', 'por fin', 'hasta que', 'desde que',
      'si', 'para que', 'creo que', 'pienso que', 'me parece que', 'en mi opinión', 'o sea', 'es decir', 'de hecho', 'primero',
      // (DX-B2) the B2 linking words
      'no obstante', 'aun así', 'a pesar de que', 'por un lado', 'por otro lado', 'puesto que', 'dado que', 'debido a', 'por consiguiente',
      'en conclusión', 'en resumen', 'en definitiva', 'asimismo', 'incluso', 'es más', 'en primer lugar', 'por último', 'a menos que',
      'con tal de que', 'siempre que', 'en caso de que', 'desde mi punto de vista', 'a mi parecer'],
    connectorKinds: { porque: 'reason', 'ya que': 'reason', pero: 'contrast', 'sin embargo': 'contrast', aunque: 'contrast', 'en cambio': 'contrast', sino: 'contrast',
      'mientras que': 'contrast', y: 'add', o: 'add', 'además': 'add', 'también': 'add', 'por ejemplo': 'add', 'o sea': 'add', 'es decir': 'add', 'de hecho': 'add',
      'así que': 'result', 'por eso': 'result', entonces: 'result', 'por lo tanto': 'result', cuando: 'time', mientras: 'time', 'después': 'time', luego: 'time',
      antes: 'time', 'al final': 'time', 'por fin': 'time', 'hasta que': 'time', 'desde que': 'time', primero: 'time', si: 'cond', 'para que': 'reason',
      'creo que': 'opinion', 'pienso que': 'opinion', 'me parece que': 'opinion', 'en mi opinión': 'opinion',
      'no obstante': 'contrast', 'aun así': 'contrast', 'a pesar de que': 'contrast', 'por un lado': 'contrast', 'por otro lado': 'contrast',
      'puesto que': 'reason', 'dado que': 'reason', 'debido a': 'reason', 'por consiguiente': 'result', 'en conclusión': 'result',
      'en resumen': 'result', 'en definitiva': 'result', asimismo: 'add', incluso: 'add', 'es más': 'add', 'en primer lugar': 'time',
      'por último': 'time', 'a menos que': 'cond', 'con tal de que': 'cond', 'siempre que': 'cond', 'en caso de que': 'cond',
      'desde mi punto de vista': 'opinion', 'a mi parecer': 'opinion' },
    weakConnectors: ['y', 'e', 'o', 'u'],
    fillers: ['pues', 'este', 'bueno', 'o sea', 'eh', 'mmm', 'a ver', 'entonces', 'la verdad', 'tipo', 'digamos', 'mira', 'oye', 'sabes', 'vale', 'sale'],
  };
  DICT.register('es', () => LATIN.build(spec));
  // tests and other packs: the morphology
  window.ES_DICT = { conj, plural, feminine, respell, nuclei, stressFromEnd, R };
})();
