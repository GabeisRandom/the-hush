'use strict';
// «Prosa», the phone's chat app (familia.js; Portuguese games only). An original messenger: a coral header, a cream screen
// with little dots, peach bubbles for you and white ones for everyone else, each name in its own color, and read receipts
// as two tiny hearts (gray until they've read it, pink once they have). Never anyone's real app: its own name, look and marks.
// Typed Portuguese is matched through CVUI (carnaval_ui.js): no accents needed.
// One global, PRS:
//   PRS.bind(game) · PRS.art(name, draw(canvas, w, h)) (pictures and stickers, drawn on demand)
//   PRS.chat(id, { title, sub, avatar: { emoji | icon, bg }, members }) → the chat (its messages live in chat.msgs)
//   PRS.open(id?) / PRS.close() / PRS.show(id) / PRS.list()     the phone on screen: a chat, or the list of chats
//   PRS.post(id, msg) (async: "…digitando", then the message) · PRS.push(id, msg) (at once, e.g. history)
//        msg: { from (a member key, or 'me'), text, en, img (art name), cap, sticker (art name), audio: { pt, en, dur },
//               sys (a gray chip), day (a date chip), t (the time shown) }
//   PRS.ask(id, { kind, goal, model, modelEn, keys | check(text) → { ok, minor, why, note, said }, audio, placeholder, en })
//        → 'S'…'D' | 'quit': what you type is sent as your message (or as your áudio); two misses show the model (D)
//   PRS.listen(id, msg) (async: waits until you've played that áudio, or read its transcript)
//   PRS.callView(tiles) → { say(key, text), end() }: the video call screen
//   PRS.read(id) (your hearts turn pink) · PRS.mute(id, on) (the Hush: nobody reads, nobody's online)
//   tests: PRS.cur ({ model, submit(text) }) while it waits for you; PRS.fast skips the typing pauses
// Needs carnaval_ui.js (CVUI), core.js and icons.js; UI, Input and Sound at run time.

