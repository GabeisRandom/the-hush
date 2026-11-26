'use strict';
// Dodging out loud (DESIGN.md 20, P7a: "make verbal counterattacks instead of pressing space").
// When a foe attacks, a reaction box opens under the fight at its shout, so you can answer while you read. Once it lunges,
// time slows down (the window: 7 s at A0 down to 4 s at B2, longer in character mode and for your first reactions) and you
// say how to dodge, in the language: es «¡Agáchate!» / «¡Salta!» · pt «Abaixa!» / «Pula!» · de «Duck dich!» / «Spring!» ·
// zh 蹲下 / 跳 · ja しゃがんで / 跳んで. The right move in time is a dodge. Quick (the first 55% of the window, or before it)
// and exact (accents and tones never count) is a PERFECT dodge, which counters (1, or 2 with Mimo's «Counter punch»).
// Once «y» is learned (battle/chain.js), a counter command («¡Agáchate y golpea!», «蹲下，然后打！», «しゃがんで、打って！»)
// hits back double; a slip anywhere in it loses the dodge too, like any chain. The wrong move, a plain «¡Esquiva!» (which
// way?) or no answer in time: the hit lands. A word Mimo doesn't know: the box keeps listening.
// Taught before it's needed: Bruno's first lesson makes its first attack a low one («¡Salta!», which Mimo knows by then),
// then shows «¡Agáchate!» before the second turn (a demonstration, then you copy it and teach it). A fight that meets it
// first teaches it in place (a foe shouts, Mimo ducks, then the same two boxes). Chips with the words help the first times
// and fade (the word, then its first letter, then nothing). The yard's board has a practice: «Dodge out loud».
// Settings → "Dodge with the arrow keys" (KEYS.opts.reactKeys) brings back the ↑ / ↓ timing presses.
// Hooks in flow.js: timingWindow (↑ / ↓ windows come here), dodgeTip, dodgeHint (opens and closes the box), dodgeResult
// (the counter command's extra hit). Kept per language in LEX: x.react.n.<move> (right answers: the chips), x.react.total.
// Tests: BATTLE._.react.auto = { text: 'right' | 'wrong' | 'side' | 'counter' | 'late' | any text, after: seconds, armed }.
(() => {
  const B = window.BATTLE, _ = B && B._;
  if (!_ || !_.UI || !_.P || !_.tac || !_.tac.h) return;
  const P = _.P, T = _.tac, H = T.h, X = () => _.flow;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const hasLEX = () => typeof LEX !== 'undefined';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = k => { try { return LEX.st(k); } catch (e) { return {}; } };
  const isC = l => l === 'zh' || l === 'ja';
  const verbal = () => !(typeof KEYS !== 'undefined' && KEYS.opts && KEYS.opts.reactKeys);
  const QUICK = 0.55, LEAD = 0.2;
  const WIN = [7, 6.5, 5.5, 4.5, 4];                  // seconds, by your level: A0, A1, A2, B1, B2

  // ------------------------------------------------------------ the words
  // duck / jump: shown (chips, boxes), the forms that count as exact, and half forms (a word left off: «agacha», «duck»).
  // zh / ja forms are in the notation; ja marks the te-forms (1), which chain an action after them. side: «dodge» with no way.
  // join: what joins a counter («y golpea»). fill: little words that don't change it («¡Agáchate ya!»).
  const RX = {
    es: {
      duck: { show: '¡Agáchate!', forms: ['agáchate', 'agáchese', 'agáchense'], half: ['agacha', 'agache'], gl: 'duck' },
      jump: { show: '¡Salta!', forms: ['salta', 'salte', 'brinca', 'brinque'], half: [], gl: 'jump' },
      side: ['esquiva', 'esquive', 'esquívalo', 'esquívala'],
      join: [['y', 'luego'], ['y', 'después'], ['y'], ['e'], ['luego'], ['después']], J: 'y',
      fill: ['ya', 'rápido', 'ahora', 'oye', 'vamos', 'dale', 'por', 'favor', 'porfa', 'cuidado', 'órale', 'ándale'],
      demo: ['¡Mira! «¡Por arriba!»… ¡y me agacho! Dile a {name}: «¡Agáchate!»', 'Look! “Up high!”… and I duck! Tell {name}: “Duck!”'],
      demoMarks: [['me agacho', 'I duck'], ['Agáchate', 'duck!'], ['Por arriba', 'up high']],
      pDodge: ['¡Y ojo! A veces un muñeco gira. Dile a {name} cómo esquivar: «¡Agáchate!» o «¡Salta!».', 'And watch out! Sometimes a dummy spins. Tell {name} how to dodge: “Duck!” or “Jump!”'],
      why: { react: 'Where it hits says the move: «por arriba» or «la cabeza» (up high) → «¡Agáchate!» (duck) · «por abajo» or «los pies» (down low) → «¡Salta!» (jump).',
        reactSide: '«¡Esquiva!» is “dodge!”, but which way? Say the move: «¡Agáchate!» (duck) or «¡Salta!» (jump).' },
    },
    pt: {
      duck: { show: 'Abaixa!', forms: ['abaixa', 'abaixe', 'se abaixa', 'abaixa se', 'se abaixe', 'abaixe se', 'agacha', 'se agacha', 'agache', 'agache se', 'se agache'], half: [], gl: 'duck' },
      jump: { show: 'Pula!', forms: ['pula', 'pule', 'salta', 'salte'], half: [], gl: 'jump' },
      side: ['desvia', 'desvie', 'esquiva', 'esquive', 'se desvia'],
      join: [['e', 'depois'], ['e', 'aí'], ['e'], ['depois']], J: 'e',
      fill: ['já', 'rápido', 'agora', 'vai', 'anda', 'por', 'favor', 'cuidado', 'olha', 'ei'],
      demo: ['Olha! «Por cima!»… e eu me abaixo! Diz pro {name}: «Abaixa!»', 'Look! “Up high!”… and I duck! Tell {name}: “Duck!”'],
      demoMarks: [['me abaixo', 'I duck'], ['Abaixa', 'duck!'], ['Por cima', 'up high']],
      pDodge: ['E olha! Às vezes um boneco gira. Diz pro {name} como desviar: «Abaixa!» ou «Pula!».', 'And look out! Sometimes a dummy spins. Tell {name} how to dodge: “Duck!” or “Jump!”'],
      why: { react: 'Where it hits says the move: «por cima» or «cabeça» (up high) → «Abaixa!» (duck) · «por baixo» or «pés» (down low) → «Pula!» (jump).',
        reactSide: '«Desvia!» is “dodge!”, but which way? Say the move: «Abaixa!» (duck) or «Pula!» (jump).' },
    },
    de: {
      duck: { show: 'Duck dich!', forms: ['duck dich', 'ducke dich', 'bück dich', 'kopf runter', 'runter'], half: ['duck', 'ducke', 'bück', 'ducken'], gl: 'duck' },
      jump: { show: 'Spring!', forms: ['spring', 'springe', 'hüpf', 'hüpfe', 'spring hoch'], half: [], gl: 'jump' },
      side: ['weich aus', 'weiche aus', 'ausweichen'],
      join: [['und', 'dann'], ['und'], ['dann']], J: 'und',
      fill: ['schnell', 'jetzt', 'los', 'bitte', 'hey', 'achtung', 'vorsicht'],
      demo: ['Schau! „Von oben!“ … und ich ducke mich! Sag {name}: „Duck dich!“', 'Look! “From above!”… and I duck! Tell {name}: “Duck!”'],
      demoMarks: [['ducke mich', 'I duck'], ['Duck dich', 'duck!'], ['Von oben', 'from above']],
      pDodge: ['Und Achtung! Manchmal dreht sich eine Puppe. Sag {name}, wie man ausweicht: „Duck dich!“ oder „Spring!“', 'And careful! Sometimes a dummy spins. Tell {name} how to dodge: “Duck!” or “Jump!”'],
      why: { react: 'Where it hits says the move: «von oben» or «Kopf» (from above) → «Duck dich!» (duck) · «von unten» or «Füße» (from below) → «Spring!» (jump).',
        reactSide: '«Weich aus!» is “dodge!”, but which way? Say the move: «Duck dich!» (duck) or «Spring!» (jump).' },
    },
    zh: {
      duck: { show: '[蹲下|dūn xià] ！', forms: ['[蹲下|dūn xià]', '[趴下|pā xià]', '[低头|dī tóu]', '[蹲|dūn]'], gl: 'duck' },
      jump: { show: '[跳|tiào] ！', forms: ['[跳起来|tiào qǐ lái]', '[跳|tiào]', '[蹦|bèng]'], gl: 'jump' },
      side: ['[躲开|duǒ kāi]', '[闪开|shǎn kāi]', '[躲|duǒ]'],
      join: ['[然后|rán hòu]', '[再|zài]', '[接着|jiē zhe]'], J: '[然后|rán hòu]',
      demo: ['[看|kàn] ！ [上面|shàng miàn] ！ … [我|wǒ] [就|jiù] [蹲下|dūn xià] ！ [对|duì] {mimo} [说|shuō] ： [蹲下|dūn xià] ！', 'Look! “Up high!”… so I duck! Tell {name}: “Duck!”'],
      demoMarks: [['[蹲下|dūn xià]', 'duck'], ['[上面|shàng miàn]', 'up high']],
      pDodge: ['[还有|hái yǒu] ， [小心|xiǎo xīn] ！ [稻草人|dào cǎo rén] [有时|yǒu shí] [会|huì] [转|zhuàn] 。 [告诉|gào su] {mimo} [怎么|zěn me] [躲|duǒ] ： [蹲下|dūn xià] [或者|huò zhě] [跳|tiào] ！', 'And watch out! Sometimes a dummy spins. Tell {name} how to dodge: “Duck!” or “Jump!”'],
      why: { react: 'Where it hits says the move: «[上面|shàng miàn]» or «[头|tóu]» (up high) → «[蹲下|dūn xià] ！» (duck) · «[下面|xià miàn]» or «[脚|jiǎo]» (down low) → «[跳|tiào] ！» (jump).',
        reactSide: '«[躲开|duǒ kāi]» is “dodge!”, but which way? Say the move: «[蹲下|dūn xià]» (duck) or «[跳|tiào]» (jump).' },
    },
    ja: {
      duck: { show: 'しゃがんで ！', forms: [['しゃがんで', 1], ['かがんで', 1], ['[伏|ふ]せて', 1], ['しゃがめ', 0], ['[伏|ふ]せろ', 0]], gl: 'duck' },
      jump: { show: '[跳|と]んで ！', forms: [['[跳|と]んで', 1], ['[飛|と]んで', 1], ['ジャンプ して', 1], ['[跳|と]べ', 0], ['[飛|と]べ', 0], ['ジャンプ', 0]], gl: 'jump' },
      side: ['よけて', '[避|よ]けて', 'かわして'],
      join: ['それから', 'そして'], J: '、',
      demo: ['[見|み]て ください 。 「 [上|うえ] ！ 」 … だから しゃがみます ！ {mimo} に は 「 しゃがんで ！ 」 と [言|い]って ください 。', 'Look. “Up high!”… so I crouch! Tell {name}: “Duck!”'],
      demoMarks: [['しゃがみます', 'I crouch'], ['しゃがんで', 'duck'], ['[上|うえ]', 'up high']],
      pDodge: ['それから 、 [気|き] を つけて ！ かかし が [回|まわ]る こと が あります 。 {mimo} に よけかた を [言|い]って ください 。 「 しゃがんで 」 か 「 [跳|と]んで 」 です 。', 'And watch out! Sometimes a dummy spins. Tell {name} how to dodge: “Duck!” or “Jump!”'],
      why: { react: 'Where it hits says the move: «[上|うえ]» or «[頭|あたま]» (up high) → «しゃがんで ！» (duck) · «[下|した]» or «[足|あし]» (down low) → «[跳|と]んで ！» (jump).',
        reactSide: '«よけて» is “dodge!”, but which way? Say the move: «しゃがんで» (duck) or «[跳|と]んで» (jump).' },
    },
  };
  const src = f => (Array.isArray(f) ? f[0] : f);
  // Bruno's practice at the yard (focus 'tac:R'), in tactics.js's tables (H.line reads them)
  const LINES = {
    es: { rHello: ['¡Hoy, a esquivar con palabras! Cuando un muñeco gira, dile a {name} qué hacer.', 'Today: dodging with words! When a dummy spins, tell {name} what to do.'],
      rFast: ['Si lo dices rápido y bien, {name} contraataca.', 'Say it quickly and right, and {name} hits back.'],
      rCounter: ['¿Y con «y»? «¡Agáchate y golpea!»: {name} esquiva y contraataca. ¡Doble!', 'And with «y»? «¡Agáchate y golpea!» (duck and hit): {name} dodges and hits back. Double!'],
      rYou: ['¡Ahora tú! Escucha y di cómo esquivar.', 'Now you! Listen, and say how to dodge.'], rGot: ['¡Bien esquivado!', 'Nicely dodged!'] },
    pt: { rHello: ['Hoje, desviar com palavras! Quando um boneco gira, diz pro {name} o que fazer.', 'Today: dodging with words! When a dummy spins, tell {name} what to do.'],
      rFast: ['Se você falar rápido e certo, o {name} contra-ataca.', 'Say it quickly and right, and {name} hits back.'],
      rCounter: ['E com «e»? «Abaixa e bate!»: o {name} desvia e contra-ataca. Em dobro!', 'And with «e»? «Abaixa e bate!» (duck and hit): {name} dodges and hits back. Double!'],
      rYou: ['Agora você! Escuta e diz como desviar.', 'Now you! Listen, and say how to dodge.'], rGot: ['Boa esquiva!', 'Nice dodge!'] },
    de: { rHello: ['Heute weichen wir mit Wörtern aus! Wenn sich eine Puppe dreht, sag {name}, was zu tun ist.', 'Today: dodging with words! When a dummy spins, tell {name} what to do.'],
      rFast: ['Sagst du es schnell und richtig, schlägt {name} zurück.', 'Say it quickly and right, and {name} hits back.'],
      rCounter: ['Und mit „und“? „Duck dich und schlag!“: {name} weicht aus und schlägt zurück. Doppelt!', 'And with «und»? «Duck dich und schlag!» (duck and hit): {name} dodges and hits back. Double!'],
      rYou: ['Jetzt du! Hör zu und sag, wie man ausweicht.', 'Now you! Listen, and say how to dodge.'], rGot: ['Gut ausgewichen!', 'Nicely dodged!'] },
    zh: { rHello: ['[今天|jīn tiān] [练|liàn] [用|yòng] [话|huà] [躲|duǒ] ！ [稻草人|dào cǎo rén] [一|yī] [转|zhuàn] ， [就|jiù] [告诉|gào su] {mimo} [怎么|zěn me] [做|zuò] 。', 'Today we practice dodging with words! When a dummy spins, tell {name} what to do.'],
      rFast: ['[说|shuō] [得|de] [又|yòu] [快|kuài] [又|yòu] [对|duì] ， {mimo} [就|jiù] [会|huì] [反击|fǎn jī] 。', 'Say it quickly and right, and {name} hits back.'],
      rCounter: ['[用|yòng] [然后|rán hòu] [呢|ne] ？ [蹲下|dūn xià] ， [然后|rán hòu] [打|dǎ] ！ {mimo} [躲开|duǒ kāi] [再|zài] [反击|fǎn jī] ， [两|liǎng] [倍|bèi] ！', 'And with 然后? “Duck, then hit!”: {name} dodges and hits back. Double!'],
      rYou: ['[现在|xiàn zài] [轮到|lún dào] [你|nǐ] [了|le] ！ [听|tīng] [好|hǎo] ， [说|shuō] [怎么|zěn me] [躲|duǒ] 。', 'Your turn! Listen, and say how to dodge.'], rGot: ['[躲|duǒ] [得|de] [好|hǎo] ！', 'Nicely dodged!'] },
    ja: { rHello: ['[今日|きょう] は 、 [言葉|ことば] で よける [練習|れんしゅう] です 。 かかし が [回|まわ]ったら 、 {mimo} に どう する か [言|い]って ください 。', 'Today we practice dodging with words. When a dummy spins, tell {name} what to do.'],
      rFast: ['[早|はや]く [正|ただ]しく [言|い]えば 、 {mimo} が [反撃|はんげき] します 。', 'Say it quickly and right, and {name} hits back.'],
      rCounter: ['て[形|けい] で つなげる と ？ 「 しゃがんで 、 [打|う]って ！ 」 。 {mimo} が よけて 、 [反撃|はんげき] します 。 [二倍|にばい] です ！', 'And chained with the て-form? “Duck, and hit!”: {name} dodges and hits back. Double!'],
      rYou: ['あなた の [番|ばん] です 。 よく [聞|き]いて 、 よけかた を [言|い]って ください 。', 'Your turn. Listen closely, and say how to dodge.'], rGot: ['うまく よけました ！', 'Nicely dodged!'] },
  };
  for (const [l, t] of Object.entries(LINES)) if (T.LX[l]) for (const [k, v] of Object.entries(t)) if (!T.LX[l][k]) T.LX[l][k] = v;
  // the why of a missed dodge, for the review after the fight (flow.js whyOf reads L.why by the mistake's error kinds)
  for (const [l, D] of Object.entries(RX)) { const L = _.LANGS && _.LANGS[l]; if (!L) continue; L.why = L.why || {}; for (const [k, v] of Object.entries(D.why)) if (!L.why[k]) L.why[k] = v; }

  // the word for «duck», for the language engine: taught like a verb (the teach box, flashcards); «salta» is v.jump already
  const DUCK = { id: 'v.duck', kind: 'verb', battle: true, icon: 'duck', en: 'duck', es: 'agáchate', pt: 'abaixa', de: 'duck dich', zh: '[蹲下|dūn xià]', ja: 'しゃがんで',
    alt: { es: ['agáchese', 'agáchense'], pt: ['abaixe', 'se abaixa', 'agacha', 'se agacha'], de: ['ducke dich', 'bück dich', 'runter'], zh: ['[蹲|dūn]', '[趴下|pā xià]'], ja: ['かがんで', '[伏|ふ]せて'] } };
  if (hasLEX() && !LEX.item('v.duck')) LEX.register([DUCK]);
  const ID = { duck: 'v.duck', jump: 'v.jump' };
  // its picture: the battle's (the teach box) and the game's (flashcards, the journal)
  _.UI.ICON.duck = '<svg viewBox="0 0 64 64"><path d="M6 22 Q32 2 58 22" fill="none" stroke="#2b2235" stroke-width="4" stroke-dasharray="3 7" stroke-linecap="round"/><path d="M49 14 L58 22 L47 26" fill="none" stroke="#2b2235" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M14 42 Q8 28 14 24 M50 42 Q56 28 50 24" fill="none" stroke="#2b2235" stroke-width="4" stroke-linecap="round"/><ellipse cx="32" cy="48" rx="21" ry="12" fill="#86f2e8" stroke="#2b2235" stroke-width="3"/><circle cx="25" cy="46" r="2.6" fill="#2b2235"/><circle cx="39" cy="46" r="2.6" fill="#2b2235"/></svg>';
  if (typeof ICONS !== 'undefined' && ICONS.add && ICONS.H && !ICONS.keys.includes('duck')) {
    const Hh = ICONS.H;
    ICONS.add('duck', (c, p) => {
      Hh.shape(c, p, cc => { cc.moveTo(-30, -16); cc.quadraticCurveTo(0, -46, 30, -16); cc.lineTo(26, -10); cc.quadraticCurveTo(0, -36, -26, -10); cc.closePath(); }, '#f2b84a');
      Hh.shape(c, p, Hh.poly([[22, -26], [36, -18], [22, -8]]), '#f2b84a');
      Hh.shape(c, p, Hh.ell(0, 18, 28, 15), '#86f2e8');
      [-17, 17].forEach(x => Hh.shape(c, p, Hh.ell(x, 4, 6, 12, x < 0 ? 0.5 : -0.5), '#86f2e8'));
      if (p) Hh.eyes(c, -8, 8, 16);
    });
  }

  // ------------------------------------------------------------ helpers
  const G0 = () => X().G;
  const rx = () => RX[G0().lang] || RX.es;
  const duckKnown = () => !hasLEX() || LEX.taught('v.duck');
  const chainOn = () => { try { return !!(T.learned && T.learned('Y')); } catch (e) { return false; } };
  const cjOn = () => { const C = CJ(); return !!(C && isC(G0().lang)); };
  const plainOf = s => (cjOn() ? CJ().plain(String(s), { lang: G0().lang, cap: false }) : String(s));
  const html = (s, o) => (cjOn() ? CJ().html(String(s), Object.assign({ lang: G0().lang, cap: false }, o || {})) : esc(s));
  const fill = ([t, en]) => { const n = G0().name || 'Mimo'; return [String(t).replace(/\{name\}/g, n), String(en).replace(/\{name\}/g, n)]; };
  const markH = (t, marks) => { try { return window.FOE_LINES ? FOE_LINES.markHTML(t, marks.map(([w, gl]) => ({ w, gl }))) : html(t); } catch (e) { return html(t); } };
  // English with «words» in the language picked out (zh / ja: through CJK)
  const meanHTML = s => String(s).replace(/\{name\}/g, esc(G0().name || 'Mimo')).replace(/«([^»]+)»/g, (m, w) => `<b class="tl">«${cjOn() && /\[|[ぁ-ヿ㐀-鿿]/.test(w) ? CJ().html(w, { lang: G0().lang, cap: false }) : esc(w)}»</b>`);
  const speak = t => { try { if (typeof UI !== 'undefined' && UI.speak && UI.sayText) UI.speak(UI.sayText(String(t).replace(/\{mimo\}/g, (UI.mimoName || 'Mimo')))); } catch (e) { /* (no voice on this PC) */ } };
  const attackVerb = v => !!v && !['eat', 'sing', 'climb', 'blow', 'call', 'light', 'dig'].includes(v);
  // the counter command, from the dodge: «¡Agáchate y golpea!», «蹲下，然后打！», «しゃがんで、打って！»
  function counterSrc(move = 'duck') {
    const G = G0(), L = G.L, D = rx(), hit = (L.verbs.hit && L.verbs.hit.show) || 'golpea', w = String(D[move].show).replace(/^¡/, '').replace(/\s*[!！]$/, '');
    if (G.lang === 'zh') return `${w} ， ${D.J} ${hit} ！`;
    if (G.lang === 'ja') return `${w} 、 ${hit} ！`;
    return P.wrapS(L, `${w.toLowerCase()} ${D.J} ${hit}`);
  }

  // ------------------------------------------------------------ reading what you typed: the move, and a counter after it
  const fillSets = {};
  const fillSet = l => fillSets[l] || (fillSets[l] = new Set((RX[l].fill || []).map(P.nrm)));
  function readLatin(text) {
    const G = G0(), l = G.lang, D = RX[l] || RX.es, L = G.L, I = P.indexLang(L);
    const toks = P.tokenize(text).filter(t => !(I.voc.has(t.n) || I.fill.has(t.n) || (G.voc && G.voc.has(t.n)) || fillSet(l).has(t.n)));
    if (!toks.length) return { kind: 'empty' };
    const forms = [];
    for (const move of ['duck', 'jump']) { for (const f of D[move].forms) forms.push({ move, seq: P.tokenize(f).map(t => t.n), exact: true }); for (const f of D[move].half || []) forms.push({ move, seq: P.tokenize(f).map(t => t.n), exact: false, half: true }); }
    for (const f of D.side) forms.push({ move: 'side', seq: P.tokenize(f).map(t => t.n), exact: true });
    forms.sort((a, b) => b.seq.length - a.seq.length);
    let hit = null;
    for (let k = 0; k < toks.length && !hit; k++) for (const f of forms) if (f.seq.every((w, j) => toks[k + j] && toks[k + j].n === w)) { hit = { k, len: f.seq.length, move: f.move, exact: f.exact, half: !!f.half }; break; }
    // one letter off (a word of 4 letters or more): still that move, but not exact
    if (!hit) for (let k = 0; k < toks.length && !hit; k++) for (const f of forms) if (f.seq.length === 1 && f.seq[0].length >= 4 && toks[k].n.length >= 4 && P.near1(toks[k].n, f.seq[0])) { hit = { k, len: 1, move: f.move, exact: false, typo: true }; break; }
    if (!hit) return { kind: 'unknown', word: toks[0].raw };
    const out = { kind: hit.move === 'side' ? 'side' : 'move', move: hit.move, exact: hit.exact && hit.k === 0, typo: !!hit.typo, half: !!hit.half, counter: null };
    const rest = toks.slice(hit.k + hit.len);
    if (!rest.length) return out;
    // after it: the joining word and an action is a counter command («y golpea»); an action with no joining word is one too, with a slip
    let j = null;
    for (const seq of D.join) { const n = seq.map(P.nrm); if (n.every((w, i) => rest[i] && rest[i].n === w)) { j = n; break; } }
    const after = j ? rest.slice(j.length) : rest, v = after.length ? P.look(I.verbs, after[0].n) : null;
    if (v && attackVerb(v.key)) out.counter = { joined: !!j, verb: v.key, ok: !!j && !v.typo, raw: after[0].raw };
    else out.exact = false;              // (something else after it: still the move, not exact)
    return out;
  }
  // zh / ja: no spaces, so each word is found unit by unit (CJK.typed / matchAt, like LEX.heard); fillers around it don't matter
  function readCJK(text) {
    const G = G0(), l = G.lang, D = RX[l], C = CJ(), L = G.L;
    let typed; try { typed = C.typed(text, l); } catch (e) { return { kind: 'unknown', word: text }; }
    const U = typed.U || [];
    if (!U.length) return { kind: 'empty' };
    const find = (list, from = 0) => {
      let best = null;
      for (const f of list) {
        const s = src(f), w = C.wordOf(s, l);
        for (let i = from; i < U.length; i++) { const m = C.matchAt(w, U, i, l); if (m) { if (!best || i < best.i || (i === best.i && m.j > best.j)) best = { i, j: m.j, f }; break; } }
      }
      return best;
    };
    let hit = null;
    for (const [move, list] of [['duck', D.duck.forms], ['jump', D.jump.forms], ['side', D.side]]) { const f = find(list); if (f && (!hit || f.i < hit.i || (f.i === hit.i && f.j > hit.j))) hit = Object.assign({ move }, f); }
    if (!hit) return { kind: 'unknown', word: String(text).trim() };
    const out = { kind: hit.move === 'side' ? 'side' : 'move', move: hit.move, exact: true, counter: null };
    const verbs = [];
    for (const [k, v] of Object.entries(L.verbs || {})) if (attackVerb(k)) for (const [w] of v.cj || []) verbs.push({ key: k, w });
    let vb = null;
    for (const x of verbs) { const f = find([x.w], hit.j); if (f && (!vb || f.i < vb.i)) vb = Object.assign({ key: x.key }, f); }
    if (vb) {
      const j = find(D.join, hit.j), joinedWord = !!(j && j.i < vb.i);
      const te = l === 'ja' && Array.isArray(hit.f) && hit.f[1] === 1;
      const joined = l === 'ja' ? te || joinedWord : joinedWord;
      out.counter = { joined, verb: vb.key, ok: joined };
    }
    return out;
  }
  const read = text => (isC(G0().lang) && CJ() ? readCJK(text) : readLatin(text));
  // what it does: { grade, code (the move Mimo makes), pop, ok, extra (a counter command), mistake }
  function verdict(r, need, quick, text) {
    const D = rx(), right = plainOf(D[need].show), code = need === 'duck' ? 'ArrowDown' : 'ArrowUp';
    const mis = kind => ({ kind: 'grammar', typed: text, right, errors: [kind] });
    if (r.kind === 'side') return { grade: 'miss', code: null, pop: 'WHICH WAY?', ok: false, note: `Which way? «${D[need].show}» (${D[need].gl})`, mistake: mis('reactSide') };
    if (r.move !== need) return { grade: 'wrong', code: r.move === 'duck' ? 'ArrowDown' : 'ArrowUp', pop: 'WRONG WAY', ok: false, note: `That way it hits you! «${D[need].show}» (${D[need].gl})`, mistake: mis('react') };
    if (r.counter && chainOn()) {
      if (!r.counter.ok || !r.exact) return { grade: 'miss', code: null, pop: 'CHAIN BROKEN', ok: false, note: `A slip in a two-part reaction: nothing happens. «${counterSrc(need)}»`, mistake: Object.assign(mis('join'), { right: plainOf(counterSrc(need)) }) };
      return { grade: 'perfect', code, pop: 'PERFECT!', ok: true, extra: 1, counter: true };
    }
    if (r.exact && quick) return { grade: 'perfect', code, pop: 'PERFECT!', ok: true };
    return { grade: 'good', code, pop: 'DODGE!', ok: true, note: r.exact ? 'A dodge. Say it quicker to counter!' : `A dodge. Exactly: «${D[need].show}»` };
  }

  // ------------------------------------------------------------ the box
  const S = { el: null, inp: null, armed: false, live: false, done: true, answered: false, res: null, T: 0, t0: 0, key: null, need: null, where: null, o: null,
    slow: 1, early: null, extra: 0, forced: null, fleeNext: false, band: 1, w: 6, autoT: 0, ring: false };
  const css = () => {
    if (document.getElementById('rx-css')) return;
    const s = document.createElement('style'); s.id = 'rx-css';
    s.textContent = `#battle-ui .bt-react { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); width: min(760px, calc(100vw - 32px)); pointer-events: auto; display: flex; flex-direction: column; gap: 6px; padding: 9px 14px 10px; background: rgba(255,250,240,.98); border: 3px solid #2b2235; border-radius: 18px; box-shadow: 0 6px 0 rgba(43,34,53,.22); z-index: 6; }
#battle-ui .bt-react.live { border-color: #b8403a; box-shadow: 0 0 0 4px rgba(255,209,102,.6), 0 6px 0 rgba(43,34,53,.22); }
#battle-ui .bt-react.ok { border-color: #21a493; } #battle-ui .bt-react.bad { border-color: #8a7f96; }
#battle-ui .bt-react .rx-top { display: flex; align-items: center; gap: 10px; }
#battle-ui .bt-react .rx-tag { background: #b8403a; color: #fff; font-weight: 900; border-radius: 10px; padding: 3px 10px; font-size: 15px; white-space: nowrap; }
#battle-ui .bt-react.ok .rx-tag { background: #21a493; }
#battle-ui .bt-react .rx-q { font-weight: 800; font-size: 16px; flex: 1; line-height: 1.3; }
#battle-ui .bt-react .rx-map { display: block; font-size: 14px; font-weight: 700; color: #4a4560; }
#battle-ui .bt-react .rx-map q { quotes: none; color: #b8403a; font-weight: 900; }
#battle-ui .bt-react .rx-bar { flex: 0 0 150px; height: 12px; border: 2px solid #2b2235; border-radius: 8px; overflow: hidden; background: #efe6d4; }
#battle-ui .bt-react .rx-bar i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #ff9b88, #ffd166); }
#battle-ui .bt-react:not(.live) .rx-bar { opacity: .35; }
#battle-ui .bt-react .rx-row { display: flex; gap: 8px; align-items: center; }
#battle-ui .bt-react .rx-in { flex: 1; min-width: 0; font: inherit; font-size: 26px; font-weight: 800; color: #2b2235; background: #fff; border: 3px solid #2b2235; border-radius: 12px; padding: 5px 12px; outline: none; }
#battle-ui .bt-react .rx-in:focus { box-shadow: 0 0 0 4px rgba(184,64,58,.25); }
#battle-ui .bt-react .rx-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
#battle-ui .bt-react .rx-chip { font-size: 18px; padding: 2px 12px; border: 3px dashed #21a493; background: rgba(233,251,248,.95); color: #17695f; box-shadow: none; }
#battle-ui .bt-react .rx-chip small { font-weight: 700; color: #4b4257; margin-left: 6px; font-size: 13px; }
#battle-ui .bt-react .rx-chip.hint { border-style: dotted; color: #6b6275; cursor: help; }
#battle-ui .bt-react .rx-chip.ctr { border-color: #c97a1d; color: #8a4f0c; background: rgba(255,243,214,.95); }
#battle-ui .bt-react .rx-note { font-size: 14px; font-weight: 800; color: #4a4560; text-align: center; }
#battle-ui .bt-react .rx-note:empty { display: none; }
#battle-ui .bt-react .rx-note b.tl, #battle-ui .bt-react .rx-q b.tl { color: #b8403a; }`;
    document.head.appendChild(s);
  };
  function build() {
    const x = X(), root = x.UI.U.root; if (!root) return null;
    css();
    const el = document.createElement('div'); el.className = 'bt-react'; el.hidden = true;
    el.innerHTML = '<div class="rx-top"><span class="rx-tag">⚡ Dodge!</span><span class="rx-q"></span><span class="rx-bar"><i></i></span></div>'
      + '<div class="rx-row"><input class="rx-in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-noacc><button class="rx-go" title="Enter">Say it ⏎</button></div>'
      + '<div class="rx-chips"></div><div class="rx-note"></div>';
    root.appendChild(el);
    const inp = el.querySelector('.rx-in'), C = CJ(), l = x.G.lang;
    if (C && isC(l) && C.isCJK && C.isCJK(l)) { try { inp.setAttribute('lang', C.tag(l, 'chars')); C.attachIME(inp); } catch (e) { /* */ } }
    inp.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') { ev.preventDefault(); submit(inp.value); }
      else if (ev.key === 'Tab' || ev.key === 'Escape') ev.preventDefault();
    });
    inp.addEventListener('keyup', ev => ev.stopPropagation());
    inp.addEventListener('focus', () => { if (typeof Input !== 'undefined') Input.typing = true; });
    inp.addEventListener('blur', () => { if (typeof Input !== 'undefined') Input.typing = false; });
    el.querySelector('.rx-go').onclick = () => submit(inp.value);
    el.querySelector('.rx-chips').addEventListener('click', ev => { const b = ev.target.closest('button[data-t]'); if (!b) return; inp.value = b.dataset.t; focus(); });
    el.addEventListener('pointerdown', ev => { if (!ev.target.closest('button, input')) setTimeout(focus, 0); });
    S.el = el; S.inp = inp;
    return el;
  }
  function focus() { const x = X(); if (!S.inp || S.el.hidden || (x.UI.U && x.UI.U.noFocus)) return; try { S.inp.focus({ preventScroll: true }); } catch (e) { S.inp.focus(); } }
  const note = h => { if (S.el) S.el.querySelector('.rx-note').innerHTML = h ? meanHTML(h) : ''; };
  const bar = k => { if (S.el) S.el.querySelector('.rx-bar i').style.width = Math.round(100 * clamp(k, 0, 1)) + '%'; };
  function drawQ() {
    const x = X(), G = x.G, D = rx(), q = S.el.querySelector('.rx-q');
    const total = st('x.react.total').n || 0, beginner = !!G.tutorial || total < 4 || G.turn <= 2;
    const dw = G.L.dodgeWords ? G.L.dodgeWords(G.tier) : { high: '↑', low: '↓' };
    let h = S.live ? `It’s coming! Tell ${esc(G.name)} how to dodge` : `Listen… then tell ${esc(G.name)} how to dodge`;
    if (beginner) {
      const parts = [];
      if (duckKnown() || !G.tutorial) parts.push(`<q>«${html(dw.high)}»</q> up high → <q>«${html(D.duck.show)}»</q>`);
      parts.push(`<q>«${html(dw.low)}»</q> down low → <q>«${html(D.jump.show)}»</q>`);
      h += `<span class="rx-map">${parts.join(' · ')}</span>`;
    }
    q.innerHTML = h;
  }
  // the words to say, while they're new: the whole word with its meaning, then its first letter, then nothing
  function drawChips() {
    const x = X(), G = x.G, D = rx(), box = S.el.querySelector('.rx-chips'), out = [];
    for (const mv of ['duck', 'jump']) {
      if (mv === 'duck' && !duckKnown() && G.tutorial) continue;             // (Bruno's first fight: ducking comes on the second turn)
      const n = st('x.react.n.' + mv).n || 0, taught = mv === 'duck' ? duckKnown() : x.knows('v.jump');
      const s0 = D[mv].show;
      if (!taught || n < 3) out.push(`<button class="rx-chip" data-t="${esc(plainOf(s0))}">${html(s0)}<small>${esc(D[mv].gl)}</small></button>`);
      else if (n < 6) out.push(`<button class="rx-chip hint" title="${esc(D[mv].gl)}">${esc(plainOf(s0).replace(/^[¡¿]/, '').charAt(0))}…<small>${esc(D[mv].gl)}</small></button>`);
    }
    if (chainOn() && (st('x.react.n.ctr').n || 0) < 3) out.push(`<button class="rx-chip ctr" data-t="${esc(plainOf(counterSrc('duck')))}">${html(counterSrc('duck'))}<small>dodge + hit back ×2</small></button>`);
    box.innerHTML = out.join('');
    box.hidden = !out.length;
  }
  function windowSecs(G) {
    let w = WIN[clamp(S.band | 0, 0, 4)];
    if (isC(G.lang) && CJ() && CJ().mode && CJ().mode(G.lang) === 'chars') w += 1.5;     // (picking characters takes longer)
    if ((st('x.react.total').n || 0) < 3) w += 1.5;                                       // (your first few)
    return w;
  }
  // a foe is about to attack: the box opens (dodgeHint(true)), so you can answer as soon as you've read its shout
  function arm() {
    const x = X(); if (!x || !x.G.running) return false;
    if (!S.el || !S.el.isConnected) build();
    if (!S.el) return false;
    if (S.res && !S.done) return true;               // (a window is already open)
    Object.assign(S, { armed: true, live: false, done: true, answered: false, early: null, slow: 1, t0r: performance.now() });
    S.el.classList.remove('live', 'ok', 'bad'); S.el.hidden = false;
    S.el.querySelector('.rx-tag').textContent = '⚡ Dodge!';
    S.inp.value = ''; S.inp.disabled = false; S.inp.placeholder = `how should ${x.G.name} dodge?`;
    note(''); bar(1); drawQ(); drawChips();
    x.UI.dodge(null);
    focus();
    const A = api.auto; S.autoT = A && A.armed ? performance.now() : 0;
    return true;
  }
  function close() {
    S.armed = false;
    if (S.el) { S.el.hidden = true; S.el.classList.remove('live', 'ok', 'bad'); }
    if (S.inp && document.activeElement === S.inp) S.inp.blur();
    if (typeof Input !== 'undefined') Input.typing = false;
  }
  // the attack's window (flow.js timingWindow, for ↑ / ↓): resolves 'perfect' | 'good' | 'wrong' | 'late' | 'miss' at the impact T
  function open(T0, key, where, o = {}) {
    const x = X(), G = x.G;
    if (S.forced) { S.forced.tbHigh = null; S.forced = null; }
    if (S.res && !S.done) finish('miss', '');
    const A = api.auto, m = !A && G.auto && (G.auto.dodge || G.auto.timing);       // (the autopilot, or a move foreseen in the Future: on time by itself)
    if (!m && (!S.armed || !S.el || !S.el.isConnected || S.el.hidden)) arm();
    return new Promise(res => {
      Object.assign(S, { T: T0, key, where, o, res, need: key === 'ArrowDown' ? 'duck' : 'jump', t0: G.t, live: true, done: false, answered: false, extra: 0 });
      if (m) { close(); if (m === 'perfect') schedule('perfect', key, ''); else if (m === 'wrong') schedule('wrong', key === 'ArrowUp' ? 'ArrowDown' : 'ArrowUp', ''); else schedule('miss', null, ''); return; }
      if (!S.el) { schedule('miss', null, ''); return; }
      S.armed = false;
      S.w = windowSecs(G);
      S.slow = clamp((T0 - G.t) / S.w, 0.02, 1);
      S.el.classList.add('live');
      S.el.querySelector('.rx-tag').textContent = '⚡ Dodge!';
      drawQ();
      if (where) { x.UI.ring({ where, T: T0, keyHTML: '' }); S.ring = true; }
      if (A && !A.armed) S.autoT = performance.now();
      if (S.early) { const e = S.early; S.early = null; answer(e.text, true); }
      else focus();
    });
  }
  // the move at T - LEAD (so the duck or the jump meets the hit), the result at T, both on the game clock
  function schedule(grade, code, pop) {
    const x = X(), G = x.G, tok = S.res;
    S.answered = true; S.slow = 1;
    const left = Math.max(0, S.T - G.t);
    if (code && S.o && S.o.onPress) x.wait(Math.max(0, left - LEAD)).then(() => { if (S.res === tok && !S.done) try { S.o.onPress(code, grade); } catch (e) { console.error('[react] move', e); } });
    x.wait(left).then(() => { if (S.res === tok && !S.done) finish(grade, pop); });
  }
  const POPC = { perfect: '#ffd166', good: '#8ff0e2' };
  function finish(grade, pop) {
    const x = X(), G = x.G; if (S.done || !S.res) return;
    S.done = true; S.live = false; S.slow = 1;
    const res = S.res; S.res = null;
    if (S.ring) { x.UI.ringHide(); S.ring = false; }
    try {
      const p = S.where ? S.where() : null;
      if (pop && p) x.UI.pop(p.clone().add(new THREE.Vector3(0, 0.7, 0)), pop, G.t, { color: POPC[grade] || '#d9d1e2', size: grade === 'perfect' ? 38 : 30, rise: 0.5, life: 1.0 });
      if (grade === 'perfect') { G.stats.perfect++; x.emit('perfect'); if (p) x.ST.S.fx.sparkle(p.x, p.y, p.z, 14, ['#ffd166', '#fff3a0']); }
      else if (grade !== 'good') x.emit('miss');
    } catch (e) { console.error('[react] finish', e); }
    close();
    res(grade);
  }
  function submit(text) {
    const x = X(); if (!x || !x.G.running) return;
    text = String(text == null ? '' : text).trim(); if (!text) return;
    if (S.armed && !S.live) {                          // before it lunges: kept, and used the moment the window opens
      const r = read(text);
      if (!r || r.kind === 'empty') return;
      if (r.kind === 'unknown') { unknown(r); return; }
      S.early = { text }; S.inp.value = '';
      note(`Ready: «${text.replace(/[«»<>&]/g, '')}»`);
      return;
    }
    if (!S.live || S.answered || S.done) return;
    answer(text, false);
  }
  function unknown(r) {
    const D = rx(), x = X();
    note(`${esc(x.G.name)} doesn’t know «${String(r && r.word || '…').replace(/[«»<>&]/g, '')}». Duck: «${D.duck.show}» · jump: «${D.jump.show}»`);
    const row = S.el.querySelector('.rx-row'); row.style.animation = 'none'; void row.offsetWidth; row.style.animation = 'bt-nudge .3s';
    S.inp.select();
  }
  function answer(text, early) {
    const x = X(), G = x.G;
    const r = read(text);
    if (!r || r.kind === 'empty') return;
    if (r.kind === 'unknown') { unknown(r); return; }           // (keep listening: the window goes on)
    const frac = early ? 0 : (G.t - S.t0) / Math.max(0.001, S.T - S.t0);
    const v = verdict(r, S.need, frac <= QUICK, text);
    x.say(x.A.you, text, { cls: 'you', dur: 1.6 });
    S.inp.value = ''; S.inp.disabled = true;
    S.el.classList.add(v.ok ? 'ok' : 'bad');
    S.el.querySelector('.rx-tag').textContent = v.ok ? (v.grade === 'perfect' ? '✦ Perfect!' : '✓ Dodge!') : '✗ ' + v.pop.charAt(0) + v.pop.slice(1).toLowerCase();
    note(v.note || '');
    // the word is a retrieval, like any command's (wrong only when the word itself was misspelled)
    try {
      if (r.kind === 'move' && hasLEX() && LEX.item(ID[r.move])) LEX.attempt(ID[r.move], { ok: !r.typo, hints: 0, ms: Math.max(800, (performance.now() - (S.t0r || performance.now()))), mode: 'command' });
      st('x.react.total').n = (st('x.react.total').n || 0) + 1;
      if (v.ok && r.kind === 'move') { const s1 = st('x.react.n.' + r.move); s1.n = (s1.n || 0) + 1; if (v.counter) { const s2 = st('x.react.n.ctr'); s2.n = (s2.n || 0) + 1; } }
      G.stats.reacts = G.stats.reacts || { n: 0, ok: 0, perfect: 0 }; G.stats.reacts.n++; if (v.ok) G.stats.reacts.ok++; if (v.grade === 'perfect') G.stats.reacts.perfect++;
    } catch (e) { console.error('[react] note', e); }
    if (v.extra) S.extra = v.extra;
    if (v.mistake) x.noteMistake(v.mistake);
    schedule(v.grade, v.code, v.pop);
  }
  // every frame (from BATTLE.update): the bar, the end of the window, tests, and a flight asked for while Mimo was learning
  function tick() {
    const x = X(); if (!x || !x.G.running) return;
    const G = x.G;
    if (S.fleeNext && G.pending && G.pending.kind === 'command') { S.fleeNext = false; const p = G.pending; G.pending = null; x.UI.promptHide(); p.res(x.FLEE); return; }
    if (S.armed && !S.live && G.pending) close();          // (the box opened, but no attack came)
    if (S.live && S.res && !S.answered && !S.done) {
      bar((S.T - G.t) / Math.max(0.001, S.T - S.t0));
      if (G.t >= S.T) { finish('late', 'TOO LATE'); return; }
    }
    const A = api.auto;
    const due = A && S.autoT && (A.at != null && !A.armed ? S.live && (G.t - S.t0) / Math.max(0.001, S.T - S.t0) >= A.at : performance.now() - S.autoT >= (A.after || 0) * 1000);   // (at: a share of the window, on the game clock)
    if (due && ((A.armed && S.armed) || (S.live && !S.answered))) {
      S.autoT = 0;
      const need = S.need || 'duck', D = rx(), other = need === 'duck' ? 'jump' : 'duck';
      if (A.text === 'late') return;
      const t = A.text === 'right' || !A.text ? plainOf(D[need].show) : A.text === 'wrong' ? plainOf(D[other].show) : A.text === 'side' ? plainOf(src(D.side[0])) : A.text === 'counter' ? plainOf(counterSrc(need)) : A.text;
      if (S.armed && !S.live && A.armed) { const r = read(t); if (r && r.kind !== 'unknown') { S.early = { text: t }; note(`Ready: «${t.replace(/[«»<>&]/g, '')}»`); } return; }
      submit(t);
    }
  }
  // time slows while the window is open (the game clock only: the camera and the box keep real time)
  const up0 = B.update;
  B.update = function (dt, input) {
    const k = S.live && S.res && !S.answered && !S.done ? S.slow : 1;
    up0.call(this, (dt || 0) * k, input);
    try { tick(); } catch (e) { console.error('[react] tick', e); }
  };

  // ------------------------------------------------------------ the hooks flow.js calls
  // dodgeHint(on): the box instead of the ↑ / ↓ strip
  function hint(on) {
    if (!verbal()) return false;
    const x = X(); if (!x || !x.G.running) return false;
    x.UI.dodge(null);
    if (on) arm(); else if (!(S.res && !S.done)) close();
    return true;
  }
  // dodgeTip(): what the first lesson says before the first attack
  function tip() {
    if (!verbal()) return null;
    const x = X(), G = x.G, D = rx(), dw = G.L.dodgeWords(G.tier);
    const duck = duckKnown() ? `«${dw.high}» = high → «${D.duck.show}» (duck) · ` : '';
    return `Foes shout where they’ll hit: ${duck}«${dw.low}» = low → «${D.jump.show}» (jump). When one attacks, a box pops up and time slows down: type it there.${duckKnown() ? '' : ' (Ducking comes next.)'}`;
  }
  // dodgeResult's counter: one more for a counter command said out loud
  function extra() { const n = S.extra || 0; S.extra = 0; return n; }

  // ------------------------------------------------------------ teaching «¡Agáchate!» before it's needed
  function box(h, who) {
    const x = X(), F = x.G;
    x.UI.coach(h, '', '', true, who);
    const tok = {}; F.coachTok = tok;
    return new Promise(res => {
      F.coachNext = () => { if (F.coachTok !== tok) return; F.coachNext = null; F.coachTok = null; x.UI.coachHide(); res(); };
      if (F.auto && F.auto.dialog) x.wait(0.35).then(() => { if (F.coachTok === tok && F.coachNext) F.coachNext(); });
    });
  }
  const meaning = () => {
    const G = G0(), D = rx(), dw = G.L.dodgeWords(G.tier);
    return `When a foe shouts «${dw.high}» (up high), tell {name} «${D.duck.show}» (duck). «${dw.low}» (down low): «${D.jump.show}» (jump). When it attacks, a box pops up and time slows down: type it there. Quick and exact, and {name} hits back!`;
  };
  let teaching = false;
  async function teachDuck() {
    const x = X(), G = x.G, D = rx(), A = x.A;
    if (teaching || duckKnown()) return;
    teaching = true;
    try {
      const coach = A.coach && !A.coach.hidden, foe = x.targetable().find(f => f.alive && !f.gone && !f.shy);
      x.UI.tip(null); x.UI.dodge(null); close();
      let demo = '';
      if (coach) {
        // Bruno says it, whole in the language, and ducks
        x.ST.shot('coach');
        const [t, en] = fill(D.demo);
        demo = markH(t, D.demoMarks);
        x.say(A.coach, demo, { cls: 'coach', html: true, en, dur: 3.4 });
        speak(t);
        await x.wait(1.1);
        await x.dodgeMove(A.coach, 'ArrowDown');
        await x.wait(0.5);
      } else if (foe) {
        // a foe shouts where it'll hit, and Mimo ducks on its own
        const [t, en] = G.L.shout(1, true, true), dw1 = G.L.dodgeWords(1);
        x.ST.shot('action', foe, A.mimo, { yaw: 0.05, up: 0.2 });
        x.setMood(foe, 'go', 1.4);
        demo = markH(t, [[dw1.high, 'up high']]);
        x.say(foe, demo, { cls: 'foe shout', html: true, en, dur: 2.6 });
        x.emit('shout', { text: t, foe, demo: true });
        await x.wait(1.0);
        x.setMood(A.mimo, 'duck', 0.6);
        await x.dodgeMove(A.mimo, 'ArrowDown');
        await x.wait(0.4);
        x.setMood(foe, 'idle');
      }
      x.ST.shot('wide');
      x.emit('teach-ok');
      await box(`${demo ? `<div class="fl-demo">${demo}</div>` : ''}<div class="fl-demo">${html(D.duck.show)} <span class="gl">(duck)</span> · ${html(D.jump.show)} <span class="gl">(jump)</span></div><div class="fl-mean">${meanHTML(meaning())}</div>`, 'New · Dodge out loud');
      // copy it, then teach it from memory (the battle's prompts: zh / ja with the IME and «?»)
      const ans = D.duck.show, word = plainOf(ans).replace(/^¡/, '').replace(/\s*[!！]$/, '');
      const r1 = await x.ask('echo', { answer: ans, id: 'v.duck', hint: `A new word: «${word}» = duck. Copy it.` });
      if (r1 && r1.flee) { S.fleeNext = true; return; }
      const pr = x.ask('echo', { answer: ans, id: 'v.duck', hint: `Now from memory: it comes «${plainOf(G.L.dodgeWords(G.tier).high)}» (up high). What do you tell ${G.name}?` });
      try {
        const e = x.UI.U.e;
        e.echo.hidden = true; e.plabel.textContent = `Teach ${G.name}`;
        e.icon.innerHTML = x.UI.iconFor('v.duck'); e.icon.hidden = false; e.input.placeholder = 'from memory…';
      } catch (er) { /* */ }
      x.ST.shot('party');
      const r2 = await pr;
      if (r2 && r2.flee) { S.fleeNext = true; return; }
      if (hasLEX()) LEX.attempt('v.duck', { ok: true, hints: 0, ms: 4000, mode: 'teach' });
      // Mimo has it: a duck, a glow, and the word
      const M = A.mimo, p = x.ST.worldOf(M, 'top');
      M.glow = 1; x.tween(M, { glow: 0 }, 1.6); x.setMood(M, 'happy', 2);
      x.ST.S.fx.sparkle(p.x, p.y, p.z, 20, ['#7ff7ea', '#fff3a0']);
      x.emit('learn', { id: 'v.duck' });
      await x.dodgeMove(M, 'ArrowDown');
      x.say(M, D.duck.show, { cls: 'mimo', dur: 2 });
      x.UI.toast(`${esc(G.name)} learned «${esc(plainOf(D.duck.show).replace(/^¡/, '').replace(/[!！]\s*$/, '').trim())}»`, G.t);
      st('x.react.intro').t = Date.now();
      await x.wait(0.8);
      x.ST.shot('wide');
    } catch (e) {
      if (e && e.flee) S.fleeNext = true; else console.error('[react] teach', e);
    } finally { teaching = false; }
  }
  // before your turn (fightLoop and the yard's lesson loop): «¡Agáchate!» the first time a fight could need it
  T.turnHooks.push(async () => {
    const x = X(), G = x.G;
    if (!verbal() || !G.running || duckKnown() || S.fleeNext) return;
    if (G.tutorial && G.tutorial !== 'verbs') return;
    if (G.tutorial === 'verbs' && G.turn < 2) return;             // (the first attack of Bruno's first lesson is a low one: «¡Salta!»)
    if (!x.knows('v.jump') || !x.targetable().some(f => f.alive && !f.gone && !f.shy)) return;
    await teachDuck();
  });
  // Bruno's first lesson: its first attack goes low (jump, a word Mimo has), the first one after «¡Agáchate!» goes high
  const fa0 = T.foeAttack;
  T.foeAttack = async f => {
    try {
      const G = X().G;
      if (verbal() && G.tutorial === 'verbs' && f && f.alive && !f.calmed && !f.shy && !f.gone && !(f.states && f.states.has('asleep'))) {
        if (!duckKnown()) { f.tbHigh = false; S.forced = f; }
        else if (!G.rxHigh) { G.rxHigh = true; f.tbHigh = true; S.forced = f; }
      }
    } catch (e) { console.error('[react] foeAttack', e); }
    return fa0 ? fa0(f) : false;
  };
  T.beginHooks.push(() => {
    const G = X().G;
    Object.assign(S, { armed: false, live: false, done: true, answered: false, res: null, early: null, slow: 1, extra: 0, forced: null, fleeNext: false, ring: false, el: null, inp: null });
    G.rxHigh = false;
    try { S.band = typeof DICT !== 'undefined' && DICT.bands ? DICT.bands(G.lang).overall : Math.max(0, (G.tier || 1) - 1); } catch (e) { S.band = Math.max(0, (G.tier || 1) - 1); }
  });

  // ------------------------------------------------------------ the old texts, said the new way (the ↑ / ↓ ones stay for the keys)
  function verbalize(s, l) {
    const D = RX[l] || RX.es, dk = `«${D.duck.show}»`, jp = `«${D.jump.show}»`;
    return String(s)
      .replace(/Duck <kbd>↓<\/kbd>/g, `Duck (${dk})`).replace(/duck <kbd>↓<\/kbd>/g, `${dk} (duck)`).replace(/jump <kbd>↑<\/kbd>/g, `${jp} (jump)`)
      .replace(/duck ↓/g, `${dk} (duck)`).replace(/jump ↑/g, `${jp} (jump)`)
      .replace(/Press it (right )?as the hit lands\./g, 'Say it in the box that pops up: time slows down for you.')
      .replace(/Dodge both, in that order:/g, 'Say both, in that order:');
  }
  const swap = (o, k, fn) => {
    if (!o) return;
    let v0 = o[k];
    try { Object.defineProperty(o, k, { configurable: true, enumerable: true, get() { return verbal() ? fn(v0) : v0; }, set(v) { v0 = v; } }); } catch (e) { /* */ }
  };
  for (const l of Object.keys(RX)) {
    const L = _.LANGS && _.LANGS[l]; if (!L) continue;
    const D = RX[l];
    swap(L, 'cmdHint', () => `Enter = send · Space at the hit = PERFECT · when they attack: say «${D.duck.show}» or «${D.jump.show}»${isC(l) ? ' · ? = an example' : ''}`);
    if (L.t) swap(L.t, 'pDodge', () => D.pDodge);
    if (L.tips && L.tips.armaBoss) swap(L.tips, 'armaBoss', v => verbalize(v, l));
  }
  if (window.FOE_LINES && FOE_LINES.TEACH) for (const [l, kinds] of Object.entries(FOE_LINES.TEACH)) for (const T0 of Object.values(kinds)) if (T0 && T0.mean) swap(T0, 'mean', v => verbalize(v, l));

  // ------------------------------------------------------------ the yard's practice: «Dodge out loud» (focus 'tac:R')
  T.INFO.R = { name: 'Dodge out loud', sub: 'duck or jump when they attack, and hit back', wait: 'after Bruno’s first lesson' };
  if (!T.KEYS.includes('R')) T.KEYS.splice(Math.max(0, T.KEYS.indexOf('A') + 1), 0, 'R');
  const un0 = T.unlocked;
  T.unlocked = k => {
    if (k !== 'R') return un0(k);
    if (T.force != null) return T.force.includes(k);
    const g = _.RW && _.RW.game, s = g && g.state;
    return !!(s && s.flags && (s.flags.lessons || 0) >= 1);
  };
  const DEMO = BATTLE._.tacDemo || (BATTLE._.tacDemo = {});
  DEMO.R = {
    es: '¡Mira! Si un muñeco grita «¡Por arriba!», me agacho: «¡Agáchate!». Si grita «¡Por abajo!», salto: «¡Salta!». Y si lo dices rápido y bien, {mimo} contraataca.',
    pt: 'Olha! Se um boneco gritar «Por cima!», eu me abaixo: «Abaixa!». Se gritar «Por baixo!», eu pulo: «Pula!». E se você falar rápido e certo, o {mimo} contra-ataca.',
    de: 'Schau! Ruft eine Puppe „Von oben!“, ducke ich mich: „Duck dich!“. Ruft sie „Von unten!“, springe ich: „Spring!“. Und sagst du es schnell und richtig, schlägt {mimo} zurück.',
    zh: '[看|kàn] ！ [稻草人|dào cǎo rén] [喊|hǎn] [上面|shàng miàn] ， [我|wǒ] [就|jiù] [蹲下|dūn xià] 。 [喊|hǎn] [下面|xià miàn] ， [我|wǒ] [就|jiù] [跳|tiào] 。 [说|shuō] [得|de] [又|yòu] [快|kuài] [又|yòu] [对|duì] ， {mimo} [就|jiù] [会|huì] [反击|fǎn jī] ！',
    ja: '[見|み]て ください 。 かかし が 「 [上|うえ] ！ 」 と [叫|さけ]んだら 、 しゃがみます 。 「 [下|した] ！ 」 なら 、 [跳|と]びます 。 [早|はや]く [正|ただ]しく [言|い]えば 、 {mimo} が [反撃|はんげき] します 。',
    en: 'Look! If a dummy shouts “Up high!”, I duck: “Duck!”. If it shouts “Down low!”, I jump: “Jump!”. And if you say it quickly and right, {mimo} hits back.',
    marks: { es: [['me agacho', 'I duck'], ['Agáchate', 'duck!'], ['salto', 'I jump'], ['contraataca', 'hits back']], pt: [['me abaixo', 'I duck'], ['Abaixa', 'duck!'], ['pulo', 'I jump'], ['contra-ataca', 'hits back']],
      de: [['ducke ich mich', 'I duck'], ['Duck dich', 'duck!'], ['springe ich', 'I jump'], ['schlägt', 'hits'], ['zurück', 'back']], zh: [['[蹲下|dūn xià]', 'duck'], ['[跳|tiào]', 'jump'], ['[反击|fǎn jī]', 'hit back']],
      ja: [['しゃがみます', 'I crouch'], ['[跳|と]びます', 'I jump'], ['[反撃|はんげき]', 'hitting back']] },
  };
  T.specsHooks.push((specs, opts) => {
    if (!opts.practice || opts.focus !== 'tac:R') return;
    const x = X(); specs.length = 0;
    for (const s of [{ kind: 'dummy', color: 'red', size: 'small', hp: 12 }, { kind: 'dummy', color: 'blue', size: 'small', hp: 12 }]) specs.push(x.normFoe(s, specs.length));
  });
  // a dummy's swing at you, every turn of the practice (like flow.js dummySwing: the shout, its arms, then the spin)
  async function swing(x, G, f) {
    const A = x.A, toMimo = Math.random() < 0.5, tgt = toMimo ? A.mimo : A.you;
    const high = api.swingDir ? api.swingDir === 'high' : Math.random() < 0.5;
    const [txt, en] = G.L.shout(G.tier, toMimo, high);
    x.ST.shot('action', f, tgt, { yaw: 0.04, up: 0.15 });
    x.say(f, txt, { cls: 'foe shout', en, dur: x.readTime(txt) + 2.6 });
    x.emit('swing', { text: txt, high });
    x.dodgeHint(true);
    x.setMood(f, 'go', 4);
    f.swing = f.swing || 0;
    await x.tween(f, { swing: high ? 1 : -1 }, 0.5, 'io');
    await x.wait(x.readTime(txt) + 0.4);
    const x0 = f.x, z0 = f.z, ex = tgt.x + 1.0, ez = tgt.z + 0.05;
    const tp = x.timingWindow(G.t + 1.2, high ? 'ArrowDown' : 'ArrowUp', () => x.ST.worldOf(tgt, 'mid'), { onPress: code => x.dodgeMove(tgt, code) });
    for (let i = 1; i <= 3; i++) { await x.arcTo(f, lerp(x0, ex, i / 3), 0, lerp(z0, ez, i / 3), 0.28, 0.32); x.squash(f, 1.15, 0.86, 0.04); x.ST.S.fx.puff(f.x, 0, f.z, 2, 0.1); }
    x.emit('whoosh');
    f.spinV = (f.spinV || 0) + 16;
    const grade = await tp;
    x.dodgeResult(f, tgt, grade, 0);
    x.tween(f, { swing: 0 }, 0.35, 'io');
    await x.wait(0.2);
    await x.hopHome(f, 0.5, 0.45);
    x.setMood(f, 'idle');
    if (f.hp <= 0) await x.defeat(f); else x.refreshLabels();
    return grade;
  }
  T.lessons.R = async (x, G) => {
    const D = rx();
    await x.intro();
    x.ST.shot('coach');
    await H.coach('rHello');
    G.tacLesson = { k: 'R', ok: 0 };
    if (!duckKnown()) await teachDuck();
    // Bruno shows both moves, saying them
    const C = x.A.coach;
    if (C && !C.hidden) {
      x.ST.shot('coach');
      x.say(C, html(D.duck.show), { cls: 'coach', html: true, en: 'Duck!', dur: 1.6 }); await x.wait(0.5); await x.dodgeMove(C, 'ArrowDown'); await x.wait(0.4);
      x.say(C, html(D.jump.show), { cls: 'coach', html: true, en: 'Jump!', dur: 1.6 }); await x.wait(0.5); await x.dodgeMove(C, 'ArrowUp'); await x.wait(0.3);
    }
    await H.coach('rFast');
    if (chainOn()) await H.coach('rCounter');
    await H.coach('rYou');
    for (;;) {
      x.setupScaffolds();
      x.UI.rung(`Skill · dodge out loud: <b>«${esc(D.duck.show)}» · «${esc(D.jump.show)}»</b>`);
      G.roundLog0 = G.stats.gradeLog.length;
      await T.lessonLoop(x, G, {
        after: async () => {
          const f = x.targetable().find(k => k.alive && !k.gone && k.species === 'dummy'); if (!f) return;
          await x.wait(0.6);
          const g = await swing(x, G, f), L = G.tacLesson;
          if (g === 'good' || g === 'perfect') { L.ok++; if (L.ok >= 2 && T.learn('R')) T.learnedBanner('R'); if (L.ok === 1) await H.coach('rGot'); }
        },
      });
      await x.practiceCheer();
      if (!(await x.practiceCard())) break;
      G.round++;
      await T.newDummies(x, G, 2);
    }
    x.ST.shot('coach');
    await x.coachSay('pDone');
    return 'done';
  };

  // ------------------------------------------------------------ zh / ja: every notation string here (CJK.md)
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return [];
    const out = [], chk = (where, s, l) => { const p = CJK.validate(s, l); if (p.length) out.push({ where, src: s, problems: p }); };
    for (const l of ['zh', 'ja']) {
      const D = RX[l];
      chk('duck', D.duck.show, l); chk('jump', D.jump.show, l);
      [...D.duck.forms, ...D.jump.forms, ...D.side, ...D.join].forEach(f => chk('form', src(f), l));
      chk('demo', D.demo[0], l); D.demoMarks.forEach(([w]) => chk('demo mark', w, l)); chk('pDodge', D.pDodge[0], l);
      for (const [k, v] of Object.entries(LINES[l])) chk(k, v[0], l);
      for (const m of String(D.why.react + D.why.reactSide).match(/«([^»]+)»/g) || []) chk('why', m.slice(1, -1), l);
      chk('DEMO.R', DEMO.R[l], l); DEMO.R.marks[l].forEach(([w]) => chk('DEMO.R mark', w, l));
      chk('LEX v.duck', DUCK[l], l); (DUCK.alt[l] || []).forEach(w => chk('LEX v.duck alt', w, l));
    }
    return out;
  }

  // ------------------------------------------------------------ Settings: the arrow keys instead (accessibility; off by default)
  if (typeof UI !== 'undefined') {
    UI.settingsParts = UI.settingsParts || [];
    if (!UI.settingsParts.some(p => p && p.id === 'react')) UI.settingsParts.push({ id: 'react', html: () => `<h4>Battles</h4>`
      + `<label class="krow"><span>Dodge with the arrow keys (↑ / ↓ as the hit lands) instead of saying it</span><input type="checkbox" data-opt="reactKeys" ${typeof KEYS !== 'undefined' && KEYS.opts.reactKeys ? 'checked' : ''}></label>`
      + `<p class="note">Off: when a foe attacks, a box opens and time slows down; you type the move («duck», «jump») in the language. On: the old timing presses.</p>` });
  }

  const api = { wants: () => verbal() && !!(X() && X().G.running), open, hint, tip, extra, teach: teachDuck, read, verdict, check, RX, S, verbal, counterSrc, swing,
    auto: null, swingDir: null };
  _.react = api;
  window.REACT = api;
})();
