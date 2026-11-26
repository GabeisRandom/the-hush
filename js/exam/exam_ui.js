'use strict';
// EXAMUI: the exam panel for EXAM (exam.js; DESIGN.md 21.2, EX1). One overlay, #ex, in the game's paper-and-ink look:
//   • the cover (the level, the four parts, the rules, the examiner), then each part: Listening (clips through SPEECH, two plays
//     each; no voice → the words show and it counts as reading), Reading, Writing (one or two tasks, a word count), Speaking (a
//     typed talk with the examiner, the picture when there is one). Between parts you may stop: finished parts are kept.
//   • the results (the total, a stamp per part, passed or not yet, Mimo's cheer, the first pass's rewards, What to practice),
//     the review (every answer, the right ones, your writing and speaking with the fixes in red), the certificate.
//   • the letter from the Academy, the certificates shelf on the level page (METER.sections), one task anywhere (EXAM.single).
//   EXAMUI.run(att, o) → Promise<att> · letter(band) · letterCard(def) · cert(band) · shelfHTML() · single(task, o) · results(att)
//   · review(att) · PICS (the pictures, drawn from ICONS) · isOpen · _.t (tests: drive the panel)

const EXAMUI = (() => {
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const Tc = s => (isC() ? CJK.html(String(s == null ? '' : s), { lang: L() }) : E(s));
  // a line in the language as HTML (C: ⟦…⟧ is a word shown as written, underlined, with no reading over it: JLPT's kanji-reading
  // and spelling questions, where the reading is the answer)
  // (the line is drawn whole, each ⟦…⟧ standing in as a placeholder word, so the spacing and the capitals stay right)
  const T = s => {
    const str = String(s == null ? '' : s); if (!str.includes('⟦')) return Tc(str);
    const tg = [], masked = str.replace(/⟦([^⟧]*)⟧/g, (m, w) => { tg.push(w); return `QZX${tg.length - 1}Q`; });
    return Tc(masked).replace(/QZX(\d+)Q/gi, (m, n) => `<u class="tgt">${E(tg[+n])}</u>`);
  };
  const P = s => { const str = String(s == null ? '' : s).replace(/⟦([^⟧]*)⟧/g, '$1'); return isC() ? CJK.plain(str, { lang: L() }) : str; };
  const sleep = ms => new Promise(r => setTimeout(r, (X.fast ? 0 : ms)));
  const snd = k => { try { if (typeof Sound !== 'undefined') Sound.play(k); } catch (e) { /* */ } };
  const mimo = () => { try { return (EXAM.game && EXAM.game.state && EXAM.game.state.mimoName) || 'Mimo'; } catch (e) { return 'Mimo'; } };
  const B = ['A0', 'A1', 'A2', 'B1', 'B2'];
  const X = { fast: false, auto: null, last: null };          // tests: fast skips the waits; auto answers for you
  const INK = '#2b2235', ACAD = '#7a2a3d', GOLD = '#d9a72c';
  const fmt = v => (Math.round(v * 2) / 2).toString().replace(/\.0$/, '');
  // a date as the language writes it (the certificate and the shelf): es / pt 22/11/2026, de 22.11.2026, zh / ja 2026年11月22日;
  // the English UI's lines keep 11/22/2026
  const dateIn = (ts, l) => {
    const d = new Date(ts || Date.now()), y = d.getFullYear(), m = d.getMonth() + 1, n = d.getDate(), p2 = v => String(v).padStart(2, '0');
    if (l === 'zh' || l === 'ja') return `${y}年${m}月${n}日`;
    if (l === 'de') return `${p2(n)}.${p2(m)}.${y}`;
    if (l === 'es' || l === 'pt') return `${p2(n)}/${p2(m)}/${y}`;
    return `${m}/${n}/${y}`;
  };
  const C = () => EXAM.content() || {};
  const ex = () => C().examiner || {};
  const ac = () => C().academy || {};
  const word = (k, fb) => { const a = ac(); return a[k] != null ? a[k] : fb; };

  // ------------------------------------------------------------ the look
  const CSS = `
#ex { position: fixed; inset: 0; z-index: 12; display: grid; place-items: center; color: ${INK}; font-family: "Segoe UI", system-ui, sans-serif; }
#ex.hidden, #ex .hidden { display: none !important; } #ex * { box-sizing: border-box; }
#ex .ex-shade { position: absolute; inset: 0; background: rgba(28,20,32,.5); }
#ex .ex-card { position: relative; width: min(1040px, calc(100vw - 20px)); height: min(720px, calc(100vh - 20px)); display: flex; flex-direction: column; background: #fbf6e7; border: 3px solid ${INK}; border-radius: 18px;
  box-shadow: 0 0 0 6px #fff, 0 14px 0 6px rgba(43,34,53,.25); overflow: hidden; }
#ex .ex-top { display: flex; align-items: center; gap: 10px; padding: 8px 12px 8px 10px; background: linear-gradient(90deg, #f3e2c8, #fbf6e7); border-bottom: 2px dashed rgba(43,34,53,.22); flex: none; }
#ex .ex-top canvas.crest { width: 40px; height: 40px; flex: none; }
#ex .ex-top .ttl { display: flex; flex-direction: column; min-width: 0; } #ex .ex-top .ttl b { font: 800 18px Bahnschrift, "Segoe UI", sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#ex .ex-top .ttl small { font-size: 12px; font-weight: 700; opacity: .65; }
#ex .ex-steps { margin-left: auto; display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end; }
#ex .ex-steps span { font: 800 12px "Segoe UI", sans-serif; border: 2px solid rgba(43,34,53,.25); border-radius: 99px; padding: 2px 9px; background: #fff; white-space: nowrap; }
#ex .ex-steps span.on { border-color: ${INK}; background: ${INK}; color: #fbf6e7; } #ex .ex-steps span.ok { border-color: #21a493; color: #13786b; }
#ex .ex-x { border: 0; background: transparent; font-size: 20px; font-weight: 800; opacity: .6; cursor: pointer; padding: 0 4px; } #ex .ex-x:hover { opacity: 1; }
#ex .ex-body { flex: 1; min-height: 0; overflow: auto; padding: 16px 22px; }
#ex .ex-foot { flex: none; display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-top: 2px dashed rgba(43,34,53,.2); background: #f7efdc; }
#ex .ex-foot .sp { flex: 1; } #ex .ex-foot .nt { font-size: 13px; opacity: .75; }
#ex .btn { border: 2.5px solid ${INK}; border-radius: 11px; background: #fffaf0; font: 800 14px "Segoe UI", sans-serif; padding: 6px 14px; cursor: pointer; color: ${INK}; box-shadow: 0 3px 0 rgba(43,34,53,.18); }
#ex .btn:hover { background: #fff3c4; } #ex .btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,34,53,.18); }
#ex .btn.main { background: ${ACAD}; color: #fff; } #ex .btn.main:hover { background: #8f3449; } #ex .btn[disabled] { opacity: .4; cursor: default; transform: none; }
#ex .btn.sm { font-size: 12px; padding: 2px 9px; border-width: 2px; box-shadow: none; } #ex .btn.on { background: #21a493; border-color: #21a493; color: #fff; }
#ex h2 { margin: 0 0 6px; font: 800 26px Bahnschrift, "Segoe UI", sans-serif; } #ex h3 { margin: 14px 0 6px; font: 800 18px Bahnschrift, "Segoe UI", sans-serif; }
#ex .tl { font-size: 19px; line-height: 1.5; } #ex .en { display: block; font-size: 13.5px; font-style: italic; opacity: .72; margin-top: 2px; } #ex .en.hide { display: none; }
#ex .gl { font-size: .62em; font-weight: 700; color: #a0761a; margin-left: 2px; font-style: normal; }
#ex .note { font-size: 13.5px; line-height: 1.45; opacity: .8; } #ex .warn { color: #9a3a22; font-weight: 700; opacity: 1; }
#ex .cols { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 18px; align-items: start; }
@media (max-width: 820px) { #ex .cols { grid-template-columns: 1fr; } }
#ex .box { background: #fff; border: 2px solid rgba(43,34,53,.14); border-radius: 14px; padding: 12px 14px; }
/* the cover */
#ex .cv { display: grid; grid-template-columns: 210px 1fr; gap: 22px; align-items: start; } @media (max-width: 760px) { #ex .cv { grid-template-columns: 1fr; } }
#ex .who { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; } #ex .who canvas { width: 132px; height: 132px; }
#ex .who b { font: 800 15px Bahnschrift, sans-serif; } #ex .who small { font-size: 12px; opacity: .7; }
#ex .bub { position: relative; background: #fff; border: 2.5px solid ${INK}; border-radius: 16px; padding: 9px 13px; box-shadow: 0 3px 0 rgba(43,34,53,.14); }
#ex .bub .tl { font-size: 17px; font-weight: 600; }
#ex .parts { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 9px; margin: 12px 0; }
#ex .pt { background: #fff; border: 2px solid rgba(43,34,53,.15); border-radius: 13px; padding: 9px 11px; } #ex .pt b { font: 800 16px Bahnschrift, sans-serif; display: block; }
#ex .pt small { font-size: 12.5px; opacity: .75; line-height: 1.35; display: block; } #ex .pt.ok { border-color: #21a493; background: #effaf7; } #ex .pt .sc { float: right; font: 900 15px Bahnschrift, sans-serif; color: #13786b; }
#ex .rules { margin: 8px 0 0; padding-left: 18px; font-size: 14px; line-height: 1.55; }
/* a task */
#ex .tk-h { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; } #ex .tk-h .k { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: ${ACAD}; }
#ex .tk-h .tl { font-weight: 800; font-size: 20px; }
#ex .play { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 6px 0 12px; } #ex .play .now { font-size: 14px; font-weight: 700; color: #13786b; }
#ex .play .left { font: 800 13px "Segoe UI", sans-serif; opacity: .7; }
#ex .clip-art { display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 18px 0 8px; text-align: center; } #ex .clip-art canvas { width: 150px; height: 150px; }
#ex .script p { margin: 0 0 6px; font-size: 16px; line-height: 1.45; } #ex .script .spk { font-weight: 800; color: ${ACAD}; margin-right: 6px; font-size: 13px; }
#ex .q { background: #fff; border: 2px solid rgba(43,34,53,.13); border-radius: 13px; padding: 9px 12px; margin-bottom: 9px; }
#ex .q .qn { font: 800 12px "Segoe UI", sans-serif; opacity: .55; margin-right: 6px; } #ex .q .tl { font-size: 17px; font-weight: 600; }
#ex .opts { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 7px; }
#ex .opt { border: 2px solid rgba(43,34,53,.3); border-radius: 10px; background: #fffaf0; padding: 5px 11px; font: 600 16px "Segoe UI", sans-serif; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; color: ${INK}; }
#ex .opt:hover { border-color: ${INK}; } #ex .opt.on { background: ${INK}; border-color: ${INK}; color: #fbf6e7; } #ex .opt canvas { width: 44px; height: 44px; }
#ex .opt .lt { font: 900 12px Bahnschrift, sans-serif; opacity: .6; }
#ex .q input.sh { width: 100%; margin-top: 7px; font: 600 18px "Segoe UI", sans-serif; padding: 5px 10px; border: 2.5px solid rgba(43,34,53,.35); border-radius: 10px; outline: none; background: #fffef9; }
#ex .q input.sh:focus, #ex textarea:focus, #ex .say-in:focus { border-color: ${INK}; box-shadow: 0 0 0 3px rgba(122,42,61,.2); }
#ex .mrow { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; } #ex .mrow .l { flex: 1 1 200px; font-size: 16px; }
#ex .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; min-height: 34px; } #ex .chip { border: 2px solid rgba(43,34,53,.3); border-radius: 99px; background: #fff; padding: 3px 11px; font: 600 15px "Segoe UI", sans-serif; cursor: pointer; }
#ex .chip.used { opacity: .35; } #ex .built { min-height: 34px; border-bottom: 2px dashed rgba(43,34,53,.25); padding: 4px 0; font-size: 17px; }
/* reading texts, by kind */
#ex .rt { border-radius: 12px; padding: 14px 16px; font: 17px/1.55 Georgia, "Times New Roman", serif; background: #fff; border: 2px solid rgba(43,34,53,.16); box-shadow: 0 3px 0 rgba(43,34,53,.1); }
#ex .rt p { margin: 0 0 7px; } #ex .rt .head { font: 800 13px "Segoe UI", sans-serif; letter-spacing: .05em; opacity: .65; margin-bottom: 6px; text-transform: uppercase; }
#ex .rt.sign { background: #fff3c4; border: 3px solid ${INK}; text-align: center; font: 700 19px/1.4 Bahnschrift, "Segoe UI", sans-serif; }
#ex .rt.note, #ex .rt.message { background: #fffbe0; font-family: "Segoe Print", "Ink Free", cursive; transform: rotate(-.4deg); }
#ex .rt.ad { background: #e9f6f1; border: 3px dashed #21a493; } #ex .rt.email, #ex .rt.forum { font-family: "Segoe UI", sans-serif; font-size: 16px; } #ex .rt.email .head, #ex .rt.forum .head { text-transform: none; letter-spacing: 0; }
#ex .rt.chat p { background: #dcf4ef; border-radius: 12px; padding: 4px 10px; font: 15px/1.45 "Segoe UI", sans-serif; display: table; }
#ex .rt .en { font-family: "Segoe UI", sans-serif; }
/* writing */
#ex .pts { margin: 8px 0 10px; padding-left: 0; list-style: none; } #ex .pts li { margin: 3px 0; font-size: 16px; } #ex .pts li::before { content: '☐ '; font-weight: 800; color: ${ACAD}; } #ex .pts.rv li::before { content: none; }
#ex textarea { width: 100%; min-height: 190px; resize: vertical; font: 18px/1.55 "Segoe UI", sans-serif; padding: 10px 12px; border: 2.5px solid rgba(43,34,53,.35); border-radius: 12px; outline: none; background: #fffef9; }
#ex .count { font: 800 13px "Segoe UI", sans-serif; opacity: .7; } #ex .count.ok { color: #13786b; opacity: 1; }
/* speaking */
#ex .talk { display: grid; grid-template-columns: 170px 1fr; gap: 16px; height: 100%; } @media (max-width: 760px) { #ex .talk { grid-template-columns: 1fr; } }
#ex .log { display: flex; flex-direction: column; gap: 8px; min-height: 0; } #ex .m { max-width: 88%; padding: 7px 11px; border-radius: 14px; font-size: 17px; line-height: 1.4; }
#ex .m.them { align-self: flex-start; background: #fff; border: 2px solid rgba(43,34,53,.16); border-bottom-left-radius: 4px; } #ex .m.me { align-self: flex-end; background: #dcf4ef; border: 2px solid rgba(33,164,147,.4); border-bottom-right-radius: 4px; }
#ex .m.sys { align-self: center; background: transparent; font-size: 13px; opacity: .7; font-style: italic; }
#ex .m .enb { font-size: 11px; border: 1.5px solid rgba(43,34,53,.35); border-radius: 6px; background: #fff; margin-left: 6px; cursor: pointer; padding: 0 5px; vertical-align: 2px; }
#ex .goal { font-size: 13.5px; font-weight: 700; color: ${ACAD}; margin: 4px 0; } #ex .pic { display: block; width: min(420px, 100%); border-radius: 12px; border: 2.5px solid ${INK}; margin: 4px 0; }
#ex .say-row { display: flex; gap: 8px; margin-top: 8px; } #ex .say-in { flex: 1; min-width: 0; font: 600 18px "Segoe UI", sans-serif; padding: 7px 11px; border: 2.5px solid rgba(43,34,53,.35); border-radius: 12px; outline: none; background: #fffef9; }
/* results */
#ex .res { text-align: center; } #ex .big { font: 900 54px Bahnschrift, sans-serif; line-height: 1; } #ex .big small { font-size: 22px; opacity: .6; }
#ex .verdict { display: inline-block; margin: 8px 0 4px; font: 900 22px Bahnschrift, sans-serif; letter-spacing: .08em; padding: 4px 18px; border: 4px solid #1f8a4c; color: #1f8a4c; border-radius: 10px; transform: rotate(-3deg); }
#ex .verdict.no { border-color: #b0502a; color: #b0502a; }
#ex .stamps { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin: 12px 0; }
#ex .stamp { width: 104px; height: 104px; border-radius: 50%; border: 4px solid #1f8a4c; color: #1f8a4c; display: grid; place-items: center; text-align: center; transform: rotate(-6deg); background: rgba(31,138,76,.06); }
#ex .stamp:nth-child(2n) { transform: rotate(5deg); } #ex .stamp.low { border-color: #c0392b; color: #c0392b; background: rgba(192,57,43,.06); }
#ex .stamp i { font-style: normal; font-size: 20px; display: block; } #ex .stamp b { font: 900 20px Bahnschrift, sans-serif; display: block; } #ex .stamp small { font: 800 10px "Segoe UI", sans-serif; letter-spacing: .06em; text-transform: uppercase; }
#ex .cheer { display: flex; align-items: center; gap: 12px; justify-content: center; margin: 6px auto; max-width: 640px; text-align: left; } #ex .cheer canvas { width: 64px; height: 64px; flex: none; }
#ex .gift { display: inline-block; margin: 6px 0; padding: 7px 14px; border-radius: 12px; background: #fff3c4; border: 2px solid ${GOLD}; font-weight: 700; }
#ex .prac { text-align: left; max-width: 760px; margin: 10px auto 0; } #ex .prac li { margin: 4px 0; font-size: 14.5px; line-height: 1.45; }
#ex .wchips { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; } #ex .wchips span { background: #fff; border: 1.5px solid rgba(43,34,53,.2); border-radius: 99px; padding: 2px 10px; font-size: 14px; } #ex .wchips span i { opacity: .6; font-size: 12px; margin-left: 4px; }
/* review */
#ex .rv-it { margin: 4px 0; font-size: 14.5px; } #ex .ok { color: #13786b; font-weight: 800; } #ex .bad { color: #b0402a; font-weight: 800; }
#ex .fix b.tk-red, #ex .fix .red { color: #c0392b; font-weight: 800; } #ex .gr { display: inline-block; font: 900 12px Bahnschrift, sans-serif; color: #fff; border-radius: 99px; padding: 0 7px; border: 2px solid ${INK}; margin-left: 4px; }
#ex .gr.S { background: #e0a020; } #ex .gr.A { background: #21a493; } #ex .gr.B { background: #3f7fc9; } #ex .gr.C { background: #8a5ab0; } #ex .gr.D, #ex .gr.X { background: #8a8f9e; }
/* the letter */
#ex .lt-paper { width: min(620px, 100%); margin: 0 auto; background: #fffdf6; border: 2px solid #d8c9a6; border-radius: 6px; padding: 22px 28px 20px; box-shadow: 0 6px 0 rgba(43,34,53,.12); font: 17px/1.6 Georgia, serif; position: relative; }
#ex .lt-paper .seal { position: absolute; right: 18px; top: 14px; width: 64px; height: 64px; } #ex .lt-paper p { margin: 0 0 10px; } #ex .lt-paper .sig { font-family: "Segoe Script", "Ink Free", cursive; font-size: 20px; margin-top: 12px; }
#ex .envelope { width: 300px; height: 190px; margin: 30px auto 10px; position: relative; cursor: pointer; } #ex .envelope canvas { width: 300px; height: 190px; }
/* the certificate */
#ex .cert { width: min(760px, 100%); margin: 0 auto; background: #fffaf0; border: 10px double ${ACAD}; outline: 3px solid ${GOLD}; outline-offset: -18px; padding: 30px 36px 24px; text-align: center; position: relative; font-family: Georgia, serif; }
#ex .cert .c-h { font: 800 13px "Segoe UI", sans-serif; letter-spacing: .3em; text-transform: uppercase; color: ${ACAD}; } #ex .cert .c-t { font: 700 30px Georgia, serif; margin: 6px 0 0; }
#ex .cert .c-lv { font: 900 72px Bahnschrift, sans-serif; color: ${ACAD}; line-height: 1; margin: 8px 0 2px; } #ex .cert .c-title { font-style: italic; font-size: 18px; }
#ex .cert .c-meta { font-size: 14px; opacity: .8; margin-top: 8px; } #ex .cert .c-sig { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 18px; font-size: 13px; }
#ex .cert .c-sig .s { font-family: "Segoe Script", "Ink Free", cursive; font-size: 22px; border-bottom: 1.5px solid ${INK}; padding: 0 16px 2px; }
#ex .cert canvas.crest { width: 74px; height: 74px; }
body.ex-open #objective, body.ex-open #counters, body.ex-open #help, body.ex-open #compass, body.ex-open #minimap, body.ex-open .bubble, body.ex-open #thought, body.ex-open .prompt { display: none !important; }
/* the level page's shelf (METER.sections) */
.exs { margin: 6px 0 12px; } .exs h4 { margin: 10px 0 6px; } .exs-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 8px; }
.exs-c { position: relative; background: #fff; border: 2px solid rgba(43,34,53,.15); border-radius: 12px; padding: 8px 10px 9px; font-size: 12.5px; line-height: 1.35; min-height: 92px; }
.exs-c b.lv { font: 900 24px Bahnschrift, sans-serif; display: block; } .exs-c.pass { background: #fffaf0; border: 3px double ${ACAD}; cursor: pointer; } .exs-c.pass b.lv { color: ${ACAD}; }
.exs-c.pass:hover { box-shadow: 0 0 0 3px #f2d98a; } .exs-c.lock { opacity: .55; border-style: dashed; } .exs-c .st { display: flex; gap: 3px; margin-top: 4px; flex-wrap: wrap; }
.exs-c .st i { font-style: normal; font: 800 10.5px "Segoe UI", sans-serif; border: 1.5px solid #1f8a4c; color: #1f8a4c; border-radius: 99px; padding: 0 5px; } .exs-c .st i.low { border-color: #c0392b; color: #c0392b; }
.exs-c button { margin-top: 5px; border: 2px solid ${INK}; border-radius: 8px; background: transparent; font: 800 11.5px "Segoe UI", sans-serif; padding: 1px 8px; cursor: pointer; } .exs-c .tt { font-style: italic; opacity: .8; }
/* practice papers (C): the clock, the cover's table, the report, the speaking cards, forms, a choice of two tasks */
#ex .clock { font: 900 16px Bahnschrift, sans-serif; border: 2.5px solid ${INK}; border-radius: 10px; padding: 2px 10px; background: #fff; margin-left: 8px; white-space: nowrap; flex: none; }
#ex .clock.low { background: #fff3c4; border-color: #c0392b; color: #c0392b; }
#ex .mk-tbl { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 14px; } #ex .mk-tbl th, #ex .mk-tbl td { border-bottom: 1.5px solid rgba(43,34,53,.15); padding: 5px 8px; text-align: left; vertical-align: top; }
#ex .mk-tbl th { font: 800 11.5px "Segoe UI", sans-serif; letter-spacing: .04em; text-transform: uppercase; opacity: .7; } #ex .mk-tbl td.n { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
#ex .mk-tbl tr.grp td { font-weight: 800; background: #f7efdc; } #ex .mk-tbl tr.fin td { font-weight: 900; font-size: 16px; border-top: 2.5px solid ${INK}; }
#ex .honest { font-size: 13px; background: #fff3c4; border: 2px solid ${GOLD}; border-radius: 10px; padding: 6px 10px; margin: 8px 0; line-height: 1.45; }
#ex .mk-mode { display: inline-block; font: 800 12px "Segoe UI", sans-serif; border-radius: 99px; padding: 1px 10px; border: 2px solid ${INK}; margin-left: 6px; vertical-align: 3px; } #ex .mk-mode.t { background: ${INK}; color: #fbf6e7; }
#ex .mk-card { background: #fff; border: 2.5px solid ${INK}; border-radius: 14px; padding: 10px 14px; margin: 6px 0; box-shadow: 0 3px 0 rgba(43,34,53,.14); } #ex .mk-card h4 { margin: 0 0 4px; font: 800 15px Bahnschrift, sans-serif; color: ${ACAD}; }
#ex .mk-card ul { margin: 4px 0 0; padding-left: 18px; } #ex .mk-card li { margin: 2px 0; font-size: 15px; } #ex .m .mk-card { max-width: 100%; }
#ex .form { display: grid; grid-template-columns: minmax(120px, 36%) 1fr; gap: 7px 10px; align-items: center; margin-top: 6px; } #ex .form label { font-size: 15px; font-weight: 700; }
#ex .form input { font: 600 16px "Segoe UI", sans-serif; padding: 4px 9px; border: 2px solid rgba(43,34,53,.35); border-radius: 9px; background: #fffef9; min-width: 0; }
#ex .choose { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } @media (max-width: 760px) { #ex .choose { grid-template-columns: 1fr; } } #ex .choose .mk-card { cursor: pointer; } #ex .choose .mk-card:hover { box-shadow: 0 0 0 3px #f2d98a; }
#ex .rep { max-width: 780px; margin: 0 auto; text-align: left; } #ex .rep .word { font: 900 28px Bahnschrift, sans-serif; letter-spacing: .06em; }
#ex .mk-list { display: grid; gap: 10px; } #ex .mk-row { background: #fff; border: 2px solid rgba(43,34,53,.15); border-radius: 14px; padding: 10px 12px; } #ex .mk-row h4 { margin: 0; font: 800 18px Bahnschrift, sans-serif; }
#ex .q canvas.qpic { display: block; width: 84px; height: 84px; margin: 2px 0 4px; } #ex u.tgt { text-decoration-thickness: 2px; text-underline-offset: 3px; font-weight: 700; } #ex .opt.po canvas { width: 58px; height: 58px; }
#ex .play .clab { font: 800 14px Bahnschrift, sans-serif; min-width: 92px; } #ex .blocks { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
#ex .blocks .rt { padding: 9px 11px; font-size: 15.5px; } #ex .blab { display: inline-block; font: 900 14px Bahnschrift, sans-serif; background: ${INK}; color: #fbf6e7; border-radius: 7px; padding: 0 8px; margin: 0 0 5px; }
#ex .mk-row .acts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; } #ex .mk-row .drills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; } #ex .mk-row .best { font-size: 13px; opacity: .8; margin-top: 3px; }
`;
  function css() { if (document.getElementById('ex-css')) return; const s = document.createElement('style'); s.id = 'ex-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ------------------------------------------------------------ the overlay (the game waits while it's open)
  let root = null, openN = 0, typingWas = false, lockWas = 0, keyFn = null;     // (openN: 1 while the overlay is up; every view reuses it)
  function ensure() { css(); if (!root) { root = document.createElement('div'); root.id = 'ex'; root.className = 'hidden'; document.body.appendChild(root); } return root; }
  function open() {
    ensure();
    if (!openN) {
      openN = 1;
      typingWas = typeof Input !== 'undefined' ? Input.typing : false;
      if (typeof Input !== 'undefined') Input.typing = true;
      const G = EXAM.game; if (G && G.sim) { lockWas = G.sim.lock || 0; G.sim.lock = 1; }
      document.body.classList.add('ex-open');
    }
    root.className = ''; return root;
  }
  function close() {
    try { if (typeof SPEECH !== 'undefined') SPEECH.stop(); } catch (e) { /* */ }
    if (!root || !openN) return;
    openN = 0;
    root.className = 'hidden'; root.innerHTML = '';
    if (typeof Input !== 'undefined') Input.typing = !!typingWas;
    const G = EXAM.game; if (G && G.sim) G.sim.lock = lockWas;
    document.body.classList.remove('ex-open'); keys(null);
  }
  function keys(fn) {
    if (keyFn) removeEventListener('keydown', keyFn, true);
    keyFn = fn ? e => { const inBox = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName); if (inBox && e.code !== 'Escape') return; if (fn(e) !== false) { e.preventDefault(); e.stopPropagation(); } } : null;
    if (keyFn) addEventListener('keydown', keyFn, true);
  }
  // the card's frame: the crest and title on top, the parts as steps, a body and a footer
  function frame(o = {}) {
    const r = open();
    r.innerHTML = `<div class="ex-shade"></div><div class="ex-card"><div class="ex-top"><canvas class="crest" width="80" height="80"></canvas><div class="ttl"><b>${E(o.title || '')}</b><small>${E(o.sub || '')}</small></div>`
      + `<div class="ex-steps">${(o.steps || []).map(s => `<span class="${s.cls || ''}">${E(s.t)}</span>`).join('')}</div><button class="ex-x" title="${E(o.xTitle || 'Close (Esc)')}">✕</button></div>`
      + `<div class="ex-body"></div><div class="ex-foot"><span class="nt"></span><span class="sp"></span></div></div>`;
    crest(r.querySelector('canvas.crest'));
    return { body: r.querySelector('.ex-body'), foot: r.querySelector('.ex-foot'), note: r.querySelector('.ex-foot .nt'), x: r.querySelector('.ex-x'), top: r.querySelector('.ex-top') };
  }
  // a line in the language with its English on request (EN), and its new words glossed small (the weave's way, MIX.newWords)
  function lineHTML(ln, o = {}) {
    if (!ln) return '';
    let h = T(ln.t);
    if (o.gloss && typeof MIX !== 'undefined' && !isC()) {
      try {
        // (the rarer words first, the ones with an English we can be sure of; «Buenos días» needs none)
        const bandOf = w => { try { return (DICT.entry(w.id) || {}).band || 0; } catch (e) { return 0; } };
        // (and only a gloss the line's own English confirms: a form the pack misreads, «calle» as callar, never shows)
        const enL = String(ln.en || '').toLowerCase();
        const nw = MIX.newWords(ln.t, { en: ln.en }).filter(w => w.en && String(w.en).trim() && bandOf(w) >= 2 && enL.includes(String(w.en).toLowerCase().trim())).sort((a, b) => bandOf(b) - bandOf(a)).slice(0, o.gloss);
        if (nw.length) { const mark = new Map(nw.map(w => [w.id, w.en])); h = MIX.tlHTML(ln.t, mark).replace(/<span class="w mx-new" data-en="([^"]*)">([\s\S]*?)<\/span>/g, (m, en, w) => `${w}<i class="gl">(${en})</i>`); }
      } catch (e) { /* (plain) */ }
    }
    const id = 'en' + Math.random().toString(36).slice(2, 8);
    return `<span class="tl">${h}</span>${ln.en && o.en !== false ? ` <button class="btn sm" data-en="${id}" type="button" title="The English">EN</button><span class="en hide" id="${id}">${E(ln.en)}</span>` : ''}`;
  }
  function wireEN(el) { el.querySelectorAll('[data-en]').forEach(b => { b.onclick = () => { const t = el.querySelector('#' + b.dataset.en); if (t) t.classList.toggle('hide'); b.classList.toggle('on'); }; }); }

  // ------------------------------------------------------------ the crest, the seal, the envelope (canvas, the game's ink line)
  function crest(cv, big) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), W = cv.width, s = W / 80; c.clearRect(0, 0, W, cv.height); c.save(); c.scale(s, s); c.lineJoin = 'round';
    // a shield in the Academy's red with a gold rim, an open book, and a sun rising over it (Alba: the dawn)
    c.beginPath(); c.moveTo(40, 5); c.lineTo(70, 13); c.lineTo(68, 42); c.quadraticCurveTo(64, 63, 40, 75); c.quadraticCurveTo(16, 63, 12, 42); c.lineTo(10, 13); c.closePath();
    c.fillStyle = ACAD; c.fill(); c.lineWidth = 3.4; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(40, 10); c.lineTo(65, 16.5); c.lineTo(63.5, 42); c.quadraticCurveTo(60, 59, 40, 69.5); c.quadraticCurveTo(20, 59, 16.5, 42); c.lineTo(15, 16.5); c.closePath(); c.lineWidth = 2; c.strokeStyle = GOLD; c.stroke();
    c.save(); c.beginPath(); c.rect(14, 14, 52, 26); c.clip(); c.beginPath(); c.arc(40, 40, 15, Math.PI, 0); c.fillStyle = '#ffd36e'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = '#ffd36e'; c.lineWidth = 2.2; for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 7; c.beginPath(); c.moveTo(40 + Math.cos(a) * 18, 40 + Math.sin(a) * 18); c.lineTo(40 + Math.cos(a) * 24, 40 + Math.sin(a) * 24); c.stroke(); } c.restore();
    c.beginPath(); c.moveTo(40, 44); c.quadraticCurveTo(30, 38, 20, 41); c.lineTo(20, 58); c.quadraticCurveTo(30, 55, 40, 61); c.quadraticCurveTo(50, 55, 60, 58); c.lineTo(60, 41); c.quadraticCurveTo(50, 38, 40, 44); c.closePath();
    c.fillStyle = '#fffaf0'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(40, 44); c.lineTo(40, 61); c.stroke();
    c.strokeStyle = 'rgba(43,34,53,.45)'; c.lineWidth = 1.2; for (const y of [47, 51, 55]) { c.beginPath(); c.moveTo(24, y - 2); c.lineTo(36, y); c.moveTo(44, y); c.lineTo(56, y - 2); c.stroke(); }
    c.restore();
  }
  function seal(cv) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), W = cv.width, s = W / 64; c.clearRect(0, 0, W, cv.height); c.save(); c.scale(s, s);
    c.beginPath(); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = i % 2 ? 27 : 30; c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } c.closePath();
    c.fillStyle = '#b3263c'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#7a1526'; c.stroke();
    c.beginPath(); c.arc(32, 32, 19, 0, Math.PI * 2); c.lineWidth = 2; c.strokeStyle = 'rgba(255,220,200,.6)'; c.stroke();
    c.fillStyle = 'rgba(255,230,210,.85)'; c.font = '900 20px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('A', 32, 33);
    c.restore();
  }
  function envelope(cv) {
    const c = cv.getContext('2d'), w = cv.width, h = cv.height; c.clearRect(0, 0, w, h); c.lineJoin = 'round';
    c.fillStyle = '#f6ead0'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.rect(8, 8, w - 16, h - 16); c.fill(); c.stroke();
    c.fillStyle = '#efdcb4'; c.beginPath(); c.moveTo(8, 8); c.lineTo(w / 2, h * 0.58); c.lineTo(w - 8, 8); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(8, h - 8); c.lineTo(w * 0.42, h * 0.5); c.moveTo(w - 8, h - 8); c.lineTo(w * 0.58, h * 0.5); c.lineWidth = 2.5; c.stroke();
    const sc = document.createElement('canvas'); sc.width = sc.height = 128; seal(sc); c.drawImage(sc, w / 2 - 30, h * 0.58 - 34, 60, 60);
  }

  // ------------------------------------------------------------ the pictures (the speaking part's, and any task's pic): ICONS on a scene
  // Each: a backdrop and things placed on it ([icon, x, y, size] on a 480 × 300 card). Every language names the things in its
  // content (content.pics[name] = the words a description may use).
  const PICS = {
    picnic: { bg: 'park', items: [['sc_sun', 400, 52, 70], ['tree', 70, 120, 120], ['kite', 330, 70, 64], ['bird', 210, 50, 40], ['apple', 175, 232, 48], ['bread', 235, 236, 56], ['cheese', 292, 238, 46], ['cat', 380, 222, 66], ['flower', 60, 255, 40], ['book', 140, 262, 34]], blanket: [140, 215, 200, 55] },
    kitchen: { bg: 'room', items: [['window', 90, 85, 90], ['clock', 250, 60, 54], ['oven', 400, 190, 110], ['table', 230, 230, 120], ['cup', 205, 175, 36], ['plate', 255, 180, 40], ['bread', 300, 172, 38], ['chair', 110, 236, 78], ['cat', 330, 268, 46], ['lamp', 300, 70, 50]] },
    station: { bg: 'street', items: [['train', 300, 150, 170], ['clock', 90, 60, 60], ['ticket', 110, 230, 52], ['bell', 450, 60, 42], ['bird', 210, 60, 34], ['coffee', 175, 250, 40], ['letter', 60, 258, 40]] },
    market: { bg: 'street', items: [['apple', 120, 175, 48], ['pear', 170, 178, 44], ['orange', 220, 178, 44], ['bread', 300, 180, 52], ['cheese', 355, 182, 44], ['flower', 410, 178, 46], ['coin', 260, 250, 34], ['cat', 70, 255, 52]], stall: [80, 150, 380, 58] },
    beach: { bg: 'lake', items: [['sc_sun', 90, 50, 64], ['boat', 300, 130, 90], ['fish', 380, 175, 40], ['gull', 200, 60, 40], ['kite', 410, 60, 56], ['icecream', 150, 245, 50], ['towel', 250, 258, 56], ['crab', 345, 262, 40]] },
    rain: { bg: 'street', rain: true, items: [['house', 110, 150, 130], ['lamp', 250, 140, 70], ['cat', 330, 250, 50], ['bird', 400, 120, 38], ['water', 230, 265, 60], ['hat', 410, 250, 46]] },
    winter: { bg: 'snow', items: [['mountain', 360, 120, 150], ['tree', 90, 140, 100], ['wmSnowman', 220, 210, 90], ['wmScarf', 300, 250, 50], ['wmMug', 410, 255, 44], ['snow', 160, 60, 40], ['bird', 260, 70, 34]] },
    library: { bg: 'room', items: [['book', 90, 120, 70], ['lamp', 220, 90, 56], ['table', 250, 230, 120], ['chair', 380, 235, 80], ['glasses', 240, 180, 40], ['clock', 400, 70, 50], ['window', 110, 230, 70], ['cat', 160, 268, 44]] },
    festival: { bg: 'night', items: [['lantern', 90, 70, 56], ['lantern', 240, 55, 56], ['lantern', 390, 70, 56], ['music', 150, 175, 56], ['cake', 260, 220, 66], ['gift', 350, 230, 56], ['candle', 420, 220, 40], ['bell', 60, 230, 44]] },
  };
  function drawPic(name, cv) {
    const p = PICS[name]; if (!p || !cv) return;
    const c = cv.getContext('2d'), w = cv.width, h = cv.height, k = w / 480; c.save(); c.scale(k, k);
    const bg = { park: ['#bfe6f5', '#8fcf7a'], room: ['#f3e3c3', '#c99a6b'], street: ['#cfe8f5', '#d9cbb0'], lake: ['#bfe6f5', '#6fb7d9'], snow: ['#dbe8f2', '#f7f9fb'], night: ['#2c2f5a', '#5a4a3a'] }[p.bg] || ['#e8f4f8', '#cfe3c0'];
    c.fillStyle = bg[0]; c.fillRect(0, 0, 480, 300); c.fillStyle = bg[1]; c.fillRect(0, p.bg === 'room' ? 200 : 180, 480, 120);
    if (p.bg === 'room') { c.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 0; x < 480; x += 40) c.fillRect(x, 0, 2, 200); }
    if (p.bg === 'night') { c.fillStyle = '#fff6c8'; for (let i = 0; i < 26; i++) c.fillRect((i * 97) % 480, (i * 53) % 160, 2.5, 2.5); }
    if (p.bg === 'lake') { c.fillStyle = '#f2dcae'; c.fillRect(0, 225, 480, 75); }
    if (p.blanket) { const [x, y, bw, bh] = p.blanket; c.fillStyle = '#e8574a'; c.fillRect(x, y, bw, bh); c.fillStyle = '#fff'; for (let i = 0; i < bw; i += 20) c.fillRect(x + i, y, 10, bh); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(x, y, bw, bh); }
    if (p.stall) { const [x, y, bw, bh] = p.stall; c.fillStyle = '#b5824c'; c.fillRect(x, y, bw, bh); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(x, y, bw, bh); c.fillStyle = '#e8574a'; for (let i = 0; i < bw; i += 38) { c.fillStyle = (i / 38) % 2 ? '#fff' : '#e8574a'; c.fillRect(x + i, y - 70, 38, 22); } c.strokeRect(x, y - 70, bw, 22); }
    for (const [icon, x, y, s] of p.items) { try { if (typeof ICONS !== 'undefined' && ICONS.keys.includes(icon)) c.drawImage(ICONS.canvas(icon, 128), x - s / 2, y - s / 2, s, s); } catch (e) { /* */ } }
    if (p.rain) { c.strokeStyle = 'rgba(60,110,170,.55)'; c.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = (i * 83) % 480, y = (i * 47) % 260; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 14); c.stroke(); } }
    c.restore(); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(0, 0, w, h);
  }
  // ------------------------------------------------------------ an exam, start to finish (or to a pause between parts)
  const PARTEN = { listen: 'Listening', read: 'Reading', write: 'Writing', speak: 'Speaking' };
  // (C: a practice paper's section in zh / ja: its name in the reading mode (characters or romanization), then the English)
  const secName = sec => (sec.title && sec.title.t && /\[[^|\]]+\|/.test(sec.title.t) ? `${P(sec.title.t)} · ${String(sec.title.en || '').split(' · ').pop()}` : (sec.title && sec.title.en) || PARTEN[sec.part] || sec.id);
  const steps = (att, cur) => att.sections.map(s => ({ t: `${(EXAM.PART[s.part] || {}).icon || '•'} ${att.kind === 'mock' ? String(secName(s)).split(' · ').pop() : secName(s)}`, cls: s === cur ? 'on' : att.res[s.id] && att.res[s.id].done ? 'ok' : '' }));
  const titleOf = att => `${P(word('name', 'Academy of Alba'))} · ${att.kind === 'level' ? `${B[att.band]} level exam` : ((att.title && att.title.en) || 'Exam')}`;
  let running = null;
  async function run(att, o = {}) {
    if (!att) return null;
    running = att;
    try {
      for (;;) {
        const sec = att.sections.find(s => !(att.res[s.id] && att.res[s.id].done));
        if (!sec) break;
        const go = await cover(att, sec);
        if (go !== 'go') return att;
        let res = null;
        try { res = await section(att, sec); } catch (e) { console.error('[exam] part', e); res = null; }
        if (!res) return att;
        EXAM._.finishSection(att, sec.id, res);
        if (!att.sections.some(s => !(att.res[s.id] && att.res[s.id].done))) break;
        const nx = await between(att, sec);
        if (nx !== 'next') return att;
      }
      EXAM._.finish(att);
      await results(att);
      return att;
    } finally { running = null; close(); }
  }
  // the cover: the level, the parts (done ones with their score), the rules, the examiner's welcome
  function cover(att, sec) {
    return new Promise(resolve => {
      const f = frame({ title: titleOf(att), sub: (C().examiner && P(ex().name)) || '', steps: steps(att, null) }), first = !Object.keys(att.res).length;
      const mock = att.kind === 'mock' && typeof MOCKUI !== 'undefined';
      // (a practice paper: the examiner's own words for its format; the level exam's «four parts» wouldn't fit HSK)
      const greet = mock ? (first ? MOCKUI.hello(att) : EXAM._.says('back')) : (EXAM._.says(first ? 'hello' : 'back') || EXAM._.says('hello'));
      f.body.innerHTML = `<div class="cv"><div class="who"><canvas width="264" height="264"></canvas><b>${T(ex().name || '')}</b><small>${E(ex().en || 'the examiner')}</small></div>`
        + (mock ? `<div>${greet ? `<div class="bub" style="margin-bottom:8px">${lineHTML(greet, { gloss: att.band <= 2 ? 3 : 0 })}</div>` : ''}${MOCKUI.coverHTML(att)}</div></div>`
          : `<div><h2>${att.kind === 'level' ? `${B[att.band]} · ${E(word('levelEn', 'Level exam'))}` : E((att.title && att.title.en) || 'Exam')}</h2>`
        + (greet ? `<div class="bub">${lineHTML(greet, { gloss: att.band <= 2 ? 3 : 0 })}</div>` : '')
        + `<div class="parts">${att.sections.map(s => { const r = att.res[s.id]; return `<div class="pt ${r && r.done ? 'ok' : ''}">${r && r.done ? `<span class="sc">${fmt(r.score)}/${s.max || 25}</span>` : ''}<b>${(EXAM.PART[s.part] || {}).icon || ''} ${E(secName(s))}</b><small>${E(partLine(att, s))}</small></div>`; }).join('')}</div>`
        + `<ul class="rules"><li>Every part is out of <b>25</b>. A pass is <b>60 of 100</b>, with at least <b>10</b> in every part.</li><li>No dictionary and no help: ${E(mimo())} waits on the bench by the door.</li>`
        + `<li>${att.kind === 'level' ? 'No time limit. ' : ''}Each recording plays <b>twice</b> at most.</li><li>You can stop between parts: finished parts are kept. A certificate needs all four parts of the same attempt.</li></ul></div></div>`);
      try { if (typeof TALKUI !== 'undefined') TALKUI.face(f.body.querySelector('.who canvas'), ex().look || null, 'happy'); } catch (e) { /* */ }
      wireEN(f.body);
      if (greet && !X.fast) speak(greet.t, 'examiner');
      f.note.textContent = first ? '' : `${att.sections.filter(s => att.res[s.id] && att.res[s.id].done).length} of ${att.sections.length} parts done`;
      const go = document.createElement('button'); go.className = 'btn main'; go.textContent = first ? `Start: ${secName(sec)} ▸` : `Go on: ${secName(sec)} ▸`;
      f.foot.appendChild(go);
      const done = v => { keys(null); try { SPEECH.stop(); } catch (e) { /* */ } resolve(v); };
      go.onclick = () => { snd('page'); done('go'); };
      f.x.onclick = () => done('close');
      keys(e => { if (e.code === 'Escape') done('close'); else if (e.code === 'Enter') done('go'); else return false; });
      if (X.auto) setTimeout(() => done('go'), 10);
    });
  }
  function partLine(att, s) {
    const n = s.tasks.length;
    if (s.part === 'listen') return `${n} recording${n > 1 ? 's' : ''}, two plays each, with questions`;
    if (s.part === 'read') return `${n} text${n > 1 ? 's' : ''} with questions`;
    if (s.part === 'write') return `${n} task${n > 1 ? 's' : ''}: three points each, in your own words`;
    return `${n} questions from the examiner, typed: answer in whole sentences`;
  }
  // between two parts: go on, or stop here (your finished parts are kept)
  function between(att, sec) {
    return new Promise(resolve => {
      const f = frame({ title: titleOf(att), sub: 'Part done', steps: steps(att, null) });
      const left = att.sections.filter(s => !(att.res[s.id] && att.res[s.id].done)), nx = left[0];
      f.body.innerHTML = `<div style="text-align:center;padding:30px 10px"><h2>✓ ${E(secName(sec))}: done</h2><p class="note">Your scores come at the end. ${left.length} part${left.length > 1 ? 's' : ''} to go: ${left.map(s => E(secName(s))).join(', ')}.</p>`
        + `<p class="note">Need a break? Stop here: this part is kept, and you can come back to the Academy any time.</p></div>`;
      const stop = document.createElement('button'); stop.className = 'btn'; stop.textContent = 'Take a break';
      const go = document.createElement('button'); go.className = 'btn main'; go.textContent = `Next: ${secName(nx)} ▸`;
      f.foot.append(stop, go);
      const done = v => { keys(null); resolve(v); };
      stop.onclick = () => done('pause'); go.onclick = () => { snd('page'); done('next'); }; f.x.onclick = () => done('pause');
      keys(e => { if (e.code === 'Escape') done('pause'); else if (e.code === 'Enter') done('next'); else return false; });
      if (X.auto) setTimeout(() => done(X.pauseAfter === sec.id ? 'pause' : 'next'), 10);
    });
  }
  // one part: its tasks in turn → the part's results (null: you left in the middle; it starts again next time)
  // (C, a timed practice paper: the section's clock runs in every screen's top bar; at 0 the section hands itself in, the tasks it
  // never reached count as blank, and a screen shows which items were left blank. Speaking: the cards first, then its clock.)
  async function section(att, sec) {
    const st = { items: [], texts: [], tasks: [], turns: [], mode: sec.part === 'read' ? 'read' : 'listen', plays: {}, t0: Date.now() };
    if (sec.part === 'speak') {
      if (sec.prep || speakCards(att, sec).length) { const p = await prepScreen(att, sec); if (p === 'quit') return null; }
      const TM = clockFor(att, sec);
      try { const r = await speakPart(att, sec, st, TM); if (r) { st.time = Date.now() - st.t0; if (TM && TM.out) st.timeUp = true; } return r ? st : null; } finally { if (TM) TM.stop(); }
    }
    const TM = clockFor(att, sec);
    try {
      for (let i = 0; i < sec.tasks.length; i++) {
        const t = EXAM._.resolve(EXAM.task(sec.tasks[i], att.lang), att);
        if (!t) continue;
        if (TM && TM.out) { blankTask(sec, t, st); continue; }
        const r = sec.part === 'write' && sec.kind !== 'items' ? await writeTask(att, sec, t, i, st, TM) : await itemTask(att, sec, t, i, st, TM);
        if (r === 'quit') return null;
      }
      st.time = Date.now() - st.t0;
      if (TM && TM.out) { st.timeUp = true; await timeUp(att, sec, st); }
      return st;
    } finally { if (TM) TM.stop(); }
  }
  // the section's clock (timed papers only; tests: X.clockMs makes every section that long)
  function clockFor(att, sec) {
    if (!att.timed || !sec.time) return null;
    const ms = X.clockMs != null ? X.clockMs : sec.time * 60000;
    const TM = { end: Date.now() + ms, out: false, cur: null, el: null, iv: 0 };
    const draw = () => { if (!TM.el) return; const s = Math.max(0, Math.ceil((TM.end - Date.now()) / 1000)); TM.el.textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; TM.el.classList.toggle('low', s <= 60); };
    TM.attach = f => { if (!f || !f.top) return; const el = document.createElement('span'); el.className = 'clock'; el.title = 'Time left in this section'; f.top.insertBefore(el, f.top.querySelector('.ex-x')); TM.el = el; draw(); };
    TM.iv = setInterval(() => { draw(); if (!TM.out && Date.now() >= TM.end) { TM.out = true; try { if (TM.cur) TM.cur(); } catch (e) { console.error('[exam] clock', e); } } }, 200);
    TM.stop = () => clearInterval(TM.iv);
    return TM;
  }
  // a task the clock never reached: its items blank, its writing empty
  function blankTask(sec, t, st) {
    if (sec.part === 'write' && sec.kind !== 'items') { st.tasks.push({ id: t.id, text: '', score: 0, points: [], zero: 'empty', blank: true }); return; }
    for (const it of t.items || []) st.items.push({ task: t.id, k: it.k, type: it.type, a: null, s: 0, pts: it.pts || 1, words: it.words || [], blank: true });
  }
  // time's up: which items were left blank (they just score 0; nothing else is taken off)
  function timeUp(att, sec, st) {
    return new Promise(resolve => {
      const f = frame({ title: titleOf(att), sub: 'Time’s up', steps: steps(att, null) });
      // (numbered as the paper numbers them: a matching item of six is six questions, each row blank or not)
      const nums = []; let nq = 0;
      for (const x of st.items || []) {
        const p = x.pts || 1;
        if (Array.isArray(x.a)) x.a.forEach((v, j) => { if (v == null) nums.push(nq + j + 1); });
        else if (x.a == null || x.a === '') for (let j = 0; j < p; j++) nums.push(nq + j + 1);
        nq += Array.isArray(x.a) ? Math.max(p, x.a.length) : p;
      }
      const tasksEmpty = (st.tasks || []).filter(x => !x.text).length;
      const runs = []; for (const n of nums) { const r = runs[runs.length - 1]; if (r && n === r[1] + 1) r[1] = n; else runs.push([n, n]); }
      f.body.innerHTML = `<div style="text-align:center;padding:24px 10px"><h2>⏱ Time’s up: ${E(secName(sec))}</h2><p class="note">The section was handed in with what you had.</p>`
        + (nums.length ? `<p><b>Left blank:</b> ${runs.map(r => r[0] === r[1] ? r[0] : `${r[0]}–${r[1]}`).join(', ')} (${nums.length} of ${nq})</p>` : '')
        + (tasksEmpty ? `<p><b>Nothing written</b> in ${tasksEmpty} task${tasksEmpty > 1 ? 's' : ''}.</p>` : '')
        + (!nums.length && !tasksEmpty ? '<p>Everything had an answer.</p>' : '') + '<p class="note">Blank answers just score 0. Nothing else is taken off.</p></div>';
      const go = document.createElement('button'); go.className = 'btn main'; go.textContent = 'Go on ▸'; f.foot.appendChild(go);
      const done = () => { keys(null); resolve(); };
      go.onclick = done; f.x.onclick = done; keys(e => { if (e.code === 'Enter' || e.code === 'Escape') done(); else return false; });
      if (X.auto) setTimeout(done, 10);
    });
  }
  // the speaking part's cards (a talk's topic, a photo, a role-play), shown to prepare before the talk
  const speakCards = (att, sec) => sec.tasks.map(id => EXAM._.resolve(EXAM.task(id, att.lang), att)).filter(t => t && t.card);
  function prepScreen(att, sec) {
    return new Promise(resolve => {
      const f = frame({ title: titleOf(att), sub: `${secName(sec)} · preparation`, steps: steps(att, sec), xTitle: 'Leave the exam' });
      const cards = speakCards(att, sec), timed = att.timed && sec.prep;
      f.body.innerHTML = `<h2>${E(secName(sec))}: prepare</h2><p class="note">${timed ? `You have <b>${sec.prep} minutes</b> to prepare, as in the real exam. Make notes if you like; then the talk starts.` : 'Take your time with the cards: press <b>Ready</b> when you want to start the talk.'}</p>`
        + (cards.length ? cards.map(t => typeof MOCKUI !== 'undefined' ? MOCKUI.cardHTML(t) : '').join('') : '<p>The examiner will ask you some questions.</p>')
        + '<textarea class="notes" style="min-height:90px;margin-top:8px" placeholder="Your notes (they aren’t marked)…"></textarea>';
      wireEN(f.body);
      f.body.querySelectorAll('canvas[data-pic]').forEach(cv => { try { drawPic(cv.dataset.pic, cv); } catch (e) { /* */ } });
      f.body.querySelectorAll('canvas[data-icon]').forEach(cv => { try { ICONS.draw(cv, cv.dataset.icon); } catch (e) { /* */ } });
      const go = document.createElement('button'); go.className = 'btn main'; go.textContent = timed ? 'Start now ▸' : 'Ready ▸'; f.foot.appendChild(go);
      let iv = 0, finished = false;
      const done = v => { if (finished) return; finished = true; clearInterval(iv); keys(null); resolve(v); };
      if (timed) {
        const end = Date.now() + (X.clockMs != null ? X.clockMs : sec.prep * 60000), el = document.createElement('span'); el.className = 'clock'; f.top.insertBefore(el, f.top.querySelector('.ex-x'));
        const draw = () => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); el.textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; el.classList.toggle('low', s <= 60); if (s <= 0) done('go'); };
        draw(); iv = setInterval(draw, 250);
      }
      go.onclick = () => { snd('page'); done('go'); };
      f.x.onclick = async () => { if (await confirmQuit(f)) done('quit'); };
      keys(e => { if (e.code === 'Escape') { f.x.onclick(); return true; } return false; });
      if (X.auto) setTimeout(() => done('go'), 10);
    });
  }
  // leaving in the middle of a part
  function confirmQuit(f) {
    return new Promise(resolve => {
      const bar = document.createElement('div'); bar.className = 'box'; bar.style.cssText = 'position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);z-index:3;max-width:420px;text-align:center;box-shadow:0 8px 0 rgba(43,34,53,.25);border:3px solid #2b2235';
      bar.innerHTML = '<p><b>Leave the exam?</b></p><p class="note">This part starts again next time. Your finished parts are kept.</p><p><button class="btn" data-v="stay">Stay</button> <button class="btn main" data-v="leave">Leave</button></p>';
      root.querySelector('.ex-card').appendChild(bar);
      const k = e => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); } };
      const done = v => { removeEventListener('keydown', k, true); bar.remove(); resolve(v); };
      bar.querySelectorAll('[data-v]').forEach(b => b.onclick = () => done(b.dataset.v === 'leave'));
      addEventListener('keydown', k, true);
    });
  }

  // ------------------------------------------------------------ Listening and Reading: a recording or a text, then its items
  const TF = () => { const t = (C().lines || {}).tf; return t ? EXAM._.linesOf(t) : [{ t: 'True', en: 'True' }, { t: 'False', en: 'False' }, { t: 'Not said', en: 'Not in the text' }]; };
  const LET = 'ABCDEFGHIJKLMNOP';
  // (C: a practice paper's option labels follow its format: the JLPT numbers them 1–4, as its instructions say)
  const optLab = () => { const F = running && running.kind === 'mock' && typeof MOCK !== 'undefined' && MOCK.F ? MOCK.F[running.format] : null; return (F && F.optLabels) || 'ABCDEF'; };
  function itemHTML(it, n) {
    // (C: an item may show a picture (HSK's ✓/✗ against a picture); options may be pictures only (HSK's «pick the picture»),
    // and lettered labels may be pictures, shown once above the rows (HSK's pictures A–F))
    const raw = it.raw || {}, pic = raw.icon ? `<canvas class="qpic" width="120" height="120" data-icon="${E(raw.icon)}"></canvas>` : '';
    const q = `<span class="qn">${n}</span>${pic}`;
    if (it.type === 'mc' || it.type === 'gap') {
      const ask = it.type === 'gap' && it.text ? lineHTML(it.text) : lineHTML(it.ask), only = raw.picsOnly, OL = optLab();
      return `<div class="q" data-k="${it.k}">${q}${ask}<div class="opts">${it.opts.map((o, i) => `<button class="opt${only ? ' po' : ''}" type="button" data-o="${i}"><span class="lt">${OL[i]}</span>${o.icon ? `<canvas width="88" height="88" data-icon="${E(o.icon)}"></canvas>` : ''}${only && o.icon ? '' : `<span>${T(o.t)}</span>`}</button>`).join('')}</div></div>`;
    }
    if (it.type === 'tf' || it.type === 'tfn') {
      const lab = raw.labels ? EXAM._.linesOf(raw.labels) : TF(), vals = it.type === 'tfn' ? [true, false, 'n'] : [true, false];
      return `<div class="q" data-k="${it.k}">${q}${lineHTML(it.ask)}<div class="opts">${vals.map((v, i) => `<button class="opt" type="button" data-o="${i}" data-v="${v}">${T(lab[i].t)}</button>`).join('')}</div></div>`;
    }
    if (it.type === 'short') return `<div class="q" data-k="${it.k}">${q}${lineHTML(it.ask)}<input class="sh" autocomplete="off" spellcheck="false" placeholder="A short answer, in ${E(EXAM.LANGNAME[L()] || 'the language')}"></div>`;
    if (it.type === 'match') {
      const lab = raw.letters;          // (C: the options are labels the text already shows, letters or names: no list, the label on each button)
      const legend = lab && raw.icons ? `<div class="opts" style="margin:6px 0 2px">${raw.icons.map((ic, i) => `<span class="opt po" style="cursor:default"><span class="lt">${T((it.opts[i] || {}).t || LET[i])}</span><canvas width="88" height="88" data-icon="${E(ic)}"></canvas></span>`).join('')}</div>` : '';
      return `<div class="q" data-k="${it.k}">${q}${lineHTML(it.ask)}${legend}${lab ? '' : `<div class="note" style="margin-top:6px">${it.opts.map((o, i) => `<b>${LET[i]}</b> ${T(o.t)}`).join(' · ')}</div>`}`
        + it.left.map((l, j) => `<div class="mrow"><span class="l">${T(l.t)}</span><span class="opts" data-row="${j}">${it.opts.map((o, i) => `<button class="opt" type="button" data-o="${i}">${lab ? T(o.t) : `<span class="lt">${LET[i]}</span>`}</button>`).join('')}</span></div>`).join('') + '</div>';
    }
    if (it.type === 'order') return `<div class="q" data-k="${it.k}">${q}${lineHTML(it.ask)}<div class="built"></div><div class="chips">${it.opts.map((o, i) => `<button class="chip" type="button" data-o="${i}">${T(o.t)}</button>`).join('')}</div><button class="btn sm" type="button" data-reset>↺</button></div>`;
    const U = UTYPES[it.type]; return U && U.html ? `<div class="q" data-k="${it.k}">${q}${U.html(it)}</div>` : '';
  }
  // the answers of a task's items, kept in A[k]
  function wireItems(el, items, A) {
    el.querySelectorAll('canvas[data-icon]').forEach(cv => { try { ICONS.draw(cv, cv.dataset.icon); } catch (e) { /* */ } });
    for (const it of items) {
      const q = el.querySelector(`.q[data-k="${it.k}"]`); if (!q) continue;
      if (it.type === 'mc' || it.type === 'gap' || it.type === 'tf' || it.type === 'tfn') {
        q.querySelectorAll('.opts > .opt').forEach(b => b.onclick = () => {
          q.querySelectorAll('.opts > .opt').forEach(x => x.classList.remove('on')); b.classList.add('on'); snd('click');
          A[it.k] = it.type === 'tf' || it.type === 'tfn' ? (b.dataset.v === 'n' ? 'n' : b.dataset.v === 'true') : +b.dataset.o;
        });
      } else if (it.type === 'short') {
        const inp = q.querySelector('input.sh'); if (isC() && CJK.mode(L()) === 'chars' && CJK.attachIME) try { CJK.attachIME(inp); } catch (e) { /* */ }
        inp.oninput = () => { A[it.k] = inp.value; };
      } else if (it.type === 'match') {
        const a = A[it.k] = A[it.k] || it.left.map(() => null);
        q.querySelectorAll('[data-row]').forEach(row => row.querySelectorAll('.opt').forEach(b => b.onclick = () => { row.querySelectorAll('.opt').forEach(x => x.classList.remove('on')); b.classList.add('on'); a[+row.dataset.row] = +b.dataset.o; snd('click'); }));
      } else if (it.type === 'order') {
        const a = A[it.k] = [], built = q.querySelector('.built');
        const draw = () => { built.innerHTML = a.map(i => T(it.opts[i].t)).join(' '); q.querySelectorAll('.chip').forEach(c => c.classList.toggle('used', a.includes(+c.dataset.o))); };
        q.querySelectorAll('.chip').forEach(c => c.onclick = () => { const i = +c.dataset.o; if (!a.includes(i)) { a.push(i); snd('click'); draw(); } });
        q.querySelector('[data-reset]').onclick = () => { a.length = 0; draw(); };
      } else { const U = UTYPES[it.type]; if (U && U.wire) U.wire(q, it, v => { A[it.k] = v; }); }
    }
  }
  // tests: the answers the auto mode gives ('model': right, 'nose': «No sé» / nothing, 'wrong': a wrong one)
  function autoAnswer(it, how) {
    if (how === 'model') {
      if (it.type === 'short') return it.model || '';
      if (it.type === 'match' || it.type === 'order') return it.key.slice();
      return it.key;
    }
    if (how === 'wrong') {
      if (it.type === 'mc' || it.type === 'gap') return (it.key + 1) % it.opts.length;
      if (it.type === 'tf') return !it.key;
      if (it.type === 'tfn') return it.key === true ? false : true;
      if (it.type === 'short') return idkText();
      if (it.type === 'match' || it.type === 'order') return it.key.map((x, i, a) => a[(i + 1) % a.length]);
    }
    return it.type === 'short' ? idkText() : null;
  }
  const idkText = () => ({ es: 'No sé.', pt: 'Não sei.', de: 'Ich weiß es nicht.', zh: '我不知道。', ja: 'わかりません。' }[L()] || 'No sé.');
  const autoFor = part => (!X.auto ? null : typeof X.auto === 'string' ? X.auto : X.auto[part] || null);
  function itemTask(att, sec, t, i, st, TM) {
    return new Promise(resolve => {
      const listen = sec.part === 'listen', band = att.band || 1, A = {}, n = sec.tasks.length;
      // (how many plays: the task's own, its part's in the format (Goethe: per Teil), the section's, else two)
      const part = t.teil || t.tarea, maxPlays = t.plays || (sec.playsBy && part ? sec.playsBy[part - 1] : 0) || sec.plays || 2;
      const f = frame({ title: titleOf(att), sub: `${secName(sec)} · ${i + 1} of ${n}`, steps: steps(att, sec), xTitle: 'Leave the exam' });
      const items = t.items || [];
      // (the questions are numbered through the part as the paper counts them: a matching item of six is six numbers, «12–17»)
      let k0 = 0; for (let j = 0; j < i; j++) { const tj = EXAM.task(sec.tasks[j], att.lang); k0 += ((tj && tj.items) || []).reduce((a, it) => a + (it.pts || (it.type === 'match' ? (it.pairs || []).length : 1)), 0); }
      // (C: a practice paper's task says which of the format's tasks it is: «Tarea 2», «Teil 3», «第二部分»)
      const tname = att.kind === 'mock' && t.tarea && typeof MOCKUI !== 'undefined' ? MOCKUI.taskName(att, t.tarea) : `${i + 1}/${n}`;
      const head = `<div class="tk-h"><span class="k">${E(secName(sec))} · ${E(tname)}</span>${t.title ? `<span class="tl">${T(t.title.t)}</span>` : ''}</div>`
        + (t.intro ? `<div class="note" style="margin-bottom:6px">${lineHTML(t.intro, { gloss: band <= 2 ? 2 : 0 })}</div>` : '');
      let kk = k0; const qs = items.map(it => { const n0 = kk + 1; kk += it.pts || 1; return itemHTML(it, kk > n0 ? `${n0}–${kk}` : n0); }).join('');
      // (one recording, or several (t.clips), each with its own Play and its own plays)
      const clips = listen && t.clips && t.clips.length ? t.clips : [{ label: null, lines: t.lines || [] }];
      if (listen) {
        const art = t.icon || { voicemail: 'call', announce: 'bell', weather: 'sc_sun', dialogue: 'speech', interview: 'radio', story: 'book', debate: 'radio', report: 'radio' }[t.slot] || 'radio';
        const rows = clips.map((c, j) => `<div class="play" data-clip="${j}">${c.label ? `<b class="clab">${T(c.label.t)}</b>` : ''}<button class="btn main" data-play="${j}">▶ Play</button><span class="left">${maxPlays > 1 ? `${maxPlays} plays left` : 'it plays once'}</span><span class="now"></span></div>`).join('');
        f.body.innerHTML = `<div class="cols"><div>${head}${rows}`
          + (clips.length > 1 ? `<p class="note">Listen, then answer. Each recording plays ${maxPlays > 1 ? 'twice' : 'once'} at most.</p>` : `<div class="clip-art"><canvas width="240" height="240" data-icon="${E(art)}"></canvas><span class="note">Listen, then answer. This recording plays ${maxPlays > 1 ? 'twice' : 'once'} at most.</span></div>`)
          + `<div class="script hidden">${clips.map(c => (c.label ? `<p><b>${T(c.label.t)}</b></p>` : '') + c.lines.map(l => `<p><span class="spk">${E(nameOf(t, l.who))}</span>${T(l.text)} <span class="en hide">${E(l.en)}</span></p>`).join('')).join('')}</div><p class="note nv hidden"></p></div><div>${qs}</div></div>`;
      } else {
        const hasText = (t.text && t.text.length) || (t.blocks && t.blocks.length) || t.head;
        f.body.innerHTML = `<div class="cols"><div>${head}${hasText ? readHTML(t) : ''}</div><div>${qs}</div></div>`;
      }
      wireEN(f.body); wireItems(f.body, items, A);
      // the recording: two plays, each line in its speaker's voice; A1–A2 a little slower and clear, B1–B2 at natural speed
      let ctl = null, played = false;
      const PL = clips.map((c, j) => ({ c, plays: maxPlays, pb: f.body.querySelector(`[data-play="${j}"]`), left: f.body.querySelector(`[data-clip="${j}"] .left`), now: f.body.querySelector(`[data-clip="${j}"] .now`) }));
      const toRead = why => {
        st.mode = 'read'; const sc = f.body.querySelector('.script'); if (sc) sc.classList.remove('hidden');
        const nv = f.body.querySelector('.nv'); if (nv) { nv.classList.remove('hidden'); nv.classList.add('warn'); nv.textContent = why || `${SPEECH.NO_VOICE}: read it instead (it counts as reading).`; }
        for (const p of PL) { if (p.pb) p.pb.disabled = true; if (p.left) p.left.textContent = ''; }
      };
      const playClip = p => {
        if (ctl || !p || p.plays <= 0 || !p.pb || p.pb.disabled) return;
        p.plays--; p.left.textContent = p.plays ? `${p.plays} play${p.plays > 1 ? 's' : ''} left` : 'no plays left'; PL.forEach(q => { if (q.pb) q.pb.disabled = true; }); snd('click');
        ctl = SPEECH.play(p.c.lines.map(l => ({ text: l.text, who: 'ex.' + l.who })), { lang: L(), gap: band <= 2 ? 0.45 : 0.3,
          onLine: (j, l) => { p.now.textContent = j >= 0 && l ? `🔊 ${nameOf(t, String(l.who).replace(/^ex\./, ''))}` : ''; } });
        ctl.done.then(r => { ctl = null; p.now.textContent = ''; played = true; if (!r.ok && !r.stopped) toRead(); else { PL.forEach(q => { if (q.pb) q.pb.disabled = q.plays <= 0; }); p.pb.textContent = '▶ Play again'; } });
      };
      if (listen) {
        for (const [who, v] of Object.entries(t.voices || {})) try { SPEECH.speaker('ex.' + who, { pitch: v.pitch != null ? v.pitch : 1, rate: (v.rate || 1) * (band <= 2 ? 0.86 : 1) }); } catch (e) { /* */ }
        PL.forEach(p => { if (p.pb) p.pb.onclick = () => playClip(p); });
        if (typeof SPEECH === 'undefined') toRead('No voices here: read it instead (it counts as reading).');
        else if (!X.auto) SPEECH.ready().then(() => { if (!SPEECH.has(L())) toRead(); });
        st.texts.push(...(t.lines || []).map(l => l.text));
      } else st.texts.push(...(t.text || []).map(s => s.t));
      const last = i === n - 1;
      const next = document.createElement('button'); next.className = 'btn main'; next.textContent = last ? `Finish ${secName(sec)} ▸` : 'Next ▸';
      f.foot.appendChild(next);
      f.note.textContent = listen ? 'Answer while it plays, or after. The words show only after the exam.' : '';
      let finished = false;
      const finish = () => {
        if (finished) return; finished = true;          // (a double click hands it in once)
        if (ctl) { try { ctl.stop(); } catch (e) { /* */ } ctl = null; }
        for (const it of items) {
          let a = A[it.k];
          if (it.type === 'short') { const inp = f.body.querySelector(`.q[data-k="${it.k}"] input.sh`); a = inp ? inp.value : a; }
          st.items.push({ task: t.id, k: it.k, type: it.type, a: a == null ? null : a, s: EXAM.grade.item(it, a, L()), pts: it.pts || 1, words: it.words || [] });
        }
        st.plays[t.id] = PL.reduce((a, p) => a + (maxPlays - p.plays), 0);
        keys(null); resolve('next');
      };
      if (TM) { TM.attach(f); TM.cur = () => finish(); }
      next.onclick = () => {
        const empty = items.filter(it => { const a = it.type === 'short' ? (f.body.querySelector(`.q[data-k="${it.k}"] input.sh`) || {}).value : A[it.k]; return a == null || a === '' || (Array.isArray(a) && a.some(x => x == null)); }).length;
        if (empty && !next.dataset.sure) { next.dataset.sure = '1'; f.note.innerHTML = `<span class="warn">${empty} question${empty > 1 ? 's have' : ' has'} no answer yet. Press again to go on anyway.</span>`; return; }
        snd('page'); finish();
      };
      f.x.onclick = async () => { if (ctl) { try { ctl.stop(); } catch (e) { /* */ } } if (await confirmQuit(f)) { keys(null); resolve('quit'); } };
      keys(e => { if (e.code === 'Escape') { f.x.onclick(); return true; } if (e.code === 'Space' && listen) { const p = PL.find(q => q.pb && !q.pb.disabled && q.plays > 0); if (p) { playClip(p); return true; } } return false; });
      // tests
      const how = autoFor(sec.part);
      if (how) setTimeout(() => {
        if (listen && how !== 'noplay') { PL.forEach(p => { p.plays = Math.max(0, maxPlays - 1); }); played = true; }
        for (const it of items) {
          const a = autoAnswer(it, how); A[it.k] = a; const q = f.body.querySelector(`.q[data-k="${it.k}"]`); if (!q) continue;
          if (it.type === 'short') { const inp = q.querySelector('input.sh'); if (inp) inp.value = a || ''; }
          else if (a != null && (it.type === 'mc' || it.type === 'gap')) { const b = q.querySelector(`.opts > .opt[data-o="${a}"]`); if (b) b.classList.add('on'); }
          else if (a != null && (it.type === 'tf' || it.type === 'tfn')) { const b = q.querySelector(`.opts > .opt[data-v="${a}"]`); if (b) b.classList.add('on'); }
          else if (Array.isArray(a) && it.type === 'match') q.querySelectorAll('[data-row]').forEach(row => { const b = row.querySelector(`.opt[data-o="${a[+row.dataset.row]}"]`); if (b) b.classList.add('on'); });
        }
        X.last = { part: sec.part, task: t.id };
        if (X.stopAt === t.id) return;
        finish();
      }, 10);
    });
  }
  const nameOf = (t, who) => { const v = t.voices && t.voices[who]; return P((v && v.name) || who); };
  const linesHTML = x => EXAM._.linesOf(x).map(l => lineHTML(l)).join(' · ');
  // a reading task's text: one, or several short ones (t.blocks: notices, ads, a letter each), each with its label (A, B, 1…);
  // en: the review's way, every sentence with its English on request
  const sentHTML = (s, en) => (en ? lineHTML(s) : T(s.t));
  function readHTML(t, en) {
    const blocks = t.blocks && t.blocks.length ? `<div class="blocks">${t.blocks.map(b => `<div class="rt ${E(b.kind || '')}">${b.label ? `<span class="blab">${T(b.label.t)}</span>` : ''}${(b.head || []).length ? `<div class="head">${linesHTML(b.head)}</div>` : ''}${(b.text || []).map(s => `<p>${sentHTML(s, en)}</p>`).join('')}</div>`).join('')}</div>` : '';
    // (a text and its lettered fragments together: the text first (t.textOwn), the fragments under it)
    if (blocks && !t.textOwn) return blocks;
    return `<div class="rt ${E(t.kind || '')}">${t.head ? `<div class="head">${linesHTML(t.head)}</div>` : ''}${(t.text || []).map(s => `<p>${sentHTML(s, en)}</p>`).join('')}</div>${blocks ? `<div style="margin-top:8px">${blocks}</div>` : ''}`;
  }
  // the examiner's voice (SPEECH; a slower, clear rate at A1–A2)
  function speak(text, who = 'examiner', band) {
    if (X.fast || typeof SPEECH === 'undefined' || !text) return Promise.resolve({ ok: false });
    const v = ex().voice || {}, b = band || (running && running.band) || 2;
    try { SPEECH.speaker('ex.' + who, { pitch: v.pitch != null ? v.pitch : 1, rate: (v.rate || 1) * (b <= 2 ? 0.88 : 1) }); } catch (e) { /* */ }
    return SPEECH.say(text, { lang: L(), who: 'ex.' + who }).catch(() => ({ ok: false }));
  }
  const compactErr = e => ({ code: e.code, sev: e.sev, tip: e.tip || '', fix: e.fix || '', free: !!e.free });

  // ------------------------------------------------------------ Writing: the task, its three points, your text
  const countWords = text => { try { return EXAM._.wordsOf(DICT.analyze(String(text || ''))).length; } catch (e) { return String(text || '').split(/\s+/).filter(Boolean).length; } };
  // (C: a task with an `alt` offers a choice of two, as DELE and Goethe do; the one you pick is written and marked)
  async function writeTask(att, sec, t, i, st, TM) {
    if (t.alt) {
      const pick = await chooseTask(att, sec, t, i, TM);
      if (pick === 'quit') return 'quit';
      if (pick === 'time') { blankTask(sec, t, st); return 'next'; }
      if (pick !== t.id) { const slotOf = t.id; t = EXAM._.resolve(EXAM.task(pick, att.lang), att); t.slotOf = slotOf; }
    }
    return writeOne(att, sec, t, i, st, TM);
  }
  function chooseTask(att, sec, t, i, TM) {
    return new Promise(resolve => {
      const band = att.band || 1, n = sec.tasks.length, b = EXAM._.resolve(EXAM.task(t.alt, att.lang), att);
      const f = frame({ title: titleOf(att), sub: `${secName(sec)} · ${i + 1} of ${n}: choose`, steps: steps(att, sec), xTitle: 'Leave the exam' });
      const ow = (att.kind === 'mock' && typeof MOCK !== 'undefined' && MOCK.F[att.format] && MOCK.F[att.format].optWord) || 'Option';
      const card = (x, j) => `<div class="mk-card" data-pick="${E(x.id)}"><h4>${T(ow)} ${j + 1}${ow !== 'Option' ? ` · Option ${j + 1}` : ''}${x.title ? ` · ${T(x.title.t)}` : ''}</h4>${(x.prompt || []).map(l => `<p style="margin:0 0 5px">${lineHTML(l, { gloss: band <= 2 ? 2 : 0 })}</p>`).join('')}<p class="note">${x.min}–${x.max} words</p></div>`;
      const tname = att.kind === 'mock' && t.tarea && typeof MOCKUI !== 'undefined' ? MOCKUI.taskName(att, t.tarea) : `${i + 1}/${n}`;
      f.body.innerHTML = `<div class="tk-h"><span class="k">${E(secName(sec))} · ${E(tname)}</span><span class="tl">Choose one of the two tasks</span></div>${t.intro ? `<div class="note" style="margin-bottom:6px">${lineHTML(t.intro, { gloss: band <= 2 ? 2 : 0 })}</div>` : ''}<div class="choose">${card(t, 0)}${b ? card(b, 1) : ''}</div>`;
      wireEN(f.body);
      let finished = false;
      const done = v => { if (finished) return; finished = true; keys(null); resolve(v); };
      f.body.querySelectorAll('[data-pick]').forEach(c => c.onclick = e => { if (e.target.closest('[data-en]')) return; snd('page'); done(c.dataset.pick); });
      f.x.onclick = async () => { if (await confirmQuit(f)) done('quit'); };
      keys(e => { if (e.code === 'Escape') { f.x.onclick(); return true; } return false; });
      if (TM) { TM.attach(f); TM.cur = () => done('time'); }
      if (autoFor('write')) setTimeout(() => done(t.id), 10);
    });
  }
  function writeOne(att, sec, t, i, st, TM) {
    return new Promise(resolve => {
      const band = att.band || 1, n = sec.tasks.length, form = t.form || null;
      const f = frame({ title: titleOf(att), sub: `${secName(sec)} · ${i + 1} of ${n}`, steps: steps(att, sec), xTitle: 'Leave the exam' });
      // (C: a source to listen to first, as in DELE B2's first task and Celpe-Bras's video and audio tasks)
      const src = t.source || null, srcPlays = sec.plays || 2;
      const tname = att.kind === 'mock' && t.tarea && typeof MOCKUI !== 'undefined' ? MOCKUI.taskName(att, t.tarea) : `${i + 1}/${n}`;
      f.body.innerHTML = `<div class="cols"><div><div class="tk-h"><span class="k">${E(secName(sec))} · ${E(tname)}</span>${t.title ? `<span class="tl">${T(t.title.t)}</span>` : ''}</div>`
        + (t.intro ? `<div class="note" style="margin-bottom:6px">${lineHTML(t.intro, { gloss: band <= 2 ? 2 : 0 })}</div>` : '')
        + (src ? `<div class="play"><button class="btn" data-src>▶ Listen</button><span class="left">${srcPlays > 1 ? `${srcPlays} plays` : 'it plays once'}</span><span class="now"></span></div>${src.pic ? `<canvas class="pic" width="480" height="300" data-pic="${E(src.pic)}"></canvas>` : ''}` : '')
        + (t.head ? `<div class="rt ${E(t.kind || 'email')}" style="margin-bottom:8px">${linesOfHTML(t.head)}${(t.text || []).map(s => `<p>${T(s.t)}</p>`).join('')}</div>` : '')
        + (t.frame && typeof MOCKUI !== 'undefined' ? MOCKUI.frameHTML(t.frame) : '')
        + (t.prompt || []).map(l => `<p style="margin:0 0 6px">${lineHTML(l, { gloss: band <= 2 ? 2 : 0 })}</p>`).join('')
        + (form ? '' : `<ul class="pts">${(t.points || []).map(p => `<li>${lineHTML(p.t, { gloss: band <= 2 ? 2 : 0 })}</li>`).join('')}</ul>`)
        + (form ? '<p class="note">Fill in every field.</p>' : `<p class="note">Write about <b>${t.min}–${t.max} words</b>. Each point counts; so do your sentences’ grammar and variety.</p>`) + '</div>'
        + (form ? `<div><div class="form">${form.map((fd, k) => `<label for="exf${k}">${T(EXAM._.lineOf(fd.label).t)}</label><input id="exf${k}" data-f="${k}" autocomplete="off" spellcheck="false">`).join('')}</div></div></div>`
          : `<div><textarea spellcheck="false" placeholder="Write in ${E(EXAM.LANGNAME[L()] || 'the language')}…"></textarea><div style="display:flex;align-items:center;gap:8px;margin-top:4px"><span class="count">0 words</span></div></div></div>`);
      wireEN(f.body);
      f.body.querySelectorAll('canvas[data-pic]').forEach(cv => { try { drawPic(cv.dataset.pic, cv); } catch (e) { /* */ } });
      const ta = f.body.querySelector('textarea'), cnt = f.body.querySelector('.count'), fields = [...f.body.querySelectorAll('[data-f]')];
      const value = () => (form ? fields.map(x => x.value.trim()).join('\n') : ta.value.trim());
      if (isC() && CJK.mode(L()) === 'chars' && CJK.attachIME) try { if (ta) CJK.attachIME(ta); fields.forEach(x => CJK.attachIME(x)); } catch (e) { /* */ }
      const upd = () => { if (!ta) return; const w = countWords(ta.value); cnt.textContent = `${w} word${w === 1 ? '' : 's'} (${t.min}–${t.max})`; cnt.classList.toggle('ok', w >= t.min && w <= t.max * 1.5); };
      if (ta) { ta.oninput = upd; setTimeout(() => ta.focus(), 60); } else setTimeout(() => fields[0] && fields[0].focus(), 60);
      // the source's recording
      let ctl = null, splays = srcPlays;
      if (src) {
        for (const [who, v] of Object.entries(src.voices || {})) try { SPEECH.speaker('ex.' + who, { pitch: v.pitch != null ? v.pitch : 1, rate: (v.rate || 1) * (band <= 2 ? 0.86 : 1) }); } catch (e) { /* */ }
        const pb = f.body.querySelector('[data-src]'), left = f.body.querySelector('.play .left'), now = f.body.querySelector('.play .now');
        pb.onclick = () => {
          if (ctl || splays <= 0) return;
          splays--; left.textContent = splays ? `${splays} play${splays > 1 ? 's' : ''} left` : 'no plays left'; pb.disabled = true;
          ctl = SPEECH.play((src.lines || []).map(l => ({ text: l.text, who: 'ex.' + l.who })), { lang: L(), gap: 0.3, onLine: (j, l) => { now.textContent = j >= 0 && l ? `🔊 ${nameOf(src, String(l.who).replace(/^ex\./, ''))}` : ''; } });
          ctl.done.then(r => { ctl = null; now.textContent = ''; pb.disabled = splays <= 0; if (!r.ok && !r.stopped) { now.textContent = 'No voice here: the words are below.'; showScript(); } });
        };
        const showScript = () => { const d = document.createElement('div'); d.className = 'script'; d.innerHTML = (src.lines || []).map(l => `<p><span class="spk">${E(nameOf(src, l.who))}</span>${T(l.text)}</p>`).join(''); pb.parentNode.after(d); };
        if (typeof SPEECH === 'undefined') showScript(); else if (!X.auto) SPEECH.ready().then(() => { if (!SPEECH.has(L())) showScript(); });
      }
      const hand = document.createElement('button'); hand.className = 'btn main'; hand.textContent = i === n - 1 ? 'Hand in ▸' : 'Hand in, next task ▸';
      f.foot.appendChild(hand);
      let finished = false;
      const finish = () => {
        if (finished) return; finished = true;          // (a double click hands it in once)
        if (ctl) { try { ctl.stop(); } catch (e) { /* */ } ctl = null; }
        const text = value(), g = EXAM.grade.write(text, t, band, L());
        st.tasks.push({ id: t.id, slotOf: t.slotOf || null, text, score: g.score, points: g.points, acc: g.acc, range: g.range, len: g.len, words: g.words, zero: g.zero, fixed: g.fixed, tips: g.tips, errors: (g.errors || []).slice(0, 24).map(compactErr) });
        keys(null); resolve('next');
      };
      hand.onclick = () => {
        if (form) { const empty = fields.filter(x => !x.value.trim()).length; if (empty && !hand.dataset.sure) { hand.dataset.sure = '1'; f.note.innerHTML = `<span class="warn">${empty} field${empty > 1 ? 's are' : ' is'} empty. Press again to hand it in anyway.</span>`; return; } snd('page'); finish(); return; }
        const w = countWords(ta.value);
        if (w < t.min && !hand.dataset.sure) { hand.dataset.sure = '1'; f.note.innerHTML = `<span class="warn">${w} of at least ${t.min} words. Press again to hand it in anyway.</span>`; return; }
        snd('page'); finish();
      };
      f.x.onclick = async () => { if (ctl) { try { ctl.stop(); } catch (e) { /* */ } } if (await confirmQuit(f)) { keys(null); resolve('quit'); } };
      keys(e => { if (e.code === 'Escape') { f.x.onclick(); return true; } return false; });
      if (TM) { TM.attach(f); TM.cur = () => finish(); }
      const how = autoFor('write');
      if (how) setTimeout(() => {
        const v = how === 'model' ? (t.model ? t.model.t : '') : how === 'weak' ? (t.weak || '') : how === 'english' ? (t.model ? t.model.en : 'I am fine.') : idkText();
        if (form) { const vs = String(v).split('\n'); fields.forEach((x, k) => { x.value = vs[k] || ''; }); } else ta.value = v;
        X.last = { part: 'write', task: t.id }; if (X.stopAt === t.id) return upd(); finish();
      }, 10);
    });
  }
  const linesOfHTML = x => EXAM._.linesOf(x).map(l => `<div class="head">${lineHTML(l)}</div>`).join('');

  // ------------------------------------------------------------ Speaking: the examiner asks, you answer (TALK.judge, no help)
  function speakPart(att, sec, st, TM) {
    return new Promise(resolve => {
      const band = att.band || 1;
      let timeOver = false, lastTask = null;
      const f = frame({ title: titleOf(att), sub: secName(sec), steps: steps(att, sec), xTitle: 'Leave the exam' });
      f.body.innerHTML = `<div class="talk"><div class="who"><canvas width="264" height="264"></canvas><b>${T(ex().name || '')}</b><small>${E(ex().en || 'the examiner')}</small></div><div class="log"></div></div>`;
      try { TALKUI.face(f.body.querySelector('.who canvas'), ex().look || null, null); } catch (e) { /* */ }
      const log = f.body.querySelector('.log');
      f.foot.innerHTML = `<div class="say-row" style="flex:1;margin:0"><input class="say-in" autocomplete="off" spellcheck="false" placeholder="Answer in ${E(EXAM.LANGNAME[L()] || 'the language')}, in whole sentences…"><button class="btn main" type="button">Answer</button></div>`;
      const inp = f.foot.querySelector('.say-in'), btn = f.foot.querySelector('button');
      if (isC() && CJK.mode(L()) === 'chars' && CJK.attachIME) try { CJK.attachIME(inp); } catch (e) { /* */ }
      let waitR = null, quit = false;
      const add = (cls, html) => { const d = document.createElement('div'); d.className = 'm ' + cls; d.innerHTML = html; log.appendChild(d); wireEN(d); d.scrollIntoView({ block: 'end' }); return d; };
      const them = async (ln, o = {}) => { if (!ln) return; add('them', lineHTML(ln, { gloss: band <= 2 ? 3 : 0 })); if (o.voice !== false) await speak(ln.t, 'examiner', band); else await sleep(200); };
      const input = () => new Promise(r => { waitR = r; inp.disabled = false; btn.disabled = false; setTimeout(() => inp.focus(), 30); });
      const send = () => { const v = inp.value.trim(); if (!v || !waitR) return; const r = waitR; waitR = null; inp.value = ''; inp.disabled = true; btn.disabled = true; r(v); };
      btn.onclick = send; inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); } };
      f.x.onclick = async () => { if (await confirmQuit(f)) { quit = true; keys(null); if (waitR) { const r = waitR; waitR = null; r(null); } resolve(false); } };
      keys(e => { if (e.code === 'Escape') { f.x.onclick(); return true; } return false; });
      inp.disabled = true; btn.disabled = true;
      // (C, timed: when the section's time is up, the talk finishes the turn it's on, and the examiner closes)
      if (TM) { TM.attach(f); TM.cur = () => { timeOver = true; }; }
      const how = autoFor('speak');
      (async () => {
        try {
          await them(EXAM._.says('speakIntro'));
          for (let i = 0; i < sec.tasks.length && !quit; i++) {
            if (timeOver) break;
            const tn = EXAM._.resolve(EXAM.task(sec.tasks[i], att.lang), att); if (!tn) continue;
            // (C: a new task of the format: its name, and its card again: the topic, the photo, the situation)
            if (tn.tarea && tn.tarea !== lastTask) { lastTask = tn.tarea; if (!(tn.card && tn.card.title)) add('sys', `<b>${E(typeof MOCKUI !== 'undefined' ? MOCKUI.taskName(att, tn.tarea) : 'Task ' + tn.tarea)}</b>`); }
            if (tn.card && typeof MOCKUI !== 'undefined') { const d = add('them', MOCKUI.cardHTML(tn)); d.querySelectorAll('canvas[data-pic]').forEach(cv => { try { drawPic(cv.dataset.pic, cv); } catch (e) { /* */ } }); d.querySelectorAll('canvas[data-icon]').forEach(cv => { try { ICONS.draw(cv, cv.dataset.icon); } catch (e) { /* */ } }); }
            for (const ln of tn.ask || []) { await them(ln); if (quit) return; }
            if (tn.pic) { const cv = document.createElement('canvas'); cv.width = 480; cv.height = 300; cv.className = 'pic'; drawPic(tn.pic, cv); const d = add('them', ''); d.appendChild(cv); }
            if (tn.goal) add('sys', `<span class="goal">✎ ${E(tn.goal)}</span>`);
            const rec = { id: tn.id, tries: [], s: 0, grade: null, understood: false };
            for (let tr = 0; tr < 2 && !quit; tr++) {
              let text;
              while (how && X.stopAt === tn.id && !quit) await new Promise(r => setTimeout(r, 200));      // (tests: hold here for a screenshot)
              if (how) { await sleep(10); text = how === 'model' ? (tn.model ? tn.model.t : '') : how === 'english' || how === 'weak' ? (tn.model ? tn.model.en : 'I don’t know') : idkText(); X.last = { part: 'speak', task: tn.id }; }
              else text = await input();
              if (text == null || quit) return;
              add('me', T(text)); rec.tries.push(text);
              const g = EXAM.grade.turn(text, tn, band, L());
              if (g.understood) {
                Object.assign(rec, { text, s: g.s, grade: g.grade, understood: true, fixed: g.fixed && g.fixed !== text ? g.fixed : '', tips: ((g.r && g.r.errors) || []).filter(e => !e.free).map(e => e.tip).filter(Boolean), errors: ((g.r && g.r.errors) || []).slice(0, 12).map(compactErr) });
                break;
              }
              rec.text = text;
              if (tr === 0) await them(tn.simpler || EXAM._.says('again'));
              else await them(EXAM._.says('moveOn'));
            }
            st.turns.push(rec);
            if (rec.understood && i < sec.tasks.length - 1) await them(EXAM._.says('ack'));
          }
          if (quit) return;
          await them(EXAM._.says('speakEnd'));
          await sleep(500);
          keys(null); resolve(true);
        } catch (e) { console.error('[exam] speaking', e); keys(null); resolve(false); }
      })();
    });
  }
  // ------------------------------------------------------------ the results: the total, a stamp per part, the cheer, what to practice
  const PART_WHERE = {
    listen: 'The radio (on the inn’s terrace and in the library), people chatting in town (E: Listen) and voice notes on the phone.',
    read: 'Alba’s library: start with a book a level below this one, and tap the words you don’t know. Noa’s diary pages too.',
    write: 'Answer in longer sentences when you talk freely, and tell the library’s books back in your own words. Each writing task wants all three of its points.',
    speak: 'Talk freely with Doña Rosa, Bruno and Marta: each rank is a conversation one level harder. Whole sentences, a reason, a detail.',
  };
  const stampsHTML = att => `<div class="stamps">${att.sections.map(s => { const v = (att.scores || {})[s.id] || 0, low = v < (s.min != null ? s.min : 10); return `<div class="stamp ${low ? 'low' : ''}"><div><i>${(EXAM.PART[s.part] || {}).icon || ''}</i><b>${fmt(v)}/${s.max || 25}</b><small>${E(secName(s))}</small></div></div>`; }).join('')}</div>`;
  function practiceHTML(att) {
    const weak = att.sections.filter(s => ((att.scores || {})[s.id] || 0) < 0.6 * (s.max || 25));
    let h = '';
    if (weak.length) h += `<h3>What to practice</h3><ul>${weak.map(s => `<li><b>${E(secName(s))} ${fmt(att.scores[s.id])}/${s.max || 25}:</b> ${E(PART_WHERE[s.part] || '')}</li>`).join('')}</ul>`;
    if ((att.missed || []).length) h += `${weak.length ? '' : '<h3>What to practice</h3>'}<p class="note" style="margin:6px 0 0"><b>Words you missed</b>, now in your flashcards (${E(keyName('cards', 'F'))}):</p><div class="wchips">${att.missed.map(w => `<span>${T(w.t)}<i>${E(w.en || '')}</i></span>`).join('')}</div>`;
    if ((att.grammar || []).length) h += `<p class="note" style="margin:8px 0 2px"><b>Grammar slips</b> in your writing and speaking:</p><ul>${att.grammar.map(g => `<li><b>${E(GRAM[g.code] || g.code)}</b> ×${g.n}${g.tips.length ? `: ${E(g.tips[0])}` : ''}<br><span class="note">${E(g.where)}</span></li>`).join('')}</ul>`;
    return h ? `<div class="prac">${h}</div>` : '';
  }
  const GRAM = { tense: 'Tenses', conj: 'Verb endings', agree: 'Agreement', article: 'Articles', serestar: 'ser / estar', gustar: 'gustar', prep: 'Prepositions', contract: 'Contractions', order: 'Word order', case: 'Cases',
    aux: 'haben / sein', sep: 'Separable verbs', measure: 'Measure words', particle: 'Particles', adj: 'Adjectives', polite: 'Polite forms', neg: 'Negation', qword: 'Questions', want: 'The task’s points', spell: 'Spelling', other: 'Other slips' };
  const keyName = (a, fb) => { try { return KEYS.name((KEYS.map[a] || [])[0]) || fb; } catch (e) { return fb; } };
  // a pass that isn't your first: the certificate (and the level page's shelf) keep your best passing attempt, with its date
  function certLine(att) {
    const cf = EXAM.state.certs[att.band];
    if (!cf || cf.att === att.id) return `<div class="gift">🎓 ${E(B[att.band])} certificate: your best result now, on your journal’s level page</div>`;
    return `<div class="gift">🎓 Your ${E(B[att.band])} certificate keeps your best result: ${fmt(cf.total)}/100, ${dateIn(cf.at, 'en')}</div>`;
  }
  // the results, and back to them after the review or the certificate
  async function results(att) {
    for (let guard = 0; guard < 40; guard++) {
      const v = await resultsOnce(att);
      if (v === 'review') { await review(att); continue; }
      if (v === 'cert') { await cert(att.band, { inside: true }); continue; }
      return v;
    }
    return 'close';
  }
  function resultsOnce(att) {
    return new Promise(resolve => {
      const f = frame({ title: titleOf(att), sub: 'Results', steps: steps(att, null) });
      // (C: a practice paper's report, shaped like its format's real one)
      if (att.kind === 'mock' && typeof MOCKUI !== 'undefined') {
        f.body.innerHTML = MOCKUI.reportHTML(att) + practiceHTML(att);
        wireEN(f.body); snd(att.passedIt ? 'learned' : 'review');
        const rv = document.createElement('button'); rv.className = 'btn'; rv.textContent = 'Review your answers';
        const fl = document.createElement('button'); fl.className = 'btn'; fl.textContent = '📇 Practice the words now'; if (!(att.missed || []).length || typeof FLASH === 'undefined') fl.className += ' hidden';
        const cl = document.createElement('button'); cl.className = 'btn main'; cl.textContent = 'Close';
        f.foot.append(rv, fl, cl);
        const done = v => { keys(null); resolve(v); };
        rv.onclick = () => done('review'); cl.onclick = () => done('close'); f.x.onclick = () => done('close');
        fl.onclick = () => { done('flash'); setTimeout(() => { try { FLASH.open(); } catch (e) { /* */ } }, 80); };
        keys(e => { if (e.code === 'Escape' || e.code === 'Enter') done('close'); else return false; });
        if (X.auto && !X.holdResults) setTimeout(() => done('close'), 10);
        return;
      }
      const pass = att.passedIt, rw = att.reward;
      const said = EXAM._.says(pass ? 'pass' : 'fail');
      const cheer = pass ? `${mimo()} bounces off the bench and spins in the air: it knew you could do it!` : `${mimo()} hops over and leans on your arm. Not yet, but it’s close. Next time!`;
      f.body.innerHTML = `<div class="res"><div class="big">${fmt(att.total)}<small> / 100</small></div><div class="verdict ${pass ? '' : 'no'}">${pass ? E(P(word('passed', 'PASSED'))) : E(P(word('notYet', 'NOT YET')))}</div>`
        + `${pass ? '' : `<p class="note">${E(att.why || '')}</p>`}${stampsHTML(att)}`
        + (said ? `<div class="bub" style="max-width:640px;margin:0 auto 8px;text-align:left">${lineHTML(said)}</div>` : '')
        + `<div class="cheer"><canvas width="128" height="128"></canvas><span>${E(cheer)}</span></div>`
        + (rw ? `<div class="gift">🎓 ${E(B[att.band])} certificate · title «${E(rw.title)}»${rw.cos ? ` · for ${E(mimo())}: ${E(rw.cos)} (switch it on or off on the journal’s People page)` : ''} · 🪙 ${rw.coins}</div>` : pass ? certLine(att) : '')
        + practiceHTML(att) + '</div>';
      wireEN(f.body);
      try { TALKUI.mimoFace(f.body.querySelector('.cheer canvas')); } catch (e) { /* */ }
      if (said) speak(said.t, 'examiner', att.band);
      snd(pass ? 'learned' : 'review');
      const rv = document.createElement('button'); rv.className = 'btn'; rv.textContent = 'Review your answers';
      const cc = document.createElement('button'); cc.className = 'btn'; cc.textContent = '🎓 The certificate'; if (!pass) cc.className += ' hidden';
      const fl = document.createElement('button'); fl.className = 'btn'; fl.textContent = '📇 Practice the words now'; if (!(att.missed || []).length || typeof FLASH === 'undefined') fl.className += ' hidden';
      const cl = document.createElement('button'); cl.className = 'btn main'; cl.textContent = 'Close';
      f.foot.append(rv, cc, fl, cl);
      const done = v => { keys(null); resolve(v); };
      rv.onclick = () => done('review');
      cc.onclick = () => done('cert');
      fl.onclick = () => { done('flash'); setTimeout(() => { try { FLASH.open(); } catch (e) { /* */ } }, 80); };
      cl.onclick = () => done('close'); f.x.onclick = () => done('close');
      keys(e => { if (e.code === 'Escape' || e.code === 'Enter') done('close'); else return false; });
      if (X.auto && !X.holdResults) setTimeout(() => done('close'), 10);
    });
  }

  // ------------------------------------------------------------ the review: every answer, the right ones, the fixes in red
  function review(att) {
    return new Promise(resolve => {
      const f = frame({ title: titleOf(att), sub: 'Review', steps: steps(att, null) });
      let h = '';
      for (const sec of att.sections) {
        const res = att.res[sec.id]; if (!res) continue;
        h += `<h2 style="margin-top:12px">${(EXAM.PART[sec.part] || {}).icon || ''} ${E(secName(sec))} <small style="font-size:16px;opacity:.7">${fmt(res.score)}/${sec.max || 25}</small></h2>`;
        sec.tasks.forEach((id, ti) => {
          let t = EXAM._.resolve(EXAM.task(id, att.lang), att); if (!t) return;
          if (sec.part === 'listen' || sec.part === 'read' || sec.kind === 'items') {
            h += `<div class="box" style="margin-bottom:10px"><div class="tk-h"><span class="k">${att.kind === 'mock' && t.tarea && typeof MOCKUI !== 'undefined' ? E(MOCKUI.taskName(att, t.tarea)) : ti + 1}</span>${t.title ? `<span class="tl" style="font-size:17px">${T(t.title.t)}</span>` : ''}</div>`;
            const cl = t.clips && t.clips.length ? t.clips : [{ label: null, lines: t.lines || [] }];
            h += sec.part === 'listen' ? `<div class="script">${cl.map(c => (c.label ? `<p><b>${T(c.label.t)}</b></p>` : '') + c.lines.map(l => `<p><span class="spk">${E(nameOf(t, l.who))}</span>${lineHTML({ t: l.text, en: l.en })}</p>`).join('')).join('')}</div>`
              : `<div style="margin-bottom:8px">${readHTML(t, true)}</div>`;
            for (const it of t.items || []) {
              const r = (res.items || []).find(x => x.task === id && x.k === it.k) || {};
              h += `<div class="rv-it">${r.s >= 1 ? '<span class="ok">✓</span>' : r.s > 0 ? '<span class="ok">½</span>' : '<span class="bad">✗</span>'} ${it.raw && it.raw.icon ? `<canvas width="88" height="88" data-icon="${E(it.raw.icon)}" style="width:36px;height:36px;vertical-align:middle"></canvas> ` : ''}${T((it.type === 'gap' && it.text ? it.text : it.ask || {}).t || '')} →${answerHTML(it, r.a)}${r.s >= 1 ? '' : ` <span class="note">(right: ${answerHTML(it, it.type === 'short' ? it.model : it.key)})</span>`}</div>`;
            }
            h += '</div>';
          } else if (sec.part === 'write') {
            // (C: the task you chose of two; a form's fields one by one; Celpe-Bras's 0–5)
            const r = (res.tasks || []).find(x => x.id === id || x.slotOf === id) || {};
            if (r.id && r.id !== id) { const t2 = EXAM._.resolve(EXAM.task(r.id, att.lang), att); if (t2) t = t2; }
            const holo = att.kind === 'mock' && typeof MOCK !== 'undefined' && MOCK.F[att.format] && (MOCK.at(MOCK.F[att.format].pass, att.level) || MOCK.F[att.format].pass).kind === 'bands';
            h += `<div class="box" style="margin-bottom:10px"><div class="tk-h"><span class="k">${att.kind === 'mock' && t.tarea && typeof MOCKUI !== 'undefined' ? E(MOCKUI.taskName(att, t.tarea)) : ti + 1}</span>${t.title ? `<span class="tl" style="font-size:17px">${T(t.title.t)}</span>` : ''}<span class="note">${holo ? `${fmt(MOCK.holistic(r))} / 5` : `${fmt(r.score || 0)} / 12.5`}</span></div>`;
            if (t.form) {
              const vals = String(r.text || '').split('\n');
              h += `<ul class="pts rv" style="margin:4px 0">${t.form.map((fd, k) => `<li style="list-style:none">${(r.points || [])[k] ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>'} ${T(EXAM._.lineOf(fd.label).t)}${/[:?？：]\s*$/.test(EXAM._.lineOf(fd.label).t) ? ' ' : ': '}<b>${T(vals[k] || '—')}</b></li>`).join('')}</ul>`
                + (t.model ? `<p class="note"><b>A model answer:</b> ${T(String(t.model.t).split('\n').join(' · '))}</p>` : '') + '</div>';
              return;
            }
            h += `<ul class="pts rv" style="margin:4px 0">${(t.points || []).map((p, k) => `<li style="list-style:none">${(r.points || [])[k] ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>'} ${T(p.t.t)} <span class="note">${E(p.t.en)}</span></li>`).join('')}</ul>`
              + `<p class="note">Points ${fmt(6 * (r.points || []).filter(Boolean).length / Math.max(1, (t.points || []).length))}/6 · accuracy ${fmt(r.acc || 0)}/4 · variety ${fmt(r.range || 0)}/1.5 · length ${fmt(r.len || 0)}/1 (${r.words || 0} words)${r.zero ? ` · <span class="warn">${E(ZERO[r.zero] || '')}</span>` : ''}</p>`
              + `<p><b>You wrote:</b> ${T(r.text || '—')}</p>${r.fixed && r.fixed !== r.text ? `<p class="fix"><b>Said right:</b> ${fixHTML(r.text, r.fixed)}</p>` : ''}${(r.tips || []).slice(0, 4).map(x => `<p class="note">• ${E(x)}</p>`).join('')}`
              + (t.model ? `<p class="note"><b>A model answer:</b> ${T(t.model.t)}</p>` : '') + '</div>';
          } else {
            const r = (res.turns || []).find(x => x.id === id) || {};
            h += `<div class="box" style="margin-bottom:10px">${(t.ask || []).map(l => `<p style="margin:0 0 4px">${lineHTML(l)}</p>`).join('')}`
              + `<p><b>You:</b> ${(r.tries || []).map(x => T(x)).join(' · ') || '—'} ${r.understood ? `<span class="gr ${r.grade}">${r.grade}</span> ${fmt(r.s)}/5` : '<span class="gr X">0</span> <span class="note">not understood</span>'}</p>`
              + (r.fixed ? `<p class="fix"><b>Said right:</b> ${fixHTML(r.text, r.fixed)}</p>` : '') + (r.tips || []).slice(0, 3).map(x => `<p class="note">• ${E(x)}</p>`).join('')
              + (t.model ? `<p class="note"><b>One way to say it:</b> ${T(t.model.t)}</p>` : '') + '</div>';
          }
        });
      }
      f.body.innerHTML = h; wireEN(f.body);
      f.body.querySelectorAll('canvas[data-icon]').forEach(cv => { try { ICONS.draw(cv, cv.dataset.icon); } catch (e) { /* */ } });
      const back = document.createElement('button'); back.className = 'btn main'; back.textContent = 'Done'; f.foot.appendChild(back);
      const done = () => { keys(null); resolve(); };
      back.onclick = done; f.x.onclick = done; keys(e => { if (e.code === 'Escape') done(); else return false; });
      if (X.auto && !X.holdReview) setTimeout(done, 10);
    });
  }
  const ZERO = { empty: 'nothing written', idk: '“I don’t know” isn’t an answer', short: 'too short to mark', notlang: 'not enough of it is in the language' };
  function fixHTML(orig, fixed) { try { return TALK.diffHTML(orig, fixed).html; } catch (e) { return T(fixed); } }
  function answerHTML(it, a) {
    if (a == null || a === '') return '<i class="note">no answer</i>';
    if (it.type === 'mc' || it.type === 'gap') return it.opts[a] ? T(it.opts[a].t) : '?';
    if (it.type === 'tf' || it.type === 'tfn') { const lab = it.raw && it.raw.labels ? EXAM._.linesOf(it.raw.labels) : TF(); return T((a === 'n' ? lab[2] : a ? lab[0] : lab[1]).t); }
    if (it.type === 'short') return T(a);
    if (it.type === 'match') return (Array.isArray(a) ? a : []).map((x, j) => `${T(it.left[j].t)}: ${x == null ? '?' : it.raw && it.raw.letters && it.opts[x] ? T(it.opts[x].t) : LET[x]}`).join(', ');
    { const U = UTYPES[it.type]; if (U && U.answer) return U.answer(it, a); }
    if (it.type === 'order') return (Array.isArray(a) ? a : []).map(i => T((it.opts[i] || {}).t || '')).join(' ');
    return E(String(a));
  }

  // ------------------------------------------------------------ the letter from the Academy (and any letter: EXAM.letter)
  function letter(band) {
    const c = C(), L1 = c.letter || {}, fill = s => String(s || '').replace(/\{level\}/g, B[band]).replace(/\{mimo\}/g, mimo());
    const body = EXAM._.linesOf(L1.body || []).map(l => ({ t: fill(l.t), en: fill(l.en) }));
    return letterCard({ title: L1.title ? EXAM._.lineOf(L1.title) : null, lines: body, sign: L1.sign ? EXAM._.lineOf(L1.sign) : null, band, envelope: true, from: P(word('name', 'Academy of Alba')) });
  }
  function letterCard(def = {}) {
    return new Promise(resolve => {
      const r = open();
      r.innerHTML = '<div class="ex-shade"></div><div class="ex-card" style="height:auto;max-height:calc(100vh - 20px)"><div class="ex-body"></div><div class="ex-foot"><span class="nt"></span><span class="sp"></span></div></div>';
      const body = r.querySelector('.ex-body'), foot = r.querySelector('.ex-foot'), note = r.querySelector('.nt');
      const done = () => { keys(null); try { SPEECH.stop(); } catch (e) { /* */ } close(); resolve(); };
      const paper = () => {
        snd('page');
        body.innerHTML = `<div class="lt-paper"><canvas class="seal" width="128" height="128"></canvas>${def.title ? `<p><b>${lineHTML(def.title)}</b></p>` : ''}${(def.lines || []).map(l => `<p>${lineHTML(l, { gloss: (def.band || 1) <= 2 ? 3 : 0 })}</p>`).join('')}`
          + (def.sign ? `<div class="sig">${T(def.sign.t)}</div>` : '') + '</div>';
        seal(body.querySelector('canvas.seal')); wireEN(body);
        foot.querySelectorAll('button').forEach(b => b.remove());
        const say = document.createElement('button'); say.className = 'btn'; say.textContent = '🔊 Hear it';
        say.onclick = () => { try { SPEECH.play((def.lines || []).map(l => ({ text: l.t, who: 'ex.examiner' })), { lang: L(), gap: 0.3 }); } catch (e) { /* */ } };
        const ok = document.createElement('button'); ok.className = 'btn main'; ok.textContent = 'Fold the letter'; ok.onclick = done;
        foot.append(say, ok); note.textContent = def.band ? 'The Academy is the half-timbered house at the end of the west street.' : '';
        keys(e => { if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'KeyE') done(); else return false; });
      };
      if (def.envelope && !X.fast) {
        body.innerHTML = `<div style="text-align:center"><h2>📨 ${E(def.from || 'A letter')}</h2><div class="envelope"><canvas width="600" height="380"></canvas></div><p class="note">A letter with a red seal. Open it?</p></div>`;
        envelope(body.querySelector('.envelope canvas'));
        const op = document.createElement('button'); op.className = 'btn main'; op.textContent = 'Open it'; foot.appendChild(op);
        op.onclick = paper; body.querySelector('.envelope').onclick = paper;
        keys(e => { if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') paper(); else if (e.code === 'Escape') done(); else return false; });
      } else paper();
      if (X.auto) setTimeout(done, 10);
    });
  }

  // ------------------------------------------------------------ the certificate, and the level page's shelf
  function certHTML(cf) {
    const c = C(), sig = ex().sign || ex().name || '', dl = cf.lang || L(), day = E(dateIn(cf.at, dl)), comma = dl === 'zh' ? '，' : dl === 'ja' ? '、' : ', ';
    const parts = EXAM.PARTS.map(p => { const v = (cf.scores || {})[p] || 0; return `<div class="stamp ${v < 10 ? 'low' : ''}" style="width:86px;height:86px"><div><i>${EXAM.PART[p].icon}</i><b style="font-size:17px">${fmt(v)}/25</b><small>${E(PARTEN[p])}</small></div></div>`; }).join('');
    return `<div class="cert"><canvas class="crest" width="148" height="148"></canvas><div class="c-h">${T(word('name', 'Academy of Alba'))}</div><div class="c-t">${T(word('cert', 'Certificate'))}</div><div class="note">${E(word('certEn', 'Certificate of level'))}</div>`
      + `<div class="c-lv">${B[cf.band]}</div><div class="c-title">«${E(cf.title || '')}»</div><div class="c-meta">${T(word('lang', EXAM.LANGNAME[cf.lang] || ''))} · ${fmt(cf.total)} / 100 · ${day}</div>`
      + `<div class="stamps" style="margin:10px 0 0">${parts}</div><div class="c-sig"><span>${T(word('place', 'Alba'))}${comma}${day}</span><span><span class="s">${T(sig)}</span><br>${E(ex().en || '')}</span></div></div>`;
  }
  function cert(band, o = {}) {
    return new Promise(resolve => {
      const cf = EXAM.state.certs[band]; if (!cf) return resolve();
      const r = open();
      r.innerHTML = '<div class="ex-shade"></div><div class="ex-card" style="height:auto;max-height:calc(100vh - 20px)"><div class="ex-body"></div><div class="ex-foot"><span class="nt"></span><span class="sp"></span></div></div>';
      const body = r.querySelector('.ex-body'), foot = r.querySelector('.ex-foot');
      body.innerHTML = certHTML(cf); crest(body.querySelector('canvas.crest'));
      r.querySelector('.nt').textContent = cf.n > 1 ? `Passed ${cf.n} times; this is your best.` : '';
      const ok = document.createElement('button'); ok.className = 'btn main'; ok.textContent = 'Close'; foot.appendChild(ok);
      const done = () => { keys(null); if (!o.inside) close(); resolve(); };
      ok.onclick = done; keys(e => { if (['Escape', 'Enter', 'KeyE'].includes(e.code)) done(); else return false; });
      snd('page');
      if (X.auto && !X.holdCert) setTimeout(done, 10);
    });
  }
  function shelfHTML() {
    try {
      if (typeof EXAM === 'undefined' || !EXAM.ready()) return '';
      const s = EXAM.state, lv = (() => { try { return DICT.bands().overall | 0; } catch (e) { return 0; } })();
      let h = `<div class="exs"><h4 class="ph-h">🎓 The Academy’s certificates</h4><div class="exs-row">`;
      for (let b = 1; b <= 4; b++) {
        const cf = s.certs[b], pa = EXAM.paused(b), tries = EXAM.attempts({ band: b, done: true }), best = tries.reduce((m, a) => (!m || a.total > m.total ? a : m), null);
        if (cf) { h += `<div class="exs-c pass" data-exam-cert="${b}" title="Open the certificate"><b class="lv">${B[b]}</b><span class="tt">«${E(cf.title || '')}»</span><br>${fmt(cf.total)}/100 · ${E(dateIn(cf.at, cf.lang || L()))}<div class="st">${EXAM.PARTS.map(p => `<i class="${((cf.scores || {})[p] || 0) < 10 ? 'low' : ''}">${EXAM.PART[p].icon} ${fmt((cf.scores || {})[p] || 0)}</i>`).join('')}</div></div>`; continue; }
        if (pa) { const n = pa.sections.filter(x => pa.res[x.id] && pa.res[x.id].done).length; h += `<div class="exs-c"><b class="lv">${B[b]}</b>In progress: ${n} of 4 parts done. Go on at the Academy.</div>`; continue; }
        if (best) { h += `<div class="exs-c"><b class="lv">${B[b]}</b>Best so far: ${fmt(best.total)}/100<div class="st">${best.sections.map(x => `<i class="${((best.scores || {})[x.id] || 0) < 10 ? 'low' : ''}">${(EXAM.PART[x.part] || {}).icon} ${fmt((best.scores || {})[x.id] || 0)}</i>`).join('')}</div><button data-exam-prac="${E(best.id)}">What to practice</button></div>`; continue; }
        if (EXAM.open(b)) { h += `<div class="exs-c"><b class="lv">${B[b]}</b>Open: take it at the Academy, at the end of the west street.</div>`; continue; }
        h += `<div class="exs-c lock"><b class="lv">${B[b]}</b>A letter comes when your level reaches ${B[b]}${lv ? ` (now ${B[lv]})` : ''}.</div>`;
      }
      return h + `</div><p class="note">Four parts, 25 points each; a pass is 60, with at least 10 in every part. Your answers there count toward your listening, reading, writing and speaking.</p></div>`;
    } catch (e) { console.error('[exam] shelf', e); return ''; }
  }
  // "What to practice" for an attempt (from the shelf)
  function practiceCard(id) {
    const att = EXAM._.attById(id); if (!att) return Promise.resolve();
    return new Promise(resolve => {
      const f = frame({ title: titleOf(att), sub: `${fmt(att.total)}/100 · ${dateIn(att.end || att.at, 'en')}`, steps: [] });
      f.body.innerHTML = `<div class="res">${stampsHTML(att)}${practiceHTML(att) || '<p class="note">Nothing in particular: just keep playing.</p>'}</div>`;
      const rv = document.createElement('button'); rv.className = 'btn'; rv.textContent = 'Review your answers';
      const cl = document.createElement('button'); cl.className = 'btn main'; cl.textContent = 'Close'; f.foot.append(rv, cl);
      const done = () => { keys(null); close(); resolve(); };
      rv.onclick = async () => { keys(null); await review(att); done(); }; cl.onclick = done; f.x.onclick = done;
      keys(e => { if (e.code === 'Escape') done(); else return false; });
    });
  }
  // (the level page's buttons: the journal draws it, so its clicks are caught here)
  if (typeof document !== 'undefined') document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const c = t.closest('[data-exam-cert]'), p = t.closest('[data-exam-prac]');
    if (c) { e.preventDefault(); cert(+c.dataset.examCert); } else if (p) { e.preventDefault(); practiceCard(p.dataset.examPrac); }
  });

  // ------------------------------------------------------------ D: one task anywhere (the radio quiz, a pen pal, an interview)
  // o: { band, title, skill } → { score (0..1), max: 1, part, details } (logged at the band, like the exam's parts)
  async function single(t, o = {}) {
    if (!t) return null;
    if (!EXAM.task(t.id)) EXAM.add(t.lang || L(), { tasks: [t] });
    const part = t.part || 'read', band = o.band || t.band || 1;
    const att = { id: 'd.' + Date.now().toString(36), lang: t.lang || L(), band, kind: 'world', title: { en: o.title || (t.title && t.title[1]) || 'A test' }, seed: (Date.now() & 0x7fffffff) >>> 0,
      sections: [{ id: part, part, skill: o.skill || (EXAM.PART[part] || {}).skill, title: { en: o.title || PARTEN[part] }, max: 25, min: 0, tasks: [t.id] }], res: {} };
    running = att;
    try {
      const res = await section(att, att.sections[0]);
      if (!res) return null;
      EXAM._.finishSection(att, part, res);
      return { score: (res.score || 0) / 25, max: 1, part, details: res };
    } finally { running = null; close(); }
  }

  // ------------------------------------------------------------ tests (EXAMUI._.t; the game never calls them)
  const TESTS = {
    get fast() { return X.fast; }, set fast(v) { X.fast = !!v; },
    get auto() { return X.auto; }, set auto(v) { X.auto = v || null; },
    set stopAt(v) { X.stopAt = v || null; }, set pauseAfter(v) { X.pauseAfter = v || null; }, set holdReview(v) { X.holdReview = !!v; }, set holdCert(v) { X.holdCert = !!v; }, set holdResults(v) { X.holdResults = !!v; },
    get last() { return X.last; },
    // run a whole exam with automatic answers: auto = 'model' | 'nose' | { listen, read, write, speak } ('model', 'wrong', 'nose', 'weak', 'english')
    async exam(band, auto, o = {}) { X.fast = true; X.auto = auto; X.pauseAfter = o.pauseAfter || null; try { return await (o.resume ? EXAM.resume(band) : EXAM.start(band)); } finally { X.auto = null; X.pauseAfter = null; } },
    close() { close(); },
    shelf: () => shelfHTML(),
  };

  const UTYPES = {};
  return {
    run, results, review, letter, letterCard, cert, certHTML, shelfHTML, practiceCard, single, drawPic, crest, PICS, TYPES: UTYPES,
    get isOpen() { return openN > 0; }, close: () => TESTS.close(),
    _: { t: TESTS, X, frame, lineHTML, itemHTML, autoAnswer, countWords, practiceHTML, stampsHTML, speak, get root() { return root; } },
  };
})();
