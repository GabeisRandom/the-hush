'use strict';
// The battle's DOM layer, #battle-ui: the command box with its live "Mimo understood" line and
// sentence frames, the Coach's dialogue box, speech bubbles and foe labels anchored to the 3D
// scene (and, for look-alikes, where each one stands), damage numbers, the timing ring, hearts, the
// coins earned and the food in the bag, tips, and the result card. Every style is scoped to
// #battle-ui so it can't clash with the game's own UI.
// Positions follow the game clock (sync).
(() => {
  const B = window.BATTLE, _ = B._;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // ------------------------------------------------------------ Chinese and Japanese (game/CJK.md)
  // In a zh / ja battle every string in the language is in the notation ([打|dǎ] [红色|hóng sè] …), whole lines (bubbles, frames)
  // or «words» inside English (tips, hints, the review). They're shown through CJK: characters with fading ruby, or pinyin /
  // rōmaji. Nothing changes for es / pt / de (CJ() is null there).
  const CJ = () => (typeof CJK !== 'undefined' && CJK.isCJK(CJK.lang()) ? CJK : null);
  const hasCJ = s => /\[[^\]|]+\|[^\]]+\]|[ぁ-ヿ㐀-鿿]|\{mimo\}/.test(String(s == null ? '' : s));
  const NOTE = '\\[[^\\[\\]|<>]+\\|[^\\[\\]<>]+\\]', HANK = '[\\u3005\\u3007\\u3041-\\u3096\\u30a1-\\u30fa\\u30fc\\u3400-\\u9fff\\uf900-\\ufaff]';
  const PUN = '[\\u3001\\u3002\\uff01\\uff0c\\uff1a\\uff1b\\uff1f\\u300c\\u300d\\u201c\\u201d\\u2026\\uff5e]';
  const WORD = `(?:\\{mimo\\}|(?:${HANK}|${NOTE})+)`;
  // a run of the language in the middle of other text: words (and their punctuation) separated by single spaces
  const RUN = new RegExp(`${WORD}(?:${PUN})*(?: (?:${WORD}|${PUN}+))*`, 'g');
  const cjHTML = (src, o) => { const C = CJ(); return C ? C.html(src, Object.assign({ lang: C.lang() }, o || {})) : esc(src); };
  // HTML with runs of the language in its text (never inside tags, nor inside what CJK already drew) shown through CJK.
  // o.ruby: 'always' for a hint you need to read. o.quote: in English text, a bare word in pinyin / rōmaji gets «» («no»
  // joins…, not "no joins…")
  function mix(html, o = {}) {
    const C = CJ();
    if (!C || !html || !hasCJ(html)) return html || '';
    const l = C.lang(), stack = [], q = o.quote && C.mode(l) === 'roman';
    return String(html).split(/(<[^>]*>)/).map(part => {
      if (part[0] === '<') {
        if (/^<span\b/i.test(part)) stack.push(/class="[^"]*\bcjk\b/.test(part) || (stack.length > 0 && stack[stack.length - 1]));
        else if (/^<\/span>/i.test(part)) stack.pop();
        return part;
      }
      if (stack.length && stack[stack.length - 1]) return part;
      return part.replace(RUN, (m, at, s) => {
        const h = C.html(m, { lang: l, ruby: o.ruby, cap: /[！？。]$/.test(m) });
        return q && s[at - 1] !== '«' && s[at + m.length] !== '»' ? `«${h}»` : h;
      });
    }).join('');
  }
  const mixQ = (html, o) => mix(html, Object.assign({ quote: true }, o || {}));
  // the same, as plain text (the damage pops)
  const mixPlain = text => { const C = CJ(); return C && hasCJ(text) ? String(text).replace(RUN, m => C.plain(m, { lang: C.lang(), cap: false })) : String(text); };
  // a whole line in the language, word by word, each word with its meaning on hover (gloss: { characters: English });
  // it counts as read for the character gimmick
  function line(src, gloss) {
    const C = CJ();
    if (!C) return esc(src);
    const l = C.lang(), roman = C.mode(l) === 'roman';
    let out = '', first = true, prevOpen = false;
    for (const t of C.split(src)) {
      const punct = C.parse(t, l).every(x => x.kind === 'punct'), open = punct && /^[“「『（]/.test(t);
      let h = C.html(t, { lang: l, cap: roman && first && !punct });
      const key = punct ? '' : C.chars(t, { lang: l }), g = key && gloss && gloss[key];
      if (g) h = `<span class="g" data-g="${esc(g)}">${h}</span>`;
      if (roman && out && !(punct && !open) && !prevOpen) out += ' ';
      out += h; prevOpen = open;
      if (!punct) first = false; else if (/[！？。]/.test(t)) first = true;
    }
    C.seen(src);
    return out;
  }
  const CSS = `
#battle-ui { position: fixed; inset: 0; z-index: 40; pointer-events: none; font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; color: #2b2235; -webkit-font-smoothing: antialiased; }
#battle-ui * { box-sizing: border-box; }
#battle-ui [hidden] { display: none !important; }
#battle-ui .card { background: #fffaf0; border: 3px solid #2b2235; border-radius: 18px; box-shadow: 0 6px 0 rgba(43,34,53,.2); }
#battle-ui .card { top: auto; max-width: none; text-align: left; animation: none; padding: 0; }   /* undo the game's own .card (index.html), which squeezed the Coach's box */
#battle-ui button { pointer-events: auto; font: inherit; font-weight: 800; font-size: 15px; color: #2b2235; background: #fffaf0; border: 3px solid #2b2235; border-radius: 12px; padding: 5px 12px; cursor: pointer; box-shadow: 0 3px 0 rgba(43,34,53,.2); }
#battle-ui button:hover { background: #fff1d6; }
#battle-ui button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,34,53,.2); }
#battle-ui button.on { background: #21a493; color: #fff; }
#battle-ui kbd { display: inline-block; min-width: 24px; padding: 0 5px; border: 2px solid #2b2235; border-radius: 6px; background: #fff; font: 800 14px "Trebuchet MS", sans-serif; text-align: center; line-height: 18px; }
#battle-ui .bt-top { position: absolute; left: 14px; right: 14px; top: 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
#battle-ui .bt-hearts { display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 10px; background: rgba(255,250,240,.95); border: 3px solid #2b2235; border-radius: 14px; box-shadow: 0 4px 0 rgba(43,34,53,.16); }
#battle-ui .bt-hearts .who { font-weight: 900; font-size: 14px; }
#battle-ui .bt-hearts .row { font-size: 22px; letter-spacing: 1px; color: #e2574c; text-shadow: 0 2px 0 rgba(43,34,53,.25); white-space: nowrap; }
#battle-ui .bt-hearts .row .gone { color: rgba(43,34,53,.16); text-shadow: none; }
#battle-ui .bt-hearts.ouch { animation: bt-nudge .35s; }
#battle-ui .bt-rung { font-weight: 800; font-size: 15px; padding: 7px 16px; border-radius: 99px; background: #2b2235; color: #fffaf0; box-shadow: 0 4px 0 rgba(43,34,53,.22); max-width: 46vw; text-align: center; }
#battle-ui .bt-rung b { color: #ffd166; }
#battle-ui .bt-btns { display: flex; gap: 6px; }
#battle-ui .bt-tip { position: absolute; left: 16px; top: 64px; width: min(470px, 40vw); padding: 9px 14px; font-size: 15px; font-weight: 700; line-height: 1.38; background: rgba(255,248,230,.96); border: 3px dashed rgba(43,34,53,.5); border-radius: 14px; }
#battle-ui .bt-dodge { position: absolute; left: 50%; bottom: 34px; transform: translateX(-50%); display: flex; gap: 22px; align-items: center; font-size: 21px; font-weight: 800; background: rgba(255,250,240,.97); border: 3px solid #2b2235; border-radius: 16px; padding: 8px 20px; white-space: nowrap; box-shadow: 0 5px 0 rgba(43,34,53,.18); }
#battle-ui .bt-dodge q { quotes: "«" "»"; color: #b8403a; }
#battle-ui .bt-coach { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); width: min(980px, calc(100vw - 40px)); min-height: 88px; padding: 18px 120px 14px 24px; pointer-events: auto; cursor: pointer; }
#battle-ui .bt-coach .who { position: absolute; top: -17px; left: 18px; background: #f19a49; color: #fff; border: 3px solid #2b2235; border-radius: 10px; padding: 1px 12px; font-weight: 900; font-size: 15px; }
#battle-ui .bt-coach .txt { font-size: 27px; font-weight: 800; line-height: 1.28; }
#battle-ui .bt-coach .en { font-size: 16px; font-weight: 700; color: #6b6275; margin-top: 4px; display: none; }
#battle-ui.show-en .bt-coach .en, #battle-ui .bt-coach.en-first .en, #battle-ui .bt-coach.en-under .en { display: block; }
#battle-ui .bt-coach.en-first .txt { font-size: 25px; }
#battle-ui .bt-coach .tl { color: #c2412f; }
#battle-ui .bt-coach.en-first .en { font-size: 18px; color: #6b4f78; margin-top: 6px; }
#battle-ui .bt-coach .en .lbl { font-size: 12px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; color: #9a8fb0; margin-right: 4px; }
#battle-ui .bt-coach.tl-toggle .txt { font-size: 25px; }
#battle-ui .bt-coach.tl-toggle .txt .w { color: #c2412f; border-bottom: 2px dotted #c2412f; }
#battle-ui .bt-coach.tl-toggle .txt .gl { font: italic 600 .62em "Segoe UI", sans-serif; opacity: .6; margin-left: 3px; }
#battle-ui .bt-coach.tl-toggle .en { display: none; }
#battle-ui .bt-coach.tl-toggle.show-tl .en { display: block; font-size: 18px; color: #6b4f78; margin-top: 6px; }
#battle-ui .bt-coach .tlbtn { position: absolute; top: 9px; right: 16px; border: 2px solid #2b2235; border-radius: 8px; background: #fffaf0; color: #2b2235; font: 800 12px "Segoe UI", sans-serif; padding: 1px 9px; cursor: pointer; }
#battle-ui .bt-coach.tl-toggle.show-tl .tlbtn { background: #2b2235; color: #fffaf0; }
#battle-ui .bt-coach .next { position: absolute; right: 18px; bottom: 12px; font-size: 14px; font-weight: 800; color: #6b6275; animation: bt-bob 1s ease-in-out infinite; }
#battle-ui .g { border-bottom: 2px dotted rgba(43,34,53,.55); position: relative; cursor: help; }
#battle-ui .g:hover::after { content: attr(data-g); position: absolute; left: 50%; bottom: 120%; transform: translateX(-50%); white-space: nowrap; background: #2b2235; color: #fffaf0; font-size: 15px; font-weight: 700; padding: 3px 9px; border-radius: 8px; z-index: 5; }
#battle-ui .bt-prompt { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); width: min(980px, calc(100vw - 32px)); display: flex; flex-direction: column; gap: 7px; pointer-events: auto; }
#battle-ui .bt-frames { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
#battle-ui .bt-fr { font-size: 18px; font-weight: 900; padding: 3px 14px; border-radius: 12px; border: 3px dashed #21a493; background: rgba(233,251,248,.95); color: #17695f; }
#battle-ui .bt-echo { align-self: center; font-size: 34px; font-weight: 900; padding: 2px 24px; background: #fff6d6; border: 3px solid #2b2235; border-radius: 14px; box-shadow: 0 4px 0 rgba(43,34,53,.16); }
#battle-ui .bt-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; }
#battle-ui .bt-row.card { position: static; left: auto; transform: none; z-index: auto; }   /* (the game's .card is fixed and centered: it lifted the row over the word to copy) */
#battle-ui .bt-row.nudge { animation: bt-nudge .3s; }
#battle-ui .bt-plabel { font-weight: 900; font-size: 16px; white-space: nowrap; background: #21a493; color: #fff; border-radius: 10px; padding: 7px 10px; }
#battle-ui .bt-icon svg { width: 64px; height: 64px; display: block; background: #fff; border: 2px dashed rgba(43,34,53,.3); border-radius: 12px; padding: 3px; }
#battle-ui .bt-cmd { flex: 1; min-width: 0; font: inherit; font-size: 26px; font-weight: 800; color: #2b2235; background: #fff; border: 3px solid #2b2235; border-radius: 12px; padding: 6px 12px; outline: none; }
#battle-ui .bt-cmd:focus { box-shadow: 0 0 0 4px rgba(33,164,147,.35); }
#battle-ui .bt-cmd::placeholder { color: #b3abbd; }
#battle-ui .bt-sub { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 0 4px; min-height: 30px; }
#battle-ui .bt-hinttxt { font-family: Consolas, monospace; font-size: 22px; font-weight: 800; color: #2b2235; white-space: pre; letter-spacing: 1px; background: rgba(255,250,240,.92); border-radius: 10px; padding: 0 10px; }
#battle-ui .bt-hinttxt:empty, #battle-ui .bt-preview:empty { display: none; }
#battle-ui .bt-hinttxt.soft { font-family: inherit; font-size: 15px; letter-spacing: 0; color: #4b4257; white-space: normal; }
#battle-ui .bt-preview { margin-left: auto; font-size: 15px; font-weight: 800; color: #2b2235; background: rgba(255,250,240,.94); border: 2px solid rgba(43,34,53,.35); border-radius: 12px; padding: 4px 12px; }
#battle-ui .bt-preview .dim { color: #6b6275; }
#battle-ui .bt-preview .pw { display: inline-block; border-radius: 8px; padding: 0 7px; margin-left: 4px; color: #fff; background: #21a493; }
#battle-ui .bt-preview .pw.weak { background: #c97a1d; }
#battle-ui .bt-preview .pw.bad { background: #b8403a; }
#battle-ui .bt-preview .bonus { display: inline-block; border-radius: 8px; padding: 0 7px; margin-left: 4px; background: #f5b73b; }
#battle-ui .bt-preview .warn { color: #b8403a; }
#battle-ui .bt-layer { position: absolute; inset: 0; }
#battle-ui .bt-bubble { position: absolute; left: 0; top: 0; max-width: 400px; width: max-content; padding: 7px 15px 8px; font-size: 21px; font-weight: 800; line-height: 1.25; background: #fff; border: 3px solid #2b2235; border-radius: 18px; box-shadow: 0 5px 0 rgba(43,34,53,.16); }
#battle-ui .bt-bubble::after { content: ""; position: absolute; left: var(--tail, 50%); bottom: -12px; width: 16px; height: 16px; background: inherit; border-right: 3px solid #2b2235; border-bottom: 3px solid #2b2235; transform: translateX(-50%) rotate(45deg); }
#battle-ui .bt-bubble.you { background: #fff6d6; }
#battle-ui .bt-bubble.mimo { background: #e9fbf8; color: #13786b; }
#battle-ui .bt-bubble.coach { background: #fff1e0; }
#battle-ui .bt-bubble.foe { background: #ece6f8; color: #3d3354; }
#battle-ui .bt-bubble.shout { background: #ffe6df; color: #2b2235; font-size: 25px; border-width: 4px; }
#battle-ui .bt-bubble.shout::before { content: "!"; position: absolute; left: -14px; top: -14px; width: 26px; height: 26px; border-radius: 50%; background: #e2574c; color: #fff; border: 3px solid #2b2235; font-size: 17px; line-height: 20px; text-align: center; }
#battle-ui .bt-bubble.small { font-size: 17px; padding: 4px 11px; }
#battle-ui .bt-bubble.shout.boss { background: #ffd6c9; font-size: 28px; border-width: 5px; max-width: 460px; }
#battle-ui .bt-bubble.shout.boss::before { background: #b8403a; width: 30px; height: 30px; line-height: 24px; font-size: 20px; }
/* a word a Hush creature let go of: its picture and the word, floating up out of it (battle/rewards.js) */
#battle-ui .bt-freed { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 8px; padding: 6px 14px 6px 8px; background: #fffaf0; border: 3px solid #2b2235; border-radius: 16px; box-shadow: 0 0 0 4px rgba(255,209,102,.65), 0 6px 0 rgba(43,34,53,.2); white-space: nowrap; }
#battle-ui .bt-freed img { width: 46px; height: 46px; display: block; }
#battle-ui .bt-freed b { font-size: 24px; font-weight: 900; color: #2b2235; display: block; line-height: 1.1; }
#battle-ui .bt-freed small { font-size: 13px; font-weight: 800; color: #6b6275; display: block; }
#battle-ui .bt-freed i { font-style: normal; font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; color: #c97a12; display: block; }
#battle-ui .bt-bubble .en { font-size: 14px; color: #6b6275; font-weight: 700; margin-top: 2px; display: none; }
#battle-ui.show-en .bt-bubble .en, #battle-ui .bt-bubble.shout .en.always { display: block; }
#battle-ui .bt-bubble .fx { color: #d0453a; text-decoration: underline; text-decoration-thickness: 3px; }
#battle-ui .bt-bubble .ac { color: #1b8f81; text-decoration: underline dotted; }
#battle-ui .bt-label { position: absolute; left: 0; top: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; }
#battle-ui .bt-label .bt-hp, #battle-ui .bt-label .bt-hpbar { order: 2; }
#battle-ui .bt-hpbar { position: relative; width: 150px; height: 14px; border: 2px solid #2b2235; border-radius: 8px; background: rgba(43,34,53,.18); overflow: hidden; }
#battle-ui .bt-hpbar i { position: absolute; left: 0; top: 0; bottom: 0; background: #e2574c; transition: width .3s; }
#battle-ui .bt-hpbar span { position: absolute; right: 6px; top: -2px; font-size: 12px; font-weight: 900; color: #fffaf0; -webkit-text-stroke: 3px #2b2235; paint-order: stroke fill; }
#battle-ui .bt-chips { display: flex; gap: 4px; }
#battle-ui .bt-chip { font-size: 15px; font-weight: 800; padding: 1px 8px; background: #fffaf0; border: 2px solid #2b2235; border-radius: 9px; white-space: nowrap; box-shadow: 0 2px 0 rgba(43,34,53,.15); }
#battle-ui .bt-chip.name { background: #2b2235; color: #fffaf0; }
#battle-ui .bt-chip.state { background: #efe6ff; }
#battle-ui .bt-chip.glow { background: #f5b73b; animation: bt-pulse .8s ease-in-out infinite alternate; }
#battle-ui .bt-chip .sw { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #2b2235; vertical-align: -1px; margin-right: 4px; }
#battle-ui .bt-chip.quiz { min-width: 30px; text-align: center; }
#battle-ui .bt-chip .rv { border-bottom: 2px dotted #6b6275; color: #4b4257; }     /* a word you know well, half-hidden: say it from memory (a review) */
#battle-ui .bt-hp { display: flex; gap: 3px; }
#battle-ui .bt-hp i { width: 11px; height: 8px; border-radius: 3px; background: #e2574c; border: 2px solid #2b2235; }
#battle-ui .bt-hp i.gone { background: rgba(43,34,53,.15); }
#battle-ui .bt-tag { position: absolute; left: 0; top: 0; font-size: 14px; font-weight: 900; padding: 1px 8px; border-radius: 9px; border: 2px solid #2b2235; background: rgba(255,250,240,.95); white-space: nowrap; box-shadow: 0 2px 0 rgba(43,34,53,.15); }
#battle-ui .bt-tag.weak { background: #ffb35c; animation: bt-pulse .7s ease-in-out infinite alternate; }
#battle-ui .bt-tag.glow { background: #f5b73b; animation: bt-pulse .8s ease-in-out infinite alternate; }
#battle-ui .bt-tag.weak::before { content: "✦ "; }
#battle-ui .bt-pop { position: absolute; left: 0; top: 0; font-weight: 900; white-space: nowrap; text-align: center; -webkit-text-stroke: 7px #2b2235; paint-order: stroke fill; line-height: 1; letter-spacing: 1px; }
#battle-ui .bt-pop small { display: block; font-size: 17px; -webkit-text-stroke: 5px #2b2235; color: #ffd166; margin-top: 2px; }
#battle-ui .bt-ring { position: absolute; left: 0; top: 0; border-radius: 50%; border: 5px solid rgba(43,34,53,.75); box-shadow: 0 0 0 3px rgba(255,255,255,.7); }
#battle-ui .bt-ring.hot { border-color: #f5b73b; box-shadow: 0 0 0 3px rgba(255,255,255,.9), 0 0 18px rgba(245,183,59,.9); }
#battle-ui .bt-ring0 { position: absolute; left: 0; top: 0; border-radius: 50%; border: 4px solid rgba(245,183,59,.95); }
#battle-ui .bt-key { position: absolute; left: 0; top: 0; font: 900 15px "Trebuchet MS", sans-serif; background: #2b2235; color: #fffaf0; border-radius: 9px; padding: 3px 8px; white-space: nowrap; }
#battle-ui .bt-key:empty { display: none; }
#battle-ui .bt-key kbd { color: #2b2235; }
#battle-ui.busy .bt-label, #battle-ui.busy .bt-tag:not(.weak) { opacity: .4; transition: opacity .2s; }
#battle-ui .bt-label, #battle-ui .bt-tag { transition: opacity .2s; }
#battle-ui .bt-confirm, #battle-ui .bt-result { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); pointer-events: auto; text-align: center; }
#battle-ui .bt-confirm { padding: 18px 26px; font-size: 22px; font-weight: 900; }
#battle-ui .bt-confirm div { margin-top: 12px; display: flex; gap: 10px; justify-content: center; }
#battle-ui .bt-result { width: min(520px, 92vw); padding: 22px 28px 18px; left: auto; right: max(24px, 6vw); transform: translate(0, -50%); }
#battle-ui .bt-result h2 { margin: 0 0 4px; font-size: 38px; }
#battle-ui .bt-result .sub { font-size: 17px; font-weight: 700; color: #6b6275; margin-bottom: 10px; }
#battle-ui .bt-result table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 17px; text-align: left; }
#battle-ui .bt-result td { padding: 4px 6px; border-bottom: 2px dashed rgba(43,34,53,.14); font-weight: 700; }
#battle-ui .bt-result td:last-child { text-align: right; font-weight: 900; font-size: 19px; }
#battle-ui .bt-result .next { font-size: 14px; font-weight: 800; color: #6b6275; animation: bt-bob 1s ease-in-out infinite; }
#battle-ui .bt-result { max-height: 88vh; overflow-y: auto; }
#battle-ui .bt-result .mist-head { font-size: 15px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; color: #b8403a; text-align: left; margin: 2px 0 6px; }
#battle-ui .bt-result .mist-none { font-size: 18px; font-weight: 900; color: #17695f; margin: 4px 0 12px; }
#battle-ui .bt-result .mists { text-align: left; margin-bottom: 10px; }
#battle-ui .bt-result .mist { background: #fff; border: 2px solid rgba(43,34,53,.18); border-radius: 12px; padding: 7px 11px; margin-bottom: 7px; }
#battle-ui .bt-result .m-you { font-size: 16px; font-weight: 800; color: #6b6275; }
#battle-ui .bt-result .m-x { font-size: 13px; background: #efe6ff; border-radius: 8px; padding: 0 6px; }
#battle-ui .bt-result .m-ok { font-size: 18px; font-weight: 900; margin-top: 2px; }
#battle-ui .bt-result .m-ok .fx { color: #d0453a; text-decoration: underline; text-decoration-thickness: 3px; }
#battle-ui .bt-result .m-ok .ac { color: #1b8f81; text-decoration: underline dotted; }
#battle-ui .bt-result .m-why { margin: 4px 0 0; padding-left: 18px; font-size: 14px; font-weight: 700; color: #4b4257; line-height: 1.35; }
#battle-ui .bt-result .m-more { font-size: 13px; font-weight: 800; color: #6b6275; }
#battle-ui .bt-toast { position: absolute; left: 50%; top: 108px; transform: translateX(-50%); font-size: 17px; font-weight: 800; padding: 6px 14px; border-radius: 12px; background: #e9fbf8; border: 3px solid #21a493; color: #13786b; white-space: nowrap; }
#battle-ui .bt-chip.name i { font-style: normal; font-weight: 700; color: #cfc6e0; }
#battle-ui .bt-chip.down { background: #ffe9c7; }
/* the attack rating: S gold, A teal, B green, C orange, D gray */
#battle-ui .gS { --g: #ffc93c; --g2: #ff9f1c; --gt: #fffbe6; }
#battle-ui .gA { --g: #2fc4b0; --g2: #158f80; --gt: #f2fffc; }
#battle-ui .gB { --g: #6cc35a; --g2: #3f8f34; --gt: #f4ffef; }
#battle-ui .gC { --g: #f39a45; --g2: #c96a1c; --gt: #fff4e8; }
#battle-ui .gD { --g: #a9a1b8; --g2: #7d7590; --gt: #f6f3fa; }
#battle-ui .bt-grade { position: absolute; left: 0; top: 0; display: flex; flex-direction: column; align-items: center; pointer-events: none; z-index: 2; }
#battle-ui .bt-grade .gb { position: relative; width: 92px; height: 92px; transform-origin: 50% 65%; }
#battle-ui .bt-grade .burst { position: absolute; left: -26px; top: -26px; width: 144px; height: 144px; overflow: visible; }
#battle-ui .bt-grade .gl { position: absolute; inset: 0; border-radius: 50%; border: 5px solid #2b2235; background: radial-gradient(circle at 36% 30%, var(--gt) 0 9%, var(--g) 34%, var(--g2) 100%);
  display: flex; align-items: center; justify-content: center; font: 900 64px/1 "Trebuchet MS", "Segoe UI", sans-serif; color: #fffaf0; -webkit-text-stroke: 8px #2b2235; paint-order: stroke fill;
  box-shadow: 0 6px 0 rgba(43,34,53,.3), inset 0 -8px 0 rgba(43,34,53,.16); padding-bottom: 4px; }
#battle-ui .bt-grade .sp { position: absolute; left: 50%; top: 50%; margin: -15px 0 0 -11px; font: 900 26px/1 "Segoe UI Symbol", "Trebuchet MS", sans-serif; font-style: normal; color: #fff3a0; -webkit-text-stroke: 5px #2b2235; paint-order: stroke fill; }
#battle-ui .bt-grade .gr { margin-top: 6px; font: 900 19px/1.1 "Trebuchet MS", "Segoe UI", sans-serif; color: #fffaf0; -webkit-text-stroke: 6px #2b2235; paint-order: stroke fill; white-space: nowrap; letter-spacing: .5px; }
#battle-ui .bt-grade.gS .gr { color: #ffe58a; }
#battle-ui .bt-preview .pw.gS, #battle-ui .bt-preview .pw.gA, #battle-ui .bt-preview .pw.gB, #battle-ui .bt-preview .pw.gC, #battle-ui .bt-preview .pw.gD { background: var(--g2); }
#battle-ui .bt-preview .pw.gS { background: #e0951a; }
#battle-ui .gc { display: inline-block; min-width: 26px; text-align: center; font-weight: 900; font-size: 15px; line-height: 20px; padding: 0 6px; margin: 0 2px; border-radius: 9px; border: 2px solid #2b2235; background: var(--g); color: #2b2235; vertical-align: 1px; }
#battle-ui .gc small { font-size: 12px; margin-left: 1px; }
#battle-ui .bt-result .bt-grades { display: flex; align-items: center; gap: 12px; text-align: left; background: #fff; border: 2px solid rgba(43,34,53,.18); border-radius: 14px; padding: 8px 10px; margin: 2px 0 6px; }
#battle-ui .bt-result .gb-all { flex: none; width: 58px; height: 58px; border-radius: 50%; border: 4px solid #2b2235; background: radial-gradient(circle at 36% 30%, var(--gt) 0 9%, var(--g) 34%, var(--g2) 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 3px 0 rgba(43,34,53,.25); }
#battle-ui .bt-result .gb-all b { font-size: 34px; line-height: 30px; color: #fffaf0; -webkit-text-stroke: 6px #2b2235; paint-order: stroke fill; }
#battle-ui .bt-result .gb-all small { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; color: #2b2235; }
#battle-ui .bt-result .gr-info { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
#battle-ui .bt-result .gr-counts, #battle-ui .bt-result .gr-best { font-size: 15px; font-weight: 800; }
#battle-ui .bt-result .gr-best { color: #4b4257; line-height: 1.3; }
#battle-ui .bt-result .bt-grades .lbl { font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; color: #9a8fb0; margin-right: 6px; }
#battle-ui .bt-result .m-you .gc { font-size: 13px; line-height: 17px; min-width: 22px; }
/* the coins earned, the food in the bag, an armadillo on its back */
#battle-ui .bt-left { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; min-width: 0; }
#battle-ui .bt-lrow { display: flex; gap: 8px; align-items: center; }
#battle-ui .bt-coinpill { display: flex; align-items: center; gap: 5px; padding: 3px 12px 3px 6px; font-weight: 900; font-size: 19px; background: rgba(255,250,240,.95); border: 3px solid #2b2235; border-radius: 14px; box-shadow: 0 4px 0 rgba(43,34,53,.16); }
#battle-ui .bt-coinpill svg { width: 24px; height: 24px; display: block; }
#battle-ui .bt-coinpill.bump { animation: bt-pop .45s; }
#battle-ui .bt-bag { display: flex; gap: 6px; flex-wrap: wrap; max-width: 46vw; }
#battle-ui .bt-food { display: inline-flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 800; padding: 2px 9px 2px 4px; background: rgba(255,250,240,.95); border: 2px solid #2b2235; border-radius: 11px; box-shadow: 0 2px 0 rgba(43,34,53,.15); }
#battle-ui .bt-food svg { width: 22px; height: 22px; display: block; }
#battle-ui .bt-food i { font-style: normal; color: #6b6275; }
#battle-ui .bt-food .art { font-weight: 700; color: #6b6275; }
#battle-ui.has-bag .bt-tip { top: 102px; }
#battle-ui .bt-hearts.heal { animation: bt-heal .7s; }
#battle-ui .bt-chip.back { background: #ffd9a8; }
/* practice in Bruno's yard: the card's Again / Done */
#battle-ui .bt-result .bt-pbtns { display: flex; gap: 12px; justify-content: center; margin: 4px 0 6px; }
#battle-ui .bt-result .bt-pbtns button { font-size: 19px; padding: 8px 22px; }
#battle-ui .bt-result .bt-pbtns .bt-again { background: #21a493; color: #fff; }
#battle-ui .bt-result .p-focus { font-size: 14px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; color: #9a8fb0; }
/* where a look-alike stands (a tag on the water in front of it): ◀ izquierda · ● medio · derecha ▶ */
#battle-ui .bt-tag.pos { font-size: 15px; background: #dff4fb; color: #1d5f73; }
#battle-ui .bt-tag.pos.glow { background: #f5b73b; color: #2b2235; }
#battle-ui .bt-result .bt-coins { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 27px; font-weight: 900; margin: 2px 0 8px; color: #2b2235; }
#battle-ui .bt-result .bt-coins svg { width: 36px; height: 36px; display: block; }
#battle-ui .bt-result .bt-coins .plus { color: #c97a12; -webkit-text-stroke: 1px #2b2235; }
#battle-ui .bt-result .bt-coins small { font-size: 14px; font-weight: 800; color: #6b6275; }
#battle-ui .gl { font-size: .62em; font-weight: 700; color: #6b6275; margin-left: 4px; }
/* the rewards on the card (battle/rewards.js): where the coins came from, drops, Mimo's XP and level, freed words, the bestiary */
#battle-ui .bt-result .bt-coinwhy { font-size: 14px; font-weight: 800; color: #6b6275; margin: -4px 0 8px; line-height: 1.5; }
#battle-ui .bt-result .bt-coinwhy .gc { font-size: 12px; line-height: 16px; min-width: 20px; padding: 0 4px; }
#battle-ui .bt-result .rw { text-align: left; background: #fff; border: 2px solid rgba(43,34,53,.18); border-radius: 14px; padding: 8px 12px; margin: 0 0 8px; }
#battle-ui .bt-result .rw .lbl { font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; color: #9a8fb0; margin-right: 6px; }
#battle-ui .bt-result .rw-drops { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: 16px; font-weight: 800; }
#battle-ui .bt-result .rw-drops span { display: inline-flex; align-items: center; gap: 4px; }
#battle-ui .bt-result .rw-drops img, #battle-ui .bt-result .rw-beast img { width: 34px; height: 34px; }
#battle-ui .bt-result .rw-xp { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 900; }
#battle-ui .bt-result .rw-bar { flex: 1; height: 14px; border: 2px solid #2b2235; border-radius: 8px; background: #efe6ff; overflow: hidden; position: relative; }
#battle-ui .bt-result .rw-bar i { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(#8ff0e2, #21a493); }
#battle-ui .bt-result .rw-bar b { position: absolute; top: 0; bottom: 0; background: linear-gradient(#ffe08a, #f5b73b); }
#battle-ui .bt-result .rw-lvl { margin-top: 6px; padding: 6px 10px; border-radius: 10px; background: #fff3c4; border: 2px solid #f5b73b; font-size: 15px; font-weight: 800; animation: bt-pop .6s ease-out 1; }
#battle-ui .bt-result .rw-lvl b { font-size: 19px; font-weight: 900; color: #b8650f; }
#battle-ui .bt-result .rw-words { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
#battle-ui .bt-result .rw-word { display: flex; align-items: center; gap: 6px; padding: 4px 8px 4px 4px; border: 2px solid rgba(43,34,53,.2); border-radius: 12px; background: #fffaf0; }
#battle-ui .bt-result .rw-word img { width: 40px; height: 40px; }
#battle-ui .bt-result .rw-word b { font-size: 18px; font-weight: 900; display: block; line-height: 1.1; }
#battle-ui .bt-result .rw-word small { font-size: 12px; font-weight: 800; color: #6b6275; display: block; }
#battle-ui .bt-result .rw-word button { pointer-events: auto; border: 2px solid #2b2235; border-radius: 9px; background: #fff; font-size: 15px; padding: 1px 6px; cursor: pointer; }
#battle-ui .bt-result .rw-beast { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; margin-top: 4px; }
#battle-ui .bt-result .rw-beast .new { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; color: #fff; background: #e2574c; border-radius: 6px; padding: 1px 6px; }
/* Chinese and Japanese: the system's CJK fonts after the game's own (so Latin keeps its look), roomier lines for ruby */
#battle-ui[data-cj="zh"], #battle-ui[data-cj="zh"] .bt-cmd { font-family: "Trebuchet MS", "Segoe UI", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC", system-ui, sans-serif; }
#battle-ui[data-cj="ja"], #battle-ui[data-cj="ja"] .bt-cmd { font-family: "Trebuchet MS", "Segoe UI", "Yu Gothic UI", "Yu Gothic", "Meiryo", "Hiragino Sans", "Noto Sans CJK JP", "Noto Sans JP", system-ui, sans-serif; }
#battle-ui .cjk.cjk-ruby { line-height: 2.1; }
#battle-ui .bt-bubble .cjk.cjk-ruby, #battle-ui .bt-chip .cjk.cjk-ruby, #battle-ui .bt-tag .cjk.cjk-ruby { line-height: 1.9; }
#battle-ui .bt-echo .cjk rt { font-size: .45em; }
#battle-ui .bt-fr .cjk rt, #battle-ui .bt-chip .cjk rt, #battle-ui .bt-tag .cjk rt { font-size: .62em; }
#battle-ui .bt-coach .txt .g { border-bottom-color: rgba(43,34,53,.35); }
#cjk-ime { z-index: 45; }
@keyframes bt-pulse { from { box-shadow: 0 0 0 0 rgba(245,183,59,.9); } to { box-shadow: 0 0 0 7px rgba(245,183,59,0); } }
@keyframes bt-bob { 50% { transform: translateY(-3px); } }
@keyframes bt-nudge { 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
@keyframes bt-pop { 40% { transform: scale(1.2); } }
@keyframes bt-heal { 30% { transform: scale(1.07); box-shadow: 0 0 0 7px rgba(111,214,140,.55); } }
`;
  const ICON = {
    jump: '<svg viewBox="0 0 64 64"><path d="M10 50 Q32 2 54 50" fill="none" stroke="#2b2235" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 9"/><path d="M46 44 L54 52 L58 40" fill="none" stroke="#2b2235" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="32" cy="52" rx="9" ry="8" fill="#fbf1df" stroke="#2b2235" stroke-width="3"/><ellipse cx="27" cy="40" rx="3" ry="7" fill="#fbf1df" stroke="#2b2235" stroke-width="2.5"/><ellipse cx="37" cy="40" rx="3" ry="7" fill="#fbf1df" stroke="#2b2235" stroke-width="2.5"/></svg>',
    hit: '<svg viewBox="0 0 64 64"><path d="M32 6 L38 24 L56 20 L42 34 L54 50 L34 42 L26 58 L24 40 L8 42 L20 30 L10 14 L28 22 Z" fill="#f5b73b" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/></svg>',
    throw: '<svg viewBox="0 0 64 64"><path d="M8 52 Q30 4 56 30" fill="none" stroke="#2b2235" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/><path d="M44 30 L56 30 L52 42" fill="none" stroke="#2b2235" stroke-width="4" stroke-linecap="round"/><path d="M6 50 L12 40 L22 40 L26 50 L18 56 Z" fill="#b9b2a6" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/></svg>',
    attack: '<svg viewBox="0 0 64 64"><path d="M36 4 L14 36 L30 36 L24 60 L50 24 L34 24 Z" fill="#f5b73b" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/></svg>',
    // two paws shoving a striped ball
    push: '<svg viewBox="0 0 64 64"><circle cx="42" cy="34" r="17" fill="#c9c2dc" stroke="#2b2235" stroke-width="3"/><path d="M32 21 Q30 34 32 47 M42 17 Q40 34 42 51" fill="none" stroke="#f5b73b" stroke-width="4"/><circle cx="42" cy="34" r="17" fill="none" stroke="#2b2235" stroke-width="3"/>'
      + '<ellipse cx="19" cy="27" rx="7" ry="8" fill="#fbf1df" stroke="#2b2235" stroke-width="3"/><ellipse cx="19" cy="42" rx="7" ry="8" fill="#fbf1df" stroke="#2b2235" stroke-width="3"/><path d="M3 24 L9 24 M2 34.5 L9 34.5 M3 45 L9 45" stroke="#2b2235" stroke-width="3" stroke-linecap="round"/></svg>',
    // an apple with a bite out of it
    eat: '<svg viewBox="0 0 64 64"><path d="M32 20 C22 12 7 18 9 35 C11 51 24 59 32 55 C40 59 53 51 55 35 C57 19 42 12 32 20 Z" fill="#e2574c" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/>'
      + '<circle cx="57" cy="29" r="9" fill="#fff"/><path d="M49.6 23.5 A9 9 0 0 0 50.5 35.5" fill="none" stroke="#2b2235" stroke-width="3" stroke-linecap="round"/><path d="M32 20 Q31 11 36 6" fill="none" stroke="#7a5233" stroke-width="3.5" stroke-linecap="round"/>'
      + '<path d="M34 12 Q43 5 48 11 Q41 16 34 12 Z" fill="#5fb257" stroke="#2b2235" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="21" cy="30" rx="4" ry="6" fill="#fff" opacity=".45"/></svg>',
    // a gray armadillo with a banded shell, in profile
    armadillo: (band = '#8e87a7') => '<svg viewBox="0 0 64 64"><path d="M13 42 Q5 44 3 36" fill="none" stroke="#2b2235" stroke-width="6" stroke-linecap="round"/><path d="M13 42 Q5 44 3 36" fill="none" stroke="#8e87a7" stroke-width="2.5" stroke-linecap="round"/>'
      + '<path d="M15 40 L15 52 M23 40 L23 53 M38 40 L38 53 M46 40 L46 52" stroke="#2b2235" stroke-width="6" stroke-linecap="round"/><path d="M15 40 L15 51 M23 40 L23 52 M38 40 L38 52 M46 40 L46 51" stroke="#8e87a7" stroke-width="2.5" stroke-linecap="round"/>'
      + `<path d="M9 45 C8 25 20 15 31 15 C43 15 52 25 52 45 Z" fill="#c9c2dc" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><path d="M23 17.5 C21 27 21 37 22 45 M31 15.5 C30 26 30 36 31 45 M39 17 C40 27 40 37 39.5 45" fill="none" stroke="${band}" stroke-width="5"/>`
      + '<path d="M9 45 C8 25 20 15 31 15 C43 15 52 25 52 45 Z" fill="none" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><path d="M60 41 L54 34" stroke="#2b2235" stroke-width="6" stroke-linecap="round"/><path d="M60 41 L54 34" stroke="#8e87a7" stroke-width="2.5" stroke-linecap="round"/>'
      + '<ellipse cx="50" cy="35" rx="8" ry="7" fill="#8e87a7" stroke="#2b2235" stroke-width="3"/><ellipse cx="48" cy="25" rx="3" ry="5.5" fill="#8e87a7" stroke="#2b2235" stroke-width="2.5"/><circle cx="62" cy="42" r="2.4" fill="#e58fa8" stroke="#2b2235" stroke-width="1.5"/><circle cx="52" cy="34" r="1.8" fill="#2b2235"/></svg>',
    // food, small, for the bag
    food: key => {
      const S = (inner) => `<svg viewBox="0 0 64 64">${inner}</svg>`, O = 'stroke="#2b2235" stroke-width="3.5" stroke-linejoin="round"';
      const stem = '<path d="M32 18 Q31 10 36 5" fill="none" stroke="#7a5233" stroke-width="4" stroke-linecap="round"/><path d="M34 11 Q43 4 48 10 Q41 15 34 11 Z" fill="#5fb257" stroke="#2b2235" stroke-width="2.5"/>';
      switch (key) {
        case 'apple': return S(`<path d="M32 18 C22 10 7 17 9 34 C11 51 24 59 32 55 C40 59 53 51 55 34 C57 17 42 10 32 18 Z" fill="#e2574c" ${O}/>${stem}`);
        case 'pear': return S(`<path d="M32 14 C24 14 24 24 24 30 C14 36 13 56 32 57 C51 56 50 36 40 30 C40 24 40 14 32 14 Z" fill="#c8d457" ${O}/>${stem}`);
        case 'orange': return S(`<circle cx="32" cy="35" r="22" fill="#f39a3c" ${O}/><path d="M32 14 Q40 8 46 13 Q39 17 32 14 Z" fill="#5fb257" stroke="#2b2235" stroke-width="2.5"/>`);
        case 'cookie': return S(`<circle cx="32" cy="33" r="23" fill="#d9a25f" ${O}/><circle cx="24" cy="25" r="3.5" fill="#6b4026"/><circle cx="39" cy="29" r="3.5" fill="#6b4026"/><circle cx="28" cy="41" r="3.5" fill="#6b4026"/><circle cx="41" cy="42" r="3" fill="#6b4026"/>`);
        case 'bread': return S(`<path d="M8 40 C8 22 20 18 32 18 C44 18 56 22 56 40 C56 48 50 50 32 50 C14 50 8 48 8 40 Z" fill="#d99a4e" ${O}/><path d="M20 26 L24 34 M30 24 L34 32 M40 25 L44 33" stroke="#f2d29b" stroke-width="3.5" stroke-linecap="round"/>`);
        case 'cheese': return S(`<path d="M6 44 L54 22 L58 44 Z" fill="#f5cf4b" ${O}/><path d="M6 44 L58 44 L58 52 L6 52 Z" fill="#e0b43a" ${O}/><circle cx="40" cy="36" r="3.5" fill="#d9a92e"/><circle cx="26" cy="40" r="2.5" fill="#d9a92e"/>`);
        case 'honey': return S(`<rect x="14" y="20" width="36" height="36" rx="9" fill="#f0a830" ${O}/><rect x="17" y="11" width="30" height="10" rx="3" fill="#a8703f" ${O}/><rect x="17" y="31" width="30" height="12" fill="#fff3d6" stroke="#2b2235" stroke-width="2"/>`);
        case 'cake': return S(`<path d="M10 30 L54 30 L54 54 L10 54 Z" fill="#f6b6c8" ${O}/><path d="M10 30 C16 22 48 22 54 30 L54 36 C48 40 44 34 38 38 C32 42 28 34 22 38 C16 42 12 36 10 36 Z" fill="#fffaf0" ${O}/><circle cx="32" cy="20" r="5" fill="#e2574c" stroke="#2b2235" stroke-width="2.5"/>`);
        case 'fish': return S(`<path d="M8 32 C18 16 40 14 50 32 C40 50 18 48 8 32 Z" fill="#8fb0c8" ${O}/><path d="M48 32 L60 20 L60 44 Z" fill="#7096b0" ${O}/><path d="M14 36 C24 44 38 44 46 34" fill="none" stroke="#dbe8f0" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="29" r="3" fill="#2b2235"/><path d="M26 24 L30 38 M34 23 L38 38" stroke="#5c4a3a" stroke-width="2.5" stroke-linecap="round"/>`);
        default: return S(`<circle cx="32" cy="34" r="21" fill="#e3c48f" ${O}/>`);
      }
    },
    color: c => `<svg viewBox="0 0 64 64"><path d="M32 7 C49 7 59 20 56 35 C53 51 39 59 27 56 C13 53 5 41 9 28 C12 16 21 7 32 7 Z" fill="${c}" stroke="#2b2235" stroke-width="4"/><ellipse cx="24" cy="21" rx="7" ry="4" fill="#fff" opacity=".55"/></svg>`,
    size: big => `<svg viewBox="0 0 64 64"><circle cx="${big ? 38 : 46}" cy="${big ? 36 : 46}" r="${big ? 22 : 10}" fill="#8e87a7" stroke="#2b2235" stroke-width="4"/><circle cx="${big ? 12 : 24}" cy="${big ? 50 : 30}" r="${big ? 8 : 20}" fill="none" stroke="#2b2235" stroke-width="3" stroke-dasharray="3 5"/></svg>`,
    // the three kinds of Hush creature, and the moth's wings
    hushling: '<svg viewBox="0 0 64 64"><path d="M50 46 Q60 44 58 34" fill="none" stroke="#2b2235" stroke-width="7" stroke-linecap="round"/><path d="M50 46 Q60 44 58 34" fill="none" stroke="#8e87a7" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="30" cy="40" rx="20" ry="17" fill="#c9c2dc" stroke="#2b2235" stroke-width="3"/><path d="M12 33 Q13 13 31 15 Q46 17 46 31 Q30 25 12 33 Z" fill="#8e87a7" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><path d="M31 15 Q37 4 49 6" fill="none" stroke="#2b2235" stroke-width="3"/><circle cx="49" cy="6" r="3.5" fill="#fff" stroke="#2b2235" stroke-width="2"/><path d="M20 40 q3 2 6 0 M32 40 q3 2 6 0" fill="none" stroke="#2b2235" stroke-width="2.5" stroke-linecap="round"/></svg>',
    moth: (wing = '#c9c2dc') => `<svg viewBox="0 0 64 64"><path d="M30 30 Q12 6 5 18 Q2 30 26 36 Z M34 30 Q52 6 59 18 Q62 30 38 36 Z" fill="${wing}" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><path d="M28 38 Q12 40 13 50 Q17 56 29 44 Z M36 38 Q52 40 51 50 Q47 56 35 44 Z" fill="${wing}" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><circle cx="15" cy="20" r="4" fill="#fff" stroke="#2b2235" stroke-width="2"/><circle cx="49" cy="20" r="4" fill="#fff" stroke="#2b2235" stroke-width="2"/><path d="M28 18 Q24 8 19 7 M36 18 Q40 8 45 7" fill="none" stroke="#2b2235" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="32" cy="36" rx="9" ry="16" fill="#958eae" stroke="#2b2235" stroke-width="3"/><path d="M26 30 q2 2 4 0 M34 30 q2 2 4 0" fill="none" stroke="#2b2235" stroke-width="2" stroke-linecap="round"/></svg>`,
    beetle: '<svg viewBox="0 0 64 64"><path d="M14 42 L6 48 M14 34 L5 34 M17 26 L8 20 M50 42 L58 48 M50 34 L59 34 M47 26 L56 20" stroke="#2b2235" stroke-width="4" stroke-linecap="round"/><path d="M32 12 C48 12 54 26 52 40 C50 52 42 56 32 56 C22 56 14 52 12 40 C10 26 16 12 32 12 Z" fill="#c9c2dc" stroke="#2b2235" stroke-width="3"/><path d="M32 14 L32 55" stroke="#2b2235" stroke-width="3"/><circle cx="23" cy="30" r="4" fill="#fff" opacity=".7"/><circle cx="42" cy="38" r="3.5" fill="#fff" opacity=".7"/><ellipse cx="32" cy="11" rx="10" ry="7" fill="#8e87a7" stroke="#2b2235" stroke-width="3"/><path d="M27 6 L22 1 M37 6 L42 1" stroke="#2b2235" stroke-width="2.5" stroke-linecap="round"/></svg>',
    // a round frog face: eye bumps on top, its colored back, a wide smile, the pale throat
    frog: (back = '#8e87a7') => `<svg viewBox="0 0 64 64"><path d="M14 46 C4 46 4 56 14 56 L22 56 M50 46 C60 46 60 56 50 56 L42 56" fill="#c9c2dc" stroke="#2b2235" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
      + '<ellipse cx="32" cy="41" rx="23" ry="16" fill="#c9c2dc" stroke="#2b2235" stroke-width="3"/>'
      + `<path d="M10 38 C12 25 52 25 54 38 C44 32 20 32 10 38 Z" fill="${back}" stroke="#2b2235" stroke-width="2.5" stroke-linejoin="round"/>`
      + `<circle cx="20" cy="23" r="8.5" fill="${back}" stroke="#2b2235" stroke-width="3"/><circle cx="44" cy="23" r="8.5" fill="${back}" stroke="#2b2235" stroke-width="3"/>`
      + '<ellipse cx="20" cy="23" rx="3.4" ry="4.2" fill="#2b2235"/><ellipse cx="44" cy="23" rx="3.4" ry="4.2" fill="#2b2235"/><circle cx="21.3" cy="21.4" r="1.3" fill="#fff"/><circle cx="45.3" cy="21.4" r="1.3" fill="#fff"/>'
      + '<path d="M17 41 Q32 51 47 41" fill="none" stroke="#2b2235" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="32" cy="52.5" rx="8" ry="4.5" fill="#f4e8d8" stroke="#2b2235" stroke-width="2.5"/></svg>',
    // a straw training dummy on its post, with a scarf
    dummy: (scarf = '#e2574c') => '<svg viewBox="0 0 64 64"><path d="M14 60 L50 60 M32 60 L32 22" stroke="#2b2235" stroke-width="7" stroke-linecap="round"/><path d="M14 60 L50 60 M32 60 L32 22" stroke="#8b6340" stroke-width="3.5" stroke-linecap="round"/>'
      + '<path d="M8 33 L56 33" stroke="#2b2235" stroke-width="6" stroke-linecap="round"/><path d="M8 33 L56 33" stroke="#8b6340" stroke-width="2.5" stroke-linecap="round"/>'
      + '<path d="M20 30 C20 26 44 26 44 30 L46 50 C46 54 18 54 18 50 Z" fill="#cfb487" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="41" r="5" fill="#fbf3e3" stroke="#5a4a3a" stroke-width="2.5"/>'
      + `<path d="M22 24 Q32 30 42 24 L42 28 Q32 33 22 28 Z" fill="${scarf}" stroke="#2b2235" stroke-width="2.5" stroke-linejoin="round"/>`
      + '<circle cx="32" cy="15" r="9" fill="#cfb487" stroke="#2b2235" stroke-width="3"/><circle cx="29" cy="14" r="1.6" fill="#2b2235"/><circle cx="35" cy="14" r="1.6" fill="#2b2235"/><path d="M29 18 q3 2 6 0" fill="none" stroke="#2b2235" stroke-width="1.8" stroke-linecap="round"/>'
      + '<path d="M28 6 L26 2 M32 6 L32 1 M36 6 L38 2" stroke="#d9b65e" stroke-width="2.5" stroke-linecap="round"/></svg>',
    // a corn kernel soldier with its husk helmet and toothpick spear
    kernel: (skin = '#f2c94c') => '<svg viewBox="0 0 64 64"><path d="M48 14 L44 56" stroke="#2b2235" stroke-width="5" stroke-linecap="round"/><path d="M48 14 L44 56" stroke="#cfa86f" stroke-width="2.2" stroke-linecap="round"/>'
      + `<path d="M32 58 C24 58 16 46 15 34 C14 22 22 14 32 14 C42 14 50 22 49 34 C48 46 40 58 32 58 Z" fill="${skin}" stroke="#2b2235" stroke-width="3"/>`
      + '<ellipse cx="32" cy="46" rx="6" ry="8" fill="#fff5d6" opacity=".8"/><path d="M15 22 C17 10 47 10 49 22 C40 18 24 18 15 22 Z" fill="#b6c178" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/>'
      + '<circle cx="27" cy="29" r="2.2" fill="#2b2235"/><circle cx="37" cy="29" r="2.2" fill="#2b2235"/><path d="M28 35 q4 3 8 0" fill="none" stroke="#2b2235" stroke-width="2" stroke-linecap="round"/></svg>',
    // a fluffy piece of popcorn with its hull
    popcorn: (hull = '#f2c94c') => '<svg viewBox="0 0 64 64">' + [[24, 28, 12], [40, 24, 12], [44, 40, 11], [20, 42, 11], [32, 34, 13]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fcf4e0" stroke="#2b2235" stroke-width="3"/>`).join('')
      + [[24, 28, 10], [40, 24, 10], [44, 40, 9], [20, 42, 9], [32, 34, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fcf4e0"/>`).join('')
      + `<path d="M20 50 Q32 60 44 50 Q40 56 32 57 Q24 56 20 50 Z" fill="${hull}" stroke="#2b2235" stroke-width="2.5" stroke-linejoin="round"/><circle cx="28" cy="33" r="2" fill="#2b2235"/><circle cx="36" cy="33" r="2" fill="#2b2235"/></svg>`,
    // Colonel Cob: a corn cob with a cap, a mustache and his husk cape
    colonel: '<svg viewBox="0 0 64 64"><path d="M12 60 C10 40 16 26 32 26 C48 26 54 40 52 60 Z" fill="#b7c376" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M22 58 C20 34 22 14 32 12 C42 14 44 34 42 58 Z" fill="#f2c94c" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M26 20 h12 M25 46 h14 M24 52 h16" stroke="#b8902c" stroke-width="2" stroke-dasharray="3 2"/><circle cx="28" cy="27" r="2.3" fill="#2b2235"/><circle cx="36" cy="27" r="2.3" fill="#2b2235"/>'
      + '<path d="M25 23 l5 2 M39 23 l-5 2" stroke="#2b2235" stroke-width="2" stroke-linecap="round"/><path d="M32 34 C28 31 22 33 20 30 C22 37 30 36 32 34 C34 36 42 37 44 30 C42 33 36 31 32 34 Z" fill="#dcae52" stroke="#2b2235" stroke-width="2"/>'
      + '<path d="M24 12 L40 12 L41 6 L23 6 Z" fill="#3f5d43" stroke="#2b2235" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 12 Q32 16 42 12" fill="none" stroke="#2b2235" stroke-width="3"/><circle cx="32" cy="42" r="3.5" fill="#ffcf45" stroke="#2b2235" stroke-width="2"/></svg>',
    // where it stands: three lily pads in a row, the one meant in gold, with an arrow over it
    pos: key => {
      const x = key === 'left' ? 12 : key === 'right' ? 52 : 32, on = k => (k === key ? '#f5b73b' : '#7fbf6a');
      return `<svg viewBox="0 0 64 64"><path d="M2 46 Q32 40 62 46" fill="none" stroke="#7fc0d6" stroke-width="3" stroke-linecap="round"/>`
        + ['left', 'middle', 'right'].map((k, i) => `<ellipse cx="${12 + i * 20}" cy="${43 - (i === 1 ? 2 : 0)}" rx="9" ry="5" fill="${on(k)}" stroke="#2b2235" stroke-width="2.5"/>`).join('')
        + `<path d="M${x} 10 L${x} 30 M${x - 7} 23 L${x} 30 L${x + 7} 23" fill="none" stroke="#2b2235" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    },
    part: key => {
      if (key === 'wing') return ICON.moth('#f5b73b');
      const on = k => (k === key ? '#f5b73b' : '#8e87a7');
      return `<svg viewBox="0 0 64 64"><path d="M40 47 Q55 50 56 36 Q57 28 50 27" fill="none" stroke="#2b2235" stroke-width="7" stroke-linecap="round"/><path d="M40 47 Q55 50 56 36 Q57 28 50 27" fill="none" stroke="${on('tail')}" stroke-width="3.5" stroke-linecap="round"/><circle cx="50" cy="25" r="6" fill="${on('tail')}" stroke="#2b2235" stroke-width="3"/>`
        + `<ellipse cx="28" cy="42" rx="18" ry="15" fill="#8e87a7" stroke="#2b2235" stroke-width="3"/>`
        + (key === 'shell' ? '<path d="M30 30 Q44 26 46 44 L32 44 Z" fill="#f5b73b" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/>' : '')
        + `<path d="M11 36 Q12 16 30 18 Q44 20 44 34 Q30 28 11 36 Z" fill="${on('head')}" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><path d="M30 18 Q36 6 48 8" fill="none" stroke="#2b2235" stroke-width="3"/><circle cx="48" cy="8" r="3.5" fill="#fff" stroke="#2b2235" stroke-width="2"/>`
        + '<path d="M19 42 q3 2 6 0 M30 42 q3 2 6 0" fill="none" stroke="#2b2235" stroke-width="2.5" stroke-linecap="round"/></svg>';
    },
  };
  const COL = { red: '#e2574c', blue: '#4c7fd8', green: '#5fb257', yellow: '#f2c94c', white: '#f8f5ec' };
  // a gold coin (the result card and the coin counter)
  const COIN = '<svg viewBox="0 0 32 32"><circle cx="16" cy="17.5" r="13" fill="#c98a12" stroke="#2b2235" stroke-width="2.5"/><circle cx="16" cy="15" r="13" fill="#ffc93c" stroke="#2b2235" stroke-width="2.5"/>'
    + '<circle cx="16" cy="15" r="8.2" fill="none" stroke="#e0951a" stroke-width="2"/><path d="M10.5 10.5 Q12.5 7.6 16 7.4" fill="none" stroke="#fff6c8" stroke-width="2.6" stroke-linecap="round"/></svg>';
  function iconFor(id) {
    if (!id) return '';
    const [kind, key] = id.split('.');
    if (kind === 'v') return typeof ICON[key] === 'string' ? ICON[key] : ICON.hit;
    if (kind === 'a') return COL[key] ? ICON.color(COL[key]) : key === 'big' || key === 'small' ? ICON.size(key === 'big') : '';
    if (kind === 'n') return key === 'moth' ? ICON.moth() : key === 'armadillo' ? ICON.armadillo() : key === 'frog' ? ICON.frog() : key === 'dummy' ? ICON.dummy() : key === 'kernel' ? ICON.kernel()
      : key === 'popcorn' ? ICON.popcorn() : key === 'colonel' ? ICON.colonel : key === 'beetle' || key === 'hushling' ? ICON[key] : ICON.part(key);
    if (kind === 'p') return ICON.pos(key);
    if (kind === 'w') return ICON.food(key);
    return '';
  }
  // The game's own word pictures (icons.js: the journal, the teach box) get the battle's new words too: the
  // positions, the frog and fish. Only where icons.js has none of its own (it loads first; ICONS.add replaces).
  if (typeof ICONS !== 'undefined' && ICONS.add && ICONS.H) {
    const H = ICONS.H, has = k => ICONS.keys.includes(k);
    const pads = key => (c, p) => {
      [-26, 0, 26].forEach((x, i) => H.shape(c, p, H.ell(x, 20 - (i === 1 ? 3 : 0), 11, 6), ['left', 'middle', 'right'][i] === key ? '#ffcf3f' : '#6db55a'));
      const x = key === 'left' ? -26 : key === 'right' ? 26 : 0;
      H.shape(c, p, H.poly([[x - 5, -40], [x + 5, -40], [x + 5, -22], [x + 14, -22], [x, -6], [x - 14, -22], [x - 5, -22]]), '#ffffff');   // an arrow down at it
    };
    if (!has('left')) ICONS.add('left', pads('left'));
    if (!has('middle')) ICONS.add('middle', pads('middle'));
    if (!has('right')) ICONS.add('right', pads('right'));
    if (!has('frog')) ICONS.add('frog', (c, p) => {
      H.shape(c, p, H.ell(0, 10, 28, 19), '#b9b2cf'); H.shape(c, p, c2 => { c2.moveTo(-27, 6); c2.bezierCurveTo(-20, -10, 20, -10, 27, 6); c2.bezierCurveTo(14, 0, -14, 0, -27, 6); c2.closePath(); }, '#5fb257');
      [-14, 14].forEach(x => H.shape(c, p, H.ell(x, -12, 10, 10), '#5fb257'));
      if (p) { H.eyes(c, -14, 14, -12, 1.2); c.beginPath(); c.moveTo(-16, 14); c.quadraticCurveTo(0, 24, 16, 14); c.lineWidth = 2.4; c.strokeStyle = H.INK; c.stroke(); }
    });
    if (!has('dummy')) ICONS.add('dummy', (c, p) => {
      H.shape(c, p, H.rr(-3, -10, 6, 46, 3), '#8b6340'); H.shape(c, p, H.rr(-30, 2, 60, 6, 3), '#8b6340');
      H.shape(c, p, c2 => { c2.moveTo(-15, -2); c2.bezierCurveTo(-18, 26, 18, 26, 15, -2); c2.closePath(); }, '#cfb487');
      H.shape(c, p, H.ell(0, -18, 13, 13), '#cfb487'); H.shape(c, p, H.rr(-14, -6, 28, 6, 3), '#e2574c');
      if (p) { H.dot(c, -4, -19, 2.2, H.INK); H.dot(c, 4, -19, 2.2, H.INK); H.dot(c, 0, 12, 5, '#fbf3e3'); }
    });
    if (!has('kernel')) ICONS.add('kernel', (c, p) => {
      H.shape(c, p, c2 => { c2.moveTo(0, 32); c2.bezierCurveTo(-30, 20, -26, -26, 0, -26); c2.bezierCurveTo(26, -26, 30, 20, 0, 32); c2.closePath(); }, '#f2c94c');
      if (p) { H.dot(c, 0, 14, 7, '#fff5d6'); H.eyes(c, -7, 7, -6); }
    });
    if (!has('popcorn')) ICONS.add('popcorn', (c, p) => {
      [[-12, -8, 13], [12, -12, 12], [14, 8, 12], [-12, 12, 12], [0, 0, 14]].forEach(([x, y, r]) => H.shape(c, p, H.ell(x, y, r, r), '#fcf4e0'));
      H.shape(c, p, H.ell(0, 26, 12, 5), '#f2c94c'); if (p) H.eyes(c, -6, 6, 0);
    });
    if (!has('colonel')) ICONS.add('colonel', (c, p) => {
      H.shape(c, p, c2 => { c2.moveTo(-26, 34); c2.bezierCurveTo(-28, 0, -16, -10, 0, -10); c2.bezierCurveTo(16, -10, 28, 0, 26, 34); c2.closePath(); }, '#b7c376');
      H.shape(c, p, c2 => { c2.moveTo(-12, 32); c2.bezierCurveTo(-14, -6, -8, -26, 0, -28); c2.bezierCurveTo(8, -26, 14, -6, 12, 32); c2.closePath(); }, '#f2c94c');
      H.shape(c, p, H.rr(-10, -38, 20, 9, 3), '#3f5d43');
      if (p) { H.eyes(c, -5, 5, -16); c.beginPath(); c.moveTo(-12, -6); c.quadraticCurveTo(0, -12, 12, -6); c.lineWidth = 4; c.strokeStyle = '#b4832f'; c.stroke(); H.dot(c, 0, 8, 4, '#ffcf45'); }
    });
    if (!has('fish')) ICONS.add('fish', (c, p) => {
      H.shape(c, p, c2 => { c2.moveTo(-30, 0); c2.bezierCurveTo(-16, -18, 12, -18, 22, 0); c2.bezierCurveTo(12, 18, -16, 18, -30, 0); c2.closePath(); }, '#8fb0c8');
      H.shape(c, p, H.poly([[20, 0], [34, -14], [34, 14]]), '#7096b0');
      if (p) H.dot(c, -19, -3, 3, H.INK);
    });
  }

  // ------------------------------------------------------------ mount
  const U = { root: null, e: {}, bubbles: [], pops: [], badges: [], labels: new Map(), tags: new Map(), ring: null, t: 0, handlers: {} };
  const mk = (cls, parent, html) => { const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; (parent || U.root).appendChild(d); return d; };
  function mount(h) {
    U.handlers = h || {};
    if (!document.getElementById('battle-ui-css')) { const st = document.createElement('style'); st.id = 'battle-ui-css'; st.textContent = CSS; document.head.appendChild(st); }
    let root = document.getElementById('battle-ui');
    if (!root) { root = document.createElement('div'); root.id = 'battle-ui'; document.body.appendChild(root); }
    root.innerHTML = '';
    root.hidden = false;
    U.root = root; U.bubbles = []; U.pops = []; U.badges = []; U.labels = new Map(); U.tags = new Map(); U.ring = null;
    const e = U.e = {};
    e.layer = mk('bt-layer');
    e.top = mk('bt-top');
    e.left = mk('bt-left', e.top);
    e.lrow = mk('bt-lrow', e.left);
    e.hearts = mk('bt-hearts', e.lrow, '<span class="who"></span><span class="row"></span>');
    e.coins = mk('bt-coinpill', e.lrow, `${COIN}<b>0</b>`); e.coins.hidden = true; e.coins.title = 'Coins earned in this fight';
    e.bag = mk('bt-bag', e.left); e.bag.hidden = true;
    e.rung = mk('bt-rung', e.top); e.rung.hidden = true;
    e.btns = mk('bt-btns', e.top, '<button class="bt-en" title="Show English">EN</button><button class="bt-run" title="Run away (Esc)">Run ⎋</button>');
    e.btns.querySelector('.bt-en').onclick = () => toggleEN();
    e.btns.querySelector('.bt-run').onclick = () => U.handlers.onRun && U.handlers.onRun();
    e.tip = mk('bt-tip'); e.tip.hidden = true;
    e.dodge = mk('bt-dodge'); e.dodge.hidden = true;
    e.toast = mk('bt-toast'); e.toast.hidden = true;
    e.coach = mk('bt-coach card', null, '<div class="who">Coach</div><div class="txt"></div><div class="en"></div><div class="next">Enter ▶</div>'); e.coach.hidden = true;
    e.coach.onclick = () => U.handlers.onNext && U.handlers.onNext();
    e.prompt = mk('bt-prompt'); e.prompt.hidden = true;
    e.frames = mk('bt-frames', e.prompt);
    e.echo = mk('bt-echo', e.prompt); e.echo.hidden = true;
    e.row = mk('bt-row card', e.prompt, '<div class="bt-plabel"></div><div class="bt-icon"></div><input class="bt-cmd" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="bt-hint" title="Tab">Hint</button><button class="bt-send">Send ⏎</button>');
    e.sub = mk('bt-sub', e.prompt, '<span class="bt-hinttxt"></span><span class="bt-preview"></span>');
    e.plabel = e.row.querySelector('.bt-plabel'); e.icon = e.row.querySelector('.bt-icon'); e.input = e.row.querySelector('.bt-cmd');
    e.hintBtn = e.row.querySelector('.bt-hint'); e.send = e.row.querySelector('.bt-send');
    e.hinttxt = e.sub.querySelector('.bt-hinttxt'); e.preview = e.sub.querySelector('.bt-preview');
    e.confirm = mk('bt-confirm card', null, 'Run away from this fight?<div><button class="yes">Run ⏎</button><button class="no">Stay (Esc)</button></div>'); e.confirm.hidden = true;
    e.confirm.querySelector('.yes').onclick = () => U.handlers.onConfirm && U.handlers.onConfirm(true);
    e.confirm.querySelector('.no').onclick = () => U.handlers.onConfirm && U.handlers.onConfirm(false);
    e.result = mk('bt-result card'); e.result.hidden = true;
    e.result.onclick = () => U.handlers.onNext && U.handlers.onNext();
    const inp = e.input;
    // zh / ja: CJK fonts, and the in-game IME on the command box (type pinyin / rōmaji, Space for characters; in pinyin mode a
    // tone digit puts its mark on: ni3 → nǐ). (Mounted after the battle has set the language engine's language.)
    const cj = CJ();
    root.dataset.cj = cj ? cj.lang() : '';
    if (cj) { inp.setAttribute('lang', cj.tag(cj.lang(), 'chars')); CJK.attachIME(inp); } else inp.removeAttribute('lang');
    inp.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') { ev.preventDefault(); U.handlers.onSubmit && U.handlers.onSubmit(inp.value); }
      else if (ev.key === 'Tab') { ev.preventDefault(); U.handlers.onHint && U.handlers.onHint(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); U.handlers.onRun && U.handlers.onRun(); }
    });
    inp.addEventListener('keyup', ev => ev.stopPropagation());
    inp.addEventListener('input', () => { U.handlers.onInput && U.handlers.onInput(inp.value); });
    inp.addEventListener('focus', () => { if (typeof Input !== 'undefined') Input.typing = true; });
    inp.addEventListener('blur', () => { if (typeof Input !== 'undefined') Input.typing = false; });
    e.send.onclick = () => U.handlers.onSubmit && U.handlers.onSubmit(inp.value);
    e.hintBtn.onclick = () => { U.handlers.onHint && U.handlers.onHint(); inp.focus(); };
    root.addEventListener('pointerdown', ev => { if (!e.prompt.hidden && !ev.target.closest('button, input')) setTimeout(() => focusInput(), 0); });
    if (U.showEN) root.classList.add('show-en');
  }
  function unmount() {
    if (!U.root) return;
    if (U.e.input) U.e.input.blur();
    if (typeof Input !== 'undefined') Input.typing = false;
    U.root.innerHTML = ''; U.root.hidden = true;
    U.bubbles = []; U.pops = []; U.badges = []; U.labels = new Map(); U.tags = new Map(); U.ring = null;
  }
  function toggleEN(v) {
    U.showEN = v === undefined ? !U.showEN : v;
    U.root.classList.toggle('show-en', U.showEN);
    const b = U.root.querySelector('.bt-en'); if (b) b.classList.toggle('on', U.showEN);
  }
  function focusInput() { if (U.e.input && !U.e.prompt.hidden && !U.noFocus) { try { U.e.input.focus({ preventScroll: true }); } catch (e) { U.e.input.focus(); } } }

  // ------------------------------------------------------------ top bar, tips
  // fx: true (hurt: a nudge) or 'heal' (a green pulse)
  function hearts(n, max, name, fx) {
    const h = U.e.hearts;
    h.querySelector('.who').textContent = `You & ${name}`;
    h.querySelector('.row').innerHTML = Array.from({ length: max }, (_, i) => `<span class="${i < n ? '' : 'gone'}">♥</span>`).join('');
    if (fx) { h.classList.remove('ouch', 'heal'); void h.offsetWidth; h.classList.add(fx === 'heal' ? 'heal' : 'ouch'); }
  }
  // the coins earned so far this fight (hidden at 0); bump: a little pop
  function coins(n, bump) {
    const c = U.e.coins; if (!c) return;
    c.hidden = !n; c.querySelector('b').textContent = n;
    if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  }
  // the food in the bag: [{ key (apple…), html (the word with its article, in the language), en, n }]
  function bag(list) {
    const b = U.e.bag; if (!b) return;
    b.innerHTML = (list || []).map(x => `<span class="bt-food" title="${esc(x.en || '')}">${ICON.food(x.key)}<span>${mix(x.html)}</span><i>×${x.n}</i></span>`).join('');
    b.hidden = !(list && list.length);
    U.root.classList.toggle('has-bag', !b.hidden);
  }
  const rung = html => { U.e.rung.innerHTML = mixQ(html || ''); U.e.rung.hidden = !html; };
  const tip = html => { U.e.tip.innerHTML = mixQ(html || ''); U.e.tip.hidden = !html; };
  const dodge = html => { U.e.dodge.innerHTML = mix(html || ''); U.e.dodge.hidden = !html; };
  function toast(html, t, dur = 2.4) { U.e.toast.innerHTML = mixQ(html); U.e.toast.hidden = false; U.toastUntil = t + dur; }

  // ------------------------------------------------------------ the Coach's box and the prompt
  // mode: 'en-first' (the English on top, the line in the language under it; sub is HTML),
  // 'en-under' (the language on top, the English always under it), or '' (English with EN only)
  // who: the name on the box's tab ('Coach' by default; a new creature's name moment uses 'New creature')
  // (P7b) 'tl-toggle': the line mixed at your level on top; the whole line in the language (sub) only when you click the box's small
  // button (tl: its label, the language's name), for that line only. Never a line with its whole translation under it.
  function coach(html, sub, mode = '', subHtml = false, who = 'Coach', tl = '') {
    const c = U.e.coach, s = c.querySelector('.en');
    c.querySelector('.who').textContent = who || 'Coach';
    c.querySelector('.txt').innerHTML = html;
    if (subHtml) s.innerHTML = sub || ''; else s.textContent = sub || '';
    c.classList.toggle('en-first', mode === 'en-first'); c.classList.toggle('en-under', mode === 'en-under');
    c.classList.toggle('tl-toggle', mode === 'tl-toggle'); c.classList.remove('show-tl');
    let b = c.querySelector('.tlbtn');
    if (mode === 'tl-toggle' && sub) {
      if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'tlbtn'; c.appendChild(b); b.onclick = ev => { ev.stopPropagation(); c.classList.toggle('show-tl'); b.blur(); }; }
      b.textContent = tl || 'In the language'; b.title = `The whole line in ${tl || 'the language'}`; b.hidden = false;
    } else if (b) b.hidden = true;
    c.hidden = false; U.e.prompt.hidden = true;
  }
  const coachHide = () => { U.e.coach.hidden = true; };
  // p: { kind: 'echo'|'teach'|'command', label, icon (item id), echo, placeholder, hint }
  function prompt(p) {
    const e = U.e;
    e.prompt.hidden = false; e.coach.hidden = true;
    e.plabel.textContent = p.label;
    e.icon.innerHTML = p.icon ? iconFor(p.icon) : ''; e.icon.hidden = !p.icon;
    if (p.echo && CJ() && hasCJ(p.echo)) e.echo.innerHTML = cjHTML(p.echo, { ruby: 'always', cap: false });     // (copy it: its reading is always shown)
    else e.echo.textContent = p.echo || '';
    e.echo.hidden = !p.echo;
    e.hintBtn.hidden = p.kind !== 'teach';
    hint(p.hint || '', true);
    e.input.value = ''; e.input.placeholder = p.placeholder || '';
    e.input.disabled = false;
    preview('');
    focusInput();
  }
  function promptHide() { const e = U.e; if (!e.prompt) return; e.prompt.hidden = true; e.input.blur(); preview(''); }
  // o.ruby: 'always' (an "I don't know" answer: you need to read it)
  function hint(text, soft, o) {
    const h = U.e.hinttxt;
    if (text && CJ() && hasCJ(text)) h.innerHTML = mixQ(esc(text), { ruby: o && o.ruby }); else h.textContent = text || '';
    h.classList.toggle('soft', !!soft); h.style.display = '';
  }
  const preview = html => {
    U.e.preview.innerHTML = mixQ(html || '');
    // the soft key hint makes room for what Mimo understood
    const h = U.e.hinttxt; if (h.classList.contains('soft')) h.style.display = html ? 'none' : '';
  };
  const frames = list => { U.e.frames.innerHTML = (list || []).map(f => `<span class="bt-fr">${CJ() && hasCJ(f) ? cjHTML(f) : esc(f)}</span>`).join(''); };
  function nudge() { const r = U.e.row; r.classList.remove('nudge'); void r.offsetWidth; r.classList.add('nudge'); }
  const confirmBox = on => { U.e.confirm.hidden = !on; if (on) U.e.input.blur(); };
  function result(html) { U.e.result.innerHTML = mixQ(html); U.e.result.hidden = !html; if (html) { U.e.prompt.hidden = true; U.e.coach.hidden = true; } }

  // ------------------------------------------------------------ things anchored to the 3D scene
  // say(): a speech bubble over an actor (state object). o: { cls, en, dur, html }
  function say(actor, text, t, o = {}) {
    for (let i = U.bubbles.length - 1; i >= 0; i--) if (U.bubbles[i].actor === actor) { U.bubbles[i].el.remove(); U.bubbles.splice(i, 1); }
    // zh / ja: a line in the notation goes through CJK (and counts as read for the character gimmick); its English may have «words»
    const cj = !o.html && CJ() && hasCJ(text) ? CJ() : null;
    if (cj) cj.seen(text);
    const body = o.html ? text : cj ? cj.html(text, { lang: cj.lang() }) : esc(text);
    const el = mk('bt-bubble ' + (o.cls || ''), U.e.layer, body + (o.en ? `<div class="en${o.enAlways ? ' always' : ''}">${mix(esc(o.en))}</div>` : ''));
    U.bubbles.push({ el, actor, until: t + (o.dur || 2.2), side: o.side || (actor.kind === 'mimo' ? 'right' : actor.kind === 'foe' ? 'left' : 'center') });
    sync(U.t);
    return el;
  }
  function clearBubbles(actor) { for (let i = U.bubbles.length - 1; i >= 0; i--) if (!actor || U.bubbles[i].actor === actor) { U.bubbles[i].el.remove(); U.bubbles.splice(i, 1); } }
  function label(foe, html) {
    let el = U.labels.get(foe);
    const fresh = !el;
    if (!el) { el = mk('bt-label', U.e.layer); U.labels.set(foe, el); }
    el.innerHTML = mix(html);
    if (fresh) sync(U.t);
  }
  function labelRemove(foe) { const el = U.labels.get(foe); if (el) { el.remove(); U.labels.delete(foe); } }
  // tags float at a world point (part names, stones). where: () => Vector3
  function tag(id, where, html, cls = '') {
    let t = U.tags.get(id);
    const fresh = !t;
    if (!t) { t = { el: mk('bt-tag', U.e.layer), where }; U.tags.set(id, t); }
    t.where = where; t.el.className = 'bt-tag ' + cls; t.el.innerHTML = mix(html);
    if (fresh) sync(U.t);
  }
  function tagRemove(prefix) { for (const [id, t] of U.tags) if (id.startsWith(prefix)) { t.el.remove(); U.tags.delete(id); } }
  // pop(): a damage number or grade that springs up and floats away
  function pop(pos, text, t, o = {}) {
    const el = mk('bt-pop', U.e.layer, esc(mixPlain(text)) + (o.sub ? `<small>${esc(o.sub)}</small>` : ''));
    el.style.color = o.color || '#ffffff'; el.style.fontSize = (o.size || 40) + 'px';
    U.pops.push({ el, pos: pos.clone(), t0: t, life: o.life || 1.1, rise: o.rise === undefined ? 0.9 : o.rise, dx: o.dx || 0 });
    sync(U.t);
  }
  // freed(): a word a beaten Hush creature lets go of (battle/rewards.js): w = { img (a picture's URL), html (the word, ready to
  // show: zh / ja already through CJK), en }. It springs up out of the foe, floats a while and fades, like a pop.
  function freed(pos, w, t) {
    const el = mk('bt-freed', U.e.layer, `${w.img ? `<img src="${w.img}" alt="">` : ''}<span><i>Word freed!</i><b>${w.html}</b>${w.en ? `<small>${esc(w.en)}</small>` : ''}</span>`);
    U.pops.push({ el, pos: pos.clone(), t0: t, life: 3.0, rise: 1.3, dx: 0 });
    sync(U.t);
  }
  // badge(): the attack rating over a foe as the hit lands: a big letter that slams in with an
  // overshoot and a wobble (S gets a gold starburst and sparkles; a D droops), with the reason under it.
  // Animated in sync() with inline styles, so screenshots of the layer show it too.
  const BURST = (() => { const pts = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU - Math.PI / 2, r = i % 2 ? 48 : 70; pts.push(`${(72 + Math.cos(a) * r).toFixed(1)},${(72 + Math.sin(a) * r).toFixed(1)}`); } return pts.join(' '); })();
  function badge(pos, letter, reason, t, o = {}) {
    const S = letter === 'S';
    const burst = S ? `<svg class="burst" viewBox="0 0 144 144"><polygon points="${BURST}" fill="#ffb627" stroke="#2b2235" stroke-width="5" stroke-linejoin="round"/></svg>` : '';
    const sparks = S ? '<i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i>' : '';
    const el = mk('bt-grade g' + letter, U.e.layer, `<div class="gb">${burst}<div class="gl">${esc(letter)}</div>${sparks}</div><div class="gr">${mixQ(esc(reason || ''))}</div>`);
    U.badges.push({ el, gb: el.querySelector('.gb'), gr: el.querySelector('.gr'), burst: el.querySelector('.burst'), sps: [...el.querySelectorAll('.sp')], pos: pos.clone(), t0: t, life: o.life || 2.1, letter });
    sync(U.t);
  }
  function syncBadges(t) {
    const ST = _.STAGE;
    for (let i = U.badges.length - 1; i >= 0; i--) {
      const b = U.badges[i], age = t - b.t0, k = age / b.life;
      if (k >= 1) { b.el.remove(); U.badges.splice(i, 1); continue; }
      const p = ST.project(b.pos.clone().add(new THREE.Vector3(0, 0.5 * Math.max(0, k - 0.72), 0)));
      const D = b.letter === 'D', S = b.letter === 'S', soft = D || b.letter === 'C';
      // slam in (overshoot), settle with a wobble, then breathe; a D tips over a little, sadly
      let s, r;
      if (age < 0.11) { const u = age / 0.11; s = 0.25 + u * (soft ? 0.95 : 1.25); r = -16 * (1 - u); }
      else if (age < 0.25) { const u = (age - 0.11) / 0.14; s = (soft ? 1.2 : 1.5) - u * (soft ? 0.28 : 0.6); r = 9 * Math.sin(u * Math.PI); }
      else if (age < 0.4) { const u = (age - 0.25) / 0.15; s = (soft ? 0.92 : 0.9) + u * (soft ? 0.08 : 0.1); r = -4 * Math.sin(u * Math.PI); }
      else { s = 1 + Math.sin((age - 0.4) * 6) * (S ? 0.04 : 0.015); r = D ? Math.min(12, (age - 0.4) * 30) : Math.sin((age - 0.4) * 3.5) * (S ? 3 : 1.5); }
      // kept on screen (the action camera can frame a floating foe near the top edge)
      const w = b.el.offsetWidth || 100, h = b.el.offsetHeight || 120;
      const x = clamp(p.x, w / 2 + 12, innerWidth - w / 2 - 12), y = clamp(p.y, h + 30, innerHeight - 20);
      b.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
      b.gb.style.transform = `scale(${s.toFixed(3)}) rotate(${r.toFixed(1)}deg)`;
      const ru = clamp((age - 0.16) / 0.18, 0, 1);
      b.gr.style.opacity = ru.toFixed(2); b.gr.style.transform = `translateY(${((1 - ru) * -10).toFixed(1)}px) scale(${(0.8 + ru * 0.2).toFixed(2)})`;
      b.el.style.opacity = k > 0.82 ? (1 - (k - 0.82) / 0.18).toFixed(3) : '1';
      if (b.burst) b.burst.style.transform = `rotate(${(age * 40).toFixed(1)}deg) scale(${(0.85 + 0.15 * Math.min(1, age / 0.2) + Math.sin(age * 8) * 0.03).toFixed(3)})`;
      // the S sparkles burst out from the badge and twinkle
      b.sps.forEach((sp, j) => {
        const a = (j / b.sps.length) * TAU + 0.5, out = 50 + Math.min(1, age / 0.35) * 30 + Math.sin(age * 3 + j) * 4, tw = 0.55 + 0.45 * Math.abs(Math.sin(age * 7 + j * 1.9));
        sp.style.transform = `translate(${(Math.cos(a) * out).toFixed(1)}px, ${(Math.sin(a) * out * 0.85).toFixed(1)}px) scale(${(tw * Math.min(1, age / 0.15)).toFixed(2)}) rotate(${(age * 140 + j * 50).toFixed(0)}deg)`;
      });
    }
  }
  // the timing ring: shrinks onto the focus point and hits the inner ring at T
  function ring(o) { ringHide(); U.ring = Object.assign({ el: mk('bt-ring', U.e.layer), el0: mk('bt-ring0', U.e.layer), key: mk('bt-key', U.e.layer, o.keyHTML || '') }, o); sync(U.t); }
  function ringHide() { const r = U.ring; if (r) { r.el.remove(); r.el0.remove(); r.key.remove(); U.ring = null; } }

  // ------------------------------------------------------------ per frame
  function sync(t) {
    U.t = t;
    const ST = _.STAGE, W = innerWidth, H = innerHeight;
    if (!U.root || U.root.hidden) return;
    // the tip box (top left): a bubble that would sit on it goes below it if there's room over the speaker's head, else beside it
    const tipR = U.e.tip && !U.e.tip.hidden && U.bubbles.length ? U.e.tip.getBoundingClientRect() : null;
    for (let i = U.bubbles.length - 1; i >= 0; i--) {
      const b = U.bubbles[i];
      if (t > b.until || b.actor.hidden) { b.el.remove(); U.bubbles.splice(i, 1); continue; }
      const p = ST.project(ST.worldOf(b.actor, b.actor.kind === 'mimo' ? 'ears' : 'top'));
      const w = b.el.offsetWidth, h = b.el.offsetHeight;
      const lab = b.actor.kind === 'foe' && U.labels.get(b.actor);
      const above = lab && lab.style.display !== 'none' && Math.abs(b.actor.x - b.actor.hx) < 0.3 ? lab.offsetHeight + 8 : 0;
      let x = b.side === 'right' ? p.x - 40 : b.side === 'left' ? p.x - w + 40 : p.x - w / 2;
      x = clamp(x, 10, W - w - 10);
      let y = clamp(p.y - 22 - h - above, 64, H - h - 10);
      if (tipR && tipR.width && x < tipR.right && x + w > tipR.left && y < tipR.bottom && y + h > tipR.top) {
        if (tipR.bottom + 6 + h <= p.y - 6) y = tipR.bottom + 6;
        else x = Math.min(W - w - 10, tipR.right + 8);
      }
      // (its label held down under the top bar, below: the bubble goes beside it, not over it)
      if (lab && lab.clamped && lab.style.display !== 'none') { const lr = lab.getBoundingClientRect(); if (lr.width && x < lr.right && x + w > lr.left && y < lr.bottom && y + h > lr.top) x = lr.right + 8 + w <= W - 10 ? lr.right + 8 : Math.max(10, lr.left - 8 - w); }
      b.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      b.el.style.setProperty('--tail', clamp(p.x - x, 22, w - 22) + 'px');
    }
    for (const [foe, el] of U.labels) {
      if (foe.hidden) { el.style.display = 'none'; continue; }
      el.style.display = '';
      // above the head, at its home spot (so it doesn't chase the foe around during attacks); held under the top bar (a tall boss
      // in a close shot has its head at the screen's top edge, and the label would go off it)
      const p = ST.project(new THREE.Vector3(foe.hx, (foe.baseY || 0) + foe.h.scale * (foe.h.labelH || 0.98) + 0.12, foe.hz));
      const minY = el.offsetHeight + Math.max(48, U.e.rung && !U.e.rung.hidden ? U.e.rung.getBoundingClientRect().bottom : 0) + 6;
      el.clamped = p.y < minY;
      el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(Math.max(p.y, minY))}px) translate(-50%, -100%)`;
    }
    for (const [, tg] of U.tags) {
      const p = ST.project(tg.where());
      tg.el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) translate(-50%, -130%)`;
    }
    for (let i = U.pops.length - 1; i >= 0; i--) {
      const q = U.pops[i], k = (t - q.t0) / q.life;
      if (k >= 1) { q.el.remove(); U.pops.splice(i, 1); continue; }
      const p = ST.project(q.pos.clone().add(new THREE.Vector3(q.dx * k, q.rise * (1 - Math.pow(1 - k, 2)), 0)));
      const s = k < 0.12 ? 0.4 + (k / 0.12) * 0.9 : k < 0.24 ? 1.3 - ((k - 0.12) / 0.12) * 0.3 : 1;
      q.el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
      q.el.style.opacity = k > 0.75 ? (1 - (k - 0.75) / 0.25).toFixed(3) : '1';
    }
    syncBadges(t);
    const r = U.ring;
    if (r) {
      const p = ST.project(r.where()), left = r.T - t, inner = 46;
      const size = inner + Math.max(0, left) * 190;
      const place = (el, s) => { el.style.width = el.style.height = s + 'px'; el.style.transform = `translate(${Math.round(p.x - s / 2)}px, ${Math.round(p.y - s / 2)}px)`; };
      place(r.el, size); place(r.el0, inner);
      r.el.classList.toggle('hot', Math.abs(left) < 0.09);
      r.key.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y + inner / 2 + 8)}px) translate(-50%, 0)`;
    }
    if (U.toastUntil && t > U.toastUntil) { U.e.toast.hidden = true; U.toastUntil = 0; }
  }

  // a copy of the whole layer as an SVG, so tests can screenshot the UI together with the canvas
  function snapshotSVG(w, h) {
    if (!U.root) return null;
    const clone = U.root.cloneNode(true);
    const inp = clone.querySelector('.bt-cmd'); if (inp && U.e.input) inp.setAttribute('value', U.e.input.value);
    clone.style.position = 'absolute'; clone.style.inset = '0';
    const xhtml = new XMLSerializer().serializeToString(clone);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${w}px;height:${h}px"><style>${CSS}</style>${xhtml}</div></foreignObject></svg>`;
  }

  _.UI = { U, esc, mount, unmount, toggleEN, focusInput, hearts, coins, bag, rung, tip, dodge, toast, coach, coachHide, prompt, promptHide, hint, preview, frames, nudge,
    confirm: confirmBox, result, say, clearBubbles, label, labelRemove, tag, tagRemove, pop, freed, badge, ring, ringHide, sync, iconFor, snapshotSVG, COL, COIN, ICON,
    // zh / ja (flow.js's Coach box and anything else that builds its own HTML)
    cj: { on: () => !!CJ(), has: hasCJ, html: cjHTML, mix, mixQ, plain: mixPlain, line } };
})();
