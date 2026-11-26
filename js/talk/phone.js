'use strict';
// PHONE: one phone, a skin per language (DESIGN.md 15.3). Every app is original: its own name, colors and marks, never a real
// app's. es «Chisme» (gossip) · pt «Prosa» (the look of Vó Dita's app; familia_ui.js's PRS itself is untouched and keeps working)
// · de «Schnack» · zh «信鸽» (the carrier pigeon: WeChat-*style* features, its own look, no green) · ja «ぴよ» (a chick's peep).
// People give you their number at bond rank 2 (talk.js rewards: number). Threads fire on story events (flags): their messages
// arrive, and a reply waits for you the next time you open the chat. Your replies are free talk turns (TALK.turn), graded S–D.
//   PHONE.init(game) · update(dt) · open(chat?) · close() · toggle() · unread() · available() · check() (fires due threads)
//   Messages: texts, voice notes (spoken if there's a voice, else the transcript), stickers, photos, gray notes, gifts (zh: 红包;
//   in a group, count > 1: 抢红包, a lucky draw with 手气最佳), moments (zh: 朋友圈: like, and comment: a graded turn the poster
//   answers), pay cards. PHONE.scanPay(o): 扫码 to pay a shop (Grandma Mei's) in coins, saying what you're paying for.
//   Thread steps may carry if: { best } (after a group 红包) or if: (state, run) => bool.
//   Members (content): { name, en (English name, for the lines under gray notes), color, face, look (TALKUI.face's format, for
//   people who aren't bond people or townsfolk), lower (keep every message's lowercase start) }; a step's raw: true keeps its own.
//   State: G.state.talk.phone { chats, run, seen, contacts, moments, moNew } (saved with the game).
//   Key: KEYS 'phone' (C by default; rebindable in Settings). HUD: 📱 with an unread badge, in the top-right counters.
// Needs talk.js (TALK), talk_ui.js (TALKUI.face, speak), core.js; UI, Input, Sound at run time.

