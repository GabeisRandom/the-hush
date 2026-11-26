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
destruir|p:destruo,destróis,destrói,destruímos,destruís,destroem`;
  const IRR = {};
  for (const line of IRR_TEXT.split('\n')) {
    const [lemma, rest] = line.split('|'); const o = {};
    for (const x of rest.split(' ')) { const c = x.indexOf(':'); if (c < 0) o[x] = true; else o[x.slice(0, c)] = x.slice(c + 1).includes(',') ? x.slice(c + 1).split(',') : x.slice(c + 1); }
    IRR[lemma] = o;
  }
  const DERIV = {};
  ('manter:ter obter:ter conter:ter deter:ter entreter:ter reter:ter convir:vir intervir:vir provir:vir compor:pôr propor:pôr supor:pôr dispor:pôr expor:pôr ' +
   'impor:pôr repor:pôr desfazer:fazer refazer:fazer satisfazer:fazer prever:ver rever:ver contradizer:dizer desdizer:dizer sorrir:rir atrair:sair:attr distrair:sair:attr')
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
    const t = pinf.slice(-2);
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
    ['', 'es', '', 'mos', 'des', 'em'].forEach((en, n) => add(inf + en, 'pinf.' + PN[n]));
    add(X.im || pres[2], 'imp.2s');
    add(subj[2], 'imp.2s.fo'); add(subj[5], 'imp.2p.fo'); add(subj[3], 'imp.1p');
    add(stem + V.vt, 'imp.2p.vt');
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
    if (e.alt) for (const a of e.alt) add(a, e.pos === 'n' ? (e.g === 'mf' ? 's' : e.g + '.s') : '');
  }

  // ------------------------------------------------------------ clitics after a hyphen (chamo-me, dá-me, fazê-lo, levantar-se)
  const CLIT = new Set(['me', 'te', 'se', 'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las', 'no', 'na', 'nos', 'nas', 'lhe', 'lhes', 'vos']);
  const MESO = new Set(['ei', 'as', 'a', 'emos', 'eis', 'ao', 'ia', 'ias', 'iamos', 'ieis', 'iam']);
  function expand(tk, P) {
    const raw = tk.t; if (raw.indexOf('-') < 0) return null;
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
    if (e.lemma === 'ser' && !c.exact && k === 'e' && nx.some(n => n.e.pos === 'adj' || DEGREE_NEXT.has(key(n.w)))) s += 3;
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
    return s;
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
          if (!(n2 && n2.e.pos === 'v' && n2.f.form === 'inf') && !(jc.e.subj && k === 'em' && false)) {
            push(err('contract', 'major', [w.i, j], to, `«${k} + ${jk}» is always «${to}».`));
            continue;
          }
        }
      }
      // «no» before a verb: «não»
      if (k === 'no' && W[nx(W, w.i)] && rd(W, nx(W, w.i)) && isFin(rd(W, nx(W, w.i))) && !W[nx(W, w.i)]._c.some(x => x.e.pos === 'n' || x.e.pos === 'adj')) {
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
    if (e.pos === 'n') return e.fem && f.gender === 'f' ? 'feminine' + (f.number === 'p' ? ' plural' : '') : f.number === 'p' ? 'plural' : '';
    if (e.pos === 'adj' || e.pos === 'det' || e.pos === 'pron') return gnText(f);
    return '';
  }
  function enGloss(c) {
    const e = c.e, f = c.f || {};
    if (e.pos === 'v' && f.form === 'pinf') return EN.verb(e.en, { form: 'inf' });
    if (e.pos === 'v' && (f.mood || f.form)) return EN.verb(e.en, f);
    const m = /^([^/,;()]+)\/([^,;()]+)(.*)$/.exec(e.en || '');
    const en = m ? (f.gender === 'f' ? m[2] : m[1]) + m[3] : e.en;
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
desculpa|int|sorry|alt:desculpe
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
doce|m|candy, sweet|alt:docinho
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
rádio|m|radio
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
gato|m~|cat|alt:gatinho
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
cinza|a=|gray
marrom|a=|brown
rosa#adj|a=|pink
roxo|a|purple
laranja#adj|a=|orange (color)
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
pipa|f|kite|alt:papagaio,pandorga,arraia
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
bege|a=|beige
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
  const spec = {
    lang: 'pt', lists: LISTS, entry, forms, expand, prior, score, callVerb: 'chamar-se',
    context: (W, P) => ROM.context(W, P, R),
    summary: (a, W, P) => ROM.summary(a, W, P, R),
    check: (a, opts, P) => ROM.check(a, opts, P, R),
    describe, enGloss, inflect, numbers,
    connectors: ['porque', 'pois', 'já que', 'mas', 'porém', 'no entanto', 'embora', 'mesmo assim', 'e', 'ou', 'além disso', 'também', 'por exemplo',
      'então', 'por isso', 'portanto', 'assim', 'quando', 'enquanto', 'depois', 'antes', 'no final', 'finalmente', 'até que', 'desde que', 'se',
      'para que', 'acho que', 'penso que', 'na minha opinião', 'ou seja', 'aliás', 'primeiro'],
    connectorKinds: { porque: 'reason', pois: 'reason', 'já que': 'reason', mas: 'contrast', 'porém': 'contrast', 'no entanto': 'contrast', embora: 'contrast',
      'mesmo assim': 'contrast', e: 'add', ou: 'add', 'além disso': 'add', 'também': 'add', 'por exemplo': 'add', 'ou seja': 'add', 'aliás': 'add',
      'então': 'result', 'por isso': 'result', portanto: 'result', assim: 'result', quando: 'time', enquanto: 'time', depois: 'time', antes: 'time',
      'no final': 'time', finalmente: 'time', 'até que': 'time', 'desde que': 'time', primeiro: 'time', se: 'cond', 'para que': 'reason',
      'acho que': 'opinion', 'penso que': 'opinion', 'na minha opinião': 'opinion' },
    weakConnectors: ['e', 'ou'],
    fillers: ['então', 'tipo', 'né', 'assim', 'bom', 'olha', 'sabe', 'quer dizer', 'pois é', 'aí', 'eh', 'hum', 'tá'],
  };
  DICT.register('pt', () => LATIN.build(spec));
  window.PT_DICT = { conj, plural, feminine, R };
})();
