'use strict';
// How to order, for new shoppers (DESIGN.md 19, P6b: "say the prices of things in shops, give prompts to new users on how to
// order things"). Every shop's panel (shop.js: Molinar's market, the corner stores, Grandma Mei's, the inns) shows each price
// on its tag (the digits and the number in words) and the keeper says it out loud when you point at a thing; this file adds
// the frames and the chips, like the battle's answer box:
//   «Quiero ___, por favor.» · «¿Cuánto cuesta ___?»   (pt «Quero ___, por favor.» · «Quanto custa ___?»; de «Ich möchte ___,
//   bitte.» · «Was kostet ___?»; zh «[请|qǐng] [给|gěi] [我|wǒ] ___ 。» · «___ [多少|duō shao] [钱|qián] ？»; ja «___ ください 。» ·
//   «___ は いくら です か ？»)
//   and a chip for each thing on the shelf, in the form that frame needs («una manzana» / «la manzana», «einen Apfel» / «der
//   Apfel», «[一|yī] [个|gè] [苹果|píng guǒ]», «りんご を [一|ひと]つ»).
// A frame fills the box with its blank picked; a chip fills the blank. You still say it (Enter). It's all there for your first
// 3 orders in a language, then the frames alone up to 6, then it's gone (Help still shows a model). LEX keeps the count
// (x.shopOrders, per language, with the save).
//   SHOP_ORDER.frames(l) · chips(stall, l, mode) · orders() · _ (tests: { render, state })
const SHOP_ORDER = (() => {
  if (typeof SHOP === 'undefined') return null;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CJL = ['zh', 'ja'], cj = l => CJL.includes(l) && typeof CJK !== 'undefined' && !!CJK.plain;
  const FULL = 3, SOME = 6;
  // [the frame with ___, its English] · buy, then price; zh / ja in the CJK.md notation
  const FRAMES = {
    es: { buy: ['Quiero ___, por favor.', 'I want ___, please.'], price: ['¿Cuánto cuesta ___, por favor?', 'How much is ___, please?'] },
    pt: { buy: ['Quero ___, por favor.', 'I want ___, please.'], price: ['Quanto custa ___, por favor?', 'How much is ___, please?'] },
    de: { buy: ['Ich möchte ___, bitte.', 'I’d like ___, please.'], price: ['Was kostet ___, bitte?', 'How much is ___, please?'] },
    zh: { buy: ['[请|qǐng] [给|gěi] [我|wǒ] ___ 。', 'Please give me ___.'], price: ['[请问|qǐng wèn] ， ___ [多少|duō shao] [钱|qián] ？', 'Excuse me, how much is ___?'] },
    ja: { buy: ['___ ください 。', '___, please.'], price: ['すみません 、 ___ は いくら です か ？', 'Excuse me, how much is ___?'] },
  };
  const TITLE = 'New here? Order like this (click, then say it with Enter):';
  const orders = () => { try { return (typeof LEX !== 'undefined' && LEX.st('x.shopOrders').n) || 0; } catch (e) { return 0; } };
  const addOrders = n => { try { const s = LEX.st('x.shopOrders'); s.n = (s.n || 0) + n; } catch (e) { /* */ } };

  // ---------------------------------------------------------------- the pieces, as notation (zh / ja) or text
  // a chip for one thing: what goes in the blank for that frame
  function chipSrc(id, l, mode) {
    const it = typeof LEX !== 'undefined' && LEX.item(id), sh = SHOP.item && SHOP.item(id);
    if (cj(l)) {
      if (mode === 'price') return (it && it[l]) || null;
      let m = null; try { m = SHOP.model(id, l, { known: true, coins: 0 }); } catch (e) { m = null; }
      const src = m && m.src ? String(m.src) : '';
      if (l === 'zh') { const s = src.replace(/^\[请\|qǐng\] \[给\|gěi\] \[我\|wǒ\] /, '').replace(/ 。$/, ''); return s && s !== src ? s : (it && it[l]) || null; }
      const k = src.lastIndexOf(' ください'); return k > 0 ? src.slice(0, k) : (it && it[l]) || null;
    }
    if (!it || !it[l]) return null;
    if (mode === 'price') return LEX.form(id, { article: true });
    const g = (it.g && it.g[l]) || 'm';
    if (sh && sh.mass) return it[l];
    if (id === 'w.honey') return { es: 'un frasco de miel', pt: 'um pote de mel', de: 'ein Glas Honig' }[l] || it[l];
    let one = ''; try { one = SHOP.numWord(1, l, g, 'acc'); } catch (e) { one = ''; }
    return `${one} ${it[l]}`.trim();
  }
  // what to put in the box (zh / ja: in the mode: characters, or pinyin / rōmaji)
  function asText(src, l) {
    if (!cj(l)) return src;
    return CJK.mode(l) === 'chars' ? CJK.chars(src, { lang: l }).replace(/\s+/g, '') : CJK.plain(src, { lang: l, cap: false });
  }
  function frameText(mode, l) {
    const F = (FRAMES[l] || FRAMES.es)[mode][0], [a, b] = F.split('___'), sp = cj(l) && CJK.mode(l) !== 'chars' ? ' ' : '';
    const A = a.trim() ? asText(a.trim(), l) : '', Bt = b.trim() ? asText(b.trim(), l) : '';
    if (!cj(l)) return F;
    return (A ? A + sp : '') + '___' + (Bt ? (/^[。？！.?!,、]/.test(Bt) ? '' : sp) + Bt : '');
  }
  const show = (src, l) => (cj(l) ? CJK.html(src, { lang: l, cap: false }) : esc(src));
  function frameHTML(mode, l) {
    const F = (FRAMES[l] || FRAMES.es)[mode][0], [a, b] = F.split('___');
    return (a.trim() ? show(a.trim(), l) + ' ' : '') + '<i>___</i>' + (b.trim() ? (/^[,.;:!?。？！、]/.test(b.trim()) ? '' : ' ') + show(b.trim(), l) : '');
  }

  // ---------------------------------------------------------------- the strip in the shop's panel
  let el = null, mode = 'buy', css = false;
  function style() {
    if (css) return; css = true;
    const st = document.createElement('style');
    st.textContent = `#shop .sh-order { display: flex; flex-wrap: wrap; align-items: center; gap: 5px 7px; padding: 6px 10px; border-radius: 14px; background: #fff7dc; border: 2px dashed rgba(230,169,46,.7); }
#shop .sh-order[hidden] { display: none; }
#shop .sh-order .sh-ot { width: 100%; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; opacity: .6; }
#shop .sh-order button { border: 2px solid #2b2235; border-radius: 99px; background: #fff; font-size: 15px; font-weight: 800; padding: 1px 11px; }
#shop .sh-order .sh-fr { color: #2b2235; } #shop .sh-order .sh-fr.on { background: #2b2235; color: #fffaf0; }
#shop .sh-order .sh-fr i { font-style: normal; opacity: .6; }
#shop .sh-order .sh-chip { color: #d6453a; border-style: dashed; font-size: 14px; }
#shop .sh-order .sh-chip:hover, #shop .sh-order .sh-fr:hover { box-shadow: 0 0 0 3px rgba(33,164,147,.3); }
#shop .sh-order .sh-sep { opacity: .35; font-weight: 900; }
#shop .sh-order.compact { padding: 3px 8px; background: transparent; border-style: dotted; } #shop .sh-order.compact button { font-size: 13px; }`;
    document.head.appendChild(st);
  }
  function render(V, els) {
    if (!V || !els || !els.card) return;
    style();
    const l = V.lang, n = orders();
    if (!el || !els.card.contains(el)) {
      el = document.createElement('div'); el.className = 'sh-order';
      els.card.insertBefore(el, els.prompt || null);
      el.addEventListener('click', e => onClick(e, els));
    }
    if (n >= SOME || !FRAMES[l]) { el.hidden = true; return; }
    el.hidden = false; el.classList.toggle('compact', n >= FULL);
    const goods = (SHOP.STALLS[V.stall] || []);
    const fr = ['buy', 'price'].map(m => `<button type="button" class="sh-fr${mode === m ? ' on' : ''}" data-fr="${m}" title="${esc((FRAMES[l] || FRAMES.es)[m][1])}">${frameHTML(m, l)}</button>`).join('');
    const ch = n >= FULL ? '' : goods.map(id => { const s = chipSrc(id, l, mode); if (!s) return ''; const it = LEX.item(id) || {}; return `<button type="button" class="sh-chip" data-chip="${esc(asText(s, l))}" title="${esc(it.en || '')}">${show(s, l)}</button>`; }).filter(Boolean).join('');
    el.innerHTML = (n >= FULL ? '' : `<span class="sh-ot">${esc(TITLE)}</span>`) + fr + (ch ? '<span class="sh-sep">·</span>' + ch : '');
  }
  function onClick(e, els) {
    const b = e.target.closest('button'); if (!b) return;
    e.stopPropagation();
    const st = SHOP._ && SHOP._.state ? SHOP._.state() : null, l = st ? st.lang : (typeof LEX !== 'undefined' ? LEX.lang : 'es'), inp = els.input;
    if (b.dataset.fr) {
      mode = b.dataset.fr;
      inp.value = frameText(mode, l);
      const k = inp.value.indexOf('___');
      inp.focus(); if (k >= 0) inp.setSelectionRange(k, k + 3);
      if (st) render(Object.assign({ lang: l, stall: st.stall }), els);
      try { Sound.play('click'); } catch (er) { /* */ }
      return;
    }
    if (b.dataset.chip !== undefined) {
      const w = b.dataset.chip;
      if (!inp.value.trim()) inp.value = frameText(mode, l);
      const k = inp.value.indexOf('___');
      if (k >= 0) inp.value = inp.value.slice(0, k) + w + inp.value.slice(k + 3);
      else { const a = inp.selectionStart != null ? inp.selectionStart : inp.value.length, z = inp.selectionEnd != null ? inp.selectionEnd : a; inp.value = inp.value.slice(0, a) + w + inp.value.slice(z); }
      inp.focus(); const end = inp.value.length; inp.setSelectionRange(end, end);
      try { Sound.play('pip'); } catch (er) { /* */ }
    }
  }
  SHOP.onPaint = SHOP.onPaint || [];
  SHOP.onPaint.push(render);
  // every order you get counts (the sales in a visit), so the strip fades as you get the hang of it
  if (SHOP.open && !SHOP.open._order) {
    const open0 = SHOP.open;
    SHOP.open = function (o) {
      mode = 'buy';
      const p = open0.apply(this, arguments);
      return p && p.then ? p.then(r => { try { if (r && r.log) addOrders(r.log.filter(t => t && t.sale).length); } catch (e) { /* */ } return r; }) : p;
    };
    SHOP.open._order = true;
  }

  // ---------------------------------------------------------------- zh / ja: every notation string here, checked (CJK.md)
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return [];
    const out = [];
    for (const l of CJL) for (const m of ['buy', 'price']) for (const part of FRAMES[l][m][0].split('___')) if (part.trim()) { const p = CJK.validate(part.trim(), l); if (p.length) out.push({ where: `frame ${l} ${m}`, src: part, problems: p }); }
    return out;
  }
  return { FRAMES, frames: l => FRAMES[l], chips: (stall, l, m) => (SHOP.STALLS[stall] || []).map(id => chipSrc(id, l, m || 'buy')), orders, check, _: { render, frameText, chipSrc, addOrders, get mode() { return mode; } } };
})();