const PHONE = (() => {
  let G = null;
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const E = s => (typeof esc === 'function' ? esc(s) : String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const T = { fast: false };
  const tick = ms => (T.fast || (typeof TALK !== 'undefined' && TALK._.T.fast) || !ms ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));
  const P = () => TALK.state.phone;
  const C = () => TALK.contentOf();
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };
  const clock = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const txt = t => (isC() ? CJK.html(t, { lang: L() }) : E(t));
  const plain = t => (isC() ? CJK.plain(t, { lang: L() }) : String(t || ''));
  // Their messages are mixed by the weave like every line (js/talk/mix.js, DESIGN.md 16): the English with the words you know in
  // the language, whole messages in the language only as the weave rises. EN is a help button: a message's English shows only with
  // EN on, mixed or whole (DESIGN.md 17.3: never under a line by default; EN starts off each time the phone opens). Voice notes
  // stay as said.
  const mixOn = () => typeof MIX !== 'undefined' && MIX.ok();
  const mix = (t, en, force) => (mixOn() && t && en ? MIX.line(t, en, force ? { force } : {}) : { full: true, html: txt(t || '') });
  const enCls = () => 'help';
  const w92 = () => { try { return LEX.weave() >= 0.92; } catch (e) { return false; } };
  const wordHTML = w => (w.src && isC() ? CJK.html(w.src, { lang: L(), cap: false }) : E(w.t || ''));
  const iconFor = w => { try { return mixOn() ? MIX.iconOf(DICT.entry(w.id)) : ''; } catch (e) { return ''; } };

  // ============================================================ the skins (one shell; each language its own original app)
  const SKINS = {
    es: { app: 'Chisme', logo: '¡!', hd: 'linear-gradient(100deg,#e8457a,#ff8a3d)', acc: '#e8457a', bg: '#fff4ea', dot: 'rgba(232,69,122,.13)', me: '#ffd6e8', them: '#ffffff', ink: '#2b2235',
      typing: n => `${n} está escribiendo…`, voice: 'Nota de voz', tr: 'Texto', read: 'visto', chats: 'Chats', msg: 'Mensaje…', gift: 'Regalo', moments: null, pattern: 'tri' },
    pt: { app: 'Prosa', logo: '♥', hd: '#ff7a59', acc: '#ff6a4d', bg: '#fff6ec', dot: 'rgba(255,122,89,.12)', me: '#ffd9c7', them: '#ffffff', ink: '#2b2235',
      typing: n => `${n} está digitando…`, voice: 'Áudio', tr: 'Transcrição', read: '♥♥', chats: 'Conversas', msg: 'Mensagem…', gift: 'Presente', moments: null, pattern: 'dot' },
    de: { app: 'Schnack', logo: '⚓', hd: '#3d405b', acc: '#e07a5f', bg: '#f4f1de', dot: 'rgba(61,64,91,.10)', me: '#f2cc8f', them: '#ffffff', ink: '#2b2235',
      typing: n => `${n} schreibt…`, voice: 'Sprachnachricht', tr: 'Text', read: 'gelesen', chats: 'Chats', msg: 'Nachricht…', gift: 'Geschenk', moments: null, pattern: 'grid' },
    zh: { app: '信鸽', logo: '✉', hd: '#2e3a59', acc: '#e9b949', bg: '#f3f0e8', dot: 'rgba(46,58,89,.09)', me: '#fbe7b2', them: '#ffffff', ink: '#2b2235',
      typing: n => `${n} 正在输入…`, voice: '语音', tr: '转文字', read: '', chats: '消息', msg: '发消息…', gift: '红包', moments: '朋友圈', pattern: 'wave',
      // (the group 红包, 朋友圈 comments, 扫码 pay: the app's own words; the lines in a chat are in the notation, so they're read too)
      luckyGift: '拼手气红包', best: '手气最佳', allGone: '已领完', me: '我', comment: '评论', reply: '回复', scan: '扫一扫 · 对准二维码', payTo: '付款给', payOk: '支付成功', poor: '余额不足',
      grabbed: (who, from) => `${who} [领取|lǐng qǔ] [了|le] ${from} [的|de] [红包|hóng bāo]`, giftOf: from => `${from} [的|de] [红包|hóng bāo]`, bestIs: who => `👑 [手气|shǒu qì] [最佳|zuì jiā] ： ${who}`,
      you: '[你|nǐ]', shares: (n, t) => `${n} [个|gè] [红包|hóng bāo] ， [共|gòng] ${t} [金币|jīn bì]`, scanned: m => `[扫码|sǎo mǎ] [成功|chéng gōng] · ${m}` },
    ja: { app: 'ぴよ', logo: '🐤', hd: '#8e7cc3', acc: '#ffd166', bg: '#f7f3ff', dot: 'rgba(142,124,195,.13)', me: '#fff3c4', them: '#ffffff', ink: '#2b2235',
      typing: n => `${n}が入力中…`, voice: 'ボイス', tr: '文字', read: '🐤', chats: 'トーク', msg: 'メッセージ…', gift: 'ギフト', moments: null, pattern: 'dot' },
  };
  const skin = () => SKINS[L()] || SKINS.es;

  // ============================================================ stickers and photos: simple original drawings (the game's paper style)
  const INK = '#2b2235';
  const ART = {};
  const art = (name, draw) => { ART[name] = draw; };
  function blob(c, x, y, r, fill, lw = 5) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
  function mimoBody(c, x, y, s, happy) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 5; c.strokeStyle = INK; c.lineJoin = 'round';
    [-1, 1].forEach(k => { c.beginPath(); c.ellipse(k * 22, -58, 13, 32, k * 0.25, 0, Math.PI * 2); c.fillStyle = '#fbf1df'; c.fill(); c.stroke(); c.beginPath(); c.ellipse(k * 22, -56, 6, 21, k * 0.25, 0, Math.PI * 2); c.fillStyle = '#ff9b88'; c.fill(); });
    c.beginPath(); c.ellipse(0, 0, 50, 45, 0, 0, Math.PI * 2); c.fillStyle = '#fbf1df'; c.fill(); c.stroke();
    c.fillStyle = INK; [-1, 1].forEach(k => { c.beginPath(); if (happy) { c.lineWidth = 5; c.arc(k * 17, -6, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } else { c.ellipse(k * 17, -6, 6, 8, 0, 0, Math.PI * 2); c.fill(); } });
    c.fillStyle = 'rgba(255,120,120,.5)'; [-1, 1].forEach(k => { c.beginPath(); c.ellipse(k * 30, 10, 9, 5, 0, 0, Math.PI * 2); c.fill(); });
    c.beginPath(); c.lineWidth = 4; c.arc(0, 6, 9, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    c.beginPath(); c.moveTo(0, -46); c.lineTo(9, -37); c.lineTo(0, -28); c.lineTo(-9, -37); c.closePath(); c.fillStyle = '#2fd0c2'; c.fill(); c.lineWidth = 4; c.stroke();
    c.restore();
  }
  art('apple_heart', (c, w, h) => { blob(c, w / 2, h / 2 + 10, 72, '#e8453a', 7); c.beginPath(); c.moveTo(w / 2, h / 2 - 58); c.quadraticCurveTo(w / 2 + 6, h / 2 - 80, w / 2 + 16, h / 2 - 92); c.lineWidth = 8; c.stroke();
    c.beginPath(); c.ellipse(w / 2 + 34, h / 2 - 78, 22, 11, -0.5, 0, Math.PI * 2); c.fillStyle = '#57b35a'; c.fill(); c.lineWidth = 5; c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); const x = w / 2, y = h / 2 + 14; c.moveTo(x, y + 26); c.bezierCurveTo(x - 46, y - 6, x - 22, y - 40, x, y - 16); c.bezierCurveTo(x + 22, y - 40, x + 46, y - 6, x, y + 26); c.fill(); });
  art('mimo_jump', (c, w, h) => { c.fillStyle = 'rgba(255,210,63,.5)'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.arc(w / 2 + Math.cos(a) * 98, h / 2 + 10 + Math.sin(a) * 84, 9, 0, Math.PI * 2); c.fill(); } mimoBody(c, w / 2, h / 2 + 30, 1.3, true); });
  art('mimo_happy', (c, w, h) => mimoBody(c, w / 2, h / 2 + 30, 1.4, true));
  art('mimo_sad', (c, w, h) => { mimoBody(c, w / 2, h / 2 + 30, 1.4, false); c.fillStyle = '#7fc8f8'; c.beginPath(); c.ellipse(w / 2 - 34, h / 2 + 40, 7, 12, 0, 0, Math.PI * 2); c.fill(); });
  art('thumbs', (c, w, h) => { c.save(); c.translate(w / 2, h / 2); c.lineWidth = 7; c.strokeStyle = INK; c.lineJoin = 'round'; c.fillStyle = '#f5cda2';
    c.beginPath(); c.moveTo(-50, -10); c.lineTo(-10, -10); c.lineTo(0, -70); c.quadraticCurveTo(25, -70, 22, -30); c.lineTo(60, -30); c.quadraticCurveTo(76, -26, 66, -6); c.quadraticCurveTo(78, 6, 64, 20); c.quadraticCurveTo(72, 36, 56, 44); c.quadraticCurveTo(58, 62, 40, 62); c.lineTo(-10, 62); c.lineTo(-50, 62); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#21a493'; c.fillRect(-82, -16, 32, 84); c.strokeRect(-82, -16, 32, 84); c.restore(); });
  art('bell', (c, w, h) => { c.save(); c.translate(w / 2, h / 2); c.lineWidth = 7; c.strokeStyle = INK; c.fillStyle = '#e9b949';
    c.beginPath(); c.moveTo(-70, 50); c.quadraticCurveTo(-60, -70, 0, -72); c.quadraticCurveTo(60, -70, 70, 50); c.closePath(); c.fill(); c.stroke(); blob(c, 0, 62, 14, '#c98a2b', 6); blob(c, 0, -80, 10, '#c98a2b', 6);
    c.lineWidth = 6; [[-100, -40, -84, -20], [100, -40, 84, -20], [-104, 10, -86, 10], [104, 10, 86, 10]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); }); c.restore(); });
  art('heart', (c, w, h) => { c.save(); c.translate(w / 2, h / 2 + 10); c.lineWidth = 8; c.strokeStyle = INK; c.fillStyle = '#ff5c8a'; c.beginPath(); c.moveTo(0, 70); c.bezierCurveTo(-120, -10, -60, -100, 0, -40); c.bezierCurveTo(60, -100, 120, -10, 0, 70); c.fill(); c.stroke(); c.restore(); });
  art('laugh', (c, w, h) => { blob(c, w / 2, h / 2, 90, '#ffd23f', 7); c.lineWidth = 7; c.strokeStyle = INK; [-1, 1].forEach(k => { c.beginPath(); c.arc(w / 2 + k * 32, h / 2 - 18, 14, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); });
    c.beginPath(); c.moveTo(w / 2 - 50, h / 2 + 10); c.quadraticCurveTo(w / 2, h / 2 + 90, w / 2 + 50, h / 2 + 10); c.closePath(); c.fillStyle = '#7a2b3a'; c.fill(); c.stroke(); });
  art('bread', (c, w, h) => { c.fillStyle = '#ffe8c2'; c.fillRect(0, 0, w, h); c.fillStyle = '#c98a4a'; c.fillRect(0, h * 0.72, w, h * 0.28);
    c.save(); c.translate(w / 2, h * 0.58); c.lineWidth = 7; c.strokeStyle = INK; c.fillStyle = '#d99a4e'; c.beginPath(); c.ellipse(0, 0, w * 0.36, h * 0.22, -0.08, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 6; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 40 - 18, -30); c.quadraticCurveTo(i * 40, -10, i * 40 + 18, -34); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-60 + i * 60, -h * 0.36, 8, 22, 0.2, 0, Math.PI * 2); c.fill(); } c.restore(); });
  art('sunset', (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffb26b'); g.addColorStop(1, '#e8457a'); c.fillStyle = g; c.fillRect(0, 0, w, h); blob(c, w / 2, h * 0.62, 70, '#ffe08a', 0); c.fillStyle = '#5a4a7a'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.7); c.quadraticCurveTo(w * 0.3, h * 0.55, w * 0.55, h * 0.72); c.quadraticCurveTo(w * 0.8, h * 0.6, w, h * 0.68); c.lineTo(w, h); c.fill(); });
  // 信鸽 (zh): 表情包 (Mimo holding up a word, the way stickers say things), Grandma Mei's 早上好 pictures, and the family's photos.
  // All original drawings in the game's paper style (flat colors, a thick ink line).
  const ZHF_ = (px, wt = 900) => `${wt} ${px}px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "SimHei", sans-serif`;
  function word(c, s, x, y, px, fill, edge, lw) { c.save(); c.font = ZHF_(px); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = lw || Math.max(4, px / 6); c.strokeStyle = edge || INK; c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y); c.restore(); }
  function flower(c, x, y, r, petal, heart, n = 6) { c.save(); c.translate(x, y); c.lineWidth = 4; c.strokeStyle = INK; for (let i = 0; i < n; i++) { c.rotate(Math.PI * 2 / n); c.beginPath(); c.ellipse(0, -r * 0.6, r * 0.4, r * 0.6, 0, 0, Math.PI * 2); c.fillStyle = petal; c.fill(); c.stroke(); } c.beginPath(); c.arc(0, 0, r * 0.3, 0, Math.PI * 2); c.fillStyle = heart; c.fill(); c.stroke(); c.restore(); }
  function leaf(c, x, y, len, ang, col) { c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0); c.fillStyle = col; c.fill(); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke(); c.restore(); }
  // the good-morning pictures: a sunrise, big flowers, gold words with a red edge (every grandma's favorite kind of picture)
  const morning = (sky, petals, line2) => (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,244,190,.9)'; c.beginPath(); c.arc(w * 0.8, h * 0.24, h * 0.13, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,244,190,.6)'; c.lineWidth = 5; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; c.beginPath(); c.moveTo(w * 0.8 + Math.cos(a) * h * 0.17, h * 0.24 + Math.sin(a) * h * 0.17); c.lineTo(w * 0.8 + Math.cos(a) * h * 0.24, h * 0.24 + Math.sin(a) * h * 0.24); c.stroke(); }
    leaf(c, w * 0.06, h * 0.98, h * 0.36, -0.9, '#4f9a5a'); leaf(c, w * 0.94, h * 0.98, h * 0.36, -2.25, '#4f9a5a'); leaf(c, w * 0.42, h * 1.02, h * 0.3, -1.3, '#3f8a4a'); leaf(c, w * 0.6, h * 1.02, h * 0.3, -1.85, '#3f8a4a');
    flower(c, w * 0.15, h * 0.84, h * 0.17, petals[0], '#ffd23f', 8); flower(c, w * 0.85, h * 0.83, h * 0.16, petals[1], '#ffd23f', 6); flower(c, w * 0.5, h * 0.9, h * 0.13, petals[2], '#ffe9a8', 5);
    word(c, '早上好', w / 2, h * 0.36, Math.round(h * 0.3), '#ffd23f', '#c8322a', Math.round(h * 0.04));
    word(c, line2, w / 2, h * 0.6, Math.round(h * 0.13), '#fffaf0', '#c8322a', Math.round(h * 0.025));
  };
  art('zh_morning1', morning(['#ffb26b', '#ff8fae'], ['#ff5c8a', '#e8457a', '#ffd0dc'], '天天开心'));
  art('zh_morning2', morning(['#8fd3ff', '#ffe08a'], ['#ff8a3d', '#f25c54', '#fff1b8'], '平安喜乐'));
  art('zh_morning3', morning(['#c9b6ff', '#ffc6d9'], ['#9b5de5', '#e8457a', '#ffe0a8'], '心想事成'));
  // 表情包: Mimo (happy) holding up a word; the word sized to fit
  const sayStk = (s, col, extra) => (c, w, h) => { mimoBody(c, w / 2, h / 2 + 40, 1.1, true); if (extra) extra(c, w, h); word(c, s, w / 2, 44, Math.min(62, Math.floor((w - 26) / [...s].length)), col, INK, 9); };
  art('zh_welcome', sayStk('欢迎', '#ff8a3d', (c, w, h) => { [[0.16, 0.62, '#ff5c8a'], [0.84, 0.6, '#ffd23f'], [0.2, 0.86, '#2ec4b6'], [0.82, 0.88, '#9b5de5']].forEach(([x, y, f]) => { c.fillStyle = f; c.beginPath(); c.arc(w * x, h * y, 8, 0, Math.PI * 2); c.fill(); }); }));
  art('zh_hug', sayStk('抱抱', '#ff5c8a', (c, w, h) => { c.save(); c.translate(w * 0.82, h * 0.6); c.fillStyle = '#ff5c8a'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 14); c.bezierCurveTo(-26, -4, -12, -24, 0, -10); c.bezierCurveTo(12, -24, 26, -4, 0, 14); c.fill(); c.stroke(); c.restore(); }));
  art('zh_zan', sayStk('赞！', '#3f7fc9'));
  art('zh_ok', sayStk('收到', '#21a493'));
  art('zh_haha', sayStk('哈哈哈', '#f2b01e'));
  art('zh_jiayou', sayStk('加油！', '#e8457a'));
  art('zh_thanks', sayStk('谢谢老板', '#d8402f', (c, w, h) => { c.save(); c.translate(w * 0.8, h * 0.68); c.rotate(0.22); c.fillStyle = '#d8402f'; c.strokeStyle = INK; c.lineWidth = 4.5; c.fillRect(-20, -28, 40, 56); c.strokeRect(-20, -28, 40, 56); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, -6, 8, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore(); }));
  // the family's photos: the city at night (Longlong's dad, working late), Grandpa Chen's songbird 小黄, Grandma Mei's dumplings,
  // a crayon drawing by Longlong, and the train home for Spring Festival
  art('zh_city', (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b2140'); g.addColorStop(1, '#3d3a6b'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(w * 0.84, h * 0.17, 22, 0, Math.PI * 2); c.fill(); c.fillStyle = '#1b2140'; c.beginPath(); c.arc(w * 0.86, h * 0.15, 20, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect((i * 97) % w, (i * 53) % (h * 0.4), 2, 2); }
    [[0.02, 0.42, 0.16], [0.17, 0.25, 0.14], [0.31, 0.5, 0.13], [0.43, 0.18, 0.15], [0.58, 0.38, 0.12], [0.69, 0.3, 0.16], [0.84, 0.46, 0.15]].forEach(([x, top, bw], k) => {
      const X = w * x, Y = h * top, W = w * bw; c.fillStyle = ['#2b3561', '#323d70', '#283058'][k % 3]; c.fillRect(X, Y, W, h - Y); c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(X, Y, W, h - Y + 4);
      for (let yy = Y + 12; yy < h - 10; yy += 18) for (let xx = X + 8; xx < X + W - 10; xx += 16) { c.fillStyle = ((xx * 7 + yy * 3 + k) % 5) < 2 ? '#ffd96b' : 'rgba(255,255,255,.12)'; c.fillRect(xx, yy, 8, 9); }
    });
  });
  art('zh_bird', (c, w, h) => {
    c.fillStyle = '#e8f1d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#9fc98a'; c.fillRect(0, h * 0.8, w, h * 0.2);
    leaf(c, w * 0.04, h * 0.2, 90, 0.3, '#6fae5a'); leaf(c, w * 0.96, h * 0.3, 90, 2.8, '#6fae5a');
    const cx = w / 2, cy = h * 0.52, R = h * 0.36; c.lineWidth = 4; c.strokeStyle = '#8a5a2b';
    for (let i = -4; i <= 4; i++) { const x = cx + i * R / 4.6; c.beginPath(); c.moveTo(x, cy - R * 0.62 + Math.abs(i) * 4); c.lineTo(x, cy + R * 0.75); c.stroke(); }
    c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.ellipse(cx, cy - R * 0.62, R * 0.95, R * 0.24, 0, Math.PI, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(cx - R * 0.95, cy + R * 0.75); c.lineTo(cx + R * 0.95, cy + R * 0.75); c.stroke();
    c.beginPath(); c.arc(cx, cy - R * 0.92, 12, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 5; c.strokeStyle = '#8a5a2b'; c.beginPath(); c.moveTo(cx - R * 0.5, cy + R * 0.25); c.lineTo(cx + R * 0.5, cy + R * 0.25); c.stroke();
    blob(c, cx, cy, 30, '#ffd23f', 5); blob(c, cx + 22, cy - 18, 18, '#ffd23f', 5);
    c.fillStyle = '#f29c38'; c.beginPath(); c.moveTo(cx + 38, cy - 20); c.lineTo(cx + 52, cy - 15); c.lineTo(cx + 38, cy - 10); c.closePath(); c.fill(); c.lineWidth = 3; c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(cx + 26, cy - 22, 3.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; [[18, -60], [34, -72], [50, -58]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(cx + dx, cy + dy); c.quadraticCurveTo(cx + dx + 8, cy + dy - 8, cx + dx + 4, cy + dy - 16); c.stroke(); });
  });
  art('zh_dumplings', (c, w, h) => {
    c.fillStyle = '#c98a4a'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 6; i++) c.fillRect(0, i * h / 6, w, 3);
    blob(c, w * 0.46, h * 0.55, h * 0.4, '#fdfbf4', 6); c.lineWidth = 3; c.strokeStyle = '#3f7fc9'; c.beginPath(); c.arc(w * 0.46, h * 0.55, h * 0.33, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7, x = w * 0.46 + Math.cos(a) * h * 0.19, y = h * 0.55 + Math.sin(a) * h * 0.17;
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(-24, 6); c.quadraticCurveTo(0, -30, 24, 6); c.quadraticCurveTo(0, 14, -24, 6); c.fillStyle = '#fff7e6'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
      c.lineWidth = 2.4; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 7, -8); c.lineTo(k * 7 + 3, -2); c.stroke(); } c.restore(); }
    blob(c, w * 0.85, h * 0.78, 34, '#fdfbf4', 5); c.fillStyle = '#5a2e1a'; c.beginPath(); c.arc(w * 0.85, h * 0.78, 24, 0, Math.PI * 2); c.fill();
    c.lineWidth = 7; c.strokeStyle = '#7a4a24'; c.beginPath(); c.moveTo(w * 0.72, h * 0.14); c.lineTo(w * 0.95, h * 0.5); c.moveTo(w * 0.77, h * 0.1); c.lineTo(w * 0.98, h * 0.44); c.stroke();
  });
  art('zh_drawing', (c, w, h) => {
    c.fillStyle = '#fffdf3'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(90,120,200,.25)'; c.lineWidth = 2; for (let y = 30; y < h; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    const cr = (col, lw, f) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); f(); c.stroke(); };
    cr('#d6332a', 9, () => { c.moveTo(w * 0.52, h * 0.3); for (let i = 0; i <= 10; i++) c.lineTo(w * (0.52 + i * 0.04), h * (0.3 + Math.sin(i * 1.1) * 0.08)); });
    cr('#d6332a', 7, () => { c.arc(w * 0.5, h * 0.3, 26, 0, Math.PI * 2); }); cr('#f2c94c', 6, () => { c.moveTo(w * 0.47, h * 0.22); c.lineTo(w * 0.44, h * 0.12); c.moveTo(w * 0.53, h * 0.22); c.lineTo(w * 0.56, h * 0.12); });
    cr('#2b2235', 6, () => { c.arc(w * 0.22, h * 0.42, 26, 0, Math.PI * 2); c.moveTo(w * 0.22, h * 0.42 + 26); c.lineTo(w * 0.22, h * 0.78); c.moveTo(w * 0.22, h * 0.55); c.lineTo(w * 0.12, h * 0.66); c.moveTo(w * 0.22, h * 0.55); c.lineTo(w * 0.32, h * 0.64); c.moveTo(w * 0.22, h * 0.78); c.lineTo(w * 0.15, h * 0.92); c.moveTo(w * 0.22, h * 0.78); c.lineTo(w * 0.29, h * 0.92); });
    cr('#e8a0b8', 6, () => { c.ellipse(w * 0.38, h * 0.8, 30, 24, 0, 0, Math.PI * 2); c.moveTo(w * 0.36, h * 0.74); c.lineTo(w * 0.34, h * 0.6); c.moveTo(w * 0.4, h * 0.74); c.lineTo(w * 0.42, h * 0.6); });
    cr('#2fd0c2', 6, () => { c.arc(w * 0.38, h * 0.72, 5, 0, Math.PI * 2); });
    cr('#f29c38', 8, () => { c.arc(w * 0.88, h * 0.16, 26, 0, Math.PI * 2); });
    c.save(); c.font = ZHF_(34, 700); c.fillStyle = '#3f6fb5'; c.fillText('我的新朋友', w * 0.5, h * 0.72); c.font = ZHF_(22, 700); c.fillText('龙龙 画', w * 0.74, h * 0.92); c.restore();
  });
  art('zh_train', (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#bfe3ff'); g.addColorStop(1, '#eaf6ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#9fc98a'; c.beginPath(); c.moveTo(0, h * 0.62); c.quadraticCurveTo(w * 0.3, h * 0.42, w * 0.6, h * 0.6); c.quadraticCurveTo(w * 0.8, h * 0.5, w, h * 0.58); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.fillStyle = '#7a7f8c'; c.fillRect(0, h * 0.8, w, 10); c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(-4, h * 0.8, w + 8, 10);
    c.save(); c.translate(w * 0.06, h * 0.56); c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.7, 0); c.quadraticCurveTo(w * 0.86, 0, w * 0.9, h * 0.22); c.lineTo(0, h * 0.22); c.closePath(); c.fillStyle = '#fdfbf4'; c.fill(); c.lineWidth = 6; c.stroke();
    c.fillStyle = '#d6332a'; c.fillRect(0, h * 0.13, w * 0.86, 10); c.fillStyle = '#3f6fb5'; for (let i = 0; i < 6; i++) { c.fillRect(18 + i * w * 0.11, 12, w * 0.07, h * 0.08); c.lineWidth = 3; c.strokeRect(18 + i * w * 0.11, 12, w * 0.07, h * 0.08); } c.restore();
    word(c, '回家', w * 0.78, h * 0.22, 56, '#d6332a', '#fffaf0', 10);
  });
  function paint(root) {
    root.querySelectorAll('canvas[data-art]').forEach(cv => { if (cv._done) return; cv._done = true; const f = ART[cv.dataset.art]; if (f) { try { f(cv.getContext('2d'), cv.width, cv.height); } catch (e) { console.warn('[phone] art', e); } } });
    root.querySelectorAll('canvas[data-face]').forEach(cv => { if (cv._done) return; cv._done = true; try { TALKUI.face(cv, lookOf(cv.dataset.face), null); } catch (e) { /* */ } });
  }
  // a face: a chat member's own look first (members: { id: { look } }, TALKUI.face's format; found by the member's id or its
  // face key), for people who aren't bond people or townsfolk (信鸽's family, Don Fello's crew, Vó Dita's family…); then TALK's
  function lookOf(id) {
    const ms = (C() && C().members) || {};
    const mm = ms[id] && ms[id].look ? ms[id] : Object.values(ms).find(x => x && x.face === id && x.look);
    if (mm && mm.look) return typeof mm.look === 'function' ? mm.look() : mm.look;
    let L0 = null; try { L0 = TALK.lookOf(id); } catch (e) { L0 = null; }
    if (!L0 && G && G.sim && typeof ACTORS !== 'undefined') { const n = G.sim.npc(id); if (n && ACTORS.PRESETS[n.kind]) L0 = Object.assign({ kid: n.kind === 'kid' }, ACTORS.PRESETS[n.kind]); }
    return L0;
  }

  // ============================================================ the look (colors come from the skin, as CSS variables)
  const CSS = `
#phone { position: fixed; inset: 0; z-index: 12; display: grid; place-items: center; font-family: "Segoe UI", "Trebuchet MS", system-ui, sans-serif; color: #2b2235; -webkit-font-smoothing: antialiased; }
#phone.hidden, #phone .hidden { display: none !important; } #phone * { box-sizing: border-box; }
#phone .sh { position: absolute; inset: 0; background: rgba(25,15,40,.42); }
#phone .ph { position: relative; width: min(390px, calc(100vw - 16px)); height: min(730px, calc(100vh - 16px)); background: #2b2235; border-radius: 34px; padding: 10px; box-shadow: 0 0 0 3px #4a3d5c, 0 18px 40px rgba(0,0,0,.35); }
#phone .scr { width: 100%; height: 100%; border-radius: 26px; overflow: hidden; display: flex; flex-direction: column; background: var(--bg); position: relative; }
#phone .sb { display: flex; justify-content: space-between; align-items: center; padding: 5px 18px 3px; font: 700 12px "Segoe UI", sans-serif; background: var(--hd); color: #fff; }
#phone .sb .app { font: 900 13px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .03em; } #phone .sb .app i { font-style: normal; display: inline-block; background: #fff; color: var(--acc); border-radius: 7px 7px 7px 2px; padding: 0 4px; margin-right: 4px; font-size: 11px; }
#phone .hdr { display: flex; align-items: center; gap: 9px; padding: 6px 10px 9px; background: var(--hd); color: #fff; }
#phone .hdr button { background: none; border: 0; color: #fff; font: 800 20px "Segoe UI", sans-serif; cursor: pointer; padding: 0 4px; flex: 0 0 auto; }
#phone .hdr .en { font-size: 12px; border: 2px solid rgba(255,255,255,.7); border-radius: 8px; padding: 1px 5px; } #phone .hdr .en.off { opacity: .55; }
#phone .av { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-size: 21px; background: #ffe3b0; border: 2px solid #fff; flex: 0 0 auto; overflow: hidden; }
#phone .av canvas { width: 38px; height: 38px; }
#phone .ttl { flex: 1; min-width: 0; } #phone .ttl b { display: block; font: 800 16px "Segoe UI", sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#phone .ttl small { display: block; font-size: 11.5px; opacity: .9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#phone .bd { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 10px 6px; background: radial-gradient(circle, var(--dot) 1.3px, transparent 1.6px) 0 0 / 18px 18px, var(--bg); }
#phone.p-tri .bd { background: linear-gradient(135deg, var(--dot) 22%, transparent 22%) 0 0 / 26px 26px, linear-gradient(225deg, var(--dot) 22%, transparent 22%) 13px 0 / 26px 26px, var(--bg); }
#phone.p-grid .bd { background: linear-gradient(var(--dot) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, var(--dot) 1px, transparent 1px) 0 0 / 22px 22px, var(--bg); }
#phone.p-wave .bd { background: radial-gradient(circle at 50% 120%, transparent 14px, var(--dot) 15px, transparent 16px) 0 0 / 30px 18px, var(--bg); }
#phone .day, #phone .sys { text-align: center; margin: 8px auto; } #phone .sys span { display: inline-block; font-size: 11.5px; font-weight: 700; background: rgba(43,34,53,.08); color: #5d5470; border-radius: 9px; padding: 2px 10px; }
#phone .m { max-width: 84%; margin: 4px 0; padding: 6px 9px 4px; border-radius: 14px; background: var(--them); box-shadow: 0 1px 0 rgba(43,34,53,.12); position: relative; }
#phone .m.me { margin-left: auto; background: var(--me); border-bottom-right-radius: 4px; } #phone .m.them { border-bottom-left-radius: 4px; } #phone .m.miss { opacity: .6; outline: 2px dashed rgba(43,34,53,.25); }
#phone .row { display: flex; gap: 6px; align-items: flex-end; } #phone .row .mini { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex: 0 0 auto; background: #ffe3b0; margin-bottom: 4px; }
#phone .row .mini canvas { width: 28px; height: 28px; } #phone .row .m { margin: 4px 0; }
#phone .m .nm { display: block; font-size: 12px; font-weight: 800; margin-bottom: 1px; }
#phone .m .tx { font-size: 15px; line-height: 1.38; white-space: pre-wrap; word-wrap: break-word; } #phone .m .enl { display: block; font-size: 11.5px; font-style: italic; opacity: .62; margin-top: 2px; line-height: 1.3; }
#phone.no-en .m .enl, #phone.no-en .au .enl, #phone.no-en .mo .enl { display: none; }
#phone .m .gl, #phone .mo .gl { font-size: .72em; } #phone .mx-new, #phone .nw b { background: linear-gradient(transparent 55%, #ffe36e 55%); font-weight: 800; color: #2b2235; border-bottom: 0; }
#phone .m.teach { background: #fffbe6; border: 2px solid #e8c547; } #phone .m.teach .tg { display: block; font: 800 10.5px "Segoe UI", sans-serif; letter-spacing: .05em; text-transform: uppercase; color: #a0761a; }
#phone .nws { display: flex; flex-wrap: wrap; gap: 4px; margin: 3px 0; } #phone .nw { display: inline-flex; align-items: center; gap: 4px; background: #fff; border: 1.5px solid rgba(43,34,53,.15); border-radius: 9px; padding: 1px 6px 1px 3px; font-size: 14px; }
#phone .nw img { width: 24px; height: 24px; } #phone .nw i { font-size: 11.5px; opacity: .7; } #phone .mimo .ech b { color: #13786b; font-size: 15px; margin-right: 6px; } #phone .mimo .ech small { display: block; opacity: .7; font-size: 11.5px; }
#phone .m .tm { display: block; text-align: right; font-size: 10.5px; opacity: .55; margin-top: 1px; } #phone .m .tm i { font-style: normal; margin-left: 5px; color: var(--acc); font-weight: 700; }
#phone .m canvas.pic { display: block; width: 100%; max-width: 250px; border-radius: 10px; margin: 2px 0; }
#phone .stk { margin: 4px 0; } #phone .stk.me { text-align: right; } #phone .stk canvas { width: 116px; height: 116px; } #phone .stk .nm { display: block; font-size: 12px; font-weight: 800; }
#phone .au { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; min-width: 230px; }
#phone .au .play { width: 34px; height: 34px; border-radius: 50%; border: 0; background: var(--acc); color: #fff; font-size: 15px; cursor: pointer; flex: 0 0 auto; }
#phone .au .wave { flex: 1; display: flex; align-items: center; gap: 2px; height: 26px; min-width: 100px; } #phone .au .wave i { display: block; width: 3px; border-radius: 2px; background: #c9b8c0; } #phone .au.played .wave i { background: var(--acc); }
#phone .au .dur { font-size: 11.5px; font-weight: 700; opacity: .7; } #phone .au .trb { border: 1.5px solid var(--acc); color: var(--acc); background: #fff; border-radius: 8px; font: 800 11px "Segoe UI", sans-serif; padding: 1px 6px; cursor: pointer; }
#phone .au .trx { flex-basis: 100%; font-size: 13.5px; line-height: 1.4; background: rgba(255,255,255,.7); border-radius: 8px; padding: 5px 7px; }
#phone .mimo { display: flex; gap: 7px; align-items: flex-start; margin: 4px 0 6px auto; max-width: 92%; background: #e9fbf8; border: 2px dashed #21a493; border-radius: 12px; padding: 5px 9px 6px 5px; font-size: 13.5px; }
#phone .mimo canvas { width: 28px; height: 28px; flex: 0 0 auto; } #phone .mimo .fx { font-weight: 600; font-size: 14.5px; } #phone .mimo .tk-red { color: #d6453a; font-weight: 800; border-bottom: 2px solid rgba(214,69,58,.4); }
#phone .mimo ul { margin: 2px 0 0; padding-left: 16px; font-size: 12.5px; }
#phone .gift { width: 210px; border-radius: 10px; overflow: hidden; margin: 4px 0; box-shadow: 0 1px 0 rgba(43,34,53,.2); cursor: pointer; } #phone .gift.me { margin-left: auto; }
#phone .gift .gt { background: var(--gift, #e04a3a); color: #ffe9a8; padding: 9px 11px; display: flex; gap: 9px; align-items: center; font-weight: 800; }
#phone .gift .gt b { font-size: 26px; } #phone .gift .enl { display: block; font-size: 11px; font-weight: 600; font-style: italic; opacity: .85; } #phone.no-en .gift .enl { display: none; } #phone .gift .gb { background: #fff; font-size: 11.5px; padding: 3px 11px; color: #8a8f9e; } #phone .gift.open .gt { opacity: .72; }
#phone .typ { font-size: 12.5px; font-style: italic; opacity: .7; padding: 2px 10px; min-height: 18px; background: var(--bg); }
#phone .task { background: #fff; border-top: 2px solid rgba(43,34,53,.12); padding: 6px 10px 5px; }
#phone .task .k { font: 800 10.5px "Segoe UI", sans-serif; letter-spacing: .07em; text-transform: uppercase; color: var(--acc); } #phone .task .g { font-size: 13.5px; font-weight: 700; line-height: 1.3; }
#phone .task .h { font-size: 13px; line-height: 1.35; } #phone .task .h b { color: #c2412f; } #phone .task .h i { display: block; font-size: 11.5px; opacity: .65; }
#phone .task .rw { display: flex; gap: 6px; margin-top: 3px; align-items: center; } #phone .task .rw button { font: 800 11px "Segoe UI", sans-serif; border: 1.5px solid #2b2235; background: #fffaf0; border-radius: 9px; padding: 1px 8px; cursor: pointer; }
#phone .task .rw small { margin-left: auto; font-size: 11px; opacity: .6; }
#phone .inp { display: flex; gap: 7px; padding: 7px 9px 10px; background: var(--bg); align-items: center; }
#phone .inp input { flex: 1; min-width: 0; font: 600 16px "Segoe UI", sans-serif; padding: 8px 12px; border: 2px solid rgba(43,34,53,.2); border-radius: 20px; outline: none; background: #fff; } #phone .inp input:focus { border-color: var(--acc); }
#phone .inp input:disabled { opacity: .55; } #phone .inp .send { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--acc); color: #fff; font: 900 18px "Segoe UI Symbol", sans-serif; cursor: pointer; flex: 0 0 auto; }
#phone .gr { display: inline-block; font: 900 12px Bahnschrift, sans-serif; color: #fff; border: 2px solid #2b2235; border-radius: 99px; padding: 0 7px; margin-left: 5px; vertical-align: 1px; }
#phone .gr.g-S { background: #e0a020; } #phone .gr.g-A { background: #21a493; } #phone .gr.g-B { background: #3f7fc9; } #phone .gr.g-C { background: #8a5ab0; } #phone .gr.g-D { background: #8a8f9e; }
#phone .tabs { display: flex; background: #fff; border-bottom: 2px solid rgba(43,34,53,.08); } #phone .tabs button { flex: 1; border: 0; background: none; font: 800 13px "Segoe UI", sans-serif; padding: 7px; cursor: pointer; opacity: .55; }
#phone .tabs button.on { opacity: 1; box-shadow: inset 0 -3px 0 var(--acc); }
#phone .lst { flex: 1; min-height: 0; overflow-y: auto; background: #fff; }
#phone .lst .r1 { display: flex; gap: 10px; align-items: center; padding: 9px 10px; border-bottom: 1px solid rgba(43,34,53,.07); cursor: pointer; } #phone .lst .r1:hover { background: rgba(43,34,53,.04); }
#phone .lst .r1 .av { border-color: rgba(43,34,53,.1); } #phone .lst .r1 .ttl small { opacity: .7; font-size: 12.5px; } #phone .lst .badge { background: var(--acc); color: #fff; border-radius: 99px; font: 800 11px "Segoe UI", sans-serif; padding: 1px 7px; }
#phone .lst .r1.want { box-shadow: inset 4px 0 0 var(--acc); } #phone .lst .empty { padding: 30px 20px; text-align: center; opacity: .6; font-size: 14px; }
#phone .mo { padding: 10px 12px; border-bottom: 1px solid rgba(43,34,53,.08); display: flex; gap: 9px; } #phone .mo .av { width: 36px; height: 36px; border-color: rgba(43,34,53,.1); }
#phone .mo .who { font-weight: 800; color: #3f5f9a; font-size: 14px; } #phone .mo .tx { font-size: 14.5px; line-height: 1.38; } #phone .mo canvas.pic { width: 100%; max-width: 220px; border-radius: 8px; margin-top: 4px; }
#phone .mo .lk { margin-top: 4px; font-size: 12px; } #phone .mo .lk button { border: 0; background: rgba(43,34,53,.06); border-radius: 8px; font: 800 12px "Segoe UI", sans-serif; padding: 2px 8px; cursor: pointer; }
#phone .shake { animation: ph-shake .35s; } @keyframes ph-shake { 20% { transform: translateX(-7px); } 45% { transform: translateX(6px); } 70% { transform: translateX(-3px); } }
#phone .mo .lk button.cmb { margin-left: 3px; } #phone .mo .lk button.want { background: var(--acc); color: #2b2235; box-shadow: 0 0 0 2px #2b2235; }
#phone .mo .likes { font-size: 12px; color: #3f5f9a; font-weight: 700; background: rgba(43,34,53,.055); border-radius: 6px 6px 0 0; padding: 3px 7px; margin-top: 5px; }
#phone .mo .cms { background: rgba(43,34,53,.055); border-radius: 0 0 6px 6px; padding: 3px 7px 5px; font-size: 13.5px; line-height: 1.42; } #phone .mo .cms:first-child, #phone .mo .lk + .cms { border-radius: 6px; margin-top: 5px; }
#phone .mo .likes + .cms { border-top: 1px solid rgba(43,34,53,.09); } #phone .mo .cms .c { margin: 2px 0; } #phone .mo .cms .c .who2 { color: #3f5f9a; font-weight: 800; }
#phone .mo .cms .c .enl { display: block; font-size: 11px; font-style: italic; opacity: .62; } #phone.no-en .mo .cms .c .enl { display: none; } #phone .mo .cms .c.miss { opacity: .55; text-decoration: line-through rgba(43,34,53,.3); }
#phone .mo .cms .mimo { margin: 4px 0; max-width: 100%; } #phone .mo.on { background: #fffbe8; box-shadow: inset 4px 0 0 var(--acc); }
#phone .tabs button i.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #e8457a; margin-left: 5px; vertical-align: 2px; }
#phone .hbd { position: absolute; inset: 0; z-index: 3; background: rgba(25,15,40,.55); display: grid; place-items: center; }
#phone .hbd .hbc { width: 86%; max-width: 320px; max-height: 84%; overflow-y: auto; background: #fffaf0; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
#phone .hbd .top { background: #d8402f; color: #ffe9a8; text-align: center; padding: 14px 10px 14px; border-radius: 16px 16px 50% 50% / 16px 16px 26px 26px; }
#phone .hbd .top b { display: block; font-size: 15px; } #phone .hbd .top small { display: block; font-size: 12px; opacity: .9; margin-top: 2px; } #phone .hbd .top .amt { font: 900 34px Bahnschrift, sans-serif; color: #ffd23f; margin-top: 6px; }
#phone .hbd .row2 { display: flex; align-items: center; gap: 8px; padding: 7px 14px; border-bottom: 1px solid rgba(43,34,53,.07); font-size: 14px; }
#phone .hbd .row2 .av { width: 30px; height: 30px; font-size: 16px; } #phone .hbd .row2 .av canvas { width: 30px; height: 30px; } #phone .hbd .row2 .n { flex: 1; font-weight: 700; } #phone .hbd .row2 .bst { color: #d8402f; font-size: 11.5px; font-weight: 800; display: block; }
#phone .hbd .sum { font-size: 12px; opacity: .7; padding: 6px 14px 2px; } #phone .hbd .close { display: block; margin: 10px auto 12px; border: 0; background: #d8402f; color: #fff; border-radius: 99px; padding: 6px 22px; font: 800 14px "Segoe UI", sans-serif; cursor: pointer; }
#phone .pay { width: 228px; border-radius: 10px; overflow: hidden; margin: 4px 0 4px auto; box-shadow: 0 1px 0 rgba(43,34,53,.2); }
#phone .pay .pt { background: #2e3a59; color: #fbe7b2; padding: 9px 11px; display: flex; gap: 10px; align-items: center; } #phone .pay .pt b { font: 900 22px Bahnschrift, sans-serif; color: #e9b949; white-space: nowrap; } #phone .pay .pt span { font-size: 12.5px; font-weight: 700; line-height: 1.3; }
#phone .pay .pb { background: #fff; font-size: 12px; padding: 4px 11px; color: #5d5470; }
#phone .scan { position: absolute; inset: 0; z-index: 3; background: #111a2e; display: grid; place-items: center; color: #fbe7b2; font: 800 15px "Segoe UI", "Microsoft YaHei", sans-serif; }
#phone .scan .vf { width: 180px; height: 180px; position: relative; border: 4px solid #e9b949; border-radius: 10px; margin: 0 auto 14px; background: repeating-conic-gradient(#e8e4dc 0 25%, #1f2a44 0 50%) 0 0 / 20px 20px; }
#phone .scan .vf i { position: absolute; left: 6px; right: 6px; height: 3px; background: #e9b949; box-shadow: 0 0 12px #e9b949; animation: ph-scan 0.9s linear infinite; } @keyframes ph-scan { 0% { top: 6px; } 100% { top: calc(100% - 9px); } }
#phone .scan .vf b { position: absolute; width: 44px; height: 44px; background: #1f2a44; box-shadow: inset 0 0 0 6px #1f2a44, inset 0 0 0 12px #e8e4dc; } #phone .scan .vf b.f1 { left: 8px; top: 8px; } #phone .scan .vf b.f2 { right: 8px; top: 8px; } #phone .scan .vf b.f3 { left: 8px; bottom: 8px; }
body.phone-open #objective, body.phone-open #compass, body.phone-open #minimap, body.phone-open #help, body.phone-open .bubble, body.phone-open #thought, body.phone-open .prompt { display: none !important; }
#chip-phone.hidden, #chip-phone .ph-badge.hidden { display: none !important; } #chip-phone button { position: relative; } #chip-phone .ph-badge { position: absolute; top: -9px; right: -12px; min-width: 16px; height: 16px; border-radius: 99px; background: #e8457a; color: #fff; font: 800 10.5px/16px "Segoe UI", sans-serif; text-align: center; padding: 0 4px; border: 2px solid #fffaf0; }
`;
  const D = { root: null };
  const S = { open: false, cur: null, view: 'list', pending: null, en: true };
  function dom() {
    if (D.root) return D;
    if (!document.getElementById('phone-css')) { const st = document.createElement('style'); st.id = 'phone-css'; st.textContent = CSS; document.head.appendChild(st); }
    const r = document.createElement('div'); r.id = 'phone'; r.className = 'hidden';
    r.innerHTML = `<div class="sh"></div><div class="ph"><div class="scr"><div class="sb"><span class="clk">08:02</span><span class="app"></span><span>▮▮▮ 92%</span></div>`
      + `<div class="hdr"><button class="bk" title="Back">‹</button><div class="av"></div><div class="ttl"><b></b><small></small></div><button class="en" title="Help: each message in English">EN</button><button class="x" title="Close (Esc)">✕</button></div>`
      + `<div class="tabs hidden"><button data-v="list"></button><button data-v="moments"></button></div><div class="bd"></div><div class="lst hidden"></div><div class="typ"></div>`
      + `<div class="task hidden"><div class="k">Your reply</div><div class="g"></div><div class="h"></div><div class="rw"><button class="help" type="button">Help (Tab)</button><small></small></div></div>`
      + `<div class="inp"><input spellcheck="false" autocomplete="off"><button class="send" title="Send">➤</button></div></div></div>`;
    document.body.appendChild(r);
    const q = s => r.querySelector(s);
    Object.assign(D, { root: r, scr: q('.scr'), clk: q('.clk'), app: q('.sb .app'), bk: q('.bk'), av: q('.hdr .av'), ttl: q('.ttl b'), sub: q('.ttl small'), en: q('.hdr .en'), x: q('.hdr .x'), tabs: q('.tabs'),
      bd: q('.bd'), lst: q('.lst'), typ: q('.typ'), task: q('.task'), tg: q('.task .g'), th: q('.task .h'), help: q('.task .help'), note: q('.task small'), inp: q('.inp'), input: q('.inp input'), send: q('.inp .send') });
    if (typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(D.input);
    D.x.onclick = () => close();
    D.bk.onclick = () => list();
    D.sh = q('.sh'); D.sh.onclick = () => close();
    D.en.onclick = () => { S.en = !S.en; try { TALK.state.en = S.en; } catch (e) { /* */ } r.classList.toggle('no-en', !S.en); D.en.classList.toggle('off', !S.en); };
    const sub = () => { if (S.pending) S.pending.submit(D.input.value); };
    D.send.onclick = sub;
    D.input.addEventListener('keydown', e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter') { e.preventDefault(); sub(); } });
    D.help.onclick = () => S.pending && S.pending.help();
    D.tabs.querySelectorAll('button').forEach(b => b.onclick = () => (b.dataset.v === 'moments' ? moments() : list()));
    return D;
  }
  function applySkin() {
    const k = skin(); dom();
    const st = D.root.style; st.setProperty('--hd', k.hd); st.setProperty('--acc', k.acc); st.setProperty('--bg', k.bg); st.setProperty('--dot', k.dot); st.setProperty('--me', k.me); st.setProperty('--them', k.them);
    D.root.className = (S.open ? '' : 'hidden') + ' p-' + k.pattern + ' ph-' + L() + (S.en ? '' : ' no-en') + (w92() ? ' w92' : '');
    D.app.innerHTML = `<i>${E(k.logo)}</i>${E(k.app)}`;
    D.input.placeholder = k.msg;
  }

  // ============================================================ chats and their messages (saved: G.state.talk.phone.chats)
  // a message: { from ('me' | a member), t, en, audio: { t, en, dur }, sticker, img, sys, gift: { t, en, coins, best, open },
  //              mimo: { diff, tips, model }, grade, miss, tm (the time shown), read, played, tr (transcript shown), n (order) }
  const chatDef = id => ((C() && C().chats) || {})[id] || { title: id, members: [id] };
  const member = k => ((C() && C().members) || {})[k] || { name: TALK.nameOf(k) || k, color: '#8a5a48', face: k };
  // a member's name as plain text in the mode (zh / ja names come in the notation), and as the notation for lines
  const nmP = k => (k === 'me' ? (skin().me || 'Me') : plain(member(k).name || k));
  const nmS = k => (k === 'me' ? (skin().you || 'you') : (member(k).name || k));
  const nmE = k => (k === 'me' ? 'you' : (member(k).en || nmP(k)));             // (for the English under a line: members' en names)
  const chatState = id => { const ch = P().chats; return ch[id] || (ch[id] = { msgs: [], unread: 0 }); };
  const mainOf = id => (chatDef(id).members || [id])[0];
  let seq = 0;
  function visibleChats() {
    const defs = (C() && C().chats) || {}, ch = P().chats, out = [];
    for (const id of Object.keys(defs)) if ((ch[id] && ch[id].msgs.length) || (!defs[id].group && P().contacts[id])) out.push(id);
    for (const id of Object.keys(ch)) if (!out.includes(id) && ch[id].msgs.length) out.push(id);
    const last = id => { const m = (ch[id] && ch[id].msgs) || []; return m.length ? m[m.length - 1].n || 0 : -1; };
    return out.sort((a, b) => last(b) - last(a));
  }
  const unread = () => Object.values(P().chats || {}).reduce((s, c) => s + (c.unread || 0), 0);
  const available = () => { try { return !!G && TALK.ready() && !!C() && (Object.keys(P().contacts).length > 0 || Object.values(P().chats).some(c => c.msgs.length)); } catch (e) { return false; } };
  function avatarHTML(id) {
    const d = chatDef(id);
    if (d.avatar && d.avatar.emoji) return { html: E(d.avatar.emoji), bg: d.avatar.bg || '#ffe3b0' };
    return { html: `<canvas data-face="${E(d.face || mainOf(id))}" width="76" height="76"></canvas>`, bg: '#ffe9c2' };
  }
  const waveBars = n => Array.from({ length: n }, (_, i) => `<i style="height:${6 + Math.round(Math.abs(Math.sin(i * 1.7) * 14 + Math.sin(i * 0.37) * 6))}px"></i>`).join('');
  function msgHTML(id, m, i) {
    const k = skin(), d = chatDef(id);
    if (m.sys) { const sx = mix(m.sys, m.en); return `<div class="sys"><span>${sx.html}${m.en && S.en ? ` · ${E(m.en)}` : ''}</span></div>`; }
    if (m.mimo) {
      const nm = E((G && G.state && G.state.mimoName) || 'Mimo'), ec = m.mimo.echo || null;
      return `<div class="mimo"><canvas data-mimo="1" width="56" height="56"></canvas><div><b style="font-size:11px;color:#13786b;text-transform:uppercase;letter-spacing:.05em">${nm}</b>`
        + (ec ? `<div class="ech">${ec.map(w => `<b>${wordHTML(w)}!</b>`).join('')}<small>${nm} says the new ${ec.length > 1 ? 'words' : 'word'} back. Try ${ec.length > 1 ? 'them' : 'it'} in your reply!</small></div>` : '')
        + (m.mimo.diff ? `<div class="fx">${m.mimo.diff}</div>` : m.mimo.model ? `<div class="fx">${txt(m.mimo.model)}</div>` : '')
        + (m.mimo.tips && m.mimo.tips.length ? `<ul>${m.mimo.tips.map(t => `<li>${E(t)}</li>`).join('')}</ul>` : '') + '</div></div>';
    }
    const me = m.from === 'me', who = member(m.from), group = !!d.group || (d.members || []).length > 1;
    const nm = !me && group ? `<b class="nm" style="color:${E(who.color || '#8a5a48')}">${E(nmP(m.from))}</b>` : '';
    const mini = !me && group ? `<div class="mini"><canvas data-face="${E(who.face || m.from)}" width="56" height="56"></canvas></div>` : '';
    const wrap = h => (mini ? `<div class="row">${mini}${h}</div>` : h);
    const mx = !me && m.t ? mix(m.t, m.en, m.force) : null;
    const en = m.en ? `<span class="enl${mx ? ' ' + enCls(mx) : ''}">${E(m.en)}</span>` : '';
    const gr = me && m.grade ? `<span class="gr g-${E(m.grade)}">${E(m.grade)}</span>` : '';
    const tm = `<span class="tm">${E(m.tm || '')}${me && k.read && m.read ? `<i>${E(k.read)}</i>` : ''}${gr}</span>`;
    if (m.teach) {     // (new words before a question: the sentence that uses them, each highlighted, with its English and a picture)
      const tc = m.teach, ws = tc.words || [], mark = new Map(ws.map(w => [w.id, w.en]));
      const sent = tc.t ? (mixOn() ? MIX.tlHTML(tc.t, mark) : txt(tc.t)) : '';
      return wrap(`<div class="m them teach">${nm}<span class="tg">✨ New ${ws.length > 1 ? 'words' : 'word'} for the next question</span><div class="nws">${ws.map(w => { const ic = iconFor(w); return `<span class="nw">${ic ? `<img src="${ic}" alt="">` : ''}<b>${wordHTML(w)}</b><i>${E(w.en || '')}</i></span>`; }).join('')}</div>`
        + `${sent ? `<div class="tx">«${sent}»</div>` : ''}${tc.en ? `<span class="enl">${E(tc.en)}</span>` : ''}${tm}</div>`);
    }
    if (m.sticker) return wrap(`<div class="stk ${me ? 'me' : 'them'}">${nm}<canvas data-art="${E(m.sticker)}" width="240" height="240"></canvas></div>`);
    if (m.gift) {      // (a group gift, count > 1, is a lucky draw: shares of different sizes, the biggest is 手气最佳)
      const g = m.gift, grp = g.count > 1, gone = grp && (g.order || []).length >= g.count, gx = mix(g.t || '', g.en);
      const st = g.open ? ` · 🪙 ${g.coins || 0}${g.best ? ` · ${k.best || '★'}` : ''}` : gone ? ` · ${k.allGone || '—'}` : '';
      return wrap(`<div class="gift ${me ? 'me' : ''} ${g.open || gone ? 'open' : ''}" data-i="${i}"><div class="gt"><b>🧧</b><span>${gx.html}${g.en ? `<span class="enl ${enCls(gx)}">${E(g.en)}</span>` : ''}</span></div><div class="gb">${E(grp ? (k.luckyGift || k.gift) : k.gift)}${st}</div></div>`);
    }
    if (m.pay) return `<div class="pay"><div class="pt"><b>🪙 ${E(m.pay.total)}</b><span>${E(k.payTo || '→')} ${E(nmP(m.pay.to))}${m.pay.items ? `<br>${E(m.pay.items)}` : ''}</span></div><div class="pb">${E(k.app)} · ${E(m.tm || '')}</div></div>`;
    if (m.audio) {
      const a = m.audio;
      return wrap(`<div class="m ${me ? 'me' : 'them'} au ${m.played ? 'played' : ''}" data-i="${i}">${nm ? nm.replace('class="nm"', 'class="nm" style="flex-basis:100%"') : ''}<button class="play" title="${E(k.voice)}">▶</button><div class="wave">${waveBars(26)}</div>`
        + `<span class="dur">${E(a.dur || '0:08')}</span><button class="trb">${E(k.tr)}</button><div class="trx ${m.tr ? '' : 'hidden'}">${txt(a.t)}${a.en ? `<span class="enl">${E(a.en)}</span>` : ''}</div>${tm}</div>`);
    }
    const pic = m.img ? `<canvas class="pic" data-art="${E(m.img)}" width="500" height="360"></canvas>` : '';
    return wrap(`<div class="m ${me ? 'me' : 'them'} ${m.miss ? 'miss' : ''}">${nm}${pic}${m.t ? `<div class="tx"${mx && !mx.full ? ` title="${E(plain(m.t))}"` : ''}>${me ? E(m.t) : mx.html}</div>` : ''}${en}${tm}</div>`);
  }
  function wire(id, scope) {
    const c = chatState(id);
    scope.querySelectorAll('canvas[data-mimo]').forEach(cv => { if (!cv._done) { cv._done = true; try { TALKUI.mimoFace(cv); } catch (e) { /* */ } } });
    paint(scope);
    scope.querySelectorAll('.au[data-i]').forEach(el => {
      const m = c.msgs[+el.dataset.i]; if (!m || !m.audio) return;
      el.querySelector('.play').onclick = () => {
        m.played = true; el.classList.add('played');
        const ok = TALKUI.speak(m.audio.t);
        if (!ok) { m.tr = true; el.querySelector('.trx').classList.remove('hidden'); if (!S.noVoice) { S.noVoice = true; try { UI.toast(`No ${(UI.LANGNAME || {})[L()] || ''} voice on this computer: here’s what it says.`); } catch (e) { /* */ } } }
      };
      el.querySelector('.trb').onclick = () => { m.tr = !m.tr; m.played = true; el.querySelector('.trx').classList.toggle('hidden', !m.tr); };
    });
    scope.querySelectorAll('.gift[data-i]').forEach(el => {
      const m = c.msgs[+el.dataset.i]; if (!m || !m.gift) return;
      el.onclick = () => {
        if (m.from === 'me') return;
        if (m.gift.count > 1) { grab(id, m); return; }
        if (m.gift.open) return;
        m.gift.open = true; if (G && G.state) G.state.coins = (G.state.coins || 0) + (m.gift.coins || 0); snd('coins'); render(id); giftDone(m);
      };
    });
  }
  function render(id) {
    if (!D.root || S.cur !== id || S.view !== 'chat') return;
    const c = chatState(id);
    D.bd.innerHTML = c.msgs.map((m, i) => msgHTML(id, m, i)).join('');
    wire(id, D.bd); D.bd.scrollTop = 1e6;
  }
  function push(id, m) {
    const c = chatState(id);
    m.tm = m.tm || clock(); m.n = ++seq + Math.round(((G && G.state && G.state.time) || 0) * 1000);
    c.msgs.push(m); if (c.msgs.length > 200) c.msgs.splice(0, c.msgs.length - 200);
    if (!(S.open && S.cur === id && S.view === 'chat') && m.from !== 'me' && !m.mimo) c.unread = (c.unread || 0) + 1;
    if (S.open && S.cur === id && S.view === 'chat') {
      const w = document.createElement('div'); w.innerHTML = msgHTML(id, m, c.msgs.length - 1);
      wire(id, w); while (w.firstChild) D.bd.appendChild(w.firstChild); D.bd.scrollTop = 1e6;
    }
    chip();
    return m;
  }
  // lowercase texting (TALK.fill capitalizes a line's first letter): a member with lower: true keeps every message's start
  // lowercase; a thread step (or moment) with raw: true keeps its own lowercase start («gente!!!»)
  const unCap = s => String(s || '').replace(/^(\s*[¿¡«"“'(]*)(\p{Lu})/u, (m, p, c) => p + c.toLowerCase());
  const lowStart = src => /^\s*[¿¡«"“'(]*\p{Ll}/u.test(String(src || ''));
  const keepLow = (who, src, raw) => !isC() && ((member(who).lower) || (raw && lowStart(src)));
  const fillT = (src, who, raw) => { const t = TALK.fill(src || '', {}); return keepLow(who, src, raw) ? unCap(t) : t; };
  // someone posts (live: the chat is open, so first "… is typing")
  async function post(id, line, live) {
    const who = line.who || mainOf(id), m = { from: who, t: line.t || '', en: line.en || '' };
    if (m.t && !isC() && member(who).lower) m.t = unCap(m.t);
    if (line.audio) { const a = TALK.lineOf(line.audio); m.audio = { t: fillT(a.t, who, line.raw), en: TALK.fill(a.en, {}, true), dur: '0:' + String(Math.min(59, 3 + Math.round(plain(a.t).length / 7))).padStart(2, '0') }; m.t = ''; m.en = ''; }
    if (line.sticker) { m.sticker = line.sticker; m.t = ''; m.en = ''; }
    if (line.img) m.img = line.img;
    if (line.gift) m.gift = Object.assign({}, line.gift);
    if (line.force && line.force.size && m.t) m.force = [...line.force];          // (words just taught in this chat: in the language, glossed)
    if (m.t && m.en && mixOn()) try { MIX.line(m.t, m.en, { count: true, force: m.force }); } catch (e) { /* (count its woven words once, as it arrives) */ }
    if (live && S.open && S.cur === id) {
      D.typ.textContent = skin().typing(nmP(who));
      await tick(Math.min(1500, 380 + (plain(m.t).length || 12) * 20));
      D.typ.textContent = '';
    }
    push(id, m);
    if (live) snd('pip');
    await tick(180);
    return m;
  }
  // your messages are read a moment later (no receipts in 信鸽)
  function readAll(id) { const c = chatState(id); c.msgs.forEach(m => { if (m.from === 'me') m.read = true; }); render(id); }

  // ============================================================ 红包 in a group (信鸽): 抢红包, a lucky draw
  // A gift with count > 1 is a group gift: its total is split into random shares when it's posted. The others in the group grab
  // theirs while you watch (a gray line each); yours is kept for you until you tap it. When the last share is gone, the biggest
  // is 手气最佳. Coins only, never money. A gift with wait: the thread goes on once you've opened it (its run.best says whether
  // you got 手气最佳, for steps with if: { best }).
  function splitShares(total, count) {            // (everyone gets at least half a fair share; the rest falls at random)
    const n = Math.max(1, count | 0), T0 = Math.max(n, total | 0), base = Math.max(1, Math.floor(T0 / n / 2)), rest = T0 - base * n, cuts = [];
    for (let k = 0; k < n - 1; k++) cuts.push(Math.floor(Math.random() * (rest + 1)));
    const pts = [0, ...cuts.sort((a, b) => a - b), rest];
    return pts.slice(1).map((p, k) => base + p - pts[k]);
  }
  function sharePosted(m) { const g = m.gift; if (!g || !(g.count > 1) || g.shares) return; g.shares = splitShares(g.total || g.count * 5, g.count); g.got = {}; g.order = []; }
  const grabLine = (who, from) => (skin().grabbed ? skin().grabbed(nmS(who), nmS(from)) : `🧧 ${plain(nmS(who))}`);
  // the next share goes to who (shares are taken in order; the last one is always kept for you)
  function take(id, m, who) {
    const g = m.gift; if (!g.shares || g.got[who] != null || g.order.length >= g.count) return false;
    if (who !== 'me' && g.got.me == null && g.count - g.order.length <= 1) return false;
    g.got[who] = g.shares[g.order.length]; g.order.push(who);
    if (who !== 'me') push(id, { sys: grabLine(who, m.from), en: `${nmE(who)} took a share of ${nmE(m.from)}’s red envelope` });
    if (g.order.length >= g.count) {
      let bw = g.order[0]; g.order.forEach(w => { if (g.got[w] > g.got[bw]) bw = w; });
      g.bestWho = bw; g.done = true; g.best = bw === 'me';
      if (skin().bestIs) push(id, { sys: skin().bestIs(nmS(bw)), en: `Best luck: ${nmE(bw)}` });
    }
    return true;
  }
  // the others grab while the chat is open, a moment apart (they never take your share)
  const grabbing = new Set();
  function grabOthers(id, m) {
    const g = m.gift; if (!g || !(g.count > 1) || g.done || grabbing.has(m.n)) return;
    sharePosted(m); grabbing.add(m.n);
    const next = () => {
      if (!S.open || S.cur !== id) { grabbing.delete(m.n); return; }
      const w = (g.grab || []).find(x => g.got[x] == null);
      if (!w || !take(id, m, w)) { grabbing.delete(m.n); render(id); return; }
      render(id); snd('pip');
      setTimeout(next, T.fast ? 0 : 1100);
    };
    setTimeout(next, T.fast ? 0 : 1500);
  }
  function grab(id, m) {
    const g = m.gift; sharePosted(m);
    if (!g.open) {
      push(id, { sys: grabLine('me', m.from), en: `You took a share of ${nmE(m.from)}’s red envelope` });
      take(id, m, 'me'); g.open = true; g.coins = g.got.me || 0;
      if (G && G.state) G.state.coins = (G.state.coins || 0) + g.coins;
      snd('coins');
      (g.grab || []).forEach(w => take(id, m, w));            // (whoever hasn't grabbed yet does now)
      render(id); giftDone(m);
    }
    giftCard(id, m);
  }
  const giftWaiting = id => chatState(id).msgs.some(m => m.gift && m.gift.count > 1 && !m.gift.open);
  // the 红包's card: whose it is, your share, everyone's, and 手气最佳
  function giftCard(id, m) {
    const g = m.gift, k = skin(); if (!D.scr) return;
    const old = D.scr.querySelector('.hbd'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'hbd';
    const rows = (g.order || []).map(w => `<div class="row2"><div class="av">${w === 'me' ? '<canvas data-mimo="1" width="60" height="60"></canvas>' : `<canvas data-face="${E(member(w).face || w)}" width="60" height="60"></canvas>`}</div>`
      + `<div class="n">${E(nmP(w))}${g.done && g.bestWho === w ? `<span class="bst">👑 ${E(k.best || 'Best luck')}</span>` : ''}</div><b>🪙 ${E(g.got[w])}</b></div>`).join('');
    el.innerHTML = `<div class="hbc"><div class="top"><b>${txt(k.giftOf ? k.giftOf(nmS(m.from)) : nmP(m.from))}</b><small>${txt(g.t || '')}</small><div class="amt">🪙 ${E(g.coins || 0)}</div></div>`
      + `<div class="sum">${k.shares ? txt(k.shares(g.count, g.total || 0)) : E(g.count + ' · 🪙 ' + (g.total || 0))}</div>${rows}<button class="close">OK</button></div>`;
    D.scr.appendChild(el);
    el.querySelectorAll('canvas[data-mimo]').forEach(cv => { try { TALKUI.mimoFace(cv); } catch (e) { /* */ } }); paint(el);
    const shut = () => el.remove();
    el.querySelector('.close').onclick = shut; el.onclick = e => { if (e.target === el) shut(); };
  }
  // a thread waiting on this gift goes on
  function giftDone(m) {
    for (const th of threadsOf()) {
      const run = P().run[th.id];
      if (run && run.waitGift === m.n) { run.waitGift = null; run.best = !!(m.gift && m.gift.best); run.step++; advance(th, S.open && S.cur === th.chat); return; }
    }
  }
  // a step's own condition: { best: true | false } (the last group gift's 手气最佳), or a function (state, run)
  function stepIf(c, run) {
    if (typeof c === 'function') { try { return !!c(G && G.state, run); } catch (e) { return false; } }
    if (c.best !== undefined && !!run.best !== !!c.best) return false;
    return true;
  }

  // ============================================================ threads: story events → messages → your reply (a TALK turn)
  const threadsOf = () => (C() && C().threads) || [];
  const threadById = id => threadsOf().find(t => t.id === id) || null;
  function whenOK(th) {
    const w = th.when || {}, f = (G && G.state && G.state.flags) || {}, ph = P();
    if (typeof w === 'function') { try { return !!w(G.state); } catch (e) { return false; } }
    if (w.contact && !ph.contacts[w.contact]) return false;
    for (const k of arr(w.flag || w.flags)) if (!f[k]) return false;
    if (w.bond) for (const [id, r] of Object.entries(w.bond)) if (TALK.rank(id) < r) return false;
    for (const id of arr(w.after)) if (!(ph.run[id] && ph.run[id].done)) return false;
    if (typeof w.test === 'function') { try { if (!w.test(G.state)) return false; } catch (e) { return false; } }
    return true;
  }
  const busyNow = () => (typeof STORY !== 'undefined' && (STORY.line || STORY.busy)) || (G && G.state && G.state.teaching && !S.open) || (typeof TALK !== 'undefined' && TALK.busy);
  // the time realms (past.js, future.js): no messages from today while you're in yesterday or tomorrow; they come when you're back
  // (and the final act's places, finale.js FIN.quiet: the Old Tower, inside the Hush, the old theater at eight)
  const inRealm = () => (typeof PAST !== 'undefined' && !!PAST.inside) || (typeof FUTURE !== 'undefined' && !!FUTURE.inside) || (typeof FIN !== 'undefined' && !!FIN.quiet && FIN.quiet());
  function check() {
    if (!G || !G.state || !TALK.ready() || !C()) return;
    const ph = P(), now = G.state.time || 0;
    ph.seen = ph.seen || {};
    for (const th of threadsOf()) {
      if (ph.run[th.id]) continue;
      if (!whenOK(th)) { delete ph.seen[th.id]; continue; }
      if (ph.seen[th.id] == null) ph.seen[th.id] = now;
      if (now - ph.seen[th.id] < (th.delay || 0) || busyNow() || inRealm()) continue;
      fire(th); break;
    }
  }
  const advancing = new Set();
  function fire(th) { P().run[th.id] = { step: 0 }; advance(th, S.open && S.cur === th.chat); }
  async function advance(th, live) {
    if (advancing.has(th.id)) return; advancing.add(th.id);
    const run = P().run[th.id]; let first = null, n = 0, moWho = null;
    try {
      while (run.step < th.steps.length) {
        if (run.waitGift) break;
        const st = th.steps[run.step];
        if (st.if && !stepIf(st.if, run)) { run.step++; continue; }
        if (st.turn) { run.wait = true; break; }
        if (st.sys) push(th.chat, { sys: TALK.fill(st.sys, {}), en: TALK.fill(st.en || '', {}, true) });
        else if (st.moment) {       // (a 朋友圈 post: likes, the others' comments, and yours: a turn of its own, or content's 'moment.comment')
          const mo = st.moment;
          (P().moments = P().moments || []).unshift({ who: mo.who, t: fillT(mo.t, mo.who, mo.raw), en: TALK.fill(mo.en || '', {}, true), img: mo.img, likes: (mo.likes || []).slice(), tm: clock(), id: th.id + '.' + run.step,
            comments: (mo.comments || []).map(c => ({ who: c.who, to: c.to || null, t: fillT(c.t, c.who, c.raw), en: TALK.fill(c.en || '', {}, true) })) });
          P().moNew = true; moWho = mo.who;
        }
        else {
          const m = await post(th.chat, Object.assign({}, st, { t: fillT(st.t, st.who || mainOf(th.chat), st.raw), en: TALK.fill(st.en || '', {}, true) }), live); if (!first && !m.sys) first = m; n++;
          if (m.gift && m.gift.count > 1) { sharePosted(m); if (live) grabOthers(th.chat, m); if (st.gift.wait) { run.waitGift = m.n; break; } }
        }
        run.step++;
      }
      if (run.step >= th.steps.length) { run.done = true; run.wait = false; }
    } finally { advancing.delete(th.id); }
    if (!live && first) {
      snd('pip');
      const who = nmP(first.from), what = first.audio ? '🎤 ' + skin().voice : first.sticker ? '🖼️' : first.gift ? '🧧 ' + skin().gift : plain(first.t).slice(0, 48);
      try { UI.toast(`📱 ${plain(who)}: ${what}${n > 1 ? ` (+${n - 1})` : ''}`); } catch (e) { /* */ }
    }
    if (moWho && !(S.open && S.view === 'moments')) { try { UI.toast(`📱 ${skin().moments || ''}: ${nmP(moWho)}`); } catch (e) { /* */ } chip(); }
    if (G && G.save) G.save();
    if (run.wait && S.open && S.cur === th.chat && S.view === 'chat') answer(th);
  }
  const waitingIn = id => threadsOf().find(th => th.chat === id && P().run[th.id] && P().run[th.id].wait && !P().run[th.id].done) || null;
  let answering = null;
  async function answer(th) {
    if (answering) return;
    answering = th.id;
    const run = P().run[th.id], st = th.steps[run.step];
    const ctx = { view: chatView(th.chat), who: mainOf(th.chat), band: th.band || st.turn.band || 1, grades: [], coins: 0 };
    const tn = Object.assign({}, st.turn, run.asked ? { ask: null } : {});
    run.asked = true;
    let res = null;
    try { res = await TALK.turn(tn, ctx); } catch (e) { console.error('[phone] turn', e); }
    answering = null;
    S.pending = null; taskOff();
    if (!res || res.quit) return;                    // (the phone closed: the reply still waits for you)
    if (ctx.coins && G && G.state) G.state.coins = (G.state.coins || 0) + ctx.coins;
    run.step++; run.wait = false; run.asked = false;
    await advance(th, S.open && S.cur === th.chat);
  }
  // the view TALK.turn talks to, in a chat: their lines are messages, yours too (with the grade), Mimo's fix is a note
  function chatView(id) {
    return {
      async npc(line) { await post(id, line, true); },
      you(text) {
        const m = push(id, { from: 'me', t: text });
        setTimeout(() => readAll(id), T.fast ? 0 : 900);
        return { grade(g) { m.grade = g; render(id); }, miss() { m.miss = true; render(id); if (D.scr) { D.scr.classList.remove('shake'); void D.scr.offsetWidth; D.scr.classList.add('shake'); } snd('wrong'); } };
      },
      async mimo(x) { push(id, { mimo: { diff: x.diff || '', tips: x.tips || [], model: x.model ? x.model.t : '' } }); },
      async model(x) { if (S.pending) S.pending.show(3, x); },
      sys(t) { push(id, { sys: t }); },
      // new words before the question (talk.js preteach): who asks shows them in a sentence, then Mimo says them back
      async teach(pre) {
        if (!pre || !pre.words || !pre.words.length) return;
        const who = pre.who || mainOf(id);
        if (S.open && S.cur === id) { D.typ.textContent = skin().typing(nmP(who)); await tick(700); D.typ.textContent = ''; }
        push(id, { from: who, teach: { t: pre.line.t, en: pre.line.en, words: pre.words.map(w => ({ id: w.id, t: w.t, src: w.src, en: w.en })) } });
        snd('pip'); await tick(450);
        push(id, { mimo: { echo: pre.words.map(w => ({ id: w.id, t: w.t, src: w.src })) } });
        await tick(250);
      },
      input(task) {
        if (!S.open || S.cur !== id) return Promise.resolve(null);
        return new Promise(res => { S.pending = taskOn(task, res); });
      },
    };
  }
  function taskOn(task, res) {
    dom(); let help = task.help || 0; const rungs = task.rungs || [];
    D.task.classList.remove('hidden'); D.th.innerHTML = ''; D.note.textContent = '';
    if (task.goal && task.goalSrc && mixOn()) D.tg.innerHTML = MIX.html(task.goalSrc, task.goal, { pos: ['n', 'adj'], noFull: true, force: task.force }); else D.tg.textContent = task.goal || '';
    D.input.disabled = false; D.input.value = ''; setTimeout(() => { if (S.open) D.input.focus(); }, 40);
    const K = ['', 'Start like this', 'For example', 'You could say'];
    // (an example's new words, talk.js: taught right there, highlighted with their English, and taught in this chat from then on)
    const rungHTML = x => {
      if (!x.teach || !x.teach.length || !mixOn()) return txt(x.t);
      if (!x.taughtNow) { x.taughtNow = true; x.teach.forEach(w => { try { if (task.force) task.force.add(w.id); DICT.met(w.id, 'heard'); } catch (e) { /* */ } }); }
      return MIX.tlHTML(x.t, new Map(x.teach.map(w => [w.id, w.en]))) + `<span style="display:block;font:600 11.5px Segoe UI;color:#a0761a">${x.teach.map(w => `${wordHTML(w)} = ${E(w.en)}`).join(' · ')}</span>`;
    };
    const show = (n, x) => { help = Math.max(help, n); x = x || rungs[help - 1]; if (!x) return; D.th.innerHTML = `<span style="font:800 10.5px Segoe UI;letter-spacing:.07em;text-transform:uppercase;color:#8a4f80">${K[help]}</span> <b>${rungHTML(x)}</b>${x.en ? `<i>${E(x.en)}</i>` : ''}`; D.note.textContent = help >= 3 ? 'model shown: a D' : 'help costs a grade step'; D.help.classList.toggle('hidden', help >= 3); };
    D.help.classList.toggle('hidden', !rungs.some(Boolean));
    if (help) show(help);
    const p = {
      task,
      submit(t) { t = String(t || '').trim(); if (!t) return false; if (t === '?' || /^(idk|i don'?t know)$/i.test(t)) { p.help(); D.input.value = ''; return true; } S.pending = null; D.input.value = ''; D.input.disabled = true; res({ text: t, help }); return true; },
      help() { if (help >= 3 || !rungs.some(Boolean)) return false; help++; while (help < 3 && !rungs[help - 1]) help++; show(help); snd('click'); return true; },
      show, quit() { S.pending = null; res(null); },
    };
    return p;
  }
  function taskOff() { if (!D.root) return; D.task.classList.add('hidden'); D.input.disabled = true; D.input.value = ''; }

  // ============================================================ the screens: the chat list, a chat, moments (信鸽's 朋友圈)
  // (plainTitle: the app's own name, a logo rather than a line, so no ruby over it)
  function header(title, sub, av, plainTitle) {
    D.ttl.innerHTML = plainTitle ? E(title || '') : txt(title || ''); D.sub.textContent = sub || '';
    D.av.innerHTML = av.html; D.av.style.background = av.bg || '#ffe3b0'; D.av.style.color = '#2b2235'; paint(D.av);
  }
  function tabs(on) {
    const k = skin(), mo = !!k.moments && (P().moments || []).length > 0;
    D.tabs.classList.toggle('hidden', !mo);
    if (!mo) return;
    const [a, b] = D.tabs.querySelectorAll('button'); a.textContent = k.chats; b.textContent = k.moments;
    if (P().moNew && on !== 'moments') b.innerHTML = E(k.moments) + '<i class="dot"></i>';
    a.classList.toggle('on', on === 'list'); b.classList.toggle('on', on === 'moments');
  }
  function list(o = {}) {
    dom(); applySkin();
    if (S.pending) { const p = S.pending; S.pending = null; p.quit(); }
    S.view = 'list'; S.cur = null; taskOff(); D.typ.textContent = '';
    D.bd.classList.add('hidden'); D.lst.classList.remove('hidden'); D.inp.classList.add('hidden'); D.bk.classList.add('hidden');
    const k = skin(); header(k.app, k.chats, { html: E(k.logo), bg: '#fff' }, true); tabs('list');
    const ids = visibleChats();
    if (!ids.length) { D.lst.innerHTML = `<div class="empty">No messages yet.<br>People give you their number once you’re friends (rank 2 in “Talk freely”).</div>`; return; }
    D.lst.innerHTML = ids.map(id => {
      const d = chatDef(id), c = chatState(id), last = [...c.msgs].reverse().find(m => !m.sys && !m.mimo);
      const lt = last ? (last.from === 'me' ? '✓ ' : '') + (last.audio ? '🎤 ' + k.voice : last.sticker ? '🖼️' : last.gift ? '🧧 ' + k.gift : last.img && !last.t ? '📷' : plain(last.t)) : (d.group ? '' : '…');
      const av = avatarHTML(id), wait = waitingIn(id) || giftWaiting(id);
      return `<div class="r1 ${o.want === id || wait ? 'want' : ''}" data-id="${E(id)}"><div class="av" style="background:${E(av.bg)}">${av.html}</div><div class="ttl"><b>${txt(d.title || id)}</b><small>${E(String(lt).slice(0, 60))}</small></div>${c.unread ? `<span class="badge">${c.unread}</span>` : ''}</div>`;
    }).join('');
    paint(D.lst);
    D.lst.querySelectorAll('.r1').forEach(el => { el.onclick = () => show(el.dataset.id); });
  }
  // 朋友圈: posts with likes and comments. Each post takes one comment from you: a graded turn (the post's own, or content's
  // 'moment.comment'), and the poster replies under it. keep: re-draw while you're writing (the box stays open)
  function moments(keep) {
    dom(); const was = D.lst.scrollTop;
    S.view = 'moments'; S.cur = null;
    if (!keep) { if (S.pending) { const p = S.pending; S.pending = null; p.quit(); } taskOff(); D.inp.classList.add('hidden'); }
    D.bd.classList.add('hidden'); D.lst.classList.remove('hidden'); D.bk.classList.add('hidden');
    P().moNew = false;
    const k = skin(); header(k.app, k.moments || '', { html: E(k.logo), bg: '#fff' }, true); tabs('moments');
    const mo = P().moments || [];
    D.lst.innerHTML = mo.map((p, i) => momentHTML(p, i, k)).join('') || '<div class="empty">—</div>';
    D.lst.querySelectorAll('canvas[data-mimo]').forEach(cv => { if (!cv._done) { cv._done = true; try { TALKUI.mimoFace(cv); } catch (e) { /* */ } } });
    paint(D.lst);
    D.lst.querySelectorAll('[data-like]').forEach(b => b.onclick = () => { const p = mo[+b.dataset.like]; p.liked = !p.liked; snd('click'); moments(S.commenting); });
    D.lst.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => comment(+b.dataset.cm));
    if (keep) D.lst.scrollTop = was;
  }
  function momentHTML(p, i, k) {
    const who = member(p.who), likes = (p.likes || []).map(nmP).concat(p.liked ? [nmP('me')] : []);
    const can = !p.done && !!momentTurn(p), on = S.commenting && S.mo === i;
    const cms = (p.comments || []).map(c => (c.mimo
      ? `<div class="mimo"><canvas data-mimo="1" width="56" height="56"></canvas><div>${c.mimo.diff ? `<div class="fx">${c.mimo.diff}</div>` : c.mimo.model ? `<div class="fx">${txt(c.mimo.model)}</div>` : ''}${c.mimo.tips && c.mimo.tips.length ? `<ul>${c.mimo.tips.map(t => `<li>${E(t)}</li>`).join('')}</ul>` : ''}</div></div>`
      : (cx => `<div class="c ${c.miss ? 'miss' : ''}"><span class="who2">${E(nmP(c.who))}</span>${c.to ? ` ${E(k.reply || '→')} <span class="who2">${E(nmP(c.to))}</span>` : ''}：${c.who === 'me' ? E(c.t) : cx.html}`
        + `${c.grade ? `<span class="gr g-${E(c.grade)}">${E(c.grade)}</span>` : ''}${c.en && c.who !== 'me' ? `<span class="enl ${enCls(cx)}">${E(c.en)}</span>` : ''}</div>`)(c.who === 'me' ? null : mix(c.t, c.en)))).join('');
    const px = mix(p.t, p.en);
    return `<div class="mo ${on ? 'on' : ''}"><div class="av"><canvas data-face="${E(who.face || p.who)}" width="72" height="72"></canvas></div><div style="flex:1;min-width:0"><div class="who">${E(nmP(p.who))}</div><div class="tx">${px.html}</div>${p.en ? `<span class="enl ${enCls(px)}" style="font-size:12px;font-style:italic;opacity:.65">${E(p.en)}</span>` : ''}`
      + `${p.img ? `<canvas class="pic" data-art="${E(p.img)}" width="440" height="300"></canvas>` : ''}<div class="lk"><button data-like="${i}">${p.liked ? '♥' : '♡'} ${likes.length}</button>${can ? ` <button class="cmb ${on ? '' : 'want'}" data-cm="${i}">💬 ${E(k.comment || 'Comment')}</button>` : ''} <small style="opacity:.6">${E(p.tm || '')}</small></div>`
      + `${likes.length ? `<div class="likes">♡ ${E(likes.join('，'))}</div>` : ''}${cms ? `<div class="cms">${cms}</div>` : ''}</div></div>`;
  }
  // the turn a post's comment answers: its own (the thread step's moment.turn), else the content's generic one
  function momentTurn(p) {
    if (!p || !p.id) return null;
    const k = p.id.lastIndexOf('.'), th = threadById(p.id.slice(0, k)), st = th && th.steps[+p.id.slice(k + 1)];
    if (st && st.moment && st.moment.turn) return st.moment.turn;
    const gen = ((C() && C().scenes) || {})['moment.comment'];
    return (gen && gen.turns && gen.turns[0]) || null;
  }
  async function comment(i) {
    const mo = P().moments || [], p = mo[i]; if (!p || p.done || S.commenting || !S.open) return false;
    const tn0 = momentTurn(p); if (!tn0) return false;
    S.commenting = true; S.mo = i;
    D.inp.classList.remove('hidden'); moments(true);
    const ctx = { view: momentView(i), who: p.who, band: tn0.band || 1, grades: [], coins: 0 };
    let res = null;
    try { res = await TALK.turn(Object.assign({}, tn0, { ask: null }), ctx); } catch (e) { console.error('[phone] comment', e); }
    S.commenting = false; S.mo = null; S.pending = null; taskOff();
    if (res && !res.quit) { p.done = true; if (ctx.coins && G && G.state) G.state.coins = (G.state.coins || 0) + ctx.coins; }
    if (S.open && S.view === 'moments') moments();
    if (G && G.save) G.save();
    return !!(res && !res.quit);
  }
  // the view TALK.turn talks to under a post: your comment (with its grade), the poster's reply to you, Mimo's fix
  function momentView(i) {
    const post = () => (P().moments || [])[i];
    const add = c => { const q = post(); if (!q) return c; (q.comments = q.comments || []).push(c); if (S.open && S.view === 'moments') moments(true); return c; };
    return {
      async npc(line) { const q = post(); add({ who: line.who || (q && q.who), to: 'me', t: line.t, en: line.en }); snd('pip'); await tick(260); },
      you(text) { const c = add({ who: 'me', t: text }); return { grade(g) { c.grade = g; if (S.view === 'moments') moments(true); }, miss() { c.miss = true; snd('wrong'); if (S.view === 'moments') moments(true); } }; },
      async mimo(x) { add({ mimo: { diff: x.diff || '', tips: x.tips || [], model: x.model ? x.model.t : '' } }); },
      async model(x) { if (S.pending) S.pending.show(3, x); },
      sys() { /* */ },
      input(task) { if (!S.open || S.view !== 'moments') return Promise.resolve(null); return new Promise(res => { S.pending = taskOn(task, res); }); },
    };
  }
  function show(id) {
    dom(); applySkin();
    const d = chatDef(id), c = chatState(id);
    S.cur = id; S.view = 'chat'; c.unread = 0;
    D.lst.classList.add('hidden'); D.bd.classList.remove('hidden'); D.inp.classList.remove('hidden'); D.bk.classList.remove('hidden'); D.tabs.classList.add('hidden');
    const sub = d.group ? (d.members || []).map(nmP).join(', ') : (d.sub ? (d.sub[L()] || d.sub.en || '') : '');
    header(d.title || id, sub, avatarHTML(id));
    taskOff(); D.input.placeholder = skin().msg;
    render(id); chip();
    c.msgs.forEach(m => { if (m.gift && m.gift.count > 1 && !m.gift.done) grabOthers(id, m); });      // (the others grab while you watch)
    const th = waitingIn(id); if (th) answer(th);
  }
  // ============================================================ 扫码: pay by scanning a shop's code (信鸽: Grandma Mei's Plum Garden)
  // PHONE.scanPay({ merchant: 'mei', dishes: [{ id: 'w.jiaozi', price: 4 }, …] }) → a Promise of what you bought ([{ id, n, price,
  // total, grade }]) or null. The phone opens on the scanner, then the merchant's chat (content: chats[merchant]). What you're
  // paying for is a graded turn (content: scenes['pay.' + merchant]: its turn, close (thanks), poor (not enough coins), none
  // (nothing from the menu), alias: { lexId: [other words for a dish] }). The bill is the dishes you named, times their numbers;
  // it's paid in coins, and the dishes go in your bag.
  let paying = false;
  const itemName = id => { try { return LEX.item(id) ? plain(isC() ? LEX.src(id) : LEX.form(id)) : id; } catch (e) { return id; } };
  function billOf(r, dishes, alias = {}) {
    const ws = ((r && r.a && r.a.words) || []).filter(w => !w.punct), items = [];
    const chOf = id => { try { return CJK.chars(LEX.src(id) || '', { lang: L() }).replace(/\s+/g, ''); } catch (e) { return ''; } };
    const which = w => dishes.find(d => (w.lex && w.lex === d.id) || (w.ch && (w.ch === chOf(d.id) || (alias[d.id] || []).includes(w.ch))));
    ws.forEach((w, k) => {
      const d = which(w); if (!d) return;
      let n = 1;
      for (let j = k - 1; j >= 0 && j >= k - 3; j--) {
        const p = ws[j];
        if (p.num != null) { n = p.num; if (n >= 10000 && n % 10000 === 0 && /wan$/i.test(String(p.t).replace(/[\s\d]+/g, ''))) n = n / 10000; break; }   // («yi wan mian»: a bowl, not ten thousand)
        if (!(p.pos === 'cl' || p.pos === 'adj')) break;
      }
      n = Math.max(1, Math.min(9, Math.round(n) || 1));
      const it = items.find(x => x.id === d.id); if (it) it.n += n; else items.push({ id: d.id, n, price: d.price });
    });
    items.forEach(x => { x.total = x.n * x.price; });
    return { items, total: items.reduce((s, x) => s + x.total, 0) };
  }
  async function scanPay(o = {}) {
    if (paying || !G || !G.state) return null;
    const sc = ((C() && C().scenes) || {})['pay.' + o.merchant];
    if (!TALK.ready() || !sc || !sc.turns || !sc.turns[0]) return null;
    paying = true;
    const id = o.merchant;
    try {
      if (!S.open) open(); else list();
      const scr = document.createElement('div'); scr.className = 'scan';
      scr.innerHTML = `<div><div class="vf"><b class="f1"></b><b class="f2"></b><b class="f3"></b><i></i></div><div style="text-align:center">${E(skin().scan || 'Scan')}</div></div>`;
      D.scr.appendChild(scr);
      await tick(1100); scr.remove();
      if (!S.open) return null;
      snd('pip');
      const title = chatDef(id).title || id;
      push(id, { sys: skin().scanned ? skin().scanned(title) : '✓ ' + title, en: `Scanned: ${plain(title)}` });
      show(id);
      const ctx = { view: chatView(id), who: id, band: sc.band || 1, grades: [], coins: 0 };
      let res = null;
      try { res = await TALK.turn(sc.turns[0], ctx); } catch (e) { console.error('[phone] pay', e); }
      S.pending = null; taskOff();
      if (!res || res.quit || !res.r) return null;
      if (ctx.coins) G.state.coins = (G.state.coins || 0) + ctx.coins;
      const bill = billOf(res.r, o.dishes || [], sc.alias || {}), say = x => TALK.say(x || [], { view: chatView(id) });
      if (!bill.items.length) { await say(sc.none); return null; }
      if (bill.total > (G.state.coins || 0)) { push(id, { sys: skin().poor || '—', en: 'Not enough coins' }); await say(sc.poor); return null; }
      G.state.coins -= bill.total;
      push(id, { from: 'me', pay: { total: bill.total, to: id, items: bill.items.map(x => `${itemName(x.id)} ×${x.n}`).join('，') } });
      snd('coins');
      push(id, { sys: skin().payOk || '✓', en: 'Payment successful' });
      await say(sc.close);
      G.state.bag = G.state.bag || {}; bill.items.forEach(x => { G.state.bag[x.id] = (G.state.bag[x.id] || 0) + x.n; });
      if (G.save) G.save();
      await tick(1300);
      close();
      return bill.items.map(x => Object.assign({ grade: res.r.grade }, x));
    } finally { paying = false; }
  }

  // ============================================================ open, close, the key, the HUD chip
  let keys = null;
  function canOpen() {
    if (!G || !G.state || !G.state.flags || !G.state.flags.hatched || !available()) return false;
    const b = document.body.classList;
    if (b.contains('in-battle') || b.contains('on-title') || b.contains('talk-open') || b.contains('fm-open')) return false;
    if (G.journalOpen || (G.state.teaching && !S.open) || (typeof STORY !== 'undefined' && (STORY.line || STORY.busy))) return false;
    return true;
  }
  function open(id) {
    dom(); S.open = true; applySkin();
    // (EN is a help button: messages are mixed by the weave, and their English shows only while EN is on; it starts off)
    S.en = false; D.root.classList.toggle('no-en', !S.en); D.root.classList.toggle('w92', w92()); D.en.classList.toggle('off', !S.en);
    D.root.classList.remove('hidden'); document.body.classList.add('phone-open');
    if (typeof Input !== 'undefined') Input.typing = true;
    if (G && G.state) { G.state.teaching = true; G.prompt = null; }
    D.clk.textContent = clock();
    if (keys) removeEventListener('keydown', keys, true);
    keys = e => {
      if (!S.open) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (S.view === 'chat' && !S.pending) list(); else close(); }
      else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (S.pending) S.pending.help(); }
      else if (document.activeElement !== D.input && KEYS.map.phone && KEYS.map.phone.includes(e.code)) { e.preventDefault(); e.stopPropagation(); close(); }
    };
    addEventListener('keydown', keys, true);
    const want = id || (() => { const w = threadsOf().find(th => P().run[th.id] && (P().run[th.id].wait || P().run[th.id].waitGift) && !P().run[th.id].done); return w ? w.chat : null; })();
    if (want) show(want); else list();
    snd('page');
  }
  function close() {
    if (!D.root || !S.open) return;
    if (S.pending) { const p = S.pending; S.pending = null; p.quit(); }
    S.open = false; S.cur = null; D.root.classList.add('hidden'); document.body.classList.remove('phone-open');
    if (typeof Input !== 'undefined') Input.typing = false;
    if (G && G.state) G.state.teaching = false;
    if (keys) { removeEventListener('keydown', keys, true); keys = null; }
    try { speechSynthesis.cancel(); } catch (e) { /* */ }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    chip();
    if (G && G.save) G.save();
  }
  const toggle = () => (S.open ? close() : canOpen() ? open() : null);
  let chipEl = null, chipKey = '';
  function chip() {
    const ok = available();
    if (!chipEl) {
      if (!ok) return;
      const box = document.getElementById('counters'); if (!box) return;
      chipEl = document.createElement('span'); chipEl.className = 'chip'; chipEl.id = 'chip-phone';
      chipEl.innerHTML = '<button title="Phone">📱<b class="ph-badge hidden"></b></button>';
      box.insertBefore(chipEl, box.firstChild);
      chipEl.querySelector('button').onclick = e => { e.currentTarget.blur(); toggle(); };
    }
    const n = unread(), key = (ok ? 1 : 0) + ':' + n + ':' + L();
    if (key === chipKey) return; chipKey = key;
    chipEl.classList.toggle('hidden', !ok);
    const b = chipEl.querySelector('.ph-badge'); b.textContent = n > 9 ? '9+' : String(n); b.classList.toggle('hidden', !n);
    try { chipEl.querySelector('button').title = `${skin().app} (${KEYS.keys('phone').split(' / ')[0]})`; } catch (e) { /* */ }
  }
  let checkT = 0;
  function update(dt) {
    if (!G || !G.state) return;
    chip();
    if ((checkT -= dt) > 0) return;
    checkT = 1;
    if (G.state.flags && G.state.flags.hatched) check();
  }
  function init(game) {
    G = game;
    addEventListener('keydown', e => {
      if (S.open || Input.typing || KEYS.capturing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!KEYS.map.phone || !KEYS.map.phone.includes(e.code)) return;
      if (canOpen()) { e.preventDefault(); open(); }
    });
  }
  return {
    init, update, open, close, toggle, show, list, check, unread, available, art, SKINS, ART, scanPay, comment, moments,
    get isOpen() { return S.open; }, get busy() { return S.open; },
    _: { T, fire, advance, answer, whenOK, waitingIn, chatState, threadById, post, push, billOf, splitShares, momentTurn, grab, giftCard,
      t: {
        get fast() { return T.fast; }, set fast(v) { T.fast = !!v; },
        say: text => (S.pending ? S.pending.submit(text) : false), help: () => (S.pending ? S.pending.help() : false),
        get waiting() { return !!S.pending; }, fire: id => { const th = threadById(id); if (th) fire(th); return !!th; },
        // 抢红包: open the first unopened group gift in a chat (the one open by default) → the gift
        grab: chat => { const id = chat || S.cur, m = id && chatState(id).msgs.find(x => x.gift && x.gift.count > 1 && !x.gift.open); if (m) grab(id, m); return m ? m.gift : null; },
        comment: i => comment(i || 0), get view() { return S.view; }, get cur() { return S.cur; },
        reset() { const ph = P(); ph.chats = {}; ph.run = {}; ph.seen = {}; ph.moments = []; chipKey = ''; },
      } },
  };
})();
