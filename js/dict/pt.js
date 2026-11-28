'use strict';
// The Portuguese dictionary pack (Brazilian Portuguese), FLUENT.md. Same word-list format and codes as es.js, plus:
//   verbs v.i (sentir: sinto) · v.u (dormir: durmo) · v.o (subir: sobe) · v.ei (odiar: odeio); -ear verbs (passear:
//   passeio) by rule; the irregulars in IRR. A lemma in -se (levantar-se) is reflexive.
//   nouns: the plural by rule (flor → flores, papel → papéis, canção → canções), pl:… for the others (pão → pães, mão → mãos)
// você, vocês, a gente take the 3rd person; tu is read with the 2nd or the 3rd (both are heard in Brazil).
// Contractions (no, na, do, da, pelo, num, dele, à…) are headwords; «em o» → «no» is the contract check.
// Checks: conj, agree, serestar, gustar (gostar de), tense, accent (minor), contract, prep, article (minor), other («no»
// for «não»).

(() => {
  if (typeof LATIN === 'undefined' || typeof DICT === 'undefined') return;
  const { key, low, feat, EN, ROM, likeCase, capF } = LATIN;
  const DEACC = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', â: 'a', ê: 'e', ô: 'o' };
  const stripAcc = w => w.replace(/[áéíóúâêô]/g, c => DEACC[c]);
  const ACUTE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }, CIRC = { a: 'á', e: 'ê', i: 'í', o: 'ô', u: 'ú' };
  const accLast = (w, T) => { for (let i = w.length - 1; i >= 0; i--) if (T[w[i]]) return w.slice(0, i) + T[w[i]] + w.slice(i + 1); return w; };

  // ------------------------------------------------------------ nouns and adjectives
  function plural(w) {
    if (/ão$/.test(w)) return w.slice(0, -2) + 'ões';
    if (/[aeiouãõáéíóúâêô]$/i.test(w)) return w + 's';
    if (/m$/.test(w)) return w.slice(0, -1) + 'ns';
    if (/[rz]$/.test(w)) return w + 'es';
    if (/s$/.test(w)) { if (/[áéíóúâêô]s$/.test(w)) return stripAcc(w.slice(0, -2)) + w.slice(-2, -1).replace(/[áéóúâêô]/, c => DEACC[c]) + 'ses'; if (!/[aeiouáéíóúâêô].*[aeiouáéíóúâêô]/.test(w)) return w + 'es'; return w; }
    if (/al$/.test(w)) return w.slice(0, -1) + 'is';
    if (/el$/.test(w)) return /[áéíóúâêô]/.test(w) ? w.slice(0, -2) + 'eis' : w.slice(0, -2) + 'éis';
    if (/ol$/.test(w)) return w.slice(0, -2) + 'óis';
    if (/ul$/.test(w)) return w.slice(0, -1) + 'is';
    if (/il$/.test(w)) return /[áéíóúâêô]/.test(w) ? w.slice(0, -2) + 'eis' : w.slice(0, -1) + 's';
    if (/x$/.test(w)) return w;
    return w + 's';
  }
  function feminine(w) {
    if (/o$/.test(w)) return w.slice(0, -1) + 'a';
    if (/ês$/.test(w)) return w.slice(0, -2) + 'esa';
    if (/or$/.test(w)) return w + 'a';
    if (/ão$/.test(w)) return w.slice(0, -2) + 'ã';
    if (/eu$/.test(w)) return w.slice(0, -2) + 'eia';
    return w;
  }

  // ------------------------------------------------------------ verbs
  const E = {
    ar: { pres: ['o', 'as', 'a', 'amos', 'ais', 'am'], past: ['ei', 'aste', 'ou', 'amos', 'astes', 'aram'], impf: ['ava', 'avas', 'ava', 'ávamos', 'áveis', 'avam'],
      subj: ['e', 'es', 'e', 'emos', 'eis', 'em'], ger: 'ando', part: 'ado', vt: 'ai' },
    er: { pres: ['o', 'es', 'e', 'emos', 'eis', 'em'], past: ['i', 'este', 'eu', 'emos', 'estes', 'eram'], impf: ['ia', 'ias', 'ia', 'íamos', 'íeis', 'iam'],
      subj: ['a', 'as', 'a', 'amos', 'ais', 'am'], ger: 'endo', part: 'ido', vt: 'ei' },
    ir: { pres: ['o', 'es', 'e', 'imos', 'is', 'em'], past: ['i', 'iste', 'iu', 'imos', 'istes', 'iram'], impf: ['ia', 'ias', 'ia', 'íamos', 'íeis', 'iam'],
      subj: ['a', 'as', 'a', 'amos', 'ais', 'am'], ger: 'indo', part: 'ido', vt: 'i' },
  };
  const FUT = ['ei', 'ás', 'á', 'emos', 'eis', 'ão'], COND = ['ia', 'ias', 'ia', 'íamos', 'íeis', 'iam'];
  const PN = ['1s', '2s', '3s', '1p', '2p', '3p'];
  // the irregulars: p (present) · y (the eu form: faço → faça) · pf (preterite) · i (imperfect) · s (present
  // subjunctive) · f (future stem) · im (the tu command) · g · pp
  const IRR_TEXT = `ser|p:sou,és,é,somos,sois,são pf:fui,foste,foi,fomos,fostes,foram i:era,eras,era,éramos,éreis,eram s:seja,sejas,seja,sejamos,sejais,sejam im:sê
estar|p:estou,estás,está,estamos,estais,estão pf:estive,estiveste,esteve,estivemos,estivestes,estiveram s:esteja,estejas,esteja,estejamos,estejais,estejam im:está
ter|p:tenho,tens,tem,temos,tendes,têm pf:tive,tiveste,teve,tivemos,tivestes,tiveram i:tinha,tinhas,tinha,tínhamos,tínheis,tinham im:tem
ir|p:vou,vais,vai,vamos,ides,vão pf:fui,foste,foi,fomos,fostes,foram s:vá,vás,vá,vamos,vades,vão im:vai
vir|p:venho,vens,vem,vimos,vindes,vêm pf:vim,vieste,veio,viemos,viestes,vieram i:vinha,vinhas,vinha,vínhamos,vínheis,vinham im:vem g:vindo pp:vindo
fazer|p:faço,fazes,faz,fazemos,fazeis,fazem y:faço pf:fiz,fizeste,fez,fizemos,fizestes,fizeram f:far pp:feito im:faz
dizer|p:digo,dizes,diz,dizemos,dizeis,dizem y:digo pf:disse,disseste,disse,dissemos,dissestes,disseram f:dir pp:dito im:diz
trazer|p:trago,trazes,traz,trazemos,trazeis,trazem y:trago pf:trouxe,trouxeste,trouxe,trouxemos,trouxestes,trouxeram f:trar im:traz
poder|y:posso pf:pude,pudeste,pôde,pudemos,pudestes,puderam
querer|p:quero,queres,quer,queremos,quereis,querem pf:quis,quiseste,quis,quisemos,quisestes,quiseram s:queira,queiras,queira,queiramos,queirais,queiram
saber|y:sei pf:soube,soubeste,soube,soubemos,soubestes,souberam s:saiba,saibas,saiba,saibamos,saibais,saibam
ver|p:vejo,vês,vê,vemos,vedes,veem pf:vi,viste,viu,vimos,vistes,viram i:via,vias,via,víamos,víeis,viam pp:visto im:vê
dar|p:dou,dás,dá,damos,dais,dão pf:dei,deste,deu,demos,destes,deram s:dê,dês,dê,demos,deis,deem im:dá
haver|p:hei,hás,há,havemos,haveis,hão pf:houve,houveste,houve,houvemos,houvestes,houveram s:haja,hajas,haja,hajamos,hajais,hajam
pôr|p:ponho,pões,põe,pomos,pondes,põem pf:pus,puseste,pôs,pusemos,pusestes,puseram i:punha,punhas,punha,púnhamos,púnheis,punham f:por pp:posto g:pondo im:põe
ler|p:leio,lês,lê,lemos,ledes,leem s:leia,leias,leia,leiamos,leiais,leiam im:lê
crer|p:creio,crês,crê,cremos,credes,creem s:creia,creias,creia,creiamos,creiais,creiam im:crê
ouvir|y:ouço
pedir|y:peço
medir|y:meço
perder|y:perco
valer|y:valho
caber|y:caibo pf:coube,coubeste,coube,coubemos,coubestes,couberam
sair|y:saio
cair|y:caio
rir|p:rio,ris,ri,rimos,rides,riem s:ria,rias,ria,riamos,riais,riam
construir|p:construo,constróis,constrói,construímos,construís,constroem
destruir|p:destruo,destróis,destrói,destruímos,destruís,destroem
doer|p:doo,dóis,dói,doemos,doeis,doem i:doía,doías,doía,doíamos,doíeis,doíam im:dói
reunir|p:reúno,reúnes,reúne,reunimos,reunis,reúnem s:reúna,reúnas,reúna,reunamos,reunais,reúnam im:reúne`;
  const IRR = {};
  for (const line of IRR_TEXT.split('\n')) {
    const [lemma, rest] = line.split('|'); const o = {};
    for (const x of rest.split(' ')) { const c = x.indexOf(':'); if (c < 0) o[x] = true; else o[x.slice(0, c)] = x.slice(c + 1).includes(',') ? x.slice(c + 1).split(',') : x.slice(c + 1); }
    IRR[lemma] = o;
  }
  const DERIV = {};
  ('manter:ter obter:ter conter:ter deter:ter entreter:ter reter:ter convir:vir intervir:vir provir:vir compor:pôr propor:pôr supor:pôr dispor:pôr expor:pôr ' +
   'impor:pôr repor:pôr desfazer:fazer refazer:fazer satisfazer:fazer prever:ver rever:ver contradizer:dizer desdizer:dizer sorrir:rir atrair:sair:attr distrair:sair:attr ' +
   'reconstruir:construir opor:pôr')
    .split(' ').forEach(x => { const [d, b] = x.split(':'); if (b === 'sair') return; DERIV[d] = { base: b, pre: d.slice(0, d.length - stripAcc(b).length) }; });
  // -ir verbs whose i is stressed in these endings take an accent after a vowel (saímos, saí, saía, incluído)
  const STRESS_I = new Set(['i', 'iste', 'imos', 'is', 'istes', 'iram', 'ia', 'ias', 'íamos', 'íeis', 'iam', 'ido']);
  function join(stem, end, O) {
    const e0 = end[0];
    if (O.front && (e0 === 'e' || e0 === 'é' || e0 === 'ê') && stem.endsWith(O.front[0])) stem = stem.slice(0, -O.front[0].length) + O.front[1];
    else if (O.back && (e0 === 'a' || e0 === 'o' || e0 === 'á' || e0 === 'ó') && stem.endsWith(O.back[0])) stem = stem.slice(0, -O.back[0].length) + O.back[1];
    if (O.vstem && /[aou]$/.test(stem) && STRESS_I.has(end)) end = 'í' + end.slice(1).replace(/^í/, 'i');
    return stem + end;
  }
  function ortho(inf, cls) {
    return {
      front: /car$/.test(inf) ? ['c', 'qu'] : /gar$/.test(inf) ? ['g', 'gu'] : /çar$/.test(inf) ? ['ç', 'c'] : null,
      back: /cer$|cir$/.test(inf) ? ['c', 'ç'] : /g[ei]r$/.test(inf) ? ['g', 'j'] : /guir$/.test(inf) ? ['gu', 'g'] : null,
      vstem: /[aou]ir$/.test(inf) && !/guir$|quir$/.test(inf),
    };
  }
  const CJ = new Map();
  function conj(lemma, cls, pp) {
    const ck = lemma + '|' + (cls || '') + '|' + (pp || '');
    if (CJ.has(ck)) return CJ.get(ck);
    let out;
    const d = DERIV[lemma];
    if (d) {
      out = conj0(d.base, cls, null).map(([f, k]) => {
        let w = d.pre + f;
        if (d.base === 'ter' || d.base === 'vir') w = w.replace(/(t|v)em$/, '$1ém').replace(/(t|v)ens$/, '$1éns');
        if (d.base === 'pôr') w = w.replace(/pôr$/, 'por');
        return [w, k];
      });
      if (pp) out = out.filter(x => !/^part/.test(x[1])).concat(partForms(pp));
    } else out = conj0(lemma, cls, pp);
    CJ.set(ck, out);
    return out;
  }
  function partForms(pp) { const st = pp.slice(0, -1); return [[pp, 'part.m.s'], [st + 'a', 'part.f.s'], [st + 'os', 'part.m.p'], [st + 'as', 'part.f.p']]; }
  function conj0(inf, cls, pp) {
    const X = IRR[inf] || {};
    const out = []; const add = (w, k) => { if (w) out.push([w, k]); };
    const pinf = stripAcc(inf);
    const t = pinf === 'por' ? 'er' : pinf.slice(-2);                // (pôr: its own forms are in IRR; the -er endings fill the rest)
    if (!E[t]) return out;
    const V = E[t], stem = pinf.slice(0, -2), O = ortho(pinf, cls);
    // 1st person singular stems (sinto, durmo), the u → o of subir (sobe), -ear → ei (passeio), odiar → odeio
    const ear = /ear$/.test(pinf) || cls === 'ei';
    const s1 = cls === 'i' ? stem.replace(/e([^aeiou]*u?)$/, 'i$1') : cls === 'u' ? stem.replace(/o([^aeiou]*)$/, 'u$1') : stem;
    const sO = cls === 'o' ? stem.replace(/u([^aeiou]*)$/, 'o$1') : stem;
    const strong = n => ear && [0, 1, 2, 5].includes(n) ? (cls === 'ei' ? stem.replace(/i$/, 'ei') : stem + 'i') : n === 0 ? s1 : [1, 2, 5].includes(n) ? sO : stem;
    let pres;
    if (X.p) pres = X.p.slice();
    else {
      pres = V.pres.map((en, n) => join(strong(n), en, O));
      if (O.vstem) { pres[1] = stem + 'is'; pres[2] = stem + 'i'; if (/a$/.test(stem)) pres[0] = stem + 'io'; }   // sais, sai, saio; incluis, inclui
      if (/uzir$/.test(pinf)) pres[2] = stem;                          // (DX-B2) traduz, produz, reduz, deduz (not «traduze»)
      if (X.y) pres[0] = X.y;
    }
    pres.forEach((w, n) => add(w, 'pres.ind.' + PN[n]));
    let past = X.pf ? X.pf.slice() : V.past.map(en => join(stem, en, O));
    past.forEach((w, n) => add(w, 'past.ind.' + PN[n]));
    const impf = X.i ? X.i.slice() : V.impf.map(en => join(stem, en, O));
    impf.forEach((w, n) => add(w, 'impf.ind.' + PN[n]));
    const fs = X.f || pinf;
    FUT.forEach((en, n) => add(fs + en, 'fut.ind.' + PN[n]));
    COND.forEach((en, n) => add(fs + en, 'cond.ind.' + PN[n]));
    let subj;
    if (X.s) subj = X.s.slice();
    else {
      const sEnd = t === 'ar' ? E.ar.subj : E.er.subj;
      if (X.y || X.p || (O.vstem && /a$/.test(stem))) { const ys = pres[0].replace(/o$/, ''); subj = sEnd.map(en => join(ys, en, Object.assign({}, O, { back: null, front: t === 'ar' ? O.front : null, vstem: false }))); }
      else subj = sEnd.map((en, n) => join(ear && [0, 1, 2, 5].includes(n) ? strong(0) : s1, en, O));
    }
    subj.forEach((w, n) => add(w, 'pres.subj.' + PN[n]));
    // imperfect and future subjunctive from the 3rd plural preterite (fizeram → fizesse, fizer)
    const b = past[5].replace(/ram$/, '');
    const T = X.pf ? ACUTE : CIRC;
    const bAcc = inf === 'ser' || inf === 'ir' ? b.replace(/o$/, 'ô') : /[áéíóúâêô]/.test(b) ? b : accLast(b, t === 'ar' ? ACUTE : T);
    ['sse', 'sses', 'sse', 'ssemos', 'sseis', 'ssem'].forEach((en, n) => add((n === 3 || n === 4 ? bAcc : b) + en, 'impf.subj.' + PN[n]));
    const bf = b.replace(/í$/, 'i');
    ['r', 'res', 'r', 'rmos', 'rdes', 'rem'].forEach((en, n) => add((n === 1 || n === 5 ? b : bf) + en, 'fut.subj.' + PN[n]));
    ['', 'es', '', 'mos', 'des', 'em'].forEach((en, n) => add((en ? pinf : inf) + en, 'pinf.' + PN[n]));   // (pôr, pores, pormos)
    add(X.im || pres[2], 'imp.2s');
    add(subj[2], 'imp.2s.fo'); add(subj[5], 'imp.2p.fo'); add(subj[3], 'imp.1p');
    add(inf === 'pôr' ? 'ponde' : stem + V.vt, 'imp.2p.vt');
    add(X.g || (inf === 'pôr' ? 'pondo' : stem + V.ger), 'ger');
    partForms(pp || X.pp || join(stem, V.part, O)).forEach(([w, k]) => add(w, k));
    add(inf, 'inf');
    return out;
  }

  // ------------------------------------------------------------ headwords
  const POS = { m: 'n', f: 'n', mf: 'n', 'm~': 'n', mpl: 'n', fpl: 'n', v: 'v', a: 'adj', 'a=': 'adj', adj: 'adj', adv: 'adv', prep: 'prep',
    conj: 'conj', pron: 'pron', det: 'det', num: 'num', int: 'int', phrase: 'phrase', name: 'name' };
  const FLAGS = ['art', 'indef', 'dem', 'poss', 'quant', 'predet', 'inv', 'subj', 'clitic', 'obj', 'formal', 'tu', 'prp', 'neg', 'sub', 'coord', 'q',
    'st', 'nat', 'dep', 'per', 'work', 'place', 'coll', 'country', 'transport', 'noagree'];
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
      e.g = code === 'm~' || code === 'mpl' ? 'm' : code === 'fpl' ? 'f' : code === 'mf' ? 'mf' : code;
      if (code === 'm~') e.fem = ex.f || feminine(e.lemma);
      if (code === 'mpl' || code === 'fpl') e.plOnly = true;
      if (ex.pl) e.pl = ex.pl;
      if (raw.tags.includes('work') && (e.per || code === 'm~' || code === 'mf')) e.work = true;
      if ((raw.tags.includes('place') || raw.tags.includes('town')) && !e.transport) e.place = true;
    } else if (e.pos === 'v') {
      e.cls = cls; if (ex.pp) e.pp = ex.pp;
      if (/-se$/.test(e.lemma)) { e.refl = true; e.base = e.lemma.slice(0, -3); }
      if (e.lemma === 'ser' || e.lemma === 'estar') e.copula = e.lemma;
    } else if (e.pos === 'adj') {
      if (code === 'a=') e.invG = true;
      if (ex.f) e.fem = ex.f;
      if (ex.pl) e.pl = ex.pl;
    }
    if (explicit) e.forms = explicit.split(',').map(x => { const q = x.indexOf('='); return q < 0 ? [x, ''] : [x.slice(0, q), x.slice(q + 1)]; });
  }
  function adjForms(e) {
    const m = e.lemma, f = e.invG ? m : (e.fem || feminine(m));
    const pm = e.pl || plural(m);
    if (f === m) return [[m, 'mf.s'], [pm, 'mf.p']];
    return [[m, 'm.s'], [f, 'f.s'], [pm, 'm.p'], [plural(f), 'f.p']];
  }
  function forms(e, add) {
    if (e.forms) { e.forms.forEach(([w, k]) => add(w, k)); if (!e.forms.some(x => x[0] === e.lemma)) add(e.lemma, ''); }
    else if (e.pos === 'n') {
      const g = e.g === 'mf' ? '' : e.g + '.';
      if (e.plOnly) add(e.lemma, g + 'p');
      else if (e.fem) { add(e.lemma, 'm.s'); add(e.pl || plural(e.lemma), 'm.p'); add(e.fem, 'f.s'); add(plural(e.fem), 'f.p'); }
      else { add(e.lemma, g + 's'); add(e.pl || plural(e.lemma), g + 'p'); }
    } else if (e.pos === 'adj') adjForms(e).forEach(([w, k]) => add(w, k));
    else if (e.pos === 'v') {
      for (const [w, k] of conj(e.refl ? e.base : e.lemma, e.cls, e.pp)) add(w, k);
      if (e.refl) add(e.lemma, 'inf');
      if (e.lemma === 'estar') { add('tô', 'pres.ind.1s'); add('tá', 'pres.ind.3s'); add('tá', 'pres.ind.2s'); add('tamo', 'pres.ind.1p'); }   // casual Brazilian speech
    }
    else add(e.lemma, '');
    // (DX-B2) a noun's other word can carry its own gender, «alt:papagaio/m»; it gets its plural too, and a plural-only
    // noun's other word is plural
    if (e.alt) for (const a of e.alt) {
      if (e.pos !== 'n') { add(a, ''); continue; }
      const sl = a.indexOf('/'), w = sl > 0 ? a.slice(0, sl) : a, ag = sl > 0 ? a.slice(sl + 1) : (e.g === 'mf' ? '' : e.g), gk = ag ? ag + '.' : '';
      if (e.plOnly) { add(w, gk + 'p'); continue; }
      add(w, gk + 's'); if (!/[sx]$/.test(w)) add(plural(w), gk + 'p');
    }
  }

  // ------------------------------------------------------------ clitics after a hyphen (chamo-me, dá-me, fazê-lo, levantar-se)
  const CLIT = new Set(['me', 'te', 'se', 'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las', 'no', 'na', 'nos', 'nas', 'lhe', 'lhes', 'vos']);
  const MESO = new Set(['ei', 'as', 'a', 'emos', 'eis', 'ao', 'ia', 'ias', 'iamos', 'ieis', 'iam']);
  // diminutives (DX-B2): -inho / -inha / -zinho / -zinha (+ s) on a noun or adjective the list knows, for a word the index
  // doesn't: casinha, escolinha, caixinha, cafezinho, pãozinho, hotelzinho, menorzinha, fresquinha (c → qu), amiguinho (g → gu),
  // pedacinho (ç → c), pãezinhos / florezinhas (from the plural). A noun keeps its gender («o probleminha»); an adjective takes
  // the ending's. Never a capitalized word (a name: «Pedrinho», «Rosinha»).
  // (a game word, LEX's, keeps its own headword: «pazinha» is the trowel, «joaninha» the ladybug)
  function lexWord(P, k) {
    if (typeof LEX === 'undefined' || !LEX.ids) return false;
    const ids = LEX.ids();
    if (!P._lexW || P._lexWN !== ids.length) {
      P._lexW = new Set(); P._lexWN = ids.length;
      // (the main word only: an item's other words never get a headword of their own)
      for (const id of ids) { const it = LEX.item(id); if (!it || !it[P.lang]) continue; const c = String(it[P.lang]).replace(/[¡!¿?.,;:…"«»“”()]/g, '').trim(); if (c && c.indexOf(' ') < 0) P._lexW.add(key(c)); }
    }
    return P._lexW.has(k);
  }
  function dims(tk, P) {
    const raw = tk.t;
    if (raw.length < 6) return null;
    const k = key(raw), m = /inh([oa])(s?)$/.exec(k); if (!m || lexWord(P, k)) return null;
    if (raw[0] !== raw[0].toLowerCase() && !m[2]) return null;          // (a capital only on a plural, «Gatinhos» heading a title; names aren't plural)
    const stem = k.slice(0, m.index), g = m[1] === 'a' ? 'f' : 'm', n = m[2] ? 'p' : 's';
    const bases = [], put = (b, min = 3) => { if (b.length >= min && !bases.includes(b)) bases.push(b); };
    const v = g === 'f' ? 'a' : 'o', st = stem.replace(/qu$/, 'c').replace(/gu$/, 'g');
    if (/z$/.test(stem)) { const s2 = stem.slice(0, -1); put(s2, 2); if (n === 'p') put(s2 + 's'); }   // (pá → pazinha, pé → pezinho)
    put(st + v); put(stem + v); put(st + 'e');
    put(stem);
    const out = [], seen = new Set();
    for (const b of bases) for (const r of P.IX.get(b) || []) {
      const e = r.e;
      if ((e.pos !== 'n' && e.pos !== 'adj') || (e.auto && !(e.pos === 'n' && e.g)) || seen.has(e.id)) continue;
      seen.add(e.id);
      const gg = e.pos === 'n' && (e.g === 'm' || e.g === 'f') && !e.fem ? e.g : g;
      out.push({ e, f: feat(gg + '.' + n), w: raw, exact: true, via: 'dim' });
    }
    return out.length ? out : null;
  }
  function expand(tk, P) {
    const raw = tk.t; if (raw.indexOf('-') < 0) return dims(tk, P);
    const parts = raw.split('-'), cls = parts.slice(1).map(x => key(x));
    let end = '';
    if (cls.length >= 2 && MESO.has(cls[cls.length - 1])) end = cls.pop();       // dar-lhe-ei → darei + lhe
    if (!cls.length || !cls.every(c => CLIT.has(c))) return null;
    const b = key(parts[0]), out = [];
    const tries = [b + end];
    if (!end) {
      if (/^(lo|la|los|las)$/.test(cls[0])) { tries.push(b + 'r', b + 's', b + 'z'); }
      if (cls[0] === 'nos' && /mo$/.test(b)) tries.push(b + 's');
    }
    if (!P.reflOf) { P.reflOf = new Map(); for (const e of P.entries.values()) if (e.refl) P.reflOf.set(e.base, e); }
    const clE = cls.map(c => { const rs = P.IX.get(c) || []; const r = rs.find(x => x.e.clitic); return r ? r.e : null; }).filter(Boolean);
    for (const k of tries) for (const r of P.IX.get(k) || []) {
      if (r.e.pos !== 'v') continue;
      out.push({ e: r.e, f: r.f, w: raw, exact: true, via: 'clitic', cl: clE });
      const re = P.reflOf.get(r.e.lemma); if (re && cls.includes('se') || re && cls.some(c => /^(me|te|nos|vos)$/.test(c))) out.push({ e: re, f: r.f, w: raw, exact: true, via: 'clitic', cl: clE });
    }
    return out;
  }

  // ------------------------------------------------------------ scoring
  const PRI = { det: 1, prep: 1.2, conj: 1.1, pron: 0.9, adv: 0.8, n: 0.6, adj: 0.4, v: 0.5, num: 0.8, int: 0.3, phrase: 0.1, name: 0.2 };
  function prior(c) {
    let s = PRI[c.e.pos] || 0;
    if (c.via) s -= 0.6;
    if (c.e.refl) s -= 0.3;
    if (c.e.pos === 'v' && LATIN.finite(c.f)) s += 0.2;
    if (c.e.auto) s -= 0.2;
    return s;
  }
  function clauseFinite(W, i) {
    for (let k = i - 1; k >= 0; k--) { const w = W[k]; if (w.punct || (w._r && (w._r.e.sub || w._r.e.coord))) break; if (w._r && w._r.e.pos === 'v' && LATIN.finite(w._r.f)) return true; }
    for (let k = i + 1; k < W.length; k++) {
      const w = W[k]; if (w.punct) break;
      if (w._c.some(c => c.e.sub || (c.e.coord && c.exact))) break;
      if (w._c.length && w._c.some(c => c.exact && c.e.pos === 'v' && LATIN.finite(c.f)) && !w._c.some(c => c.exact && (c.e.pos === 'n' || c.e.det || c.e.art || c.e.pos === 'prep'))) return true;
    }
    return false;
  }
  const DEGREE_NEXT = new Set(['muito', 'tao', 'bem', 'mais', 'menos', 'bastante', 'super', 'meio', 'pouco']);
  function score(c, i, W, ctx) {
    const e = c.e, f = c.f, k = key(c.w);
    let s = 0;
    const nx = ctx.next || [], pv = ctx.prev;
    const nxFin = nx.some(n => n.e.pos === 'v' && LATIN.finite(n.f)), nxNoun = nx.some(n => ['n', 'adj', 'num'].includes(n.e.pos) && n.exact);
    const question = W.some(w => w.punct && /\?/.test(w.t));
    if (e.subj && !c.exact && !e.clitic) s += nxFin && !nxNoun ? 2.5 : -1;
    if (e.q && question && ctx.first && c.exact) s += 2.5;            // (Portuguese question words carry no accent: «Que horas são?»)
    if (e.clitic && !c.exact) s -= 2;                                  // («nós» typed with its accent is never «nos»)
    if (e.pos === 'v' && LATIN.finite(f) && !clauseFinite(W, i)) s += 1.2;
    if ((e.det || e.art) && e.pos !== 'prep' && pv && (pv.e.pos === 'n' || pv.e.subj)) s -= 2;
    if (e.pos === 'prep' && !e.art && nx.some(n => n.e.det || n.e.art || n.e.prp || (n.e.pos === 'v' && n.f.form === 'inf'))) s += 1.5;
    else if (e.pos === 'prep' && !e.art && nx.some(n => n.e.pos === 'n')) s += ctx.first && k === 'a' ? -1 : 0.5;
    if (e.prp && !c.exact && pv && pv.e.pos === 'prep' && !nxNoun) s += 2;
    if (e.pos === 'v' && f.mood === 'imp' && pv && (pv.e.subj || pv.e.clitic)) s -= 1;
    if (e.pos === 'v' && f.form === 'part' && pv && /^(ter|haver)$/.test(pv.e.lemma)) s += 3;
    if (e.pos === 'v' && f.form === 'inf' && pv && LATIN.finite(pv.f) && pv.e.pos === 'v') s += 1;
    // «é» typed «e» before an adjective: «a casa e grande»
    // (DX-B2: not at the end of a list, «com luvas, sacos e muito bom humor»: that «e» is «and»)
    if (e.lemma === 'ser' && !c.exact && k === 'e' && nx.some(n => n.e.pos === 'adj' || DEGREE_NEXT.has(key(n.w))) && !W.slice(Math.max(0, i - 4), i).some(x => x.punct && x.t === ',')) s += 3;
    // fui / foi: ir before «a», «para», «ao»; ser before what something was
    if (e.lemma === 'ir' && f.tense === 'past' && nx.some(n => /^(a|ao|aos|à|as|para|pra|pro|no|na|em)$/.test(key(n.w)))) s += 1;
    if (e.lemma === 'ser' && f.tense === 'past' && nx.some(n => n.e.pos === 'adj' || n.e.det || n.e.art && !/^(ao|a)$/.test(key(n.w)))) s += 0.6;
    // «nos» before a verb is the pronoun; before a noun, em + os
    if (e.clitic && k === 'nos' && nxFin && c.exact) s += 1.5;
    // an adjective right after a noun it agrees with («um ovo frito»), unless an object follows
    if (e.pos === 'adj' && pv && pv.e.pos === 'n' && !nx.some(n => n.e.det || n.e.art || n.e.clitic)) {
      const pg = pv.f.gender || pv.e.g, pn = pv.f.number || 's';
      if ((f.number || 's') === pn && (!f.gender || f.gender === 'mf' || !pg || pg === 'mf' || f.gender === pg)) s += 2;
    }
    // a second verb right after a noun, in a clause that has its verb already («comi um ovo frito»): unlikely
    if (e.pos === 'v' && LATIN.finite(f) && pv && (pv.e.pos === 'n' || pv.e.pos === 'adj') && clauseFinite(W, i)) s -= 1.5;
    // (DX-B2) «Presentes para crianças», «Gatinhos para adoção»: a singular verb right after a plural noun, when the word is
    // something else too, is that something else (a title has no verb: «para» is the preposition, not parar)
    if (e.pos === 'v' && LATIN.finite(f) && f.number === 's' && pv && pv.e.pos === 'n' && pv.f.number === 'p' && W[i]._c.some(x => x.exact && x.e.pos !== 'v')) s -= 1.5;
    // (DX-B2) a contraction or article typed right, before a word the list doesn't know, stays one: «os nomes das samambaias»
    // (not «dás» with its accent missing)
    if ((e.det || e.art) && c.exact && ctx.next && !ctx.next.length) s += 2;
    // «o jeito como a senhora conta…»: «como» right after a noun is the conjunction, not «(eu) como»
    if (e.pos === 'v' && k === 'como' && pv && pv.e.pos === 'n') s -= 2.5;
    // «pôr» typed with its circumflex is the verb, never the preposition: «vou pôr a mesa», «o pôr do sol»
    if (e.pos === 'v' && k === 'por' && c.exact) s += 2;
    // never a finite verb right after ser / estar (in any form): «ela é baixa» (not baixar), «a roupa está seca» (not secar),
    // «o salário ser baixo»
    if (e.pos === 'v' && LATIN.finite(f) && pv && pv.e.copula) s -= 2;
    // «vinte e um anos», «noventa e uma pessoas»: «um» after «e» and a number is the end of that number, not an article
    if (e.pos === 'num' && (k === 'um' || k === 'uma') && pv && key(pv.w) === 'e' && i >= 2 && W[i - 2] && !W[i - 2].punct && (W[i - 2].num != null || (W[i - 2]._r && W[i - 2]._r.e.pos === 'num'))) s += 4;
    // «às» typed «as» right after a noun is the article, not an accent slip: «todo dia as crianças brincam»
    if (e.pos === 'prep' && !c.exact && pv && pv.e.pos === 'n' && W[i]._c.some(x => x.exact && (x.e.art || x.e.det) && x.e.pos !== 'prep')) s -= 2;
    // after a determiner and an adjective, a word that can be a noun that agrees with them is the noun: «a maior parte», «o
    // primeiro passo», «meu maior desejo» («o velho cozinha bem» keeps the verb: cozinha the noun is feminine)
    if (e.pos === 'v' && LATIN.finite(f) && pv && pv.e.pos === 'adj' && i >= 2 && !W[i - 1].punct && W[i - 2] && W[i - 2]._r && (W[i - 2]._r.e.det || W[i - 2]._r.e.art) && nounAgrees(W, i, W[i - 2]._r) && nounAgrees(W, i, pv)) s -= 2.5;
    return s;
  }
  // a noun reading of word i that agrees in gender and number with the reading r (a determiner or an adjective before it)
  function nounAgrees(W, i, r) {
    const g = r.f.gender, n = r.f.number || 's';
    return W[i]._c.some(x => { if (x.e.pos !== 'n') return false; const xg = x.f.gender || x.e.g, xn = x.f.number || 's'; return xn === n && (!g || g === 'mf' || !xg || xg === 'mf' || xg === g); });
  }

  // ------------------------------------------------------------ the shared Romance config
  const DAYS = 'segunda|terca|quarta|quinta|sexta|sabado|domingo|segunda-feira|terca-feira|quarta-feira|quinta-feira|sexta-feira';
  const UNITS = 'semana|mes|ano|fim de semana|verao|inverno|outono|primavera|' + DAYS;
  const NUMW = '(?:um|uma|uns|umas|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta|cem|mil|\\d+|muitos|muitas|poucos|poucas|varios|varias)';
  const R = {
    lang: 'pt',
    skipAdv: new Set(['tambem', 'sempre', 'ja', 'ainda', 'so', 'quase', 'nunca', 'realmente', 'normalmente', 'geralmente', 'apenas', 'agora', 'hoje', 'ontem', 'amanha', 'tambem', 'jamais']),
    objClitics: new Set(['o', 'a', 'os', 'as', 'lhe', 'lhes']),
    refl: { '1s': 'me', '2s': 'te', '3s': 'se', '1p': 'nos', '2p': 'vos', '3p': 'se' },
    reflAny: new Set(['me', 'te', 'se', 'nos', 'vos']),
    clauseStart: new Set(['e', 'ou', 'mas', 'que', 'porque', 'quando', 'se', 'embora', 'enquanto', 'pois', 'entao', 'depois', 'tambem', 'hoje', 'ontem', 'amanha', 'agora', 'sempre', 'nunca', 'onde', 'nem', 'porem', 'antes', 'logo', 'ai']),
    coord: new Set(['e', 'ou', 'nem']),
    and: new Set(['e']),
    ofPrep: new Set(['de', 'do', 'da', 'dos', 'das']),
    aPrepNouns: new Set(['trabalho', 'pe', 'cavalo', 'respeito', 'caminho', 'passeio', 'servico', 'negocios', 'bordo', 'domicilio', 'fundo', 'gosto', 'vapor', 'jato', 'lapis', 'mao', 'tempo', 'cargo', 'prazo', 'pedido', 'proposito', 'titulo', 'partir', 'seguir', 'distancia', 'sos', 'lazer', 'cabo', 'dispor', 'custo']),
    gustar: new Set(['gostar']),
    perfAux: new Set(['ter', 'haver']),
    irA: false, inversion: false, tu3: true, copSkip: true,
    subBreak: new Set(['que', 'porque', 'quando', 'se', 'embora', 'enquanto', 'mas', 'onde', 'nem', 'porem']),
    ifWord: new Set(['se']),
    degree: new Set(['muito', 'tao', 'bastante', 'mais', 'menos', 'demais', 'super', 'meio', 'um', 'pouco', 'tambem', 'sempre', 'ainda', 'ja', 'quase', 'nao', 'nada', 'realmente', 'bem', 'muitissimo', 'bem']),
    here: new Set(['aqui', 'ai', 'ali', 'la', 'ca']),
    inWord: 'em', inSet: new Set(['em', 'no', 'na', 'nos', 'nas', 'num', 'numa']),
    indef: new Set(['um', 'uma']),
    noTense: new Set(['haver']),
    elfOk: () => false,
    timePatterns: [
      { re: new RegExp(`\\b(?:na |no )?(?:${UNITS}) passad[oa]\\b`, 'g'), t: 'past' },
      { re: /\bontem a noite\b/g, t: 'past' },
      { re: /\b(?:outro dia)\b/g, t: 'past' },
      { re: new RegExp(`(?<!desde )\\b(?:ha|faz) ${NUMW} (?:segundos?|minutos?|horas?|dias?|semanas?|mes|meses|anos?|seculos?)\\b`, 'g'), t: 'past', hace: true },
      { re: /\b(?:ha|faz) (?:muito|pouco)(?: tempo)?\b/g, t: 'past', hace: true },
      { re: /\bdepois de amanha\b/g, t: 'future' },
      { re: new RegExp(`\\b(?:na |no |o |a )?(?:${UNITS}) que vem\\b`, 'g'), t: 'future' },
      { re: new RegExp(`\\b(?:na |no |a |o )?proxim[oa] (?:${UNITS})\\b`, 'g'), t: 'future' },
      { re: new RegExp(`\\bdaqui a ${NUMW} (?:minutos?|horas?|dias?|semanas?|mes|meses|anos?)\\b`, 'g'), t: 'future' },
      { re: /\bno futuro\b/g, t: 'future' },
    ],
  };
  // gostar de: «Eu gosto chocolate» → «gosto de chocolate»; «Gosto o filme» → «do filme»; «Me gosta» → «Eu gosto de»
  const DE = { o: 'do', a: 'da', os: 'dos', as: 'das', este: 'deste', esta: 'desta', estes: 'destes', estas: 'destas', isto: 'disto', esse: 'desse',
    essa: 'dessa', esses: 'desses', essas: 'dessas', isso: 'disso', aquele: 'daquele', aquela: 'daquela', aqueles: 'daqueles', aquelas: 'daquelas',
    aquilo: 'daquilo', ele: 'dele', ela: 'dela', eles: 'deles', elas: 'delas', aqui: 'daqui', ali: 'dali', 'ai': 'daí' };
  const EM = { o: 'no', a: 'na', os: 'nos', as: 'nas', este: 'neste', esta: 'nesta', estes: 'nestes', estas: 'nestas', isto: 'nisto', esse: 'nesse',
    essa: 'nessa', esses: 'nesses', essas: 'nessas', isso: 'nisso', aquele: 'naquele', aquela: 'naquela', aqueles: 'naqueles', aquelas: 'naquelas',
    aquilo: 'naquilo', ele: 'nele', ela: 'nela', eles: 'neles', elas: 'nelas' };
  const POR = { o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas' };
  const A = { o: 'ao', os: 'aos', a: 'à', as: 'às', aquele: 'àquele', aquela: 'àquela', aqueles: 'àqueles', aquelas: 'àquelas', aquilo: 'àquilo' };
  const CONTR = { em: EM, de: DE, por: POR, a: A };
  const GADV = new Set(['muito', 'mais', 'menos', 'tambem', 'bastante', 'tanto', 'demais', 'pouco', 'mesmo', 'muitissimo', 'sempre', 'realmente']);
  const deWith = w => DE[key(w)] || 'de ' + w;
  R.gustarCheck = (W, P, infl, push, done, H) => {
    const { rd, nx, pv, lk, err, isFin } = H;
    for (const w of W) {
      const c = w._r; if (!isFin(c) || lk(c) !== 'gostar' || done.has(w.i)) continue;
      const p = pv(W, w.i), pc = rd(W, p);
      // «Me gosta (o chocolate)»: Spanish word order
      if (pc && pc.e.clitic && /^(me|te|lhe)$/.test(key(W[p].t)) && c.f.person === 3) {
        const j = nx(W, w.i), jk = j >= 0 ? key(W[j].t) : '';
        const art = j >= 0 && DE[jk] && rd(W, j) && (rd(W, j).e.art || rd(W, j).e.det);
        const who = { me: 'Eu gosto', te: 'Você gosta', lhe: 'Ele gosta' }[key(W[p].t)];
        const fx = who + (art ? ' ' + DE[jk] : j >= 0 && rd(W, j) && !DE_SET.has(jk) ? ' de' : '');
        push(err('gustar', 'major', art ? [p, j] : [p, w.i], fx, `In Portuguese the one who likes is the subject: «${fx}…».`));
        continue;
      }
      let j = nx(W, w.i); while (j >= 0 && rd(W, j) && GADV.has(lk(rd(W, j)))) j = nx(W, j);
      if (j < 0) continue;
      const jc = rd(W, j), jk = key(W[j].t);
      if (DE_SET.has(jk) || jk === 'que' || jk === 'quando' || jk === 'se' || jk === 'como') continue;
      const thing = W[j].name || (jc && (jc.e.pos === 'n' || jc.e.det || jc.e.art || (jc.e.pos === 'v' && jc.f.form === 'inf') || (jc.e.subj && !jc.e.clitic) || jc.e.dem));
      if (!thing) continue;
      const fx = jc && (jc.e.art || jc.e.det || jc.e.subj || jc.e.dem) && DE[jk] ? DE[jk] : 'de ' + W[j].t;
      push(err('gustar', 'major', [j, j], fx, `«gostar» takes «de»: «${w.t} ${fx}…».`));
    }
  };
  const DE_SET = new Set(['de', 'do', 'da', 'dos', 'das', 'dum', 'duma', 'dele', 'dela', 'deles', 'delas', 'disso', 'disto', 'daquilo', 'deste', 'desta', 'desse', 'dessa', 'daquele', 'daquela', 'daqui', 'dali']);
  R.checkMore = (a, W, opts, P, push, done, H) => {
    const { rd, nx, pv, lk, npFrom, err, infl, isFin } = H;
    for (const w of W) {
      if (w.punct || done.has(w.i)) continue;
      const c = w._r, k = key(w.t);
      // em o → no, de a → da, por os → pelos, a a → à (contract)
      if (CONTR[k] && c && c.e.pos === 'prep' && !c.e.art) {
        const j = nx(W, w.i), jc = rd(W, j), jk = j >= 0 ? key(W[j].t) : '';
        const to = CONTR[k][jk] || (k === 'a' && W[j] && W[j].t === 'a' ? 'à' : null);
        if (to && jc && !jc.e.clitic && !(jc.e.subj && k === 'a') && !(W[j].t !== W[j].t.toLowerCase() && j !== 0)) {
          const n2 = rd(W, nx(W, j));
          // (DX-B2) nor when the article's noun is the subject of an infinitive: «apesar de o salário ser baixo»
          const j2 = nx(W, j), n3 = j2 >= 0 ? rd(W, nx(W, j2)) : null;
          const infSubj = n2 && n2.e.pos === 'n' && n3 && n3.e.pos === 'v' && (n3.f.form === 'inf' || n3.f.form === 'pinf');
          if (!(n2 && n2.e.pos === 'v' && n2.f.form === 'inf') && !infSubj && !(jc.e.subj && k === 'em' && false)) {
            push(err('contract', 'major', [w.i, j], to, `«${k} + ${jk}» is always «${to}».`));
            continue;
          }
        }
      }
      // «no» before a verb: «não» (also before a word that can be a noun too, right after a subject pronoun: «Eu no gosto»)
      const subjNo = k === 'no' && W[nx(W, w.i)] && pv(W, w.i) >= 0 && rd(W, pv(W, w.i)) && rd(W, pv(W, w.i)).e.subj && !rd(W, pv(W, w.i)).e.clitic && W[nx(W, w.i)]._c.some(x => x.e.pos === 'v' && isFin(x));
      if (k === 'no' && W[nx(W, w.i)] && rd(W, nx(W, w.i)) && (subjNo || (isFin(rd(W, nx(W, w.i))) && !W[nx(W, w.i)]._c.some(x => x.e.pos === 'n' || x.e.pos === 'adj')))) {
        push(err('other', 'major', [w.i, w.i], 'não', '«Not» is «não» in Portuguese.'));
        continue;
      }
      if (!isFin(c)) continue;
      const lem = lk(c), j = nx(W, w.i);
      if (j >= 0 && PREPS[lem] && PREPS[lem].bad.includes(key(W[j].t)) && !done.has(j)) {
        const good = PREPS[lem].good, d = nx(W, j), dk = d >= 0 ? key(W[d].t) : '';
        const contr = CONTR[good] && CONTR[good][dk] && rd(W, d) && (rd(W, d).e.art || rd(W, d).e.det);
        const fx = contr ? CONTR[good][dk] : good;
        push(err('prep', 'major', contr ? [j, d] : [j, j], fx, `«${c.e.lemma}» goes with «${good}»: «${w.t} ${fx}…».`));
        continue;
      }
      // sou um estudante → sou estudante (minor)
      if (c.e.copula === 'ser' && R.indef.has(key((W[j] || {}).t || ''))) {
        const h = nx(W, j), hc = rd(W, h), after = rd(W, nx(W, h));
        if (hc && hc.e.pos === 'n' && hc.e.work && !(after && (after.e.pos === 'adj' || /^(de|do|da|que)$/.test(key(W[nx(W, h)].t))))) {
          push(err('article', 'minor', [j, j], '', `A job after «ser» takes no «um / uma»: «${w.t} ${W[h].t}».`));
        }
      }
    }
    if (a.question) {
      const i0 = W.findIndex(x => !x.punct);
      if (i0 >= 0 && key(W[i0].t) === 'porque' && !done.has(i0)) push(err('accent', 'minor', [i0, i0], likeCase('por que', W[i0].t), 'Asking why: «Por que…?» (two words). «Porque» answers it.'));
    }
  };
  const PREPS = { depender: { bad: ['em', 'no', 'na'], good: 'de' }, casar: { bad: ['a', 'ao'], good: 'com' }, sonhar: { bad: ['de', 'do', 'da'], good: 'com' }, apaixonar: { bad: ['com'], good: 'por' } };
  R.tenseFix = (c, to, infl, W, v) => {
    const f = c.f;
    if (to.tense === 'fut' && c.e.lemma !== 'ir') {
      const ir = DICT.pack('pt') && DICT.pack('pt').entries.get('pt:ir');
      const aux = ir && infl(ir, { tense: 'pres', mood: 'ind', person: f.person, number: f.number });
      const inf = infl(c.e, { form: 'inf' });
      if (aux && inf) return aux + ' ' + inf;
    }
    return infl(c.e, Object.assign({ mood: 'ind', person: f.person, number: f.number }, to));
  };

  // ------------------------------------------------------------ numbers in words (vinte e cinco, dois mil e vinte)
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
        if (on && key(w.t) === 'e' && W[i + 1] && W[i + 1]._r && W[i + 1]._r.e.pos === 'num') continue;
        if (c && /^(um|uma)$/.test(key(w.t)) && /^(mil|milhao|milhoes)$/.test(nk)) { flush(); on = true; cur = 1; continue; }
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
  const WHO = { '1s': 'I', '2s': 'you', '3s': 'he/she/você', '1p': 'we', '2p': 'you all (vós)', '3p': 'they/vocês' };
  const gnText = f => [f.gender === 'f' ? 'feminine' : f.gender === 'm' && f.number === 'p' ? 'masculine' : '', f.number === 'p' ? 'plural' : ''].filter(Boolean).join(' ');
  function describe(c) {
    const e = c.e, f = c.f || {}, pn = f.person ? f.person + f.number : '';
    if (e.pos === 'v') {
      let s;
      if (f.form === 'inf') s = 'infinitive';
      else if (f.form === 'pinf') s = 'personal infinitive, ' + WHO[pn];
      else if (f.form === 'ger') s = 'gerund';
      else if (f.form === 'part') s = 'participle' + (f.gender === 'f' || f.number === 'p' ? ', ' + gnText(f) : '');
      else if (f.mood === 'imp') s = 'command, ' + (f.formal ? (f.number === 'p' ? 'vocês' : 'você') : f.vosotros ? 'vós' : WHO[pn]);
      else if (f.mood === 'subj') s = (f.tense === 'impf' ? 'imperfect' : f.tense === 'fut' ? 'future' : 'present') + ' subjunctive, ' + WHO[pn];
      else s = TN[f.tense] + ', ' + WHO[pn];
      if (c.cl && c.cl.length) s += ' + ' + c.cl.map(x => x.lemma).join(' + ');
      return s;
    }
    if (low(c.w) === low(e.lemma)) return '';
    if (c.via === 'dim') return 'diminutive' + (f.number === 'p' ? ', plural' : '');
    if (e.pos === 'n') return e.fem && f.gender === 'f' ? 'feminine' + (f.number === 'p' ? ' plural' : '') : f.number === 'p' ? 'plural' : '';
    if (e.pos === 'adj' || e.pos === 'det' || e.pos === 'pron') return gnText(f);
    return '';
  }
  function enGloss(c) {
    const e = c.e, f = c.f || {};
    if (e.pos === 'v' && f.form === 'pinf') return EN.verb(e.en, { form: 'inf' });
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
    if (f.form === 'pinf') return 'pinf.' + person + number;
    if (f.mood === 'imp') {
      if (f.neg) { if (f.formal || person === 2) person = f.formal || number === 'p' ? 3 : 2; return 'pres.subj.' + person + number; }
      if (f.formal) return 'imp.2' + number + '.fo';
      if (person === 1) return 'imp.1p';
      if (number === 'p') return f.vosotros ? 'imp.2p.vt' : 'imp.2p.fo';
      return 'imp.2s';
    }
    if (f.formal) person = 3;
    if (person === 2 && number === 'p' && !f.vosotros) person = 3;
    return (f.tense || 'pres') + '.' + (f.mood || 'ind') + '.' + person + number;
  }
  function inflect(e, f, P) {
    if (e.pos === 'v') {
      const list = conj(e.refl ? e.base : e.lemma, e.cls, e.pp);
      if (f.tense === 'perf') {
        const ter = inflect(P.entries.get('pt:ter'), Object.assign({}, f, { tense: 'pres' }), P);
        const pt = list.find(x => x[1] === 'part.m.s');
        return ter && pt ? ter + ' ' + pt[0] : null;
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
o|det:o=m.s,a=f.s,os=m.p,as=f.p|the|art
um|det:um=m.s,uma=f.s,uns=m.p,umas=f.p|a, an; some (plural)|art indef
no|prep:no=m.s,na=f.s,nos=m.p,nas=f.p|in the, on the (em + o)|art
do|prep:do=m.s,da=f.s,dos=m.p,das=f.p|of the, from the (de + o)|art
ao|prep:ao=m.s,à=f.s,aos=m.p,às=f.p|to the (a + o)|art
pelo|prep:pelo=m.s,pela=f.s,pelos=m.p,pelas=f.p|through the, by the (por + o)|art
num|prep:num=m.s,numa=f.s,nuns=m.p,numas=f.p|in a (em + um)|art indef
pro|prep:pro=m.s,pra=f.s,pros=m.p,pras=f.p|to the, for the (para + o, casual)|art
este|det:este=m.s,esta=f.s,estes=m.p,estas=f.p|this; these|dem
esse|det:esse=m.s,essa=f.s,esses=m.p,essas=f.p|that; those|dem
aquele|det:aquele=m.s,aquela=f.s,aqueles=m.p,aquelas=f.p|that (over there)|dem
isto|pron|this (thing)|dem
isso|pron|that (thing)|dem
aquilo|pron|that (thing over there)|dem
meu|det:meu=m.s,minha=f.s,meus=m.p,minhas=f.p|my; mine|poss
teu|det:teu=m.s,tua=f.s,teus=m.p,tuas=f.p|your (tu); yours|poss
seu|det:seu=m.s,sua=f.s,seus=m.p,suas=f.p|your (você); his, her, their|poss
nosso|det:nosso=m.s,nossa=f.s,nossos=m.p,nossas=f.p|our; ours|poss
muito|det:muito=m.s,muita=f.s,muitos=m.p,muitas=f.p|a lot of, many|quant
muito#adv|adv|very; a lot
pouco|det:pouco=m.s,pouca=f.s,poucos=m.p,poucas=f.p|little, few|quant
pouco#adv|adv|little, not much
todo|det:todo=m.s,toda=f.s,todos=m.p,todas=f.p|all, every, the whole|predet quant
tudo|pron|everything
outro|det:outro=m.s,outra=f.s,outros=m.p,outras=f.p|other, another|quant
cada|det:cada=mf.s|each, every|inv quant
eu|pron:eu=1s|I|subj
tu|pron:tu=2s|you (tu)|subj tu
você|pron:você=2s.fo,cê=2s.fo,vc=2s.fo|you (casual: cê, vc)|subj formal
ele|pron:ele=3s.m|he; him|subj
ela|pron:ela=3s.f|she; her|subj
nós|pron:nós=1p|we; us|subj
vocês|pron:vocês=2p.fo,cês=2p.fo,vcs=2p.fo|you all (casual: cês, vcs)|subj formal
eles|pron:eles=3p.m,elas=3p.f|they; them|subj
me|pron:me=1s|me, to me, myself|clitic
te|pron:te=2s|you, to you, yourself|clitic
o#pron|pron:o=3s.m|him, it|clitic obj
a#pron|pron:a=3s.f|her, it|clitic obj
os#pron|pron:os=3p.m|them|clitic obj
as#pron|pron:as=3p.f|them|clitic obj
lhe|pron:lhe=3s,lhes=3p|to him, to her, to you|clitic obj
nos#pron|pron:nos=1p|us, to us, ourselves|clitic
se#pron|pron:se=3|himself, herself, themselves, yourself|clitic
mim|pron:mim=1s|me (after a preposition)|prp
ti|pron:ti=2s|you (after a preposition)|prp
comigo|pron|with me
contigo|pron|with you
conosco|pron|with us
dele|pron:dele=3s.m,dela=3s.f,deles=3p.m,delas=3p.f|his, her, their (de + ele)
a#prep|prep|to, at
de|prep|of, from
em|prep|in, on, at
por|prep|for, by, through
para|prep|for, to, in order to
pra#prep|prep|to, for (para, casual)
com|prep|with
sem|prep|without
sobre|prep|on, about
entre|prep|between, among
até|prep|until, up to; even
desde|prep|since, from
e|conj|and|coord
ou|conj|or|coord
mas|conj|but|coord
que|conj|that, which, who|sub
porque|conj|because|sub
se|conj|if, whether|sub
quando|conj|when|sub
como|conj|like, as; since|sub
o que|phrase|what
quê|pron|what|q
quem|pron|who|q
qual|pron:qual=s,quais=p|which, what|q
quanto|det:quanto=m.s,quanta=f.s,quantos=m.p,quantas=f.p|how much, how many|q
como#q|adv|how|q
onde|adv|where|q
quando#q|adv|when|q
por que|phrase|why
por quê|phrase|why
não|adv|no, not|neg
sim|adv|yes
também|adv|also, too
mais|adv|more, most
menos|adv|less, fewer
bem|adv|well, fine
mal|adv|badly
já|adv|already; now
sempre|adv|always
nunca|adv|never|neg
aqui|adv|here
ali|adv|there
lá|adv|over there
hoje|adv|today|time:present
ontem|adv|yesterday|time:past
amanhã|adv|tomorrow|time:future
agora|adv|now|time:present
depois|adv|after, afterwards, later
antes|adv|before
algo|pron|something
nada|pron|nothing|neg
alguém|pron|someone
ninguém|pron|nobody|neg
oi|int|hi
olá|int|hello
tchau|int|bye
obrigado|int:obrigado=m,obrigada=f|thank you
desculpa|int|sorry|alt:desculpe,desculpem
ok|int|OK|alt:okay
por favor|phrase|please
a favor|phrase|in favor (a favor de; ser a favor)
de nada|phrase|you’re welcome
bom dia|phrase|good morning
boa tarde|phrase|good afternoon
boa noite|phrase|good evening, good night
até logo|phrase|see you later
até amanhã|phrase|see you tomorrow
tudo bem|phrase|how are you?; all good
tudo bom|phrase|how are you?; all good
muito prazer|phrase|nice to meet you
muito bem|phrase|very well
às vezes|phrase|sometimes
todo dia|phrase|every day
todos os dias|phrase|every day
um pouco|phrase|a little
a gente|phrase|we, us (casual)
zero|num|zero|n:0
um#num|num:um=m,uma=f|one|n:1
dois|num:dois=m,duas=f|two|n:2
três|num|three|n:3
quatro|num|four|n:4
cinco|num|five|n:5
seis|num|six|n:6
sete|num|seven|n:7
oito|num|eight|n:8
nove|num|nine|n:9
dez|num|ten|n:10
onze|num|eleven|n:11
doze|num|twelve|n:12
treze|num|thirteen|n:13
catorze|num|fourteen|n:14 alt:quatorze
quinze|num|fifteen|n:15
dezesseis|num|sixteen|n:16
dezessete|num|seventeen|n:17
dezoito|num|eighteen|n:18
dezenove|num|nineteen|n:19
vinte|num|twenty|n:20
trinta|num|thirty|n:30
quarenta|num|forty|n:40
cinquenta|num|fifty|n:50
cem|num|a hundred|n:100
mil|num|a thousand|n:1000
primeiro|a|first
segundo#ord|a|second
terceiro|a|third
último|a|last
@2
vosso|det:vosso=m.s,vossa=f.s,vossos=m.p,vossas=f.p|your (vós)|poss
algum|det:algum=m.s,alguma=f.s,alguns=m.p,algumas=f.p|some, any|quant
nenhum|det:nenhum=m.s,nenhuma=f.s|no, none|quant neg
vários|det:vários=m.p,várias=f.p|several|quant
tanto|det:tanto=m.s,tanta=f.s,tantos=m.p,tantas=f.p|so much, so many|quant
mesmo|a|same; -self; really
vós|pron:vós=2p|you all (old)|subj
vos|pron:vos=2p|you all, to you all (old)|clitic
neste|prep:neste=m.s,nesta=f.s,nestes=m.p,nestas=f.p|in this (em + este)|art
nesse|prep:nesse=m.s,nessa=f.s,nesses=m.p,nessas=f.p|in that (em + esse)|art
naquele|prep:naquele=m.s,naquela=f.s,naqueles=m.p,naquelas=f.p|in that (em + aquele)|art
deste|prep:deste=m.s,desta=f.s,destes=m.p,destas=f.p|of this (de + este)|art
desse|prep:desse=m.s,dessa=f.s,desses=m.p,dessas=f.p|of that (de + esse)|art
daquele|prep:daquele=m.s,daquela=f.s,daqueles=m.p,daquelas=f.p|of that (de + aquele)|art
àquele|prep:àquele=m.s,àquela=f.s|to that (a + aquele)|art
dum|prep:dum=m.s,duma=f.s|of a (de + um)|art indef
nisso|prep|in that (em + isso)
disso|prep|of that, about that (de + isso)
disto|prep|of this (de + isto)
nisto|prep|in this (em + isto)
daquilo|prep|of that (de + aquilo)
nele|pron:nele=3s.m,nela=3s.f,neles=3p.m,nelas=3p.f|in him, in her, in it (em + ele)
daqui|adv|from here (de + aqui)
dali|adv|from there (de + ali)
contra|prep|against
durante|prep|during
após|prep|after
nem|conj|nor, not even|coord neg
embora|conj|although|sub
enquanto|conj|while|sub
pois|conj|because, since
porém|conj|however
então|adv|so, then
cadê|adv|where is…? (casual)|q
ainda|adv|still, yet
jamais|adv|never (ever)|neg
aí|adv|there (near you); then
cá|adv|here
anteontem|adv|the day before yesterday|time:past
logo|adv|soon; right away
cedo|adv|early
tarde#adv|adv|late
só|adv|only, just
apenas|adv|only
quase|adv|almost
talvez|adv|maybe
assim|adv|like this, so
tão|adv|so, as
bastante|adv|quite, enough
demais|adv|too much; a lot
perto|adv|near
longe|adv|far
dentro|adv|inside
fora|adv|outside
embaixo|adv|underneath, downstairs|alt:em_baixo
juntos|adv|together
claro|int|of course
nossa|int|wow
puxa|int|gee, wow
valeu|int|thanks (casual)
beleza|int|cool, OK (casual)
até mais|phrase|see you
com licença|phrase|excuse me
por isso|phrase|that’s why, so
no entanto|phrase|however
por exemplo|phrase|for example
ou seja|phrase|that is, I mean
já que|phrase|since
além disso|phrase|besides
mesmo assim|phrase|even so
acho que|phrase|I think that
penso que|phrase|I think that
na minha opinião|phrase|in my opinion
ao lado de|phrase|next to
perto de|phrase|near
longe de|phrase|far from
na frente de|phrase|in front of
atrás de|phrase|behind
antes de|phrase|before
depois de|phrase|after
em cima de|phrase|on top of
embaixo de|phrase|under
no final|phrase|in the end
de repente|phrase|suddenly
com certeza|phrase|definitely
tem que|phrase|have to
para que|phrase|so that
até que|phrase|until
desde que|phrase|since; as long as
vinte e um|phrase|twenty-one
sessenta|num|sixty|n:60
setenta|num|seventy|n:70
oitenta|num|eighty|n:80
noventa|num|ninety|n:90
cento|num|(one) hundred (cento e vinte)|n:100
duzentos|num:duzentos=m,duzentas=f|two hundred|n:200
trezentos|num:trezentos=m,trezentas=f|three hundred|n:300
quatrocentos|num:quatrocentos=m,quatrocentas=f|four hundred|n:400
quinhentos|num:quinhentos=m,quinhentas=f|five hundred|n:500
seiscentos|num:seiscentos=m,seiscentas=f|six hundred|n:600
setecentos|num:setecentos=m,setecentas=f|seven hundred|n:700
oitocentos|num:oitocentos=m,oitocentas=f|eight hundred|n:800
novecentos|num:novecentos=m,novecentas=f|nine hundred|n:900
milhão|num:milhão=s,milhões=p|million|n:1000000
quarto#ord|a|fourth
quinto|a|fifth
sexto|a|sixth
décimo|a|tenth
@3
cujo|det:cujo=m.s,cuja=f.s,cujos=m.p,cujas=f.p|whose
inclusive|adv|even; including
aliás|adv|by the way; actually
portanto|conj|therefore
contudo|conj|however
todavia|conj|however
sobretudo|adv|above all
apesar de|phrase|despite
em vez de|phrase|instead of
graças a|phrase|thanks to
através de|phrase|through
ao redor de|phrase|around
dentro de|phrase|inside, within
fora de|phrase|outside
de fato|phrase|in fact
na verdade|phrase|actually
é claro|phrase|of course
pelo menos|phrase|at least
cada vez mais|phrase|more and more
aos poucos|phrase|little by little
sem dúvida|phrase|without a doubt
por sorte|phrase|luckily
infelizmente|adv|unfortunately
felizmente|adv|fortunately
`;
  const LISTS = [CLOSED];

  LISTS.push(`
@1 people,family
pessoa|f|person|per
gente|f|people; (a gente) we|noagree
homem|m|man|per
mulher|f|woman; wife|per
menino|m~|boy/girl, kid|per
criança|f|child|per
bebê|mf|baby|per
amigo|m~|friend|per
família|f|family|coll
pai|m|father|per
mãe|f|mother|per
pais|mpl|parents|per
filho|m~|son/daughter|per
irmão|m~|brother/sister|per pl:irmãos f:irmã
avô|m~|grandfather/grandmother|per f:avó
tio|m~|uncle/aunt|per
primo|m~|cousin|per
marido|m|husband|per
esposa|f|wife|per
namorado|m~|boyfriend/girlfriend|per
senhor|m~|Mr., sir, gentleman/Mrs., madam, lady|per
vizinho|m~|neighbor|per
nome|m|name
idade|f|age
@1 work,people
trabalho|m|work, job
professor|m~|teacher|per
estudante|mf|student|per
aluno|m~|student, pupil|per
médico|m~|doctor|per
enfermeiro|m~|nurse|per
policial|mf|police officer|per
cozinheiro|m~|cook|per
padeiro|m~|baker|per
carteiro|m~|mail carrier|per
jardineiro|m~|gardener|per
músico|m~|musician|per f:musicista
fazendeiro|m~|farmer|per
pescador|m~|fisher|per
vendedor|m~|seller, salesperson|per
garçom|m~|waiter/waitress|per f:garçonete pl:garçons
chefe|mf|boss|per
artista|mf|artist|per
cantor|m~|singer|per
escritor|m~|writer|per
costureira|f|seamstress|per
@1 body,health
corpo|m|body
cabeça|f|head
rosto|m|face|alt:cara
olho|m|eye
orelha|f|ear
nariz|m|nose
boca|f|mouth
dente|m|tooth
cabelo|m|hair
mão|f|hand|pl:mãos
braço|m|arm
dedo|m|finger, toe
perna|f|leg
pé|m|foot
costas|fpl|back
barriga|f|belly, stomach
coração|m|heart
saúde|f|health
doente|a|sick, ill
dor|f|pain, ache|-
remédio|m|medicine
hospital|m|hospital|place
@1 food
comida|f|food; meal
café da manhã|phrase|breakfast
almoço|m|lunch
jantar#n|m|dinner
pão|m|bread|pl:pães
maçã|f|apple
laranja|f|orange
banana|f|banana
morango|m|strawberry
uva|f|grape
pera|f|pear
limão|m|lemon, lime
fruta|f|fruit
verdura|f|vegetable
legume|m|vegetable
tomate|m|tomato
batata|f|potato
cebola|f|onion
salada|f|salad
arroz|m|rice
feijão|m|beans
milho|m|corn
carne|f|meat
frango|m|chicken
peixe|m|fish
ovo|m|egg
queijo|m|cheese
leite|m|milk
manteiga|f|butter
açúcar|m|sugar
sal|m|salt
sopa|f|soup
pizza|f|pizza
macarrão|m|pasta, noodles|pl:macarrões
biscoito|m|cookie|alt:bolacha
bolo|m|cake
doce|m|candy, sweet
bala|f|candy
chocolate|m|chocolate
sorvete|m|ice cream|alt:picolé
mel|m|honey|pl:méis
@1 drink,food
água|f|water
café|m|coffee; café
chá|m|tea
suco|m|juice
refrigerante|m|soda|alt:refri
copo|m|glass
xícara|f|cup
prato|m|plate; dish
garrafa|f|bottle
@1 home
casa|f|house, home|place
quarto|m|bedroom, room|place
cozinha|f|kitchen|place
banheiro|m|bathroom|place
sala|f|living room|place
jardim|m|garden|place
porta|f|door
janela|f|window
mesa|f|table
cadeira|f|chair
cama|f|bed
luminária|f|lamp|alt:abajur,lâmpada
chave|f|key
livro|m|book
papel|m|paper
foto|f|photo|alt:fotografia
relógio|m|clock, watch
telefone|m|phone
celular|m|cell phone
computador|m|computer
televisão|f|television|alt:tv
rádio|mf|radio (o rádio: the set; a rádio: the station)
@1 town
cidade|f|city|place
vila|f|village|place
rua|f|street|place
praça|f|square|place
parque|m|park|place
loja|f|shop, store|place
mercado|m|market|place
mercadinho|m|corner store|place
escola|f|school|place
biblioteca|f|library|place
igreja|f|church|place
banco|m|bank; bench|place
restaurante|m|restaurant|place
cinema|m|movie theater|place
museu|m|museum|place
escritório|m|office|place
estação|f|station|place
@1 nature,place
praia|f|beach|place
mar|m|sea|place
rio|m|river|place
lago|m|lake|place
montanha|f|mountain|place
floresta|f|forest|place
campo|m|field; countryside|place
ilha|f|island|place
ponte|f|bridge|place
torre|f|tower; rook (chess)|place
caminho|m|path, way
país|m|country|place
mundo|m|world
lugar|m|place|place
@1 nature
árvore|f|tree
flor|f|flower
folha|f|leaf; sheet of paper
planta|f|plant
pedra|f|stone, rock
terra|f|earth, land
fogo|m|fire
sol|m|sun
lua|f|moon
estrela|f|star
céu|m|sky
@1 weather
chuva|f|rain
neve|f|snow
vento|m|wind
nuvem|f|cloud
calor|m|heat
frio#n|m|cold
chover|v|rain
nevar|v|snow
@1 animal
animal|m|animal
cachorro|m~|dog|alt:cão
gato|m~|cat
pássaro|m|bird|alt:passarinho
cavalo|m|horse; knight (chess)
vaca|f|cow
porco|m|pig; pork
ovelha|f|sheep
galinha|f|hen, chicken
pato|m|duck
rato|m|mouse, rat
coelho|m|rabbit
raposa|f|fox
urso|m|bear
sapo|m|frog, toad
abelha|f|bee
borboleta|f|butterfly
@1 time
tempo|m|time; weather
hora|f|hour; time
minuto|m|minute
dia|m|day
semana|f|week
mês|m|month
ano|m|year
manhã|f|morning
tarde|f|afternoon
noite|f|night, evening
segunda-feira|f|Monday|alt:segunda
terça-feira|f|Tuesday|alt:terça
quarta-feira|f|Wednesday|alt:quarta
quinta-feira|f|Thursday|alt:quinta
sexta-feira|f|Friday|alt:sexta
sábado|m|Saturday
domingo|m|Sunday
momento|m|moment
vez|f|time (once, twice), turn
aniversário|m|birthday
festa|f|party
férias|fpl|vacation, holidays
fim de semana|phrase|weekend
@1 school,language
aula|f|class, lesson
lição|f|lesson
prova|f|test, exam
dever de casa|phrase|homework
caderno|m|notebook
lápis|m|pencil
pergunta|f|question
resposta|f|answer
palavra|f|word
língua|f|language; tongue
idioma|m|language
português|m|Portuguese (the language)
inglês|m|English (the language)
espanhol|m|Spanish (the language)
@1 hobby,sport,music
jogo|m|game
esporte|m|sport
futebol|m|soccer, football
música|f|music; song
canção|f|song
filme|m|movie, film
@1 money,shop
dinheiro|m|money
moeda|f|coin; currency
preço|m|price
@1 transport,travel
trem|m|train|transport
carro|m|car|transport
ônibus|m|bus|transport
bicicleta|f|bicycle|alt:bike|transport
avião|m|airplane|transport
barco|m|boat|transport
viagem|f|trip
@1 clothes
roupa|f|clothes
camisa|f|shirt
camiseta|f|T-shirt
calça|f|pants, trousers
sapato|m|shoe
chapéu|m|hat
vestido|m|dress
@1 color
cor|f|color
vermelho|a|red
azul|a|blue
verde|a|green
amarelo|a|yellow
branco|a|white
preto|a|black
cinza|a:cinza=mf.s,cinza=mf.p,cinzas=mf.p|gray (the same in the plural: luvas cinza)
marrom|a=|brown
rosa#adj|a:rosa=mf.s,rosa=mf.p|pink (the same in the plural: camisas rosa)
roxo|a|purple
laranja#adj|a:laranja=mf.s,laranja=mf.p|orange (color; the same in the plural)
@1 feeling
feliz|a|happy|+
contente|a|happy, glad|+
triste|a|sad|-
bravo|a|angry|st -
irritado|a|annoyed|st -
cansado|a|tired|st
entediado|a|bored|st
chato|a|boring; annoying|-
calmo|a|calm|+
tranquilo|a|calm, quiet|+
amor|m|love|+
medo|m|fear|-
fome|f|hunger (estou com fome: I’m hungry)
sede|f|thirst
sono|m|sleepiness, sleep
@1
bom|a|good|f:boa +
mau|a|bad|f:má -
ruim|a=|bad|-
grande|a|big, large; great
pequeno|a|small, little
alto|a|tall, high
baixo|a|short, low
comprido|a|long
curto|a|short (length)
novo|a|new; young
velho|a|old
jovem|a=|young
bonito|a|pretty, nice|+
lindo|a|beautiful|+
feio|a|ugly|-
fácil|a|easy
difícil|a|difficult, hard
rápido|a|fast, quick
lento|a|slow
caro|a|expensive
barato|a|cheap
rico|a|rich
pobre|a|poor
limpo|a|clean
sujo|a|dirty
cheio|a|full
vazio|a|empty
quente|a|hot
frio|a|cold
gostoso|a|tasty, delicious|+
importante|a|important
interessante|a|interesting|+
divertido|a|fun|+
legal|a|cool, nice|+
simpático|a|nice, friendly|+
gentil|a|kind|+
melhor|a=|better, best
pior|a=|worse, worst
maior|a=|bigger; older
menor|a=|smaller; younger
favorito|a|favorite
pronto|a|ready
ocupado|a|busy
livre|a|free
aberto|a|open
fechado|a|closed
sozinho|a|alone|dep
@1
ser|v|be (what someone or something is)
estar|v|be (how or where)
ter|v|have
haver|v|there is (há); have (helper)
ir|v|go
ir-se|v|leave
vir|v|come
fazer|v|do, make
dizer|v|say, tell
poder|v|can, be able to
querer|v|want
saber|v|know (a fact), know how to
conhecer|v|know (a person, a place); meet
ver|v|see; watch
olhar|v|look (at)
ouvir|v|hear
escutar|v|listen (to)
falar|v|speak, talk
perguntar|v|ask
responder|v|answer
chamar|v|call
chamar-se|v|be called (me chamo: my name is)
comer|v|eat
beber|v|drink
tomar|v|take; drink
morar|v|live (somewhere)
viver|v|live
trabalhar|v|work
estudar|v|study
aprender|v|learn
ensinar|v|teach
ler|v|read
escrever|v|write|pp:escrito
jogar|v|play (a game); throw
brincar|v|play (kids)
correr|v|run
andar|v|walk; go
caminhar|v|walk
nadar|v|swim
dançar|v|dance
cantar|v|sing
dormir|v.u|sleep
acordar|v|wake up
levantar-se|v|get up
deitar-se|v|lie down, go to bed
sentar-se|v|sit down
abrir|v|open|pp:aberto
fechar|v|close
começar|v|start, begin
terminar|v|finish
sair|v|go out, leave
entrar|v|go in, come in
chegar|v|arrive
voltar|v|come back
procurar|v|look for
encontrar|v|find; meet
achar|v|find; think
perder|v|lose; miss
ganhar|v|win; earn; get
pagar|v|pay|pp:pago
comprar|v|buy
vender|v|sell
custar|v|cost
precisar|v|need
usar|v|use; wear
levar|v|take, carry
trazer|v|bring
dar|v|give
ajudar|v|help
esperar|v|wait (for); hope
pensar|v|think
acreditar|v|believe
sentir|v.i|feel; be sorry
sentir-se|v.i|feel (well, sad…)
gostar|v|like (gostar de)
amar|v|love
adorar|v|love, adore
preferir|v.i|prefer
lembrar|v|remember
esquecer|v|forget
visitar|v|visit
viajar|v|travel
cozinhar|v|cook
limpar|v|clean
lavar|v|wash
tocar|v|touch; play (music)
passar|v|pass; spend (time)
mudar|v|change; move
pôr|v|put
colocar|v|put
tirar|v|take off, take out
pular|v|jump|alt:saltar
bater|v|hit; knock|alt:socar
atacar|v|attack
empurrar|v|push
subir|v.o|go up, climb
descer|v|go down
soprar|v|blow|alt:assoprar
voar|v|fly
cair|v|fall
mostrar|v|show
explicar|v|explain
entender|v|understand
repetir|v.i|repeat
praticar|v|practice
descansar|v|rest
`);
  LISTS.push(`
@2 hush
caladinho|m|hushling (a small Hush creature)
caladão|m|big hushling|pl:caladões
silêncio|m|silence; the Hush (o Silêncio)
Mimo|name|Mimo (your friend)
Noa|name|Noa
Alba|name|Alba (the town)
Molinar|name|Molinar (the windmill village)
Remanso|name|Remanso (the lake village)
sino|m|bell
moinho|m|mill, windmill|place
pedreira|f|quarry|place
caverna|f|cave|place
pico|m|peak|place
mariposa|f|moth
besouro|m|beetle
tatu|m|armadillo
boneco|m|dummy, doll
grão|m|grain, kernel|pl:grãos
pipoca|f|popcorn
coronel|m|colonel|pl:coronéis
esquerda|f|left
direita|f|right
meio|m|middle|alt:centro
rabo|m|tail
casco|m|shell; hoof
asa|f|wing
pedrinha|f|pebble
pedrão|m|big rock
morcego|m|bat
bola|f|ball
remo|m|oar
lanterna|f|lantern|alt:lampião
corda|f|rope
espantalho|m|scarecrow
senha|f|password
labirinto|m|maze
dominó|m|dominoes
peça|f|piece; play (theater)
túmulo|m|grave|alt:sepultura,lápide,jazigo
cemitério|m|cemetery|place
vela|f|candle; sail
corvo|m|crow
gongo|m|gong
cristal|m|crystal|pl:cristais
canário|m|canary
girassol|m|sunflower|pl:girassóis
tulipa|f|tulip
lavanda|f|lavender
colmeia|f|beehive
estufa|f|greenhouse|place
gelo|m|ice
tapete|m|rug, carpet
forno|m|oven
tesoura|f|scissors
xadrez|m|chess
damas|fpl|checkers
peão|m|pawn|pl:peões
bispo|m|bishop (chess)
dama|f|queen (chess); lady|alt:rainha
rei|m|king
medalha|f|medal
fone|m|headphones|alt:fones,headphone
gravador|m|recorder
fita|f|tape, cassette; ribbon
gnomo|m|gnome|alt:anão
dado|m|die (dice)
caixa de correio|phrase|mailbox
boné|m|cap
carta|f|letter; card
cartão postal|phrase|postcard
poema|m|poem
martelo|m|hammer
cobertor|m|blanket|alt:manta,coberta
disco|m|record, disc|alt:vinil
chiclete|m|chewing gum
jornal|m|newspaper
pipa|f|kite|alt:papagaio/m,pandorga,arraia
caveirinha|f|sugar skull
rolinho|m|spring roll
guioza|f|gyoza, jiaozi|alt:jiaozi
baozi|m|baozi (steamed bun)
wonton|m|wonton|alt:wantan
lámen|m|ramen noodles|alt:talharim
taça|f|cup, trophy; glass
bairro|m|neighborhood|place
sorte|f|luck|+
bolso|m|pocket
ouro|m|gold
cogumelo|m|mushroom
norte|m|north
sul|m|south
leste|m|east
oeste|m|west
morro|m|hill|place
colina|f|hill|place
bora|int|let’s go (casual)
@2
pedir|v|ask for, order
servir|v.i|serve
seguir|v.i|follow; keep (doing)
conseguir|v.i|manage, be able to; get
vestir|v.i|wear; dress
vestir-se|v.i|get dressed
escolher|v|choose
rir|v|laugh
sorrir|v|smile
divertir-se|v.i|have fun
mentir|v.i|lie (tell lies)
morrer|v|die|pp:morto
contar|v|count; tell
provar|v|try, taste
sonhar|v|dream
mover|v|move
devolver|v|give back
resolver|v|solve
doer|v|hurt (dói: it hurts)
almoçar|v|have lunch
jantar|v|have dinner
lembrar-se|v|remember
preocupar-se|v|worry
ficar|v|stay; be; become
pôr-se|v|put on; become
lavar-se|v|wash (yourself)
tomar banho|phrase|take a shower, a bath
escovar|v|brush
casar|v|marry, get married
casar-se|v|get married
apaixonar-se|v|fall in love
irritar-se|v|get annoyed
preparar|v|prepare
esquentar|v|heat, warm up
cortar|v|cut
convidar|v|invite
comemorar|v|celebrate|alt:celebrar
presentear|v|give (as a gift)
receber|v|receive, get
enviar|v|send
mandar|v|send; order
desenhar|v|draw
pintar|v|paint
dirigir|v|drive
parar|v|stop
atravessar|v|cross
virar|v|turn
perder-se|v|get lost
mudar-se|v|move (house)
alugar|v|rent
nascer|v|be born
crescer|v|grow
passar de ano|phrase|pass (the school year)
decidir|v|decide
tentar|v|try
dever|v|must, should; owe
costumar|v|usually (do)
parecer|v|seem
acontecer|v|happen
faltar|v|be missing, lack
importar|v|matter
interessar|v|interest
incomodar|v|bother
odiar|v.ei|hate
beijar|v|kiss
abraçar|v|hug
chorar|v|cry
gritar|v|shout
calar|v|keep quiet
calar-se|v|go quiet
conversar|v|talk, chat
bater papo|phrase|chat
cumprimentar|v|greet, say hi
despedir-se|v|say goodbye
apresentar|v|introduce; present
acompanhar|v|go with
compartilhar|v|share
emprestar|v|lend
economizar|v|save (money)
gastar|v|spend
consertar|v|fix
quebrar|v|break
construir|v|build
criar|v|create; raise
funcionar|v|work (a machine)
ligar|v|turn on; call (phone)
desligar|v|turn off; hang up
encher|v|fill
guardar|v|keep, put away
arrumar|v|tidy up; fix
jogar fora|phrase|throw away
pegar|v|take, grab, catch
deixar|v|leave; let
levantar|v|lift, raise
cheirar|v|smell
notar|v|notice
descobrir|v.u|discover|pp:descoberto
esconder|v|hide
esconder-se|v|hide
pescar|v|fish
treinar|v|train
patinar|v|skate
escalar|v|climb
passear|v|go for a walk
acampar|v|camp
relaxar|v|relax
aproveitar|v|enjoy; make the most of
gravar|v|record
depender|v|depend
existir|v|exist
cuidar|v|look after, take care of
sentir falta|phrase|miss (someone)
avisar|v|let know, warn
traduzir|v|translate
significar|v|mean
pronunciar|v|pronounce
corrigir|v|correct
errar|v|make a mistake
fazer aniversário|phrase|have a birthday
trepar|v|climb
lançar|v|throw
socar|v|punch
@2 people,family
neto|m~|grandson/granddaughter|per
sobrinho|m~|nephew/niece|per
sogro|m~|father-in-law/mother-in-law|per
cunhado|m~|brother-in-law/sister-in-law|per
casal|m|couple|per
colega|mf|classmate, colleague|per
convidado|m~|guest|per
desconhecido|m~|stranger|per
moço|m~|young man/young woman|per
rapaz|m|young man, guy|per
garoto|m~|boy/girl, kid|per
adulto|m~|adult|per
idoso|m~|elderly person|per
gêmeo|m~|twin|per
@2 work,people
advogado|m~|lawyer|per
engenheiro|m~|engineer|per
bombeiro|m~|firefighter|per
dono|m~|owner|per
cliente|mf|customer, client|per
turista|mf|tourist|per
funcionário|m~|employee|per
secretário|m~|secretary|per
pintor|m~|painter|per
motorista|mf|driver|per
piloto|mf|pilot|per
jornalista|mf|journalist|per
programador|m~|programmer|per
dentista|mf|dentist|per
carpinteiro|m~|carpenter|per
ferreiro|m~|blacksmith|per
relojoeiro|m~|watchmaker|per
barqueiro|m~|boatman|per
bibliotecário|m~|librarian|per
empresa|f|company, business
reunião|f|meeting|pl:reuniões
projeto|m|project
salário|m|salary
@2
coisa|f|thing
ideia|f|idea
problema|m|problem
verdade|f|truth|+
mentira|f|lie|-
razão|f|reason (ter razão: be right)|pl:razões
parte|f|part
forma|f|form, shape; way
jeito|m|way, manner
tipo|m|type, kind
exemplo|m|example
número|m|number
metade|f|half
grupo|m|group
história|f|story; history
notícia|f|news, piece of news
mensagem|f|message
e-mail|m|email
presente|m|gift, present|+
surpresa|f|surprise
ajuda|f|help
favor|m|favor
plano|m|plan
sonho|m|dream
vida|f|life
morte|f|death|-
paz|f|peace|+
guerra|f|war|-
fim|m|end
começo|m|beginning
centro|m|center, downtown
lado|m|side
fundo|m|bottom, back
ponto|m|point; dot
linha|f|line
conta|f|bill; account
lista|f|list
brinquedo|m|toy
@2 home
apartamento|m|apartment|place
andar#n|m|floor (story)
escada|f|stairs; ladder
chão|m|floor, ground
teto|m|ceiling; roof
telhado|m|roof
parede|f|wall
móvel|m|piece of furniture
sofá|m|sofa
armário|m|closet, cupboard
prateleira|f|shelf
espelho|m|mirror
cortina|f|curtain
travesseiro|m|pillow
lençol|m|sheet
toalha|f|towel
sabonete|m|soap
escova|f|brush
lixo|m|trash
geladeira|f|refrigerator
fogão|m|stove|pl:fogões
máquina de lavar|phrase|washing machine
colher|f|spoon
faca|f|knife
garfo|m|fork
panela|f|pot, pan
frigideira|f|frying pan
caixa|f|box
sacola|f|bag|alt:bolsa
mochila|f|backpack
guarda-chuva|m|umbrella
@2 clothes
saia|f|skirt
jaqueta|f|jacket
casaco|m|coat
blusa|f|blouse; sweater
meia|f|sock
bota|f|boot
cachecol|m|scarf
luva|f|glove
cinto|m|belt
óculos|mpl|glasses
anel|m|ring
colar|m|necklace
terno|m|suit
fantasia|f|costume; fantasy
uniforme|m|uniform
pijama|m|pajamas
@2 food
óleo|m|oil
pimenta|f|pepper
farinha|f|flour
alho|m|garlic
cenoura|f|carrot
alface|f|lettuce
pepino|m|cucumber
abacate|m|avocado
abacaxi|m|pineapple
melancia|f|watermelon
manga|f|mango
cereja|f|cherry
pêssego|m|peach
coco|m|coconut
presunto|m|ham
salsicha|f|sausage
hambúrguer|m|hamburger
sanduíche|m|sandwich
sobremesa|f|dessert
geleia|f|jam
iogurte|m|yogurt
receita|f|recipe
cardápio|m|menu
farofa|f|farofa (toasted manioc flour)
pudim|m|flan, pudding|pl:pudins
brigadeiro|m|brigadeiro (chocolate sweet)
pão de queijo|phrase|cheese bread
mandioca|f|cassava|alt:aipim,macaxeira
açaí|m|açaí
@2 health,body
pescoço|m|neck
ombro|m|shoulder
joelho|m|knee
unha|f|nail
lábio|m|lip
garganta|f|throat
sangue|m|blood
osso|m|bone
pele|f|skin
febre|f|fever
tosse|f|cough
gripe|f|flu
resfriado|m|cold (illness)
comprimido|m|pill
farmácia|f|pharmacy|place
ferida|f|wound
@2 town
supermercado|m|supermarket|place
padaria|f|bakery|place
hotel|m|hotel|place
universidade|f|university|place
faculdade|f|college|place
aeroporto|m|airport|place
porto|m|port, harbor|place
esquina|f|corner|place
estrada|f|road, highway|place
avenida|f|avenue|place
prédio|m|building|place
fábrica|f|factory|place
fazenda|f|farm|place
teatro|m|theater|place
academia|f|gym|place
piscina|f|swimming pool|place
estádio|m|stadium|place
cais|m|dock, pier|place
farol|m|lighthouse; headlight|place
fonte|f|fountain; source|place
@2 nature
grama|f|grass
galho|m|branch
raiz|f|root
semente|f|seed
rocha|f|rock
areia|f|sand
onda|f|wave
costa|f|coast|place
vale|m|valley|place
selva|f|jungle|place
deserto|m|desert|place
vulcão|m|volcano|place
natureza|f|nature
ar|m|air
fumaça|f|smoke
tempestade|f|storm
trovão|m|thunder|pl:trovões
raio|m|lightning; ray
neblina|f|fog
arco-íris|m|rainbow
clima|m|climate, weather
temperatura|f|temperature
grau|m|degree
@2 animal
bicho|m|animal, creature
pintinho|m|chick
touro|m|bull
cabra|f|goat
burro|m|donkey
lobo|m|wolf
leão|m|lion|pl:leões
tigre|m|tiger
macaco|m|monkey
elefante|m|elephant
girafa|f|giraffe
cobra|f|snake
aranha|f|spider
mosca|f|fly
mosquito|m|mosquito
formiga|f|ant
tartaruga|f|turtle
baleia|f|whale
golfinho|m|dolphin
tubarão|m|shark|pl:tubarões
águia|f|eagle
coruja|f|owl
papagaio|m|parrot
minhoca|f|worm
caracol|m|snail
`);
  LISTS.push(`
@2 time
janeiro|m|January
fevereiro|m|February
março|m|March
abril|m|April
maio|m|May
junho|m|June
julho|m|July
agosto|m|August
setembro|m|September
outubro|m|October
novembro|m|November
dezembro|m|December
primavera|f|spring
verão|m|summer|pl:verões
outono|m|autumn, fall
inverno|m|winter
meio-dia|m|noon
meia-noite|f|midnight
madrugada|f|early morning
data|f|date
calendário|m|calendar
século|m|century
passado|m|the past
futuro|m|the future
temporada|f|season
@2 school,language
matéria|f|school subject
matemática|f|math
ciência|f|science
geografia|f|geography
arte|f|art
educação física|phrase|PE, gym class
nota|f|grade; note
caneta|f|pen
borracha|f|eraser
régua|f|ruler
quadro|m|board; painting
dicionário|m|dictionary
frase|f|sentence, phrase
letra|f|letter; lyrics; handwriting
página|f|page
texto|m|text
conto|m|short story
romance|m|novel; romance
poesia|f|poetry
gramática|f|grammar
vocabulário|m|vocabulary
erro|m|mistake, error
francês|m|French (the language)
alemão|m|German (the language)|pl:alemães
chinês|m|Chinese (the language)
japonês|m|Japanese (the language)
@2 hobby,sport,music
basquete|m|basketball
vôlei|m|volleyball
tênis|m|tennis; sneakers
natação|f|swimming
corrida|f|race; running
partida|f|match, game; departure
time|m|team
jogador|m~|player|per
passatempo|m|hobby
videogame|m|video game
violão|m|acoustic guitar|pl:violões
guitarra|f|electric guitar
piano|m|piano
tambor|m|drum
violino|m|violin
flauta|f|flute
show|m|concert, show
banda|f|band
ritmo|m|rhythm
dança|f|dance
desenho|m|drawing; cartoon
pintura|f|painting
série|f|series, show
programa|m|program, show
passeio|m|walk, outing
cartas|fpl|cards (the game)
samba|m|samba
carnaval|m|carnival|pl:carnavais
@2 travel,transport
mala|f|suitcase
passaporte|m|passport
passagem|f|ticket (travel)|alt:bilhete
ingresso|m|ticket (event)
mapa|m|map
metrô|m|subway|transport
táxi|m|taxi|transport
caminhão|m|truck|pl:caminhões transport
moto|f|motorbike|transport
balsa|f|raft; ferry|transport
viajante|mf|traveler|per
turismo|m|tourism
voo|m|flight
saída|f|exit; departure
chegada|f|arrival
entrada|f|entrance
fronteira|f|border
endereço|m|address
direção|f|direction|pl:direções
@2 money,shop
cartão|m|card|pl:cartões
troco|m|change (money)
oferta|f|offer, sale
compra|f|purchase, shopping
caixa#per|mf|cashier; checkout|per
quilo|m|kilo
litro|m|liter
pedaço|m|piece
pacote|m|package
nota fiscal|phrase|receipt
@2 feeling
alegre|a|cheerful, happy|+
preocupado|a|worried|-
nervoso|a|nervous
animado|a|excited, lively|st +
assustado|a|scared|st -
surpreso|a|surprised|st
orgulhoso|a|proud|+
ciumento|a|jealous|-
apaixonado|a|in love|+
envergonhado|a|embarrassed|st -
saudade|f|longing, missing (estou com saudade: I miss)|
alegria|f|joy|+
tristeza|f|sadness|-
felicidade|f|happiness|+
emoção|f|emotion|pl:emoções
sentimento|m|feeling
risada|f|laugh|+
beijo|m|kiss|+
abraço|m|hug|+
@2
diferente|a|different
igual|a|same, equal
parecido|a|similar
próprio|a|own
único|a|only; unique
especial|a|special
normal|a|normal
estranho|a|strange, weird
esquisito|a|weird
típico|a|typical
perfeito|a|perfect|+
terrível|a|terrible|-
horrível|a|horrible|-
maravilhoso|a|wonderful|+
incrível|a|incredible, amazing|+
ótimo|a|great|+
excelente|a|excellent|+
fantástico|a|fantastic|+
gordo|a|fat
magro|a|thin, slim
forte|a|strong
fraco|a|weak
inteligente|a|intelligent|+
burro#adj|a|stupid|-
esperto|a|clever|+
trabalhador#adj|a|hard-working|+
preguiçoso|a|lazy|-
sério|a|serious
engraçado|a|funny|+
tímido|a|shy
corajoso|a|brave|+
generoso|a|generous|+
egoísta|a|selfish|-
educado|a|polite|+
grosso|a|rude; thick|-
paciente|a|patient|+
quieto|a|quiet, still
barulhento|a|noisy
perigoso|a|dangerous|-
seguro|a|safe; sure
possível|a|possible
impossível|a|impossible
necessário|a|necessary
útil|a|useful
inútil|a|useless
confortável|a|comfortable
claro#adj|a|clear; light (color)
escuro|a|dark
brilhante|a|bright, shiny
macio|a|soft
duro|a|hard
pesado|a|heavy
leve|a|light (weight)
largo|a|wide
estreito|a|narrow
fundo#adj|a|deep
molhado|a|wet|st
seco|a|dry
salgado|a|salty
picante|a|spicy|alt:apimentado
amargo|a|bitter
delicioso|a|delicious|+
fresco|a|fresh; cool
morno|a|lukewarm
antigo|a|old, ancient
moderno|a|modern
famoso|a|famous
popular|a|popular
público|a|public
particular|a|private
verdadeiro|a|true, real
falso|a|false, fake
certo|a|right, correct; certain
errado|a|wrong
seguinte|a|next, following
próximo|a|next; near
passado#adj|a|last (a semana passada)
inteiro|a|whole
meio#adj|a|half
dobro|m|double
@2 color
dourado|a|golden
prateado|a|silver
bege|a:bege=mf.s,bege=mf.p,beges=mf.p|beige
@2 place,people
Brasil|name|Brazil|country
Portugal|name|Portugal|country
Angola|name|Angola|country
Moçambique|name|Mozambique|country
Espanha|name|Spain|country
México|name|Mexico|country
Argentina|name|Argentina|country
Alemanha|name|Germany|country
França|name|France|country
Itália|name|Italy|country
Inglaterra|name|England|country
China|name|China|country
Japão|name|Japan|country
Estados Unidos|phrase|the United States|country
Canadá|name|Canada|country
brasileiro|a|Brazilian|nat
português#adj|a|Portuguese|nat
espanhol#adj|a|Spanish|nat f:espanhola
mexicano|a|Mexican|nat
argentino|a|Argentinian|nat
alemão#adj|a|German|nat pl:alemães
francês#adj|a|French|nat
italiano|a|Italian|nat
inglês#adj|a|English|nat
americano|a|American|nat
canadense|a|Canadian|nat
chinês#adj|a|Chinese|nat
japonês#adj|a|Japanese|nat
estrangeiro|a|foreign; foreigner|nat
carioca|a|from Rio de Janeiro|nat
paulista|a|from São Paulo (state)|nat
@2 tech
internet|f|internet
tela|f|screen
teclado|m|keyboard
câmera|f|camera
vídeo|m|video
rede|f|network; hammock
site|m|website
aplicativo|m|app|alt:app
bateria|f|battery; drums
carregador|m|charger
áudio|m|audio, voice message
figurinha|f|sticker
`);
  LISTS.push(`
@3
conquistar|v|achieve, win
desenvolver|v|develop
melhorar|v|improve, get better
piorar|v|get worse
aumentar|v|increase
diminuir|v|decrease
reduzir|v|reduce
produzir|v|produce
proteger|v|protect
poluir|v|pollute
reciclar|v|recycle
salvar|v|save, rescue
resgatar|v|rescue
oferecer|v|offer
agradecer|v|thank
merecer|v|deserve
pertencer|v|belong
desaparecer|v|disappear
aparecer|v|appear
reconhecer|v|recognize
obedecer|v|obey
sugerir|v.i|suggest
propor|v|propose
supor|v|suppose
imaginar|v|imagine
opinar|v|give an opinion
considerar|v|consider
duvidar|v|doubt
negar|v|deny
aceitar|v|accept|pp:aceito
recusar|v|refuse, turn down
discutir|v|argue; discuss
convencer|v|convince
permitir|v|allow
proibir|v|forbid, ban
obrigar|v|force, make (someone do)
prometer|v|promise
confiar|v|trust
reclamar|v|complain
alegrar-se|v|be glad
surpreender|v|surprise
assustar|v|scare
assustar-se|v|get scared
arrepender-se|v|regret
atrever-se|v|dare
acostumar-se|v|get used to
adaptar-se|v|adapt
transformar-se|v|turn into
tornar-se|v|become
evitar|v|avoid
impedir|v|prevent
suceder|v|happen; succeed
resultar|v|turn out
participar|v|take part
organizar|v|organize
planejar|v|plan
alcançar|v|reach
superar|v|overcome
vencer|v|win, defeat
fracassar|v|fail
sobreviver|v|survive
lutar|v|fight, struggle
brigar|v|fight, argue
defender|v|defend
escapar|v|escape
fugir|v.o|run away, flee
perseguir|v.i|chase
explorar|v|explore
pesquisar|v|research
investigar|v|investigate
inventar|v|invent; make up
projetar|v|design
destruir|v|destroy
investir|v.i|invest
contratar|v|hire
demitir|v|fire, dismiss
aposentar-se|v|retire
percorrer|v|travel around
apreciar|v|appreciate
valorizar|v|value
respeitar|v|respect
admirar|v|admire
criticar|v|criticize
votar|v|vote
apoiar|v|support
colaborar|v|collaborate
comunicar-se|v|communicate
expressar|v|express
descrever|v|describe|pp:descrito
informar|v|inform
anunciar|v|announce
advertir|v.i|warn
aconselhar|v|advise
recomendar|v|recommend
insistir|v|insist
mencionar|v|mention
comentar|v|comment
acrescentar|v|add
comparar|v|compare
demonstrar|v|show, prove
verificar|v|check
calcular|v|calculate
medir|v|measure
somar|v|add up
cansar|v|tire
cansar-se|v|get tired
emocionar|v|move, touch (emotionally)
cobrir|v.u|cover|pp:coberto
queimar|v|burn
ferver|v|boil
fritar|v|fry
misturar|v|mix
brilhar|v|shine
soar|v|sound
sussurrar|v|whisper
assobiar|v|whistle
tremer|v|shake, tremble
respirar|v|breathe
tossir|v.u|cough
espirrar|v|sneeze
suar|v|sweat
dobrar|v|fold; turn
machucar|v|hurt, injure
@3
sociedade|f|society
cultura|f|culture
tradição|f|tradition|pl:tradições
costume|m|custom, habit
comemoração|f|celebration|pl:comemorações
religião|f|religion|pl:religiões
política|f|politics; policy
governo|m|government
lei|f|law
direito|m|right; law (subject)
liberdade|f|freedom|+
justiça|f|justice
igualdade|f|equality
eleição|f|election|pl:eleições
nação|f|nation|pl:nações
cidadão|m~|citizen|per pl:cidadãos f:cidadã
comunidade|f|community
população|f|population|pl:populações
meio ambiente|phrase|the environment
poluição|f|pollution|pl:poluições -
reciclagem|f|recycling
energia|f|energy
planeta|m|planet
recurso|m|resource
perigo|m|danger|-
risco|m|risk
segurança|f|safety, security
doença|f|illness, disease|-
tratamento|m|treatment
dieta|f|diet
exercício|m|exercise
estresse|m|stress|-
descanso|m|rest, break
sucesso|m|success|+
fracasso|m|failure|-
meta|f|goal
objetivo|m|aim, goal
esforço|m|effort
oportunidade|f|opportunity|+
experiência|f|experience
conhecimento|m|knowledge
habilidade|f|skill
talento|m|talent
capacidade|f|ability, capacity
caráter|m|character|pl:caracteres
personalidade|f|personality
atitude|f|attitude
opinião|f|opinion|pl:opiniões
ponto de vista|phrase|point of view
conselho|m|advice
decisão|f|decision|pl:decisões
solução|f|solution|pl:soluções
dúvida|f|doubt
causa|f|cause
consequência|f|consequence
resultado|m|result
efeito|m|effect
diferença|f|difference
vantagem|f|advantage|+
desvantagem|f|disadvantage|-
relação|f|relationship|pl:relações
amizade|f|friendship|+
confiança|f|trust, confidence
respeito|m|respect
apoio|m|support
conflito|m|conflict|-
discussão|f|argument; discussion|pl:discussões
briga|f|fight|-
acordo|m|agreement
lembrança|f|memory; souvenir
memória|f|memory
infância|f|childhood
juventude|f|youth
adolescente|mf|teenager|per
geração|f|generation|pl:gerações
sentido|m|sense, meaning
significado|m|meaning
mente|f|mind
alma|f|soul
espírito|m|spirit
fé|f|faith
esperança|f|hope|+
desejo|m|wish, desire
pesadelo|m|nightmare|-
segredo|m|secret
mistério|m|mystery
aventura|f|adventure
destino|m|destination; fate
rota|f|route
paisagem|f|landscape
vista|f|view; sight
ambiente|m|atmosphere, environment
barulho|m|noise
som|m|sound
voz|f|voice
grito|m|shout, scream
canto|m|singing; corner
eco|m|echo
luz|f|light
sombra|f|shadow, shade
escuridão|f|darkness|-
beleza|f|beauty|+
força|f|strength, force
poder#n|m|power
magia|f|magic
feitiço|m|spell
lenda|f|legend
tesouro|m|treasure
diário|m|diary
@3 work,money
negócio|m|business, deal
indústria|f|industry
economia|f|economy
imposto|m|tax
dívida|f|debt
empréstimo|m|loan
entrevista|f|interview
currículo|m|CV, résumé
vaga|f|job opening; parking space
contrato|m|contract
horário|m|schedule
turno|m|shift
trampo|m|job, work (slang)
@3
responsável|a|responsible
honesto|a|honest|+
sincero|a|sincere|+
justo|a|fair|+
injusto|a|unfair|-
independente|a|independent
social|a|social
cultural|a|cultural
político|a|political
econômico|a|economic
natural|a|natural
artificial|a|artificial
ecológico|a|ecological
global|a|global
local|a|local
nacional|a|national
internacional|a|international
mundial|a|world, worldwide
atual|a|current, present-day
recente|a|recent
tradicional|a|traditional
comum|a=|common
frequente|a|frequent
grave|a|serious
enorme|a|huge
gigante|a|giant
mínimo|a|minimum
máximo|a|maximum
principal|a|main
básico|a|basic
simples|a=|simple
complicado|a|complicated
complexo|a|complex
confuso|a|confusing; confused
óbvio|a|obvious
provável|a|likely
capaz|a|capable, able
disposto|a|willing
preparado|a|prepared, ready
disponível|a|available
ausente|a|absent
satisfeito|a|satisfied|st +
decepcionado|a|disappointed|st -
frustrado|a|frustrated|st -
grato|a|grateful|+
impressionado|a|impressed|st
deprimido|a|depressed|st -
ansioso|a|anxious|-
estressado|a|stressed|st -
relaxado|a|relaxed|st +
esgotado|a|exhausted|st
farto|a|fed up|st -
saudável|a|healthy|+
vivo|a|alive; lively
morto|a|dead|st
acordado|a|awake|st
silencioso|a|silent, quiet
mágico|a|magic, magical
misterioso|a|mysterious
@3
realmente|adv|really
totalmente|adv|totally
completamente|adv|completely
absolutamente|adv|absolutely
provavelmente|adv|probably
possivelmente|adv|possibly
finalmente|adv|finally
imediatamente|adv|immediately
rapidamente|adv|quickly
lentamente|adv|slowly
facilmente|adv|easily
especialmente|adv|especially
geralmente|adv|generally, usually
normalmente|adv|normally, usually
atualmente|adv|currently, nowadays
ultimamente|adv|lately
recentemente|adv|recently
exatamente|adv|exactly
claramente|adv|clearly
frequentemente|adv|often
muitas vezes|phrase|often
em geral|phrase|in general
é que|phrase|the thing is
tem razão|phrase|(you’re) right
estar com fome|phrase|be hungry
estar com sede|phrase|be thirsty
estar com medo|phrase|be scared
estar com saudade|phrase|miss (someone, something)
ter vontade de|phrase|feel like (doing)
acabar de|phrase|have just (done)
voltar a|phrase|(do) again
deixar de|phrase|stop (doing)
estar prestes a|phrase|be about to
dar certo|phrase|work out
dar errado|phrase|go wrong
fazer questão|phrase|insist, make a point of
@3 home,food,health
ferramenta|f|tool
prego|m|nail (metal)
parafuso|m|screw
vassoura|f|broom
balde|m|bucket
vaso|m|vase; pot
gaveta|f|drawer
lâmpada|f|light bulb
tomada|f|socket, plug
lareira|f|fireplace
varanda|f|balcony, porch
quintal|m|backyard|pl:quintais
garagem|f|garage
porão|m|basement|pl:porões
sótão|m|attic|pl:sótãos
aluguel|m|rent|pl:aluguéis
mudança|f|change; move (house)
sabor|m|taste, flavor
cheiro|m|smell
ingrediente|m|ingredient
fatia|f|slice
molho|m|sauce
gorjeta|f|tip (money)
lanche|m|snack
cérebro|m|brain
pulmão|m|lung|pl:pulmões
músculo|m|muscle
testa|f|forehead
bochecha|f|cheek
sobrancelha|f|eyebrow
barba|f|beard
bigode|m|mustache
tornozelo|m|ankle
pulso|m|wrist; pulse
cotovelo|m|elbow
dor de cabeça|phrase|headache
consulta|f|appointment (doctor)
vacina|f|vaccine
cansaço|m|tiredness
lágrima|f|tear (crying)
@3 nature,animal,town
cachoeira|f|waterfall|place
poça|f|puddle
margem|f|bank, shore
cume|m|summit|place
geleira|f|glacier|place
pântano|m|swamp|place
geada|f|frost
granizo|m|hail
relâmpago|m|lightning
nascer do sol|phrase|sunrise
pôr do sol|phrase|sunset
furacão|m|hurricane|pl:furacões
terremoto|m|earthquake
esquilo|m|squirrel
veado|m|deer
foca|f|seal
pinguim|m|penguin
caranguejo|m|crab
polvo|m|octopus
pomba|f|dove, pigeon
gaivota|f|seagull
cisne|m|swan
semáforo|m|traffic light
calçada|f|sidewalk
quarteirão|m|block (street)|pl:quarteirões
ponto de ônibus|phrase|bus stop
trânsito|m|traffic
engarrafamento|m|traffic jam
recepção|f|reception|pl:recepções
bagagem|f|luggage
reserva|f|reservation
guia|mf|guide; guidebook|per
@3 media,tech,language
jornalismo|m|journalism
artigo|m|article
revista|f|magazine
anúncio|m|ad, announcement
propaganda|f|advertising
telejornal|m|TV news|pl:telejornais
canal|m|channel|pl:canais
emissora|f|station (radio, TV)
locutor|m~|announcer|per
ouvinte|mf|listener|per
leitor|m~|reader|per
autor|m~|author|per
personagem|mf|character (in a story)
capítulo|m|chapter
título|m|title
capa|f|cover
diálogo|m|dialogue
conversa|f|conversation
discurso|m|speech
sotaque|m|accent
tradução|f|translation|pl:traduções
fofoca|f|gossip
@4
desenvolvimento|m|development
pesquisa|f|research; survey
perspectiva|f|perspective
pensamento|m|thought
raciocínio|m|reasoning
argumento|m|argument; plot
hipótese|f|hypothesis
fenômeno|m|phenomenon
compromisso|m|commitment; appointment
responsabilidade|f|responsibility
desigualdade|f|inequality
pobreza|f|poverty|-
riqueza|f|wealth
bem-estar|m|well-being|+
crise|f|crisis|-
mudança climática|phrase|climate change
por conseguinte|phrase|consequently
em suma|phrase|in short
apesar de que|phrase|even though
contanto que|phrase|provided that
a menos que|phrase|unless
abordar|v|tackle, address
destacar|v|stand out; highlight
promover|v|promote
evoluir|v|evolve
surgir|v|arise
enfrentar|v|face
assumir|v|assume, take on
`);
  // (wave 2, the pt content helper, 2026-11-14: words the talk and reading content's answers need; Brazilian everyday words)
  LISTS.push(`
@1 food
goiaba|f|guava
maracujá|m|passion fruit
caju|m|cashew fruit
mamão|m|papaya
melão|m|melon
tangerina|f|tangerine
mexerica|f|tangerine (the everyday Brazilian word)
jabuticaba|f|jabuticaba (a dark berry that grows right on the tree trunk)
acerola|f|acerola (a small, sour red fruit)
kiwi|m|kiwi fruit
pastel|m|pastel (a fried pastry with a filling)
coxinha|f|coxinha (a fried snack filled with chicken)
pamonha|f|pamonha (sweet corn paste cooked in a corn husk)
canjica|f|canjica (a sweet white-corn pudding)
goiabada|f|guava paste
granulado|m|chocolate sprinkles
churrasco|m|barbecue
fubá|m|cornmeal
pavê|m|pavê (a layered cream dessert)
leite condensado|phrase|condensed milk
@1 drink
guaraná|m|guaraná (a Brazilian soft drink made from a berry)
limonada|f|lemonade
vitamina|f|smoothie (fruit blended with milk); vitamin
@1 people,family
vó|f|grandma (casual for avó)|per
vô|m|grandpa (casual for avô)|per
vovó|f|granny, grandma|per
vovô|m|grandpa|per
@1
parabéns|int|congratulations; happy birthday!
né|int|right? isn’t it? (= não é, at the end of a sentence)
hein|int|huh? eh? (at the end of a sentence)
alô|int|hello? (on the phone)
poxa|int|aw, gee
caramba|int|wow, gosh
tá#int|int|OK, all right (casual: «tá bom»; also short for «está»)
@1 hobby,sport
gibi|m|comic book
quadrinho|m|comic panel («quadrinhos»: comics)
boneca|f|doll
carrinho|m|toy car; little cart
brincadeira|f|game, play; joke
balão|m|balloon
piquenique|m|picnic
capoeira|f|capoeira (an Afro-Brazilian martial art, played to music)
ioga|f|yoga
judô|m|judo
amarelinha|f|hopscotch
@1 town,shop
feira|f|street market, open-air market
barraca|f|stall; tent
feirante|mf|stallholder (at a street market)|per
@1 nature,place
lagoa|f|pond, lagoon
@1 work,people
astronauta|mf|astronaut|per
@2
soltar|v|let go, release; fly (a kite: soltar pipa)
separar|v|separate; set aside
marcar|v|mark; leave a mark on; score
acertar|v|hit (a target); get right
decorar|v|decorate; learn by heart
animar|v|cheer up, liven up
continuar|v|continue, keep on
acabar|v|finish, end; run out
sumir|v.o|disappear, vanish
mexer|v|stir; move; touch
girar|v|turn, spin
juntar|v|put together, gather
costurar|v|sew
jurar|v|swear
pisar|v|step (on)
desabafar|v|get things off your chest, vent
gaguejar|v|stutter
remar|v|row
fundir|v|melt; cast (metal)
desgrudar|v|come unstuck, come away
esfriar|v|cool down
enrolar|v|roll (up); wrap
tropeçar|v|trip, stumble
aguentar|v|stand, bear, put up with
desistir|v|give up
enxergar|v|see, make out
experimentar|v|try (out); taste; try on
combinar|v|agree on, arrange; go together
desconfiar|v|suspect, be suspicious
fingir|v|pretend
pendurar|v|hang (up)
travar|v|lock; get stuck
coragem|f|courage|+
vergonha|f|shame; embarrassment (ter vergonha: be shy)|-
paciência|f|patience|+
solidão|f|loneliness|-
maravilha|f|wonder, marvel (que maravilha: how wonderful)|+
timidez|f|shyness
susto|m|fright, scare
regra|f|rule
turma|f|class; group of friends
pressa|f|hurry (estar com pressa: be in a hurry)
casamento|m|wedding; marriage
emprego|m|job
curso|m|course
dúzia|f|dozen
passo#n|m|step
povo|m|people, folk (a people)
região|f|region
interior|m|the countryside (in Brazil: anywhere away from the big cities); the inside
roça|f|the countryside, a small farm
sítio|m|small farm; website
capital|f|capital (city)
frente|f|front (na frente de: in front of)
atrás|adv|behind, at the back (atrás de: behind)
sinal|m|sign, signal
plástico|m|plastic
mina|f|mine
metal|m|metal
poeira|f|dust
lata|f|can, tin
beira|f|edge, bank, shore
culinária|f|cooking, cuisine
gorro|m|cap, beanie
peneira|f|sieve
redemoinho|m|whirlwind
trança|f|braid
quadrilha|f|quadrilha (the square dance of the June festival)
junino|a|of the June festival (festa junina)
fogueira|f|bonfire
sanfona|f|accordion
ginásio|m|gym, sports hall
quadra|f|court (for sports); block
apito|m|whistle
névoa|f|mist
cinzento|a|gray
forró|m|forró (a dance and music from Brazil’s Northeast)
pá|f|shovel; blade (of a windmill)
lama|f|mud
gaiola|f|cage
acampamento|m|camp
mineiro|m~|miner|per
moleiro|m|miller|per
sineiro|m|bell ringer|per
molde|m|mold
barro|m|clay; mud
fôlego|m|breath, stamina
lambari|m|lambari (a small river fish)
vara|f|rod, stick (vara de pescar: fishing rod)
pousada|f|inn, guesthouse
previsão|f|forecast (previsão do tempo: weather forecast)
cordel|m|cordel (folk poetry booklets, sold hanging on strings)
vaquinha|f|whip-round (everyone chips in; literally «little cow»)
casinha|f|little house
grandão|m|the big one, a huge one|pl:grandões
milhar|m|thousand (milhares: thousands)
ambos|det:ambos=m.p,ambas=f.p|both|quant
antigamente|adv|in the old days, long ago
breve|a=|brief (até breve: see you soon)
direto|a|direct, straight; live (on air)
colorido|a|colorful
mole|a=|soft; runny
ensolarado|a|sunny
travesso|a|naughty, mischievous
bem-vindo|a|welcome
quilômetro|m|kilometer
exigente|a=|demanding, strict
principalmente|adv|mainly, especially
fermento|m|yeast; baking powder
feijoada|f|feijoada (a black-bean stew with pork, Brazil’s Saturday dish)
dividir|v|divide; share
cansativo|a|tiring
equipe|f|team
túnel|m|tunnel
frito|a|fried
`);
  // DX-B2 (2026-11-26, the B2 dictionary helper): game/words_needed.txt's pt words (A2's letters and debates), then about
  // 1,000 B2 words by topic plus the B1 words that were missing. Brazilian Portuguese.
  LISTS.push(`
@1
ei|int|hey
ah|int|ah, oh
@2
novidade|f|news, something new (alguma novidade?: any news?)
convite|m|invitation
bobo|a|silly (ficar todo bobo: be touched, melt)
demorar|v|take (a long) time; be late
qualquer|det:qualquer=s,quaisquer=p|any, whichever|quant
certeza|f|certainty (ter certeza: be sure)
copiar|v|copy
correio|m|mail, post; post office
banho|m|bath, shower (tomar banho: take a shower)
recado|m|message (deixar recado: leave a message)
merenda|f|school snack or lunch
couve|f|kale, collard greens
educação|f|education; manners
plantar|v|plant
pouquinho|adv|a little bit (um pouquinho)
@3
coitado|a|poor thing (coitado!: poor thing!)
turnê|f|(music) tour
perceber|v|notice, realize
aplaudir|v|applaud, clap
motivo|m|reason, motive
motor|m|engine, motor
instrumento|m|instrument
máquina|f|machine (maquininha de cartão: card machine)
vestibular|m|university entrance exam
medicina|f|medicine (the field)
condicional|m|the conditional (grammar)
embarcar|v|board (a plane, a boat)
fotografar|v|photograph
erva|f|herb
freguês|m~|customer, regular (at a shop)|per
embalagem|f|packaging, wrapping
conteúdo|m|content, what’s inside
hóspede|mf|guest (at an inn or hotel)|per
comunitário|a|community (horta comunitária: community garden)
terreno|m|(empty) lot, plot of land; ground
molecada|f|the kids (casual)|coll
criançada|f|the kids (as a group)|coll
opção|f|option
mutirão|m|community work party (neighbors working together)
urgente|a|urgent
cedinho|adv|nice and early
agorinha|adv|just now; in a moment
pertinho|adv|really close
rapidinho|adv|real quick
`);
  LISTS.push(`
// work and careers
@4 work
desemprego|m|unemployment|-
greve|f|strike (from work)
sindicato|m|labor union
jornada|f|working day (jornada de trabalho)
hora extra|phrase|overtime
promoção|f|promotion; (store) sale
aumento|m|raise, increase
candidatura|f|application (for a job)
formação|f|training, education
capacitação|f|training
estágio|m|internship
bolsa|f|purse, bag; scholarship (bolsa de estudos)
ofício|m|trade, occupation
profissão|f|profession
aposentadoria|f|retirement; pension
demissão|f|dismissal; resignation
prazo|m|deadline; period, term
relatório|m|report
orçamento|m|budget; estimate (a quote)
desempenho|m|performance
produtividade|f|productivity
eficiência|f|efficiency
liderança|f|leadership
negociação|f|negotiation
trabalho remoto|phrase|remote work
filial|f|branch (of a company)
comércio|m|trade, commerce; shops
mercado de trabalho|phrase|job market
concorrência|f|competition
requisito|m|requirement
meio período|phrase|part-time
tempo integral|phrase|full-time
carteira de trabalho|phrase|work card (Brazil’s work record booklet)
@4 work,people
gerente|mf|manager|per
diretor|m~|director, manager; principal|per
supervisor|m~|supervisor|per
empresário|m~|businessman/businesswoman|per
empreendedor|m~|entrepreneur|per
trabalhador#n|m~|worker|per
técnico|m~|technician|per
mecânico|m~|mechanic|per
cirurgião|m~|surgeon|per f:cirurgiã pl:cirurgiões
psicólogo|m~|psychologist|per
especialista|mf|specialist|per
pesquisador|m~|researcher|per
cientista|mf|scientist|per
arquiteto|m~|architect|per
fotógrafo|m~|photographer|per
repórter|mf|reporter|per
correspondente|mf|correspondent|per
ator|m~|actor/actress|per f:atriz
escultor|m~|sculptor|per
compositor|m~|composer|per
encanador|m~|plumber|per
eletricista|mf|electrician|per
pedreiro|m|bricklayer, builder|per
juiz|m~|judge|per f:juíza pl:juízes
prefeito|m~|mayor|per
@4 people
candidato|m~|candidate|per
estagiário|m~|intern|per
@4 work
profissional|a=|professional
empresarial|a=|business, corporate
eficiente|a|efficient|+
eficaz|a=|effective|+
competitivo|a|competitive
qualificado|a|qualified, skilled
desempregado|a|unemployed
aposentado|a|retired
solicitar|v|apply for, request
candidatar-se|v|apply (for a job)
capacitar|v|train
empregar|v|employ; use
desempenhar|v|perform, carry out (a role)
exercer|v|practice (a profession); exercise
cobrar|v|charge; get paid
negociar|v|negotiate
competir|v.i|compete
exigir|v|demand, require
encarregar-se|v|be in charge of, take care of
ganhar a vida|phrase|earn a living
// money and shopping
@4 money,shop
poupança|f|savings; savings account
investimento|m|investment
lucro|m|profit
prejuízo|m|loss; damage
benefício|m|benefit
renda|f|income
despesa|f|expense
financiamento|m|financing, loan
hipoteca|f|mortgage
juros|mpl|interest (on money)
taxa|f|rate; fee
parcela|f|installment
tarifa|f|rate, fare
fatura|f|bill, invoice
boleto|m|payment slip (a bank bill)
conta bancária|phrase|bank account
cartão de crédito|phrase|credit card
dinheiro vivo|phrase|cash
caixa eletrônico|phrase|ATM
transferência|f|transfer
consumidor|m~|consumer|per
consumo|m|consumption
desconto|m|discount
liquidação|f|clearance sale
garantia|f|guarantee, warranty
devolução|f|return, refund
reembolso|m|refund
reclamação|f|complaint
marca|f|brand; mark
qualidade|f|quality
quantidade|f|amount, quantity
produto|m|product
serviço|m|service
entrega|f|delivery
encomenda|f|order; parcel
pedido|m|order; request
frete|m|shipping (cost)
shopping|m|shopping mall|place
provador|m|fitting room
fila|f|line, queue (fazer fila: wait in line)
gratuito|a|free (of charge)
financeiro|a|financial
bancário|a|bank, banking
comercial|a=|commercial
financiar|v|finance, fund
pechinchar|v|haggle
desperdiçar|v|waste
consumir|v.o|consume, use
entregar|v|deliver, hand in
encomendar|v|order (goods)
parcelar|v|pay in installments
pedir emprestado|phrase|borrow
`);
  LISTS.push(`
// health, the body and medicine
@3 health
exame|m|exam; (medical) test
@4 health
sintoma|m|symptom
diagnóstico|m|diagnosis
terapia|f|therapy
cirurgia|f|surgery
operação|f|operation
clínica|f|clinic|place
pronto-socorro|m|emergency room|place pl:prontos-socorros
ambulância|f|ambulance
dose|f|dose
xarope|m|syrup (medicine)
antibiótico|m|antibiotic
alergia|f|allergy
infecção|f|infection
vírus|m|virus
bactéria|f|bacterium, germ
epidemia|f|epidemic
pandemia|f|pandemic
contágio|m|contagion, infection
lesão|f|injury
fratura|f|fracture
hematoma|m|bruise
queimadura|f|burn
tontura|f|dizziness
enjoo|m|nausea; motion sickness
pressão|f|pressure (pressão alta: high blood pressure)
insônia|f|insomnia
ansiedade|f|anxiety|-
depressão|f|depression|-
saúde mental|phrase|mental health
nutrição|f|nutrition
alimentação|f|diet, eating
proteína|f|protein
gordura|f|fat
caloria|f|calorie
obesidade|f|obesity
peso|m|weight
gravidez|f|pregnancy
deficiência|f|disability
prevenção|f|prevention
raio-x|m|X-ray|pl:raios-x
injeção|f|injection, shot
recuperação|f|recovery
fadiga|f|fatigue
suor|m|sweat
coceira|f|itch
picada|f|bite, sting (insect)
plano de saúde|phrase|health insurance
primeiros socorros|phrase|first aid
@4 health,people
paciente#n|mf|patient (in a hospital)|per
@4 health,body
fígado|m|liver
rim|m|kidney
quadril|m|hip
coxa|f|thigh
peito|m|chest
cintura|f|waist
nervo|m|nerve
@4 health
alérgico|a|allergic
contagioso|a|contagious
tonto|a|dizzy|st
grávida|a|pregnant|st
sedentário|a|sedentary
crônico|a|chronic
agudo|a|sharp; acute; high-pitched
físico|a|physical
mental|a=|mental
emocional|a=|emotional
médico#adj|a|medical
curar|v|cure, heal
recuperar-se|v|recover
torcer|v|twist, sprain
desmaiar|v|faint
vacinar|v|vaccinate
receitar|v|prescribe
operar|v|operate (on)
contagiar|v|infect, pass on (an illness)
pesar|v|weigh
engordar|v|gain weight
emagrecer|v|lose weight
// the environment, nature and climate
@3 nature
enchente|f|flood
@4 nature,weather
aquecimento global|phrase|global warming
efeito estufa|phrase|greenhouse effect
emissão|f|emission
carbono|m|carbon
gás carbônico|phrase|carbon dioxide
combustível|m|fuel
petróleo|m|oil, petroleum
gasolina|f|gasoline
gás|m|gas
energia solar|phrase|solar energy
painel solar|phrase|solar panel
resíduo|m|waste (resíduos)
papelão|m|cardboard
desperdício|m|waste
sustentabilidade|f|sustainability
ecossistema|m|ecosystem
biodiversidade|f|biodiversity
espécie|f|species
extinção|f|extinction
em extinção|phrase|endangered
habitat|m|habitat
fauna|f|wildlife, fauna
flora|f|plant life, flora
desmatamento|m|deforestation
queimada|f|wildfire (set to clear land)
incêndio|m|fire (a building on fire, a wildfire)
incêndio florestal|phrase|forest fire
inundação|f|flood
seca|f|drought
desastre|m|disaster|-
catástrofe|f|catastrophe|-
desastre natural|phrase|natural disaster
atmosfera|f|atmosphere
camada de ozônio|phrase|ozone layer
oceano|m|ocean
polo|m|pole (o Polo Norte)
nível|m|level
nível do mar|phrase|sea level
água potável|phrase|drinking water
escassez|f|shortage, scarcity
pegada de carbono|phrase|carbon footprint
transporte público|phrase|public transportation
campanha|f|campaign
conscientização|f|awareness
conservação|f|conservation
dano|m|damage, harm
ameaça|f|threat|-
plantação|f|plantation, crop
agricultura|f|agriculture
pecuária|f|livestock farming
agrotóxico|m|pesticide
planície|f|plain|place
planalto|m|plateau|place
cordilheira|f|mountain range|place
recife|m|reef|place
mata|f|woods, forest|place
@4 people
ambientalista|mf|environmentalist|per
ativista|mf|activist|per
habitante|mf|inhabitant|per
@4 nature,weather
renovável|a|renewable
eólico|a|wind (energia eólica: wind power)
sustentável|a|sustainable|+
escasso|a|scarce
abundante|a|abundant
prejudicial|a=|harmful
tóxico|a|toxic
puro|a|pure
fértil|a=|fertile
árido|a|arid, dry
tropical|a=|tropical
selvagem|a|wild
ameno|a|mild
chuvoso|a|rainy
nublado|a|cloudy
orgânico|a|organic
agrícola|a=|agricultural
conservar|v|preserve, keep
preservar|v|preserve
danificar|v|damage
ameaçar|v|threaten
esgotar|v|use up, run out of
extinguir|v|put out (a fire); wipe out
habitar|v|inhabit, live in
reutilizar|v|reuse
conscientizar|v|raise awareness
derreter|v|melt
desmatar|v|cut down (forests)
`);
  LISTS.push(`
// technology and the internet
@3 tech
tecnologia|f|technology
informação|f|information
baixar|v|lower; download
apagar|v|delete, erase; turn off
digitar|v|type (on a keyboard)
clicar|v|click
@4 tech
dispositivo|m|device
aparelho|m|device, appliance
software|m|software
arquivo|m|file; archive
pasta|f|folder; paste
documento|m|document
perfil|m|profile
rede social|phrase|social network
redes sociais|phrase|social media
navegador|m|browser
buscador|m|search engine
link|m|link
download|m|download
publicação|f|publication; post
comentário|m|comment
conexão|f|connection
online|a=|online|alt:on-line
wi-fi|m|wifi
dados|mpl|data
banco de dados|phrase|database
inteligência|f|intelligence
inteligência artificial|phrase|artificial intelligence
robô|m|robot
algoritmo|m|algorithm
código|m|code
programação|f|programming
atualização|f|update
impressora|f|printer
tablet|m|tablet
notebook|m|laptop
armazenamento|m|storage
privacidade|f|privacy
assédio|m|harassment|-
notícias falsas|phrase|fake news
videochamada|f|video call
mensagem de texto|phrase|text message
tecla|f|key (on a keyboard)
clique|m|click
inovação|f|innovation
avanço|m|advance, breakthrough
eletricidade|f|electricity
tecnológico|a|technological
digital|a=|digital
virtual|a=|virtual
eletrônico|a|electronic
elétrico|a|electric
automático|a|automatic
inovador|a|innovative|+
sem fio|phrase|wireless
publicar|v|publish, post
postar|v|post (online)
inscrever-se|v|subscribe, sign up|pp:inscrito
conectar-se|v|connect, go online
desconectar-se|v|disconnect, go offline
programar|v|program; schedule
instalar|v|install
atualizar|v|update
reiniciar|v|restart
imprimir|v|print|pp:impresso
escanear|v|scan
navegar|v|sail; browse (the internet)
@4 tech,people
usuário|m~|user|per
seguidor|m~|follower|per
// news and media
@3 media
novela|f|soap opera (on TV)
@4 media
imprensa|f|the press
mídia|f|the media
manchete|f|headline
reportagem|f|report, feature (story)
redação|f|newsroom; essay
audiência|f|audience; ratings
censura|f|censorship|-
liberdade de expressão|phrase|freedom of speech
opinião pública|phrase|public opinion
enquete|f|poll
estatística|f|statistic, statistics
polêmica|f|controversy
escândalo|m|scandal|-
boato|m|rumor
acontecimento|m|event
evento|m|event
crônica|f|column, chronicle
documentário|m|documentary
episódio|m|episode
estreia|f|premiere, release
crítica|f|criticism; review
polêmico|a|controversial
subjetivo|a|subjective
imparcial|a=|impartial
confiável|a|reliable, trustworthy|+
crítico|a|critical
entrevistar|v|interview
redigir|v|write, draft
divulgar|v|spread, publicize
transmitir|v|broadcast
emitir|v|broadcast; issue
@4 media,people
espectador|m~|viewer, spectator|per
protagonista|mf|main character, protagonist|per
`);
  LISTS.push(`
// B1 words that were missing (some of them the game already used, read until now as bare quest words)
@2
madeira|f|wood
vidro|m|glass (the material)
ferro|m|iron
botão|m|button
roubar|v|steal, rob
desejar|v|wish, desire
carregar|v|carry; load; charge (a phone)
acender|v|light; turn on
regar|v|water (plants)
assar|v|bake, roast
@3
ação|f|action; share (of a company)
atividade|f|activity
atenção|f|attention
caso|m|case (em caso de: in case of)
controle|m|control; remote control
custo|m|cost
estado|m|state; condition
imagem|f|image, picture
maioria|f|majority
membro|m|member|per
modelo|m|model
movimento|m|movement
objeto|m|object
período|m|period
posição|f|position
prêmio|m|prize, award|+
resto|m|rest, remainder
tema|m|topic, subject, theme
uso|m|use
zona|f|zone, area
área|f|area
situação|f|situation
transporte|m|transportation
espaço|m|space; room
sistema|m|system
processo|m|process
gosto|m|taste (de bom gosto: in good taste)
assunto|m|subject, matter
fato|m|fact
valor|m|value; worth
tamanho|m|size
instante|m|instant, moment
versão|f|version
final#n|m|end; final (match)
sorriso|m|smile|+
piada|f|joke
promessa|f|promise
alarme|m|alarm
concurso|m|contest; civil service exam
companhia|f|company
possibilidade|f|possibility
imaginação|f|imagination
altura|f|height
buraco|m|hole
bandeira|f|flag
gota|f|drop
ninho|m|nest
culpa|f|fault, blame
orgulho|m|pride
perdão|m|forgiveness, pardon
alívio|m|relief|+
navio|m|ship
oficina|f|workshop; (car) repair shop
palco|m|stage
tinta|f|paint; ink
roda|f|wheel
colheita|f|harvest
abrigo|m|shelter
tecido|m|fabric; tissue
@3 people
presidente|m~|president|per f:presidenta
testemunha|f|witness|per
visitante|mf|visitor|per
@3
completo|a|complete, full
humano|a|human
quadrado|a|square
ideal|a=|ideal
elegante|a|elegant
total|a=|total
positivo|a|positive|+
negativo|a|negative|-
exato|a|exact
real|a=|real; royal
geral|a=|general
final|a=|final, last
suficiente|a|enough, sufficient
cuidadoso|a|careful
pálido|a|pale
redondo|a|round
fino|a|thin, fine
úmido|a|damp, humid
torto|a|crooked
mal-educado|a|rude, bad-mannered|-
apertado|a|tight, cramped
manter|v|maintain, keep
obter|v|obtain, get
afetar|v|affect
assistir|v|watch (TV, a game); attend
confirmar|v|confirm
durar|v|last
incluir|v|include
revisar|v|review, check
utilizar|v|use
assinar|v|sign; subscribe
sofrer|v|suffer
guiar|v|guide
varrer|v|sweep
enfeitar|v|decorate
abandonar|v|abandon, leave
enterrar|v|bury
afundar|v|sink
secar|v|dry
congelar|v|freeze
colar|v|glue, stick; copy (on a test)
adivinhar|v|guess
cavar|v|dig
abaixar|v|lower; bend down
afastar-se|v|move away
descarregar|v|unload
descascar|v|peel
a partir de|phrase|starting from
em caso de|phrase|in case of
ser humano|phrase|human being
@4
minoria|f|minority
multidão|f|crowd
busca|f|search
superfície|f|surface
profundidade|f|depth
corrente|f|current; chain
reflexo|m|reflection; reflex
coroa|f|crown
troféu|m|trophy
ruína|f|ruin
horizonte|m|horizon
gratidão|f|gratitude|+
pânico|m|panic|-
nostalgia|f|nostalgia
firme|a|firm, steady
teimoso|a|stubborn
magnífico|a|magnificent|+
transparente|a|transparent
faminto|a|starving, hungry
íngreme|a|steep
escorregadio|a|slippery
movimentado|a|busy, lively
empoeirado|a|dusty
imóvel|a=|still, motionless
luminoso|a|bright, full of light
aliviado|a|relieved|st +
exterior|a=|exterior, outside; foreign
superior|a=|upper; higher; superior
inferior|a=|lower; inferior
mensal|a=|monthly
semanal|a=|weekly
anual|a=|yearly, annual
atender|v|answer (the phone); serve, attend to
estender|v|extend, spread
distinguir|v|distinguish
eliminar|v|eliminate, remove
formar|v|form, shape; train
identificar|v|identify
indicar|v|indicate, show
ocupar|v|occupy, take up
realizar|v|carry out; fulfill
relacionar|v|relate, connect
representar|v|represent; perform
temer|v|fear
corresponder|v|correspond
bastar|v|be enough
anotar|v|note down
possuir|v|own, possess
reconstruir|v|rebuild
florescer|v|bloom, flourish
brotar|v|sprout, spring up
sarar|v|heal, get better
desabar|v|collapse
pingar|v|drip
deslizar|v|slide, glide
recuar|v|move back, back down
rachar|v|crack, split
semear|v|sow
remendar|v|patch, mend
afiar|v|sharpen
evaporar|v|evaporate
transbordar|v|overflow
`);
  LISTS.push(`
// society and community (local government, rights, volunteering)
@3 home
lar|m|home, household
@4
município|m|municipality, town
prefeitura|f|city hall|place
câmara municipal|phrase|city council
cidadania|f|citizenship
direitos humanos|phrase|human rights
dever#n|m|duty
obrigação|f|obligation
voluntariado|m|volunteering, volunteer work
organização|f|organization
associação|f|association
fundação|f|foundation
caridade|f|charity
doação|f|donation
solidariedade|f|solidarity|+
discriminação|f|discrimination|-
racismo|m|racism|-
preconceito|m|prejudice|-
tolerância|f|tolerance|+
diversidade|f|diversity
inclusão|f|inclusion
imigração|f|immigration
integração|f|integration
convivência|f|living together, getting along
moradia|f|housing, home
manifestação|f|demonstration, protest
protesto|m|protest
participação|f|participation
voto|m|vote
autoridade|f|authority
instituição|f|institution
serviço público|phrase|public service
qualidade de vida|phrase|quality of life
infraestrutura|f|infrastructure
solidário|a|caring, supportive|+
tolerante|a|tolerant|+
municipal|a=|municipal, city
doar|v|donate
discriminar|v|discriminate
emigrar|v|emigrate
conviver|v|live together, get along
protestar|v|protest; complain
@4 people
voluntário|m~|volunteer|per
imigrante|mf|immigrant|per
refugiado|m~|refugee|per
vereador|m~|city council member|per
// everyday law (contracts, fines, permits)
@4
crime|m|crime|-
criminalidade|f|crime (in general)|-
assalto|m|robbery, mugging|-
roubo|m|theft, robbery|-
furto|m|theft (without violence)|-
denúncia|f|report (to the police), complaint
multa|f|fine (to pay)
licença|f|permission; license; leave
carteira de motorista|phrase|driver’s license
assinatura|f|signature; subscription
julgamento|m|trial; judgment
tribunal|m|court
castigo|m|punishment
punição|f|punishment, penalty
norma|f|rule, standard
regulamento|m|regulations
burocracia|f|bureaucracy, paperwork
formulário|m|form (to fill in)
identidade|f|identity; ID card
carteira de identidade|phrase|ID card
residência|f|residence; residency
visto|m|visa
seguro#n|m|insurance
depósito|m|deposit; warehouse
caução|f|security deposit
cláusula|f|clause
estacionamento|m|parking lot|place
excesso de velocidade|phrase|speeding
ilegal|a=|illegal|-
culpado|a|guilty|-
inocente|a|innocent
obrigatório|a|compulsory, required
denunciar|v|report (a crime), denounce
multar|v|fine
processar|v|sue; process
acusar|v|accuse
castigar|v|punish
punir|v|punish
estacionar|v|park
@4 people
criminoso|m~|criminal|per
ladrão|m~|thief|per f:ladra pl:ladrões
vítima|f|victim|per
inquilino|m~|tenant|per
proprietário|m~|owner, landlord|per
// education and science
@4 school
ensino|m|teaching, education
aprendizagem|f|learning
ensino fundamental|phrase|elementary and middle school
ensino médio|phrase|high school
graduação|f|undergraduate degree
mestrado|m|master’s degree
doutorado|m|doctorate, PhD
diploma|m|diploma
campus|m|campus
matrícula|f|enrollment
mensalidade|f|monthly (school) fee
anotações|fpl|(class) notes
resumo|m|summary
tese|f|thesis
média|f|average
semestre|m|semester
palestra|f|lecture, talk
debate|m|debate
método|m|method
teoria|f|theory
experimento|m|experiment
laboratório|m|laboratory|place
descoberta|f|discovery
conclusão|f|conclusion
evidência|f|evidence
fórmula|f|formula
cálculo|m|calculation
química|f|chemistry
física|f|physics
biologia|f|biology
filosofia|f|philosophy
literatura|f|literature
psicologia|f|psychology
informática|f|computer science
engenharia|f|engineering
conceito|m|concept
definição|f|definition
universo|m|universe
galáxia|f|galaxy
célula|f|cell (biology)
evolução|f|evolution
acadêmico|a|academic
escolar|a=|school (vida escolar: school life)
universitário|a|university, college
educativo|a|educational
intelectual|a=|intellectual
científico|a|scientific
matricular-se|v|enroll
memorizar|v|memorize
analisar|v|analyze
concluir|v|conclude
definir|v|define
debater|v|debate
argumentar|v|argue (make a case)
deduzir|v|deduce
@4 school,people
tutor|m~|tutor|per
`);
  LISTS.push(`
// arguing and explaining: the linking phrases and adverbs
@3
por causa de|phrase|because of
@4
em primeiro lugar|phrase|first of all, in the first place
em segundo lugar|phrase|secondly
por último|phrase|finally, lastly
por um lado|phrase|on the one hand
por outro lado|phrase|on the other hand
em conclusão|phrase|in conclusion
em resumo|phrase|in short, to sum up
devido a|phrase|due to, because of
uma vez que|phrase|since, given that
visto que|phrase|given that, since
dado que|phrase|given that
a fim de|phrase|in order to
de modo que|phrase|so (that)
de maneira que|phrase|so (that)
caso contrário|phrase|otherwise
a não ser que|phrase|unless
sem que|phrase|without (+ subjunctive)
antes que|phrase|before (+ subjunctive)
quanto a|phrase|as for, regarding
em relação a|phrase|regarding, in relation to
com relação a|phrase|with regard to
no lugar de|phrase|instead of
do meu ponto de vista|phrase|from my point of view
a meu ver|phrase|in my view
de modo geral|phrase|generally
em particular|phrase|in particular
a longo prazo|phrase|in the long run
a curto prazo|phrase|in the short term
hoje em dia|phrase|nowadays
de qualquer forma|phrase|anyway
de qualquer jeito|phrase|anyway
em todo caso|phrase|in any case
afinal de contas|phrase|after all
pelo contrário|phrase|on the contrary
nem sequer|phrase|not even
mais ou menos|phrase|more or less
raramente|adv|rarely
igualmente|adv|equally; likewise
obviamente|adv|obviously
evidentemente|adv|evidently, obviously
aparentemente|adv|apparently
supostamente|adv|supposedly
precisamente|adv|precisely
praticamente|adv|practically
relativamente|adv|relatively
extremamente|adv|extremely
basicamente|adv|basically
unicamente|adv|only, solely
simplesmente|adv|simply
diretamente|adv|directly
pessoalmente|adv|personally
sinceramente|adv|honestly, sincerely
francamente|adv|frankly
definitivamente|adv|definitely
constantemente|adv|constantly
anteriormente|adv|previously
posteriormente|adv|later, afterwards
gradualmente|adv|gradually
aproximadamente|adv|approximately
// abstract ideas
aspecto|m|aspect; appearance
fator|m|factor
elemento|m|element
questão|f|question, issue
condição|f|condition
circunstância|f|circumstance
contexto|m|context
realidade|f|reality
critério|m|criterion
crença|f|belief
ética|f|ethics
dignidade|f|dignity
privilégio|m|privilege
influência|f|influence
impacto|m|impact
origem|f|origin
propósito|m|purpose
intenção|f|intention
conquista|f|achievement; conquest|+
desafio|m|challenge
obstáculo|m|obstacle
dificuldade|f|difficulty
tendência|f|tendency, trend
hábito|m|habit
rotina|f|routine
transformação|f|transformation
estrutura|f|structure
característica|f|characteristic, feature
defeito|m|flaw, defect
virtude|f|virtue|+
inconveniente|m|drawback, problem
prioridade|f|priority
necessidade|f|need, necessity
alternativa|f|alternative
proposta|f|proposal
desacordo|m|disagreement
equilíbrio|m|balance
harmonia|f|harmony|+
caos|m|chaos
ordem|f|order (tidiness, sequence); command
desordem|f|mess, disorder
tranquilidade|f|calm, peace and quiet|+
@3 feeling
raiva|f|anger|-
@4 feeling
autoestima|f|self-esteem
estado de espírito|phrase|mood
ânimo|m|spirit, mood; encouragement
humor|m|humor; mood
temor|m|fear|-
angústia|f|anguish, distress|-
ciúme|m|jealousy (ciúmes)|-
satisfação|f|satisfaction|+
decepção|f|disappointment|-
frustração|f|frustration|-
entusiasmo|m|enthusiasm|+
paixão|f|passion
curiosidade|f|curiosity
admiração|f|admiration
empatia|f|empathy|+
compaixão|f|compassion|+
insegurança|f|insecurity|-
motivação|f|motivation
inspiração|f|inspiration
`);
  LISTS.push(`
// feelings, opinions and judgments: adjectives
@4 feeling
angustiado|a|distressed|st -
sobrecarregado|a|overwhelmed|st -
desanimado|a|discouraged|st -
otimista|a|optimistic|+
pessimista|a|pessimistic|-
compreensivo|a|understanding|+
sensível|a|sensitive
sensato|a|sensible|+
maduro|a|mature; ripe
imaturo|a|immature|-
respeitoso|a|respectful|+
humilde|a|humble|+
arrogante|a|arrogant|-
ambicioso|a|ambitious
leal|a|loyal|+
fiel|a|faithful, loyal|+
irresponsável|a|irresponsible|-
@4
realista|a|realistic
razoável|a|reasonable
lógico|a|logical
coerente|a|coherent, consistent
equilibrado|a|balanced
flexível|a|flexible
digno|a|worthy, dignified
valioso|a|valuable|+
essencial|a=|essential
fundamental|a=|fundamental
imprescindível|a|essential, indispensable
relevante|a|relevant
significativo|a|significant
considerável|a|considerable
notável|a|remarkable, notable
adequado|a|suitable, appropriate
apropriado|a|appropriate
conveniente|a|convenient, advisable
favorável|a|favorable|+
absurdo|a|absurd|-
ridículo|a|ridiculous|-
inevitável|a|inevitable
inesperado|a|unexpected
previsível|a|predictable
surpreendente|a|surprising
impressionante|a|impressive|+
emocionante|a|exciting; moving|+
comovente|a|moving, touching
preocupante|a|worrying|-
alarmante|a|alarming|-
delicado|a|delicate, sensitive
abstrato|a|abstract
concreto|a|concrete, specific
específico|a|specific
preciso|a|precise; necessary
autêntico|a|authentic
original|a=|original
habitual|a=|usual
cotidiano|a|everyday, daily
semelhante|a|similar
similar|a=|similar
oposto|a|opposite
contrário|a|contrary, opposite
mútuo|a|mutual
alheio|a|someone else’s; unaware of
individual|a=|individual
coletivo|a|collective
íntimo|a|intimate, close
pessoal|a=|personal, private
// arguing, explaining and feeling: verbs
@3
concordar|v|agree
discordar|v|disagree
@4
sustentar|v|hold, maintain (an opinion); support
afirmar|v|state, claim
admitir|v|admit
esclarecer|v|clarify
justificar|v|justify
persuadir|v|persuade
influenciar|v|influence
questionar|v|question
refletir|v.i|reflect, think it over
avaliar|v|evaluate, assess
julgar|v|judge
interpretar|v|interpret; perform
exagerar|v|exaggerate
opor-se|v|oppose, be against
favorecer|v|favor, benefit
prejudicar|v|harm, damage
beneficiar|v|benefit
garantir|v|guarantee
assegurar|v|ensure; assure
comprometer-se|v|commit (oneself)
implicar|v|imply, involve
consistir|v|consist (consistir em: consist of)
contribuir|v|contribute
provocar|v|cause, provoke
causar|v|cause
gerar|v|generate
fortalecer|v|strengthen
enfraquecer|v|weaken
ampliar|v|expand, widen
limitar|v|limit
controlar|v|control
estabelecer|v|establish, set up
solucionar|v|solve
tolerar|v|tolerate
suportar|v|stand, put up with
arriscar|v|risk, take a chance
@4 feeling
desanimar|v|lose heart; discourage
emocionar-se|v|be moved, get emotional
ofender|v|offend
ofender-se|v|take offense
envergonhar-se|v|be ashamed
confessar|v|confess
lamentar|v|regret, be sorry about
invejar|v|envy
desprezar|v|despise
ignorar|v|ignore; not know
enganar|v|deceive, cheat
trair|v|betray
decepcionar|v|disappoint
impressionar|v|impress
comover|v|move (emotionally)
inspirar|v|inspire
motivar|v|motivate
desafiar|v|challenge, defy
`);
  LISTS.push(`
// travel, culture and the arts
@3
trocar|v|exchange, swap; change
@4 travel
roteiro|m|itinerary; script
hospedagem|f|accommodation, lodging
albergue|m|hostel|place
atraso|m|delay
escala|f|stopover; scale
alfândega|f|customs
embaixada|f|embassy|place
cruzeiro|m|cruise
percurso|m|route, course
patrimônio|m|heritage
monumento|m|monument|place
catedral|f|cathedral|place
castelo|m|castle|place
palácio|m|palace|place
reservar|v|book, reserve
cancelar|v|cancel
atrasar-se|v|be late, be delayed
turístico|a|tourist
pitoresco|a|picturesque|+
histórico|a|historic, historical
exótico|a|exotic
inesquecível|a|unforgettable|+
aconchegante|a|cozy, welcoming|+
@4 travel,people
mochileiro|m~|backpacker|per
@4 art
exposição|f|exhibition
obra|f|work (of art, of literature); construction work
obra de arte|phrase|work of art
peça de teatro|phrase|play
obra-prima|f|masterpiece|pl:obras-primas
retrato|m|portrait
estilo|m|style
criatividade|f|creativity|+
arquitetura|f|architecture
design|m|design
fotografia|f|photography; photograph
espetáculo|m|show, spectacle
apresentação|f|performance; presentation
cena|f|scene
cenário|m|set, scenery; setting
atuação|f|performance; acting
gênero|m|genre; gender; kind
enredo|m|plot
artesanato|m|crafts, handicrafts
folclore|m|folklore
festival|m|festival
desfile|m|parade
herança|f|heritage; inheritance
intercâmbio|m|exchange (studying abroad)
artístico|a|artistic
clássico|a|classic, classical
contemporâneo|a|contemporary
bilíngue|a|bilingual
atuar|v|act; perform
compor|v|compose
expor|v|exhibit; expose
@4 art,people
poeta|m~|poet|per f:poetisa
romancista|mf|novelist|per
narrador|m~|narrator|per
artesão|m~|craftsman/craftswoman|per f:artesã pl:artesãos
@4 music
orquestra|f|orchestra
// housing and city life
@4 home
elevador|m|elevator
aquecimento|m|heating
ar-condicionado|m|air conditioning|pl:ares-condicionados
manutenção|f|maintenance
reforma|f|renovation; reform
construção|f|construction; building
colega de quarto|phrase|roommate
metro quadrado|phrase|square meter
mobiliado|a|furnished
espaçoso|a|spacious
central|a=|central
caseiro|a|homemade
reformar|v|renovate
localizar|v|locate
localizar-se|v|be located
porteiro|m~|doorman|per
@4 town
centro histórico|phrase|historic center
periferia|f|outskirts
área verde|phrase|green space
faixa de pedestres|phrase|crosswalk
rotatória|f|traffic circle
ciclovia|f|bike lane
arranha-céu|m|skyscraper|pl:arranha-céus
@4
urbano|a|urban
rural|a=|rural
inseguro|a|unsafe; insecure|-
iluminação|f|lighting
lixeira|f|trash can
poste|m|lamppost
campainha|f|doorbell
pedestre|mf|pedestrian|per
// basics that were missing
@2
estômago|m|stomach
diversão|f|fun, entertainment
@3
reunir|v|gather, bring together
reunir-se|v|meet, get together
@2 time
Natal|m|Christmas
Páscoa|f|Easter
`);
  // DX-B2, round 2 (2026-11-27): words_needed.txt's pt words (the LIFE jobs, the club books, the quiz show's kit, the radio
  // serial and the paper)
  LISTS.push(`
@1
ih|int|oh (sympathy)
opa|int|oops; oh!
@2
devagar|adv|slowly
buscar|v|fetch, pick up; look for
par|m|pair (um par de: a pair of)
longo|a|long
vontade|f|wish, desire (ter vontade de: feel like)
muro|m|(outside) wall
curioso|a|curious; odd
graça|f|grace; fun (achar graça: find funny; de graça: free; uma graça: lovely)
de graça|phrase|free (of charge)
chuveiro|m|shower
detalhe|m|detail
polícia|f|police
galo|m|rooster
clube|m|club
dica|f|tip, hint
desculpas|fpl|apology, apologies (pedir desculpas: apologize)
saco|m|bag, sack
cesta|f|basket
inseto|m|insect
ave|f|bird
circo|m|circus
bosque|m|woods
grátis|a=|free (of charge)
época|f|time, era (na época: back then)
ligação|f|(phone) call
partir|v|leave; split, break
caber|v|fit
colher#v|v|pick (fruit), harvest
sétimo|a|seventh
oitavo|a|eighth
nono|a|ninth
gente boa|phrase|a good sort, a nice person (ele é gente boa)
@3
balcão|m|counter (in an office or a shop)
boletim|m|bulletin
infantil|a=|children’s (o time infantil)
telescópio|m|telescope
microfone|m|microphone
ajeitar|v|fix up, tidy (dar uma ajeitada: give it a little polish)
clareza|f|clarity (com clareza: clearly)
unir|v|unite, bring together
píer|m|pier
hospedar|v|host, put up
hospedar-se|v|stay (at an inn or a hotel)
corredor|m|corridor, hall; runner
indireto|a|indirect (discurso indireto: reported speech)
delícia|f|delight; something delicious (uma delícia!)
adotar|v|adopt
adoção|f|adoption («para adoção»: up for adoption)
cartaz|m|poster
diante|adv|in front (daqui em diante: from now on)
daqui em diante|phrase|from now on
trás|adv|behind (para trás: back, backwards)
para trás|phrase|back, backwards
acalmar|v|calm (down)
anterior|a=|previous (a noite anterior: the night before)
sobrar|v|be left over
emergência|f|emergency
listrado|a|striped
preso|a|stuck, shut in; arrested
agência|f|agency
perda|f|loss (perda de tempo: waste of time)
sensação|f|feeling, sensation
importância|f|importance
confundir|v|confuse, mix up
invenção|f|invention
abanar|v|wag (a tail); fan
aceso|a|lit, switched on
agasalhar-se|v|wrap up warm
aproximar|v|bring closer
aproximar-se|v|come closer
armar|v|put up (a tent); arm
balanço|m|swing (in a playground); balance
bezerro|m|calf
bingo|m|bingo
buzina|f|horn (of a bike or a car)
cantarolar|v|hum
cargo|m|position, post (a seat on a council)
cima|adv|top (em cima de: on top of; de cima: from above)
cozido|a|boiled, cooked
curva|f|bend, curve
enfim|adv|at last; in short (até que enfim: at last!)
ensaio|m|rehearsal; essay
espiar|v|peek, spy
garça|f|heron
latir|v|bark
leitura|f|reading
limpeza|f|cleanup, cleaning
maratona|f|marathon
morador|m~|resident|per
perfeitamente|adv|perfectly
plateia|f|audience
pomar|m|orchard
aos pouquinhos|phrase|little by little
rasgar|v|tear
recolher|v|pick up, collect
refrescar|v|cool down, refresh
representante|mf|representative|per
roda-gigante|f|Ferris wheel|pl:rodas-gigantes
tapar|v|cover, block
testar|v|test, try out
vencedor|m~|winner|per
ventar|v|be windy (está ventando: it’s windy)
vitrine|f|shop window
antena|f|antenna
apontar|v|point (to)
atrapalhar|v|get in the way of, mess up
baixinho#adv|adv|very softly, quietly
barbearia|f|barbershop|place
barbeiro|m|barber|per
binóculo|m|binoculars
colecionar|v|collect
palavras cruzadas|phrase|crossword
cuco|m|cuckoo (relógio de cuco: cuckoo clock)
ensaiar|v|rehearse
filhote|m|young animal; puppy, kitten, chick
fio|m|wire; thread
manual|m|manual
miar|v|meow
montar|v|set up, build; ride (a horse)
novelo|m|ball of yarn
prestar|v|be any good (prestar atenção: pay attention)
prestar atenção|phrase|pay attention
abóbora|f|pumpkin
aprovar|v|approve; pass (an exam)
atlas|m|atlas
cercar|v|fence off, surround
cheiro-verde|m|fresh herbs (parsley and spring onion)
consultório|m|(doctor’s or vet’s) office|place
debaixo|adv|underneath (debaixo de: under)
debaixo de|phrase|under
distância|f|distance
edição|f|edition
escorregador|m|slide (in a playground)
escorregar|v|slip, slide
estrelado|a|starry
galinheiro|m|chicken coop
lesma|f|slug
observar|v|watch, observe
pagamento|m|payment
perdoar|v|forgive
preferência|f|preference (de preferência: ideally)
pátio|m|courtyard, schoolyard
rabanete|m|radish
recontar|v|retell
resumir|v|sum up
salão|m|hall
sugestão|f|suggestion
vendinha|f|corner store|place
@3 people
capitão|m~|captain|per f:capitã pl:capitães
organizador|m~|organizer|per
ajudante|mf|helper, assistant|per
detetive|mf|detective|per
agricultor|m~|farmer|per
criador|m~|breeder; creator|per
iniciante|mf|beginner|per
parceiro|m~|partner|per
veterinário|m~|vet|per
@4
enxurrada|f|torrent (of rainwater)
generosidade|f|generosity|+
meio-termo|m|middle ground|pl:meios-termos
pelúcia|f|plush (de pelúcia: stuffed)
amarelado|a|yellowed
desmontado|a|taken apart, in pieces
encerrado|a|closed, finished (caso encerrado: case closed)
frequência|f|frequency
radionovela|f|radio drama
solda|f|solder (ferro de solda: soldering iron)
transmissor|m|transmitter
astronomia|f|astronomy
constelação|f|constellation
coruja-buraqueira|f|burrowing owl|pl:corujas-buraqueiras
olheira|f|dark circle (under the eyes)
partitura|f|sheet music
plantio|m|planting
cruzar|v|cross
palavras cruzadas|phrase|crossword (puzzle)
@4 people
astrônomo|m~|astronomer|per
`);
  // words the Meridiana chapter used (words_needed.txt, 2026-11-28)
  LISTS.push(`
@1
hum|int|hmm
ufa|int|phew
@2
bonde|m|tram, streetcar
prazer|m|pleasure (Prazer!: nice to meet you; com prazer: gladly)
plataforma|f|(train) platform
recibo|m|receipt
aviso|m|notice
saldo|m|balance (of an account, a card)
@3
prontinho|a|all set, ready (a diminutive of pronto)
esquerdo|a|left (do lado esquerdo)
guichê|m|(service) window, counter
vibração|f|vibration
chaleira|f|kettle
recarregar|v|top up; recharge
consultar|v|check, look up; consult
recarga|f|top-up
ativar|v|activate
admissão|f|admission
interno|a|internal
lanchonete|f|snack bar, café
palma|f|palm; a clap (bater uma palma)
reparar|v|notice (nem reparei)
inaugural|a=|opening, inaugural (aula inaugural)
doméstico|a|household (utilidades domésticas)
peixaria|f|fish shop
auditório|m|auditorium, lecture hall
empilhar|v|stack, pile up
estimação|f|(animal de estimação: pet)
@3 people
passageiro|m~|passenger|per
senhorita|f|miss (a young woman, formal)|per
acompanhante|mf|companion|per
`);
  const spec = {
    lang: 'pt', lists: LISTS, entry, forms, expand, prior, score, callVerb: 'chamar-se',
    context: (W, P) => ROM.context(W, P, R),
    summary: (a, W, P) => ROM.summary(a, W, P, R),
    check: (a, opts, P) => ROM.check(a, opts, P, R),
    describe, enGloss, inflect, numbers,
    connectors: ['porque', 'pois', 'já que', 'mas', 'porém', 'no entanto', 'embora', 'mesmo assim', 'e', 'ou', 'além disso', 'também', 'por exemplo',
      'então', 'por isso', 'portanto', 'assim', 'quando', 'enquanto', 'depois', 'antes', 'no final', 'finalmente', 'até que', 'desde que', 'se',
      'para que', 'acho que', 'penso que', 'na minha opinião', 'ou seja', 'aliás', 'primeiro',
      // (DX-B2) the B2 linking words
      'contudo', 'todavia', 'apesar de que', 'por um lado', 'por outro lado', 'uma vez que', 'visto que', 'dado que', 'devido a',
      'por conseguinte', 'em conclusão', 'em resumo', 'em suma', 'inclusive', 'em primeiro lugar', 'por último', 'a menos que',
      'a não ser que', 'contanto que', 'do meu ponto de vista', 'a meu ver'],
    connectorKinds: { porque: 'reason', pois: 'reason', 'já que': 'reason', mas: 'contrast', 'porém': 'contrast', 'no entanto': 'contrast', embora: 'contrast',
      'mesmo assim': 'contrast', e: 'add', ou: 'add', 'além disso': 'add', 'também': 'add', 'por exemplo': 'add', 'ou seja': 'add', 'aliás': 'add',
      'então': 'result', 'por isso': 'result', portanto: 'result', assim: 'result', quando: 'time', enquanto: 'time', depois: 'time', antes: 'time',
      'no final': 'time', finalmente: 'time', 'até que': 'time', 'desde que': 'time', primeiro: 'time', se: 'cond', 'para que': 'reason',
      'acho que': 'opinion', 'penso que': 'opinion', 'na minha opinião': 'opinion',
      contudo: 'contrast', todavia: 'contrast', 'apesar de que': 'contrast', 'por um lado': 'contrast', 'por outro lado': 'contrast',
      'uma vez que': 'reason', 'visto que': 'reason', 'dado que': 'reason', 'devido a': 'reason', 'por conseguinte': 'result',
      'em conclusão': 'result', 'em resumo': 'result', 'em suma': 'result', inclusive: 'add', 'em primeiro lugar': 'time',
      'por último': 'time', 'a menos que': 'cond', 'a não ser que': 'cond', 'contanto que': 'cond',
      'do meu ponto de vista': 'opinion', 'a meu ver': 'opinion' },
    weakConnectors: ['e', 'ou'],
    fillers: ['então', 'tipo', 'né', 'assim', 'bom', 'olha', 'sabe', 'quer dizer', 'pois é', 'aí', 'eh', 'hum', 'tá'],
  };
  DICT.register('pt', () => LATIN.build(spec));
  window.PT_DICT = { conj, plural, feminine, R };
})();