const PRS = (() => {
  let G = null;
  const bind = g => { G = g; };
  const esc = s => CVUI.esc(s), GR = CVUI.GR;
  // (en: the English under each message, only on request: EN starts off, DESIGN.md 17.3)
  const S = { open: false, chats: {}, cur: null, view: 'chat', fast: false, en: false, arts: {}, ask: null, members: {}, onPing: null, pending: null };
  const tick = ms => (S.fast ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };
  const clock = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const art = (name, draw) => { S.arts[name] = draw; };
  const member = (key, def) => { S.members[key] = Object.assign(S.members[key] || {}, def); return S.members[key]; };

  // ============================================================ the look
  const CSS = `
#fmph { position: fixed; inset: 0; z-index: 12; display: grid; place-items: center; font-family: "Segoe UI", "Trebuchet MS", system-ui, sans-serif; color: #2b2235; -webkit-font-smoothing: antialiased; }
#fmph.hidden, #fmph .hidden { display: none !important; } #fmph * { box-sizing: border-box; }
#fmph .sh { position: absolute; inset: 0; background: rgba(25,15,40,.42); }
#fmph .ph { position: relative; width: min(392px, calc(100vw - 20px)); height: min(740px, calc(100vh - 20px)); background: #2b2235; border-radius: 36px; padding: 11px; box-shadow: 0 0 0 3px #4a3d5c, 0 18px 40px rgba(0,0,0,.35); }
#fmph .scr { width: 100%; height: 100%; border-radius: 27px; overflow: hidden; display: flex; flex-direction: column; background: #fff6ec; position: relative; }
#fmph .sb { display: flex; justify-content: space-between; align-items: center; padding: 5px 18px 3px; font: 700 12px "Segoe UI", sans-serif; background: #ff7a59; color: #fff; }
#fmph .hdr { display: flex; align-items: center; gap: 9px; padding: 6px 10px 9px; background: #ff7a59; color: #fff; }
#fmph .hdr .bk, #fmph .hdr .x, #fmph .hdr .en { background: none; border: 0; color: #fff; font: 800 20px "Segoe UI", sans-serif; cursor: pointer; padding: 0 4px; }
#fmph .hdr .en { font-size: 12px; border: 2px solid rgba(255,255,255,.7); border-radius: 8px; padding: 1px 5px; } #fmph .hdr .en.off { opacity: .55; }
#fmph .av { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-size: 21px; background: #ffe3b0; border: 2px solid #fff; flex: 0 0 auto; overflow: hidden; }
#fmph .av canvas { width: 38px; height: 38px; }
#fmph .ttl { flex: 1; min-width: 0; } #fmph .ttl b { display: block; font: 800 16px "Segoe UI", sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } #fmph .ttl small { display: block; font-size: 11.5px; opacity: .9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#fmph .bd { flex: 1; overflow-y: auto; padding: 10px 10px 6px; background: radial-gradient(circle, rgba(255,122,89,.10) 1.3px, transparent 1.6px) 0 0 / 18px 18px, #fff6ec; }
#fmph .day, #fmph .sys { text-align: center; margin: 8px auto; } #fmph .day span, #fmph .sys span { display: inline-block; font-size: 11.5px; font-weight: 700; background: #ffe7d6; color: #8a5a48; border-radius: 9px; padding: 2px 10px; }
#fmph .m { max-width: 82%; margin: 4px 0; padding: 6px 9px 4px; border-radius: 14px; background: #fff; box-shadow: 0 1px 0 rgba(43,34,53,.12); position: relative; animation: fm-pop .22s ease-out; }
#fmph .m.me { margin-left: auto; background: #ffd9c7; border-bottom-right-radius: 4px; } #fmph .m.them { border-bottom-left-radius: 4px; }
#fmph .m .nm { display: block; font-size: 12px; font-weight: 800; margin-bottom: 1px; }
#fmph .m .tx { font-size: 15px; line-height: 1.38; white-space: pre-wrap; word-wrap: break-word; } #fmph .m .enl { display: block; font-size: 11.5px; font-style: italic; opacity: .62; margin-top: 2px; line-height: 1.3; }
#fmph .m .tm { display: block; text-align: right; font-size: 10.5px; opacity: .55; margin-top: 1px; } #fmph .m .tm i { font-style: normal; letter-spacing: -2px; margin-left: 4px; color: #b8b2c2; } #fmph .m .tm i.rd { color: #ff4f9a; }
#fmph .m canvas.pic { display: block; width: 100%; max-width: 250px; border-radius: 10px; margin: 2px 0; }
#fmph .stk { margin: 4px 0; animation: fm-pop .22s ease-out; } #fmph .stk.me { text-align: right; } #fmph .stk canvas { width: 120px; height: 120px; } #fmph .stk .nm { display: block; font-size: 12px; font-weight: 800; }
#fmph .au { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; min-width: 238px; }
#fmph .au .play { width: 34px; height: 34px; border-radius: 50%; border: 0; background: #ff7a59; color: #fff; font-size: 15px; cursor: pointer; flex: 0 0 auto; }
#fmph .au .wave { flex: 1; display: flex; align-items: center; gap: 2px; height: 26px; min-width: 110px; } #fmph .au .wave i { display: block; width: 3px; border-radius: 2px; background: #c9b8c0; } #fmph .au.played .wave i { background: #ff7a59; }
#fmph .au .dur { font-size: 11.5px; font-weight: 700; opacity: .7; } #fmph .au .spd, #fmph .au .trb { border: 1.5px solid #ff7a59; color: #ff6a4d; background: #fff; border-radius: 8px; font: 800 11px "Segoe UI", sans-serif; padding: 1px 6px; cursor: pointer; }
#fmph .au .trx { flex-basis: 100%; font-size: 13.5px; line-height: 1.4; background: #fff4ea; border-radius: 8px; padding: 5px 7px; }
#fmph .typ { font-size: 12.5px; font-style: italic; opacity: .7; padding: 2px 6px; min-height: 18px; }
#fmph .task { background: #fff; border-top: 2px solid #ffd2bd; padding: 7px 10px 6px; }
#fmph .task .k { font: 800 11px "Segoe UI", sans-serif; letter-spacing: .07em; text-transform: uppercase; color: #ff6a4d; }
#fmph .task .g { font-size: 14px; font-weight: 700; line-height: 1.35; } #fmph .task .h { font-size: 13px; min-height: 18px; line-height: 1.35; } #fmph .task .h.no { color: #d6286f; } #fmph .task .h.ok { color: #13786b; }
#fmph .task .row { display: flex; gap: 6px; margin-top: 3px; } #fmph .task .row button { font: 800 11.5px "Segoe UI", sans-serif; border: 1.5px solid #2b2235; background: #fffaf0; border-radius: 9px; padding: 1px 8px; cursor: pointer; }
#fmph .inp { display: flex; gap: 7px; padding: 7px 9px 10px; background: #fff6ec; align-items: center; }
#fmph .inp input { flex: 1; min-width: 0; font: 600 16px "Segoe UI", sans-serif; padding: 8px 12px; border: 2px solid #ffc9b3; border-radius: 20px; outline: none; background: #fff; } #fmph .inp input:focus { border-color: #ff7a59; }
#fmph .inp .send { width: 40px; height: 40px; border-radius: 50%; border: 0; background: #ff7a59; color: #fff; font: 900 18px "Segoe UI Symbol", sans-serif; cursor: pointer; flex: 0 0 auto; }
#fmph .inp .send.mic { background: #8a4fd8; }
#fmph .shake { animation: fm-shake .35s; } @keyframes fm-shake { 20% { transform: translateX(-7px); } 45% { transform: translateX(6px); } 70% { transform: translateX(-3px); } }
@keyframes fm-pop { from { transform: scale(.92); opacity: 0; } to { transform: none; opacity: 1; } }
#fmph .gr { display: inline-block; font: 900 13px Bahnschrift, sans-serif; color: #fff; border: 2px solid #2b2235; border-radius: 99px; padding: 0 8px; margin-right: 5px; }
#fmph .gr.cv-S { background: #e0a020; } #fmph .gr.cv-A { background: #21a493; } #fmph .gr.cv-B { background: #3f7fc9; } #fmph .gr.cv-C { background: #8a5ab0; } #fmph .gr.cv-D { background: #8a8f9e; }
#fmph .lst { flex: 1; min-height: 0; overflow-y: auto; background: #fff; }
#fmph .lst .row1 { display: flex; gap: 10px; align-items: center; padding: 9px 10px; border-bottom: 1px solid #ffe2d3; cursor: pointer; background: #fff; } #fmph .lst .row1:hover { background: #fff1e8; }
#fmph .lst .row1 .ttl b { font-size: 15px; } #fmph .lst .row1 .ttl small { font-size: 12.5px; opacity: .7; } #fmph .lst .row1 .badge { background: #ff4f9a; color: #fff; border-radius: 99px; font: 800 11px "Segoe UI", sans-serif; padding: 1px 7px; }
#fmph .lst .row1.gray { filter: grayscale(.9); opacity: .7; } #fmph .lst .row1.want { box-shadow: inset 4px 0 0 #ff7a59; }
#fmph .call { flex: 1; min-height: 0; position: relative; background: linear-gradient(#3b2f52, #2b2235); display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 6px; padding: 34px 8px 8px; }
#fmph .call .tile { position: relative; border-radius: 16px; background: #4a3d5c; display: grid; place-items: center; overflow: hidden; border: 2px solid transparent; }
#fmph .call .tile canvas { width: 86px; height: 86px; } #fmph .call .tile b { position: absolute; left: 8px; bottom: 6px; color: #fff; font: 800 12px "Segoe UI", sans-serif; }
#fmph .call .tile.talk { border-color: #ffd23f; } #fmph .call .tile .bub { position: absolute; top: 6px; left: 6px; right: 6px; background: #fff; border-radius: 10px; font-size: 12px; font-weight: 700; padding: 3px 6px; animation: fm-pop .2s; }
#fmph .call .ctop { position: absolute; top: 12px; left: 0; right: 0; text-align: center; color: #fff; font: 800 14px "Segoe UI", sans-serif; }
body.fm-open #objective, body.fm-open #counters, body.fm-open #help, body.fm-open #compass, body.fm-open #minimap, body.fm-open .bubble, body.fm-open #thought, body.fm-open .prompt { display: none !important; }
`;
  function css() { if (document.getElementById('fm-css')) return; const s = document.createElement('style'); s.id = 'fm-css'; s.textContent = CSS; document.head.appendChild(s); }
  const D = { root: null };
  function dom() {
    if (D.root) return D;
    css();
    const r = document.createElement('div'); r.id = 'fmph'; r.className = 'hidden';
    r.innerHTML = `<div class="sh"></div><div class="ph"><div class="scr"><div class="sb"><span class="clk">08:02</span><span>Prosa</span><span>▮▮▮ 87%</span></div>
<div class="hdr"><button class="bk" title="Chats">‹</button><div class="av"></div><div class="ttl"><b></b><small></small></div><button class="en" title="English under each message">EN</button><button class="x" title="Close (Esc)">✕</button></div>
<div class="bd"></div><div class="lst hidden"></div><div class="typ"></div>
<div class="task hidden"><div class="k"></div><div class="g"></div><div class="h"></div><div class="row"><button class="idk">I don’t know (?)</button><button class="hint">Hint (Tab)</button></div></div>
<div class="inp"><input spellcheck="false" placeholder="Mensagem…"><button class="send" title="Send">➤</button></div></div></div>`;
    document.body.appendChild(r);
    const q = s => r.querySelector(s);
    Object.assign(D, { root: r, scr: q('.scr'), clk: q('.clk'), bk: q('.bk'), av: q('.av'), ttl: q('.ttl b'), sub: q('.ttl small'), en: q('.en'), x: q('.x'), bd: q('.bd'), lst: q('.lst'), typ: q('.typ'),
      task: q('.task'), tk: q('.task .k'), tg: q('.task .g'), th: q('.task .h'), idk: q('.task .idk'), hint: q('.task .hint'), inp: q('.inp'), input: q('.inp input'), send: q('.inp .send') });
    D.x.onclick = () => close(true);
    D.bk.onclick = () => { if (!S.ask) list(); };
    D.en.onclick = () => { S.en = !S.en; D.en.classList.toggle('off', !S.en); if (S.cur && S.view === 'chat') render(S.cur); };
    const sub = () => { const t = D.input.value; if (S.ask) S.ask.submit(t); };
    D.send.onclick = sub;
    D.input.addEventListener('keydown', e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter') { e.preventDefault(); sub(); } });
    D.idk.onclick = () => S.ask && S.ask.idk(); D.hint.onclick = () => S.ask && S.ask.hint();
    return D;
  }
  let keys = null;
  function open(id) {
    dom(); D.root.classList.remove('hidden'); document.body.classList.add('fm-open'); S.open = true; Input.typing = true;
    if (G) { G.state.teaching = true; G.prompt = null; }
    if (keys) removeEventListener('keydown', keys, true);
    keys = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (S.ask) S.ask.quit(); else close(true); } else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (S.ask) S.ask.hint(); } };
    addEventListener('keydown', keys, true);
    D.clk.textContent = clock(); D.en.classList.toggle('off', !S.en);
    if (id) show(id); else list();
    setTimeout(() => D.input.focus(), 50);
  }
  function close(byYou) {
    if (!D.root) return;
    if (S.ask && byYou) { S.ask.quit(); return; }
    D.root.classList.add('hidden'); document.body.classList.remove('fm-open'); S.open = false; Input.typing = false;
    if (keys) { removeEventListener('keydown', keys, true); keys = null; }
    if (G) G.state.teaching = false;
    try { speechSynthesis.cancel(); } catch (e) { /* */ }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (S.onClose) { const f = S.onClose; S.onClose = null; f(); }
  }
  // ============================================================ chats and messages
  function chat(id, def) { const c = S.chats[id] || (S.chats[id] = { id, msgs: [], unread: 0 }); if (def) Object.assign(c, def); return c; }
  function avatar(el, a) {
    el.innerHTML = ''; el.style.background = (a && a.bg) || '#ffe3b0';
    if (a && a.icon && typeof ICONS !== 'undefined') { const cv = document.createElement('canvas'); cv.width = cv.height = 76; ICONS.draw(cv, a.icon); el.appendChild(cv); } else el.textContent = (a && a.emoji) || '💬';
  }
  function header(c) {
    avatar(D.av, c.avatar); D.ttl.textContent = c.title || ''; D.sub.textContent = c.muted ? (c.mutedSub || '') : (c.sub || (c.members || []).map(k => (S.members[k] || {}).name || k).join(', '));
    D.bk.classList.remove('hidden');
  }
  const waveBars = n => Array.from({ length: n }, (_, i) => `<i style="height:${6 + Math.round(Math.abs(Math.sin(i * 1.7) * 14 + Math.sin(i * 0.37) * 6))}px"></i>`).join('');
  function msgHTML(c, m, i) {
    if (m.day) return `<div class="day"><span>${esc(m.day)}</span></div>`;
    if (m.sys) return `<div class="sys"><span>${esc(m.sys)}</span></div>`;
    const me = m.from === 'me', who = S.members[m.from] || { name: m.from, color: '#8a5a48' };
    const nm = !me && (c.members || []).length > 1 ? `<b class="nm" style="color:${who.color || '#8a5a48'}">${esc(who.name || '')}</b>` : '';
    const en = S.en && m.en ? `<span class="enl">${esc(m.en)}</span>` : '';
    const tm = `<span class="tm">${esc(m.t || '')}${me ? `<i class="${m.read && !c.muted ? 'rd' : ''}">♥♥</i>` : ''}</span>`;
    if (m.sticker) return `<div class="stk ${me ? 'me' : 'them'}">${nm}<canvas data-art="${esc(m.sticker)}" width="240" height="240"></canvas></div>`;
    if (m.audio) {
      const a = m.audio;
      return `<div class="m ${me ? 'me' : 'them'} au ${m.played ? 'played' : ''}" data-i="${i}">${nm ? nm.replace('class="nm"', 'class="nm" style="flex-basis:100%"') : ''}<button class="play" title="Play">${m.playing ? '■' : '▶'}</button><div class="wave">${waveBars(28)}</div><span class="dur">${esc(a.dur || '0:12')}</span>${me ? '' : `<button class="spd" title="Speed">${m.spd || '1x'}</button><button class="trb">Transcrição</button>`}`
        + `<div class="trx ${m.tr || me ? '' : 'hidden'}">${esc(a.pt)}${S.en && a.en ? `<span class="enl">${esc(a.en)}</span>` : ''}</div>${tm}</div>`;
    }
    const pic = m.img ? `<canvas class="pic" data-art="${esc(m.img)}" width="500" height="${m.imgH || 380}"></canvas>` : '';
    return `<div class="m ${me ? 'me' : 'them'}">${nm}${pic}${m.text ? `<div class="tx">${esc(m.text)}</div>` : ''}${en}${tm}</div>`;
  }
  function paintArts(root) {
    root.querySelectorAll('canvas[data-art]').forEach(cv => { if (cv._done) return; cv._done = true; const f = S.arts[cv.dataset.art]; if (f) { try { f(cv.getContext('2d'), cv.width, cv.height); } catch (e) { console.warn('[prosa] art', e); } } });
  }
  function render(id) {
    const c = chat(id); if (!D.root) return;
    D.bd.innerHTML = c.msgs.map((m, i) => msgHTML(c, m, i)).join('');
    paintArts(D.bd); wireAudio(c); D.bd.scrollTop = 1e6;
  }
  function append(c, m) {
    if (!D.root || S.cur !== c.id || S.view !== 'chat') return;
    const wrap = document.createElement('div'); wrap.innerHTML = msgHTML(c, m, c.msgs.length - 1);
    const el = wrap.firstElementChild; D.bd.appendChild(el); paintArts(el); wireAudio(c, el); D.bd.scrollTop = 1e6;
  }
  function show(id) {
    dom(); const c = chat(id); S.cur = id; S.view = 'chat'; c.unread = 0;
    D.lst.classList.add('hidden'); D.bd.classList.remove('hidden'); D.inp.classList.remove('hidden');
    header(c); render(id);
  }
  // the list of chats (o: { want: id to point at, gray: [ids] })
  function list(o = {}) {
    dom(); S.view = 'list'; D.bd.classList.add('hidden'); D.lst.classList.remove('hidden'); D.typ.textContent = ''; D.inp.classList.add('hidden');
    if (o.task) { D.task.classList.remove('hidden'); D.tk.textContent = o.task[0]; D.tg.innerHTML = o.task[1]; D.th.textContent = ''; D.idk.classList.add('hidden'); D.hint.classList.add('hidden'); } else if (!S.ask) D.task.classList.add('hidden');
    D.ttl.textContent = 'Prosa'; D.sub.textContent = 'Conversas'; avatar(D.av, { emoji: '💬', bg: '#fff' }); D.bk.classList.add('hidden');
    const ids = Object.keys(S.chats).filter(k => !S.chats[k].hidden);
    D.lst.innerHTML = ids.map(k => { const c = S.chats[k], last = [...c.msgs].reverse().find(m => !m.day && !m.sys), lt = last ? (last.text || (last.audio ? '🎤 Áudio' : last.sticker ? 'Figurinha' : last.img ? '📷 Foto' : '')) : '';
      return `<div class="row1 ${c.muted ? 'gray' : ''} ${o.want === k ? 'want' : ''}" data-id="${esc(k)}"><div class="av" data-av="${esc(k)}"></div><div class="ttl"><b>${esc(c.title || k)}</b><small>${esc(c.muted ? (c.mutedSub || '') : lt).slice(0, 60)}</small></div>${c.unread ? `<span class="badge">${c.unread}</span>` : ''}</div>`; }).join('');
    D.lst.querySelectorAll('.av[data-av]').forEach(el => avatar(el, S.chats[el.dataset.av].avatar));
    D.lst.querySelectorAll('.row1').forEach(el => { el.onclick = () => { if (S.pick) { const f = S.pick; S.pick = null; f(el.dataset.id); } else if (!S.ask) show(el.dataset.id); }; });
  }
  // wait for you to pick a chat in the list (→ its id; tests: PRS.cur.submit(id))
  function pickChat(o = {}) {
    list(o);
    const fin = id => { S.cur2 = null; D.task.classList.add('hidden'); D.idk.classList.remove('hidden'); D.hint.classList.remove('hidden'); return id; };
    return new Promise(res => { S.pick = id => res(fin(id)); S.cur2 = { model: o.want, submit: id => { if (S.pick) { const f = S.pick; S.pick = null; f(id || o.want); } } }; });
  }
  function push(id, m) { const c = chat(id); m.t = m.t || clock(); c.msgs.push(m); if (S.cur !== id || S.view !== 'chat' || !S.open) c.unread++; append(c, m); return m; }
  async function post(id, m, o = {}) {
    const c = chat(id), who = S.members[m.from] || {};
    if (m.from && m.from !== 'me' && !m.sys && !m.day && !c.muted) {
      const len = (m.text || (m.audio ? 'audio audio audio' : 'x')).length;
      if (S.open && S.cur === id) { D.typ.textContent = `${who.name || m.from} está ${m.audio ? 'gravando áudio' : 'digitando'}…`; D.sub.textContent = D.typ.textContent; }
      await tick(o.wait !== undefined ? o.wait : Math.min(1800, 450 + len * 22));
      D.typ.textContent = ''; if (S.open && S.cur === id) header(c);
    }
    push(id, m);
    if (m.from && m.from !== 'me' && !m.sys && !m.day) { if (S.onPing) S.onPing(m); else snd('pip'); }
    await tick(o.after !== undefined ? o.after : 260);
    return m;
  }
  // your messages are read (the hearts go pink) unless the chat's muted (the Hush)
  function read(id) { const c = chat(id); if (c.muted) return; c.msgs.forEach(m => { if (m.from === 'me') m.read = true; }); if (S.open && S.cur === id && S.view === 'chat') D.bd.querySelectorAll('.m.me .tm i').forEach(i => i.classList.add('rd')); }
  function mute(id, on, sub) { const c = chat(id); c.muted = !!on; if (sub !== undefined) c.mutedSub = sub; if (S.open && S.cur === id && S.view === 'chat') { header(c); render(id); } }
  // ============================================================ the áudios: play (a pt-BR voice reads it, if there is one), 2x, the transcript
  function speak(text, rate) {
    try {
      if (!window.speechSynthesis) return false;
      const v = (typeof VOICES !== 'undefined' && VOICES.best && VOICES.best('pt')) || speechSynthesis.getVoices().find(x => /^pt[-_]BR/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^pt/i.test(x.lang));     // (P7b: the most natural pt voice, js/voices.js)
      if (!v) return false;
      const u = new SpeechSynthesisUtterance(String(text).replace(/[«»"“”]/g, '')); u.voice = v; u.lang = v.lang; u.rate = rate || 0.95;
      speechSynthesis.cancel(); speechSynthesis.speak(u); return u;
    } catch (e) { return false; }
  }
  function wireAudio(c, scope) {
    (scope && scope.matches && scope.matches('.au') ? [scope] : [...(scope || D.bd).querySelectorAll('.au')]).forEach(el => {
      const m = c.msgs[+el.dataset.i]; if (!m || !m.audio) return;
      const P = el.querySelector('.play'), sp = el.querySelector('.spd'), tb = el.querySelector('.trb'), tr = el.querySelector('.trx');
      P.onclick = () => {
        m.played = true; el.classList.add('played');
        const u = speak(m.audio.pt, m.spd === '2x' ? 1.7 : 0.95);
        if (!u) { m.tr = true; tr.classList.remove('hidden'); if (!m.noVoiceNote) { m.noVoiceNote = true; try { UI.toast('No Portuguese voice on this PC: here’s the transcript.'); } catch (e) { /* */ } } }
        if (S.wantPlay === m) { S.wantPlay = null; if (S.playRes) { const f = S.playRes; S.playRes = null; f(); } }
      };
      if (sp) sp.onclick = () => { m.spd = m.spd === '2x' ? '1x' : '2x'; sp.textContent = m.spd; };
      if (tb) tb.onclick = () => { m.tr = !m.tr; tr.classList.toggle('hidden', !m.tr); if (m.tr && S.wantPlay === m) { m.played = true; S.wantPlay = null; if (S.playRes) { const f = S.playRes; S.playRes = null; f(); } } };
    });
  }
  // wait until this áudio has been played (or its transcript opened)
  function listen(id, m) {
    if (m.played) return Promise.resolve();
    const c = chat(id); S.wantPlay = m;
    D.tk.textContent = 'Áudio'; D.tg.textContent = 'Play the áudio (▶). The transcript is there too.'; D.th.textContent = ''; D.th.className = 'h'; D.task.classList.remove('hidden'); D.idk.classList.add('hidden'); D.hint.classList.add('hidden');
    S.cur = id;
    return new Promise(res => { S.playRes = () => { D.task.classList.add('hidden'); D.idk.classList.remove('hidden'); D.hint.classList.remove('hidden'); S.cur3 = null; res(); };
      S.cur3 = { model: '▶', submit: () => { const el = D.bd.querySelector(`.au[data-i="${c.msgs.indexOf(m)}"] .play`); if (el) el.click(); else if (S.playRes) { const f = S.playRes; S.playRes = null; m.played = true; f(); } } }; });
  }
  // ============================================================ you, typing: a task, and what you send
  function ask(id, o = {}) {
    const c = chat(id); if (S.view !== 'chat' || S.cur !== id) show(id);
    const model = typeof o.model === 'function' ? o.model() : (o.model || '');
    D.task.classList.remove('hidden'); D.tk.textContent = o.kind || (o.audio ? 'Your áudio' : 'Your message'); D.tg.innerHTML = o.goal || ''; D.th.className = 'h'; D.th.innerHTML = o.help || '';
    D.input.value = ''; D.input.placeholder = o.placeholder || (o.audio ? 'say your áudio in Portuguese…' : 'Mensagem…'); D.send.classList.toggle('mic', !!o.audio); D.send.textContent = o.audio ? '🎤' : '➤';
    const down = () => { D.bd.scrollTop = D.bd.scrollHeight; };
    setTimeout(() => { D.input.focus(); down(); }, 40); setTimeout(down, 180);      // (the task card took room: back to the newest message)
    let tries = 0, shown = false, hints = 0, busy = false;
    return new Promise(res => {
      const done = v => { S.ask = null; D.task.classList.add('hidden'); D.send.classList.remove('mic'); D.send.textContent = '➤'; res(v); };
      const reveal = auto => { if (!model) return; shown = true; D.th.className = 'h no'; D.th.innerHTML = (auto ? 'It’s ' : 'Try: ') + `<b>${esc(model)}</b>${o.modelEn ? ` <i>(${esc(o.modelEn)})</i>` : ''}`; D.input.placeholder = model; CVUI.say(model); D.input.focus(); };
      S.ask = {
        get model() { return model; },
        async submit(text) {
          const t = String(text || '').trim(); if (!t || busy) return;
          if (!shown && CVUI.idk(t)) { reveal(false); D.input.value = ''; return; }
          let ok = false, minor = false, why = '', note = '', said = '';
          if (o.check) { const r = o.check(t) || {}; ok = !!r.ok; minor = !!r.minor; why = r.why || ''; note = r.note || ''; said = r.said || ''; }
          else ok = CVUI.has(t, [model].concat(o.keys || []).filter(Boolean));
          if (!ok) {
            tries++; snd('wrong'); D.scr.classList.remove('shake'); void D.scr.offsetWidth; D.scr.classList.add('shake');
            if (tries >= 2 && !shown && model) reveal(true); else { D.th.className = 'h no'; D.th.innerHTML = why || 'Not quite. Try again! (? shows it)'; }
            D.input.select(); return;
          }
          busy = true;
          const g = GR[Math.min(4, tries + (minor ? 1 : 0) + (shown ? 2 : 0) + (hints > 1 ? 1 : 0))];
          snd(g === 'S' ? 'perfect' : 'review');
          D.th.className = 'h ok'; D.th.innerHTML = `<span class="gr cv-${g}">${g}</span>✓${note ? ' ' + note : ''}`;
          D.input.value = '';
          const mine = o.audio ? { from: 'me', audio: { pt: t, en: o.modelEn || '', dur: '0:' + String(Math.min(59, 3 + Math.round(t.length / 6))).padStart(2, '0') } } : { from: 'me', text: t, en: o.mineEn || '' };
          push(id, mine); snd('click');
          if (o.audio) { const u = speak(t, 1); if (!u) { /* no voice: the bubble's transcript shows */ } }
          await tick(650);
          read(id);
          await tick(450);
          done(g);
        },
        idk() { if (!shown) reveal(false); },
        hint() { if (!model || shown) return; hints++; D.th.className = 'h'; D.th.innerHTML = `<b style="letter-spacing:.05em">${esc(CVUI.hintOf(model, hints))}</b>`; D.input.focus(); },
        quit() { done('quit'); },
      };
    });
  }
  // ============================================================ the video call: a tile per face; someone talks, a bubble
  function callView(tiles, title) {
    dom(); const el = document.createElement('div'); el.className = 'call';
    el.innerHTML = `<div class="ctop">${esc(title || 'Chamada de vídeo')}</div>` + tiles.map(t => `<div class="tile" data-k="${esc(t.key)}"><canvas width="172" height="172"></canvas><b>${esc(t.name)}</b></div>`).join('');
    D.bd.after(el);
    el.querySelectorAll('.tile').forEach((tl, i) => { const cv = tl.querySelector('canvas'); try { ICONS.draw(cv, tiles[i].icon); } catch (e) { /* */ } });
    D.bd.classList.add('hidden'); D.typ.textContent = '';
    return {
      el,
      say(key, text) {
        const tl = el.querySelector(`.tile[data-k="${key}"]`); if (!tl) return;
        tl.classList.add('talk'); let b = tl.querySelector('.bub'); if (b) b.remove();
        b = document.createElement('div'); b.className = 'bub'; b.textContent = text; tl.appendChild(b);
        setTimeout(() => { tl.classList.remove('talk'); if (b.parentNode) b.remove(); }, S.fast ? 50 : 2600);
      },
      end() { el.remove(); D.bd.classList.remove('hidden'); },
    };
  }
  return {
    bind, art, member, chat, open, close, show, list, pickChat, push, post, ask, listen, read, mute, callView, speak,
    get isOpen() { return S.open; }, get busy() { return S.open; },
    get cur() { return S.ask || S.cur2 || S.cur3 || null; },
    get fast() { return S.fast; }, set fast(v) { S.fast = !!v; },
    set onPing(f) { S.onPing = f; }, set onClose(f) { S.onClose = f; },
    get chats() { return S.chats; }, get en() { return S.en; }, set en(v) { S.en = !!v; },
  };
})();
