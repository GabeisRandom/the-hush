'use strict';
// What the foes say, mixed and taught (DESIGN.md 19, P6b: "enemies are using words in battle to target me that are never taught
// when they first attack you and its just assumed that you understand what they are saying").
//  - Every foe's line goes through the weave (talk/mix.js MIX): the words you know in the language, the rest in English; the
//    whole line in the language only as the weave rises (UI.fullLine), and its English stays a button (EN). This wraps the
//    battle's bubbles (BATTLE._.UI.say), so it covers every fight: flow.js, tactics.js, timebattle.js, the regions' plug-ins.
//  - The key words of a tell are always in the language: where an attack goes («por arriba», «la cabeza»), what a foe will do
//    («saltar», «la roca»), glossed small the first 3 times you meet each (LEX x.fkey.<word>, per language, with the save).
//  - The first time a kind of shout or tell comes up in a real fight, the fight stops a moment and teaches it, as the game teaches
//    everything: the foe says it (whole in the language, the key words marked and glossed), Mimo acts out what it means (duck,
//    jump), and a box says what it means for the fight ("«por arriba»: up high → duck ↓"). Then the attack goes on.
//    Kinds: the shouts at each tier (1 «¡Por arriba!», which Bruno's first lesson teaches; 2 who it's coming for and where;
//    3 the head or the feet), and Bruno's tells (leap, hide), which the yard teaches first: a tell met in a fight before the
//    yard (tests, BATTLE._.tac.force) teaches itself the same way. LEX x.tell.<kind> keeps what's been taught (per language).
//   FOE_LINES.mix(tl, en) → { html, full } · KEYS · TEACH · taught(kind) · teach(kind, f) · check() → notation problems
(() => {
  const B = window.BATTLE, _ = B && B._;
  if (!_ || !_.UI || !_.UI.say) return;
  const X = () => _.flow;
  const lang = () => (X() && X().G && X().G.lang) || (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && ['zh', 'ja'].includes(lang());
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const st = k => { try { return LEX.st(k); } catch (e) { return {}; } };

  // ------------------------------------------------------------ the key words: [as written (zh / ja: notation), its English in
  // the line's translation, the gloss]; one per thing a tell says. The English is swapped for the word in the language.
  const K = (w, en, gl) => ({ w, en, gl });
  // (and who a shout is after: Mimo's nickname, «el orejón», "big-ears")
  const KEYS = {
    es: [K('por arriba', /\bup high\b/i, 'up high'), K('por abajo', /\bdown low\b/i, 'down low'), K('cabeza', /\bhead\b/i, 'head'), K('pies', /\bfeet\b/i, 'feet'),
      K('saltar', /\bjump\b/i, 'jump'), K('roca', /\brock\b/i, 'rock'), K('orejón', /\bbig-ears\b/i, 'big-ears: Mimo')],
    pt: [K('por cima', /\bup high\b/i, 'up high'), K('por baixo', /\bdown low\b/i, 'down low'), K('cabeça', /\bhead\b/i, 'head'), K('pés', /\bfeet\b/i, 'feet'),
      K('pular', /\bjump\b/i, 'jump'), K('pedra', /\brock\b/i, 'rock'), K('orelhudo', /\bbig-ears\b/i, 'big-ears: Mimo')],
    de: [K('von oben', /\bfrom above\b/i, 'from above'), K('von unten', /\bfrom below\b/i, 'from below'), K('Kopf', /\bhead\b/i, 'head'), K('Füße', /\bfeet\b/i, 'feet'),
      K('springe', /\bjump\b/i, 'jump'), K('Stein', /\brock\b/i, 'rock'), K('Langohr', /\blong-ears\b/i, 'long-ears: Mimo')],
    zh: [K('[上面|shàng miàn]', /\bup high\b/i, 'up high'), K('[下面|xià miàn]', /\bdown low\b/i, 'down low'), K('[头|tóu]', /\bhead\b/i, 'head'), K('[脚|jiǎo]', /\bfeet\b/i, 'feet'),
      K('[跳|tiào]', /\bjump\b/i, 'jump'), K('[石头|shí tou]', /\brock\b/i, 'rock'), K('[大|dà] [耳朵|ěr duo]', /\bbig-ears\b/i, 'big-ears: Mimo')],
    ja: [K('[上|うえ]', /\bup high\b/i, 'up high'), K('[下|した]', /\bdown low\b/i, 'down low'), K('[頭|あたま]', /\bhead\b/i, 'head'), K('[足|あし]', /\bfeet\b/i, 'feet'),
      K('[跳|と]ぶ', /\bjump\b/i, 'jump'), K('[岩|いわ]', /\brock\b/i, 'rock'), K('デカ[耳|みみ]', /\bbig-ears\b/i, 'big-ears: Mimo')],
  };
  const keyId = k => 'x.fkey.' + (isC() ? CJK.chars(k.w, { lang: lang() }) : k.w.toLowerCase());
  const glossDue = k => (st(keyId(k)).n || 0) < 3;
  const noteKey = k => { const s = st(keyId(k)); s.n = (s.n || 0) + 1; };
  // is this key word in the line (as a word, not inside another)?
  function hasKey(t, k) {
    if (isC()) return String(t).split(/\s+/).join(' ').includes(k.w);
    return new RegExp(`(^|[^\\p{L}])${escRe(k.w)}(?![\\p{L}])`, 'iu').test(t);
  }

  // ------------------------------------------------------------ the line in the language with some words marked (story.js's
  // demonstration look): each mark wrapped where it stands, its gloss after it the first time (o.gloss(m) says whether)
  const CJ_CHUNK = /(?:[^\s[\]]*\[[^\]]*\])+[^\s[\]]*|\S+/g;
  function markHTML(t, marks, o = {}) {
    const M = marks.slice().sort((a, b) => b.w.length - a.w.length), done = o.done || new Set(), l = lang();      // (o.done: glossed already, in a line above)
    const gl = m => (done.has(m.gl) || (o.gloss && !o.gloss(m)) ? '' : (done.add(m.gl), `<span class="gl">(${esc(m.gl)})</span>`));
    if (isC()) {
      const roman = CJK.mode(l) !== 'chars', ch = String(t).match(CJ_CHUNK) || [], tag = new Array(ch.length).fill(null);
      for (const m of M) { const toks = m.w.match(CJ_CHUNK) || []; if (!toks.length) continue; for (let i = 0; i + toks.length <= ch.length; i++) if (!tag.slice(i, i + toks.length).some(Boolean) && toks.every((x, j) => ch[i + j] === x)) { for (let j = 0; j < toks.length; j++) tag[i + j] = { m, first: j === 0, last: j === toks.length - 1 }; break; } }
      let out = '', cap = true, open = false;
      ch.forEach((c, i) => {
        const pun = !/\[/.test(c) && /^[\p{P}\p{S}]+$/u.test(c), h = CJK.html(c, { lang: l, cap }), g = tag[i];
        out += (out && roman && !pun ? ' ' : '');
        if (g && g.first) { out += `<span class="w" data-en="${esc(g.m.gl)}">`; open = true; }
        out += h;
        if (g && g.last && open) { out += '</span>' + gl(g.m); open = false; }
        cap = pun ? /[。！？.!?「『“]/.test(c) || cap : false;
      });
      return out;
    }
    const re = new RegExp(`(^|[^\\p{L}])(${M.map(m => escRe(esc(m.w))).join('|')})(?![\\p{L}])`, 'giu');
    return esc(t).replace(re, (all, pre, w) => {
      const m = M.find(x => esc(x.w).toLowerCase() === w.toLowerCase());
      return m ? `${pre}<span class="w" data-en="${esc(m.gl)}">${w}</span>${gl(m)}` : all;
    });
  }

  // ------------------------------------------------------------ a foe's line, mixed
  const mixOn = () => { try { return typeof MIX !== 'undefined' && MIX.ok(); } catch (e) { return false; } };
  function mix(tl, en) {
    const l = lang(), keys = (KEYS[l] || []).filter(k => hasKey(tl, k)), W = typeof LEX !== 'undefined' ? LEX.weave() : 1;
    const full = typeof UI !== 'undefined' && UI.fullLine ? UI.fullLine('foe:' + tl, W) : W >= 0.7;
    // the key words with the English they stand for in this line
    let en2 = en; const slots = [];
    for (const k of keys) {
      const m = en2.match(k.en); if (!m) continue;
      const ph = `Qzq${slots.length}x`;
      slots.push({ k, ph, enText: m[0], start: /[.!?:]\s*$/.test(en2.slice(0, m.index)) || /^[¡¿"“«\s]*$/.test(en2.slice(0, m.index)),     // (a sentence's start takes a capital; after «…» it goes on)
        inv: l === 'es' && /(^|[.!?…]\s*)[\s("“«]*$/.test(en2.slice(0, m.index)) ? ({ '!': '¡', '?': '¿' })[(en2.slice(m.index + m[0].length).match(/^\s*([!?])/) || [])[1]] || '' : '' });     // (es: a key word that is a whole «¡…!» / «¿…?» opens it: «(¡por abajo!)»)
      en2 = en2.slice(0, m.index) + ph + en2.slice(m.index + m[0].length);
    }
    // the whole line in the language: the weave says so, or there's nothing in it but its key words
    const rest = en2.replace(/Qzq\d+x/g, '').replace(/[\s!?.,¡¿…:;"“”«»]+/g, '');
    if (full || (slots.length && !rest)) {
      const marks = slots.map(s => ({ w: s.k.w, gl: s.k.gl, k: s.k }));
      const html = marks.length ? markHTML(tl, marks, { gloss: m => glossDue(m.k) }) : (isC() ? CJK.html(tl, { lang: l }) : esc(tl));
      slots.forEach(s => noteKey(s.k));
      if (isC()) try { CJK.seen(tl, { lang: l }); } catch (e) { /* */ }
      return { html, full: true };
    }
    let ps = null;
    if (mixOn()) { try { ps = MIX.parts(tl, en2, {}); } catch (e) { ps = null; } }
    if (!ps || !ps.length) ps = [{ s: en2 }];
    const out = [];
    for (const p of ps) {
      if (p.tl || !p.s || !/Qzq\d+x/.test(p.s)) { out.push(p); continue; }
      for (const seg of p.s.split(/(Qzq\d+x)/)) {
        const sl = slots.find(s => s.ph === seg);
        if (!sl) { if (seg) out.push({ s: seg }); continue; }
        const k = sl.k, q = { id: keyId(k), tl: true, en: sl.enText, gl: glossDue(k) ? k.gl : undefined };
        if (isC()) { q.src = k.w; q.cap = !!sl.start; q.s = CJK.plain(k.w, { lang: l, cap: q.cap }); q.len = CJK.len(k.w, { lang: l, cap: q.cap }); }
        else q.s = (sl.inv || '') + (sl.start ? k.w.charAt(0).toUpperCase() + k.w.slice(1) : k.w);
        out.push(q);
      }
    }
    slots.forEach(s => noteKey(s.k));
    try { if (mixOn()) MIX.note(out.filter(p => p.tl && (p.lex || p.did))); } catch (e) { /* */ }
    if (isC()) for (const p of out) if (p.src) try { CJK.seen(p.src, { lang: l }); } catch (e) { /* */ }
    return { html: UI.partsHTML(out), full: false };
  }
  // every foe's bubble (it has its English: o.en); lines with no English (Shh…, zzz…, a bat's echo of your words) stay as they are
  const say0 = _.UI.say;
  _.UI.say = function (actor, text, t, o = {}) {
    if (actor && actor.kind === 'foe' && o && o.en && !o.html && typeof UI !== 'undefined' && UI.partsHTML) {
      try { const m = mix(String(text), String(o.en)); if (m && m.html) return say0.call(this, actor, m.html, t, Object.assign({}, o, { html: true })); }
      catch (e) { console.error('[foe lines]', e); }
    }
    return say0.apply(this, arguments);
  };

  // ------------------------------------------------------------ teaching a kind of shout or tell, the first time
  // marks: [as written, gloss]; mean: what it means for the fight, English with the words in the language in «» (zh / ja: notation)
  const M = (w, gl) => ({ w, gl });
  const TEACH = {
    es: {
      shout1: { who: 'Listen: where it hits', marks: [M('Por arriba', 'up high'), M('Por abajo', 'down low')], mean: 'Foes shout where they’ll hit: «por arriba» (up high) → duck <kbd>↓</kbd> · «por abajo» (down low) → jump <kbd>↑</kbd>. Press it as the hit lands.' },
      shout2: { who: 'Listen: who, and where', marks: [M('Voy por', 'I’m coming for'), M('orejón', 'big-ears: Mimo'), M('ti', 'you'), M('por arriba', 'up high'), M('por abajo', 'down low')], mean: 'Now it says who it’s coming for («el orejón» is {name}, «ti» is you) and where: «por arriba» → duck <kbd>↓</kbd> · «por abajo» → jump <kbd>↑</kbd>.' },
      shout3: { who: 'Listen: the head or the feet', marks: [M('te voy a dar', 'I’m gonna get you'), M('Orejón', 'big-ears: Mimo'), M('en la cabeza', 'on the head'), M('en los pies', 'on the feet')], mean: 'Now it says where it’ll hit: «la cabeza» (the head) → duck <kbd>↓</kbd> · «los pies» (the feet) → jump <kbd>↑</kbd>.' },
      leap: { who: 'A tell: it will jump', marks: [M('Voy a', 'I’m going to'), M('saltar', 'jump')], mean: '«¡Voy a saltar!»: it’s going to jump at you. Duck <kbd>↓</kbd> as it lands, or tell {name} «¡Cuando salte, golpéalo!» to hit it in the air (×2).' },
      hide: { who: 'A tell: it hides', marks: [M('Me escondo', 'I’m hiding'), M('detrás de', 'behind'), M('roca', 'rock')], mean: 'It’s hiding behind a rock: hits only do half. Tell {name} «¡Empuja la roca!» to tip it over onto it (×2).' },
    },
    pt: {
      shout1: { who: 'Listen: where it hits', marks: [M('Por cima', 'up high'), M('Por baixo', 'down low')], mean: 'Foes shout where they’ll hit: «por cima» (up high) → duck <kbd>↓</kbd> · «por baixo» (down low) → jump <kbd>↑</kbd>. Press it as the hit lands.' },
      shout2: { who: 'Listen: who, and where', marks: [M('Vou pegar', 'I’m gonna get'), M('Vou te pegar', 'I’m gonna get you'), M('orelhudo', 'big-ears: Mimo'), M('por cima', 'up high'), M('por baixo', 'down low')], mean: 'Now it says who it’s after («o orelhudo» is {name}, «te» is you) and where: «por cima» → duck <kbd>↓</kbd> · «por baixo» → jump <kbd>↑</kbd>.' },
      shout3: { who: 'Listen: the head or the feet', marks: [M('vou acertar', 'I’m gonna hit'), M('Vou acertar', 'I’m gonna hit'), M('Orelhudo', 'big-ears: Mimo'), M('sua cabeça', 'your head'), M('seus pés', 'your feet')], mean: 'Now it says where it’ll hit: «cabeça» (head) → duck <kbd>↓</kbd> · «pés» (feet) → jump <kbd>↑</kbd>.' },
      leap: { who: 'A tell: it will jump', marks: [M('Vou', 'I’m going to'), M('pular', 'jump')], mean: '«Vou pular!»: it’s going to jump at you. Duck <kbd>↓</kbd> as it lands, or tell {name} «Quando ele pular, bate nele!» to hit it in the air (×2).' },
      hide: { who: 'A tell: it hides', marks: [M('me esconder', 'hide'), M('atrás da', 'behind the'), M('pedra', 'rock')], mean: 'It’s hiding behind a rock: hits only do half. Tell {name} «Empurra a pedra!» to tip it over onto it (×2).' },
    },
    de: {
      shout1: { who: 'Listen: where it hits', marks: [M('Von oben', 'from above'), M('Von unten', 'from below')], mean: 'Foes shout where they’ll hit: «von oben» (from above) → duck <kbd>↓</kbd> · «von unten» (from below) → jump <kbd>↑</kbd>. Press it as the hit lands.' },
      shout2: { who: 'Listen: who, and where', marks: [M('Ich krieg', 'I’ll get'), M('Langohr', 'long-ears: Mimo'), M('dich', 'you'), M('von oben', 'from above'), M('von unten', 'from below')], mean: 'Now it says who it’s after («das Langohr» is {name}, «dich» is you) and where: «von oben» → duck <kbd>↓</kbd> · «von unten» → jump <kbd>↑</kbd>.' },
      shout3: { who: 'Listen: the head or the feet', marks: [M('ich hau dir', 'I’ll whack you'), M('Ich hau dir', 'I’ll whack you'), M('Langohr', 'long-ears: Mimo'), M('auf den Kopf', 'on the head'), M('auf die Füße', 'on the feet')], mean: 'Now it says where it’ll hit: «den Kopf» (the head) → duck <kbd>↓</kbd> · «die Füße» (the feet) → jump <kbd>↑</kbd>.' },
      leap: { who: 'A tell: it will jump', marks: [M('springe', 'jump'), M('gleich', 'in a moment')], mean: '«Ich springe gleich!»: it’s about to jump at you. Duck <kbd>↓</kbd> as it lands, or tell {name} «Wenn er springt, schlag ihn!» to hit it in the air (×2).' },
      hide: { who: 'A tell: it hides', marks: [M('verstecke mich', 'I’m hiding'), M('hinter dem', 'behind the'), M('Stein', 'rock')], mean: 'It’s hiding behind a rock: hits only do half. Tell {name} «Schieb den Stein!» to tip it over onto it (×2).' },
    },
    zh: {
      shout1: { who: 'Listen: where it hits', marks: [M('[上面|shàng miàn]', 'up high'), M('[下面|xià miàn]', 'down low')], mean: 'Foes shout where they’ll hit: «[上面|shàng miàn]» (up high) → duck <kbd>↓</kbd> · «[下面|xià miàn]» (down low) → jump <kbd>↑</kbd>. Press it as the hit lands.' },
      shout2: { who: 'Listen: who, and where', marks: [M('[大|dà] [耳朵|ěr duo]', 'big-ears: Mimo'), M('[从|cóng]', 'from'), M('[上面|shàng miàn]', 'up high'), M('[下面|xià miàn]', 'down low'), M('[打|dǎ] [你|nǐ]', 'hit you')], mean: 'Now it says who it’s after («[大|dà] [耳朵|ěr duo]» is {name}, «[你|nǐ]» is you) and where: «[上面|shàng miàn]» → duck <kbd>↓</kbd> · «[下面|xià miàn]» → jump <kbd>↑</kbd>.' },
      shout3: { who: 'Listen: the head or the feet', marks: [M('[大|dà] [耳朵|ěr duo]', 'big-ears: Mimo'), M('[打|dǎ] [你|nǐ] [的|de]', 'hit your'), M('[头|tóu]', 'head'), M('[脚|jiǎo]', 'feet')], mean: 'Now it says where it’ll hit: «[头|tóu]» (head) → duck <kbd>↓</kbd> · «[脚|jiǎo]» (feet) → jump <kbd>↑</kbd>.' },
      leap: { who: 'A tell: it will jump', marks: [M('[要|yào]', 'going to'), M('[跳|tiào]', 'jump')], mean: '«[我|wǒ] [要|yào] [跳|tiào] [了|le] ！»: it’s going to jump at you. Duck <kbd>↓</kbd> as it lands, or tell {name} «[它|tā] [跳|tiào] [的|de] [时候|shí hou] ， [打|dǎ] [它|tā] ！» to hit it in the air (×2).' },
      hide: { who: 'A tell: it hides', marks: [M('[躲|duǒ]', 'hide'), M('[石头|shí tou]', 'rock'), M('[后面|hòu miàn]', 'behind')], mean: 'It’s hiding behind a rock: hits only do half. Tell {name} «[把|bǎ] [石头|shí tou] [推倒|tuī dǎo] ！» to tip it over onto it (×2).' },
    },
    ja: {
      shout1: { who: 'Listen: where it hits', marks: [M('[上|うえ]', 'up high'), M('[下|した]', 'down low')], mean: 'Foes shout where they’ll hit: «[上|うえ]» (up high) → duck <kbd>↓</kbd> · «[下|した]» (down low) → jump <kbd>↑</kbd>. Press it as the hit lands.' },
      shout2: { who: 'Listen: who, and where', marks: [M('デカ[耳|みみ]', 'big-ears: Mimo'), M('[上|うえ]', 'up high'), M('[下|した]', 'down low'), M('から', 'from'), M('いく ぞ', 'here I come')], mean: 'Now it says who it’s after («デカ[耳|みみ]» is {name}) and where: «[上|うえ]» → duck <kbd>↓</kbd> · «[下|した]» → jump <kbd>↑</kbd>.' },
      shout3: { who: 'Listen: the head or the feet', marks: [M('デカ[耳|みみ]', 'big-ears: Mimo'), M('[頭|あたま]', 'head'), M('[足|あし]', 'feet'), M('ねらう ぞ', 'I’m going for')], mean: 'Now it says where it’ll hit: «[頭|あたま]» (head) → duck <kbd>↓</kbd> · «[足|あし]» (feet) → jump <kbd>↑</kbd>.' },
      leap: { who: 'A tell: it will jump', marks: [M('[跳|と]ぶ', 'jump')], mean: '«[跳|と]ぶ ぞ ！»: it’s going to jump at you. Duck <kbd>↓</kbd> as it lands, or tell {name} «[跳|と]んだら 、 [叩|たた]いて ！» to hit it in the air (×2).' },
      hide: { who: 'A tell: it hides', marks: [M('[岩|いわ]', 'rock'), M('[後|うし]ろ', 'behind'), M('[隠|かく]れる', 'hide')], mean: 'It’s hiding behind a rock: hits only do half. Tell {name} «[岩|いわ] を [押|お]して ！» to tip it over onto it (×2).' },
    },
  };
  // (P6c, the Great Mill's giant armadillo: "armadillo threatens us fully in target language so new players won't understand". Its
  // own shouts skip foeAttack, so flow.js armaAttack asks here first (_.armaTeach): arma1 the first time it attacks, how it's coming
  // (rolling or bouncing, and where), arma2 the first time it's angry and shouts two moves at once ("first… and then…").)
  const ARMA_T = {
    es: { arma1: { who: 'The big armadillo: how it attacks', marks: [M('rodando', 'rolling'), M('rebotando', 'bouncing'), M('por arriba', 'up high'), M('por abajo', 'down low'), M('la cabeza', 'the head'), M('los pies', 'the feet'), M('Ahí voy', 'here I come'), M('te doy en', 'I’ll get you on')],
        mean: 'It shouts how it’s coming at you: bouncing («rebotando»), «por arriba» or at «la cabeza» (up high, the head) → duck <kbd>↓</kbd> · rolling («rodando»), «por abajo» or at «los pies» (down low, the feet) → jump <kbd>↑</kbd>. After it rolls, it’s dizzy: push it!' },
      arma2: { who: 'Angry: two moves at once', marks: [M('Primero', 'first'), M('y luego', 'and then'), M('por arriba', 'up high'), M('por abajo', 'down low'), M('la cabeza', 'the head'), M('los pies', 'the feet')],
        mean: 'Angry, it shouts two moves in one go: «primero» (first) one, «y luego» (and then) the other. Dodge both, in that order: up high → duck <kbd>↓</kbd> · down low → jump <kbd>↑</kbd>.' } },
    pt: { arma1: { who: 'The big armadillo: how it attacks', marks: [M('quicando', 'bouncing'), M('rolando', 'rolling'), M('por cima', 'up high'), M('por baixo', 'down low'), M('na cabeça', 'on the head'), M('nos pés', 'on the feet'), M('Lá vou eu', 'here I come'), M('vou te pegar', 'I’m gonna get you')],
        mean: 'It shouts how it’s coming at you: bouncing («quicando»), «por cima» or «na cabeça» (up high, the head) → duck <kbd>↓</kbd> · rolling («rolando»), «por baixo» or «nos pés» (down low, the feet) → jump <kbd>↑</kbd>. After it rolls, it’s dizzy: push it!' },
      arma2: { who: 'Angry: two moves at once', marks: [M('Primeiro', 'first'), M('e depois', 'and then'), M('por cima', 'up high'), M('por baixo', 'down low'), M('na cabeça', 'on the head'), M('nos pés', 'on the feet')],
        mean: 'Angry, it shouts two moves in one go: «primeiro» (first) one, «e depois» (and then) the other. Dodge both, in that order: up high → duck <kbd>↓</kbd> · down low → jump <kbd>↑</kbd>.' } },
    de: { arma1: { who: 'The big armadillo: how it attacks', marks: [M('gehüpft', 'bouncing'), M('gerollt', 'rolling'), M('hüpfe', 'I bounce'), M('rolle', 'I roll'), M('von oben', 'from above'), M('von unten', 'from below'), M('Kopf', 'head'), M('Füße', 'feet'), M('Jetzt komme ich', 'here I come')],
        mean: 'It shouts how it’s coming at you: bouncing («gehüpft», «ich hüpfe»), «von oben» or onto your «Kopf» (from above, your head) → duck <kbd>↓</kbd> · rolling («gerollt», «ich rolle»), «von unten» or onto your «Füße» (from below, your feet) → jump <kbd>↑</kbd>. After it rolls, it’s dizzy: push it!' },
      arma2: { who: 'Angry: two moves at once', marks: [M('Erst', 'first'), M('und dann', 'and then'), M('von oben', 'from above'), M('von unten', 'from below'), M('auf den Kopf', 'on the head'), M('auf die Füße', 'on the feet')],
        mean: 'Angry, it shouts two moves in one go: «erst» (first) one, «und dann» (and then) the other. Dodge both, in that order: from above → duck <kbd>↓</kbd> · from below → jump <kbd>↑</kbd>.' } },
    zh: { arma1: { who: 'The big armadillo: how it attacks', marks: [M('[弹|tán]', 'bounce'), M('[滚|gǔn]', 'roll'), M('[过来|guò lái]', 'over at you'), M('[上面|shàng miàn]', 'up high'), M('[下面|xià miàn]', 'down low'), M('[头|tóu]', 'head'), M('[脚|jiǎo]', 'feet')],
        mean: 'It shouts how it’s coming at you: bouncing («[弹|tán]»), «[上面|shàng miàn]» or your «[头|tóu]» (up high, your head) → duck <kbd>↓</kbd> · rolling («[滚|gǔn]»), «[下面|xià miàn]» or your «[脚|jiǎo]» (down low, your feet) → jump <kbd>↑</kbd>. After it rolls, it’s dizzy: push it!' },
      arma2: { who: 'Angry: two moves at once', marks: [M('[先|xiān]', 'first'), M('[再|zài]', 'then'), M('[上面|shàng miàn]', 'up high'), M('[下面|xià miàn]', 'down low'), M('[头|tóu]', 'head'), M('[脚|jiǎo]', 'feet')],
        mean: 'Angry, it shouts two moves in one go: «[先|xiān]» (first) one, «[再|zài]» (then) the other. Dodge both, in that order: up high → duck <kbd>↓</kbd> · down low → jump <kbd>↑</kbd>.' } },
    ja: { arma1: { who: 'The big armadillo: how it attacks', marks: [M('はねて', 'bouncing'), M('ころがって', 'rolling'), M('[上|うえ]', 'up high'), M('[下|した]', 'down low'), M('[頭|あたま]', 'head'), M('[足|あし]', 'feet'), M('ねらう', 'aim at')],
        mean: 'It shouts how it’s coming at you: bouncing («はねて»), «[上|うえ]» or your «[頭|あたま]» (up high, your head) → duck <kbd>↓</kbd> · rolling («ころがって»), «[下|した]» or your «[足|あし]» (down low, your feet) → jump <kbd>↑</kbd>. After it rolls, it’s dizzy: push it!' },
      arma2: { who: 'Angry: two moves at once', marks: [M('まず', 'first'), M('それから', 'and then'), M('[上|うえ]', 'up high'), M('[下|した]', 'down low'), M('[頭|あたま]', 'head'), M('[足|あし]', 'feet')],
        mean: 'Angry, it shouts two moves in one go: «まず» (first) one, «それから» (and then) the other. Dodge both, in that order: up high → duck <kbd>↓</kbd> · down low → jump <kbd>↑</kbd>.' } },
  };
  for (const l of Object.keys(ARMA_T)) if (TEACH[l]) Object.assign(TEACH[l], ARMA_T[l]);
  // (P6c) "bell" is the key word of the bell guardians' threats («¡Nadie toca mi campana!»): always in the language, glossed the
  // first times, like the dodge words (zh's dictionary reads 钟 as "clock" first, so the weave alone never swapped it there)
  const BELL = { es: K('campana', /\bbell\b/i, 'bell'), pt: K('sino', /\bbell\b/i, 'bell'), de: K('Glocke', /\bbell\b/i, 'bell'), zh: K('[钟|zhōng]', /\bbell\b/i, 'bell'), ja: K('[鐘|かね]', /\bbell\b/i, 'bell') };
  for (const l of Object.keys(BELL)) if (KEYS[l] && !KEYS[l].some(k => k.w === BELL[l].w)) KEYS[l].push(BELL[l]);
  const taught = kind => !!(st('x.tell.' + kind).t);
  const markTaught = kind => { const s = st('x.tell.' + kind); if (!s.t) s.t = Date.now(); };
  // English with «words» in the language: the words shown in the language (zh / ja through CJK), picked out
  function meanHTML(s) {
    const x = X(), name = (x && x.G && x.G.name) || 'Mimo', l = lang();
    return String(s).replace(/\{name\}/g, esc(name)).replace(/«([^»]+)»/g, (m, w) => `<b class="tl">«${isC() && /\[|[ぁ-ヿ㐀-鿿]/.test(w) ? CJK.html(w, { lang: l, cap: false }) : esc(w)}»</b>`);
  }
  // the box (the Coach's, with the kind's name on its tab): Enter goes on
  function box(html, who) {
    const x = X(), F = x.G;
    x.UI.coach(html, '', '', true, who);
    const tok = {}; F.coachTok = tok;
    return new Promise(res => {
      F.coachNext = () => { if (F.coachTok !== tok) return; F.coachNext = null; F.coachTok = null; x.UI.coachHide(); res(); };
      if (F.auto && F.auto.dialog) x.wait(0.35).then(() => { if (F.coachTok === tok && F.coachNext) F.coachNext(); });
    });
  }
  // the demonstration lines of a kind: [text, English, the dodge it means] (the shouts: up and down; a tell: its own line)
  function linesOf(kind, F) {
    const L = F.L, T = _.tac && _.tac.LX && (_.tac.LX[F.lang] || _.tac.LX.es);
    if (/^shout/.test(kind)) { const tier = +kind.slice(5); return [[...L.shout(tier, tier >= 2, true), 'ArrowDown'], [...L.shout(tier, false, false), 'ArrowUp']]; }
    if (kind === 'leap' && T) return [[...T.leap, 'ArrowDown']];
    if (kind === 'hide' && T) return [[...T.hide, null]];
    // the armadillo's own (P6c): its single shouts, up and down; its double one, with both dodges in order
    if (/^arma/.test(kind) && L.armaShout) { const tier = F.tier || 1; return kind === 'arma2' ? [[...L.armaShout(tier, [true, false]), ['ArrowDown', 'ArrowUp']]] : [[...L.armaShout(tier, [true]), 'ArrowDown'], [...L.armaShout(tier, [false]), 'ArrowUp']]; }
    return [];
  }
  let teaching = false;
  async function teach(kind, f) {
    const x = X(), F = x.G, T = (TEACH[F.lang] || TEACH.es)[kind];
    if (!T || teaching || !f) return;
    teaching = true;
    try {
      const lines = linesOf(kind, F), marks = T.marks, done = new Set();
      const html = lines.map(([t]) => `<div class="fl-demo">${markHTML(t, marks, { done })}</div>`).join('');
      x.UI.tip(null); x.UI.dodge && x.UI.dodge(null);
      x.ST.shot('action', f, x.A.mimo, { yaw: 0.05, up: f.isBoss ? 0.7 : f.species === 'hushbig' ? 0.5 : 0.2 });
      for (const [t, en, key] of lines) {
        x.setMood(f, 'go', 1.4);
        x.say(f, markHTML(t, marks), { cls: f.isBoss ? 'foe shout boss' : 'foe shout', html: true, en, dur: 2.6 });
        x.emit('shout', { text: t, foe: f, demo: true });
        await x.wait(1.1);
        for (const k of [].concat(key || [])) { x.setMood(x.A.mimo, 'go', 0.8); await x.dodgeMove(x.A.mimo, k); await x.wait(0.12); }     // (a double shout: both dodges, in order)
        await x.wait(0.5);
        x.setMood(f, 'idle');
      }
      x.ST.shot('wide');
      x.emit('teach-ok');
      await box(`${html}<div class="fl-mean">${meanHTML(T.mean)}</div>`, `New · ${T.who}`);
      markTaught(kind);
    } catch (e) { console.error('[foe lines] teach', e); }
    teaching = false;
  }

  // ------------------------------------------------------------ when: a foe about to shout, a tell just told
  const T = _.tac;
  const live = F => F && F.running && !F.practice && !F.tutorial;
  if (T) {
    // the first lessons teach the first shouts, and the yard teaches the tells (or did already, in an older save)
    if (T.beginHooks) T.beginHooks.push(() => {
      const F = X().G;
      if (F.tutorial) markTaught('shout1');
      if (F.practice && F.focus === 'tac:A') { markTaught('leap'); markTaught('hide'); }
      try { const g = _.RW && _.RW.game, s = g && g.state; if (s && (s.flags.lessons || 0) >= 1) markTaught('shout1'); if (s && s.tac && s.tac.A) { markTaught('leap'); markTaught('hide'); } } catch (e) { /* */ }
    });
    // a foe about to attack the usual way (not the leap it told you about, not from behind a rock, not a trap)
    const fa0 = T.foeAttack;
    T.foeAttack = async f => {
      const F = X().G;
      if (live(F) && f && f.alive && !f.calmed && !f.shy && !(f.states && f.states.has('asleep')) && !(f.tell && f.tell.kind === 'leap') && !f.hiding && !f.tbTrap && !f.gone) {
        const kind = 'shout' + Math.max(1, Math.min(3, F.tier || 1));
        if (!taught(kind)) await teach(kind, f);
      }
      return fa0 ? fa0(f) : false;
    };
    // a tell, told this turn (tactics.js tellTurn runs before this): taught at the yard, or here the first time
    if (T.turnHooks) T.turnHooks.push(async () => {
      const F = X().G; if (!live(F)) return;
      const lp = F.foes.find(f => f.alive && !f.gone && f.tell && f.tell.kind === 'leap');
      if (lp && !taught('leap')) await teach('leap', lp);
      const hd = F.foes.find(f => f.alive && !f.gone && f.hiding);
      if (hd && !taught('hide')) await teach('hide', hd);
    });
  }
  // the Great Mill's armadillo (flow.js armaAttack calls this before its shout; P6c): its own shouts taught the first time
  _.armaTeach = async (f, two) => { const F = X().G; if (!live(F) || !f) return; const kind = two ? 'arma2' : 'arma1'; if (!taught(kind)) await teach(kind, f); };
  // the look of the box's demonstration and its meaning
  { const s = document.createElement('style'); s.textContent = '#battle-ui .bt-coach .fl-demo { font-size: 25px; } #battle-ui .bt-coach .fl-demo + .fl-demo { margin-top: 2px; } #battle-ui .bt-coach .fl-mean { font-size: 17px; font-weight: 700; color: #4a4560; margin-top: 8px; line-height: 1.4; } #battle-ui .bt-coach .fl-mean kbd { font: 800 13px "Segoe UI", sans-serif; border: 1.5px solid #2b2235; border-radius: 5px; padding: 0 4px; background: #fff; } #battle-ui .bt-coach .gl { font-size: .6em; }'; document.head.appendChild(s); }

  // ------------------------------------------------------------ zh / ja: every notation string here (CJK.md)
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return [];
    const out = [], chk = (where, src, l) => { const p = CJK.validate(src, l); if (p.length) out.push({ where, src, problems: p }); };
    for (const l of ['zh', 'ja']) {
      KEYS[l].forEach(k => chk('key', k.w, l));
      for (const [kind, T0] of Object.entries(TEACH[l])) { T0.marks.forEach(m => chk(kind + ' mark', m.w, l)); (T0.mean.match(/«([^»]+)»/g) || []).forEach(m => { const w = m.slice(1, -1); if (/\[/.test(w)) chk(kind + ' mean', w, l); }); }
    }
    return out;
  }
  window.FOE_LINES = { mix, KEYS, TEACH, taught, markTaught, teach, markHTML, check };
})();
