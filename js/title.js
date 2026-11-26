'use strict';
// The title page (DESIGN.md 12.13). A slow crane over Alba with the old tower behind it; the logo, where
// one letter keeps getting hushed and coming back (like the words in Noa's letters); Mimo perched on the
// logo (the real 3D model, standing in the world just in front of the camera); "Press any key"; then the
// menu: Continue (the save you played last) · New game (pick a language; it takes the first free save)
// · Load game (the three saves: continue, start one, delete one).
//   const choice = await TITLE.show({ scene, camera, cam, slots, onDelete });   // { mode: 'continue' | 'new', slot, lang }
//   TITLE.update(dt, t)    every frame while it's up: after the camera moves, before the render
//   TITLE.close()          once the screen has faded out
const TITLE = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // zh / ja come in two modes each (CJK.md): romanized, or in characters with readings over them until you know them
  const LANGS = [
    { k: 'es', name: 'Español', sub: 'Spanish, as it’s spoken in Latin America', col: '#e2563f' },
    { k: 'pt', name: 'Português', sub: 'Portuguese, as it’s spoken in Brazil', col: '#2f9e5b' },
    { k: 'de', name: 'Deutsch', sub: 'German', col: '#e6a92e' },
    { k: 'zh', script: 'roman', name: '中文 · Pinyin', sub: 'Chinese (Mandarin) in pinyin: letters with tone marks', col: '#c43b3b', tag: 'zh-Hans' },
    { k: 'zh', script: 'chars', name: '中文 · 汉字', sub: 'Chinese in characters, with pinyin over them until you know them', col: '#8f2430', tag: 'zh-Hans' },
    { k: 'ja', script: 'roman', name: '日本語 · Rōmaji', sub: 'Japanese in rōmaji (Latin letters)', col: '#3f6fb5', tag: 'ja' },
    { k: 'ja', script: 'chars', name: '日本語 · かな・漢字', sub: 'Japanese in kana & kanji, with readings over them until you know them', col: '#2c4a85', tag: 'ja' },
  ];
  const LNAME = { es: 'Español', pt: 'Português', de: 'Deutsch', zh: '中文', ja: '日本語' };
  const SCRIPT = { zh: { roman: 'Pinyin', chars: '汉字' }, ja: { roman: 'Rōmaji', chars: 'かな・漢字' } };
  const langLabel = (l, script) => (LNAME[l] || l || '') + (SCRIPT[l] ? ' · ' + SCRIPT[l][script === 'chars' ? 'chars' : 'roman'] : '');
  const TAGS = ['a language adventure', 'una aventura de palabras', 'uma aventura de palavras', 'ein Abenteuer voller Wörter', '一场语言的冒险', 'ことばの冒険'];
  const ALBA = { x: -10, z: -150 };
  const MIMO_DIST = 7, MIMO_SIZE = 0.95;     // how far in front of the camera Mimo stands, and how big
  let S = null;

  // ------------------------------------------------------------ the camera: a slow crane over Alba, the old tower behind
  function shot(t, out) {
    const a = 0.33 + 0.1 * Math.sin(t * 0.042), R = 74 + 3 * Math.sin(t * 0.031), h = 17 + 1.3 * Math.sin(t * 0.057 + 1);
    out.pos.set(ALBA.x - Math.sin(a) * R, h, ALBA.z + Math.cos(a) * R);
    out.look.set(-4 - 6 * Math.sin(t * 0.042), 7, -165);
    return out;
  }

  // ------------------------------------------------------------ Mimo, perched on the logo
  function makeMimo(scene) {
    const m = ACTORS.mimo();
    m.root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    m.root.visible = false; scene.add(m.root);
    return { m, M: { x: 0, ry: 0, z: 0, yaw: 0, land: 1, hop: null, tilt: 0, ears: [{ a: 0.3 }, { a: 0.3 }], earBack: 0, blink: 0, happy: 0, say: null, glow: 0 },
      blinkT: 1.2, turn: 0, turnTo: 0, turnT: 2, hopY: 0 };
  }
  const v = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3();
  function placeMimo(dt, t) {
    const P = S.mimo, M = P.M, el = document.querySelector('#title .tl-logo .perch');
    if (!el) return;
    // little life: blinks, ears, a look around now and then, hops
    if ((P.blinkT -= dt) <= 0) { M.blink = 0.13; P.blinkT = 1.8 + Math.random() * 3.4; }
    M.blink -= dt;
    M.ears[0].a = 0.32 + Math.sin(t * 2.3) * 0.06; M.ears[1].a = 0.32 + Math.sin(t * 2.3 + 1.7) * 0.06;
    if ((P.turnT -= dt) <= 0) { P.turnTo = (Math.random() - 0.5) * 1.1; P.turnT = 2.5 + Math.random() * 3; }
    P.turn = damp(P.turn, S.stage === 'menu' ? -0.55 : P.turnTo, 3, dt);     // in the menu it looks down at the buttons
    M.happy = Math.max(0, M.happy - dt);
    if (M.hop) { M.hop.t += dt * 2.4; if (M.hop.t >= 1) M.hop = null; }
    P.hopY = M.hop ? Math.sin(M.hop.t * Math.PI) * 0.45 : 0;
    ACTORS.animateMimo(P.m, M, dt, t);
    // stand on top of the logo's last letter: a point on the ray through it, a few units out
    const r = el.getBoundingClientRect(), cam = S.camera;
    if (r.width < 1) { P.m.root.visible = false; return; }
    cam.updateMatrixWorld();
    v.set((r.left + r.width * 0.5) / innerWidth * 2 - 1, -((r.top + r.height * 0.13) / innerHeight) * 2 + 1, 0.5).unproject(cam);
    dir.copy(v).sub(cam.position).normalize();
    up.set(0, 1, 0).applyQuaternion(cam.quaternion);
    const k = clamp(r.height / 180, 0.45, 1.3);            // Mimo's size follows the logo's (it shrinks deeper in the menu)
    P.k = P.k ? damp(P.k, k, 8, dt) : k;
    P.m.root.position.copy(cam.position).addScaledVector(dir, MIMO_DIST).addScaledVector(up, P.hopY * P.k);
    P.m.root.quaternion.copy(cam.quaternion); P.m.root.rotateY(P.turn);       // faces you, upright on the screen
    P.m.root.scale.setScalar(MIMO_SIZE * P.k);
    P.m.root.visible = true;
  }
  const hop = (happy = 0) => { if (!S) return; S.mimo.M.hop = { t: 0 }; S.mimo.M.happy = Math.max(S.mimo.M.happy, happy); };

  // ------------------------------------------------------------ the menu
  const latest = () => S.slots.filter(s => s.info).sort((a, b) => (b.info.savedAt || 0) - (a.info.savedAt || 0))[0] || null;
  const btn = (act, label, sub, cls = '', data = '') => `<button class="tl-btn ${cls}" data-act="${act}" ${data}><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const head = (title, sub) => `<div class="tl-head">${title}</div>${sub ? `<div class="tl-note">${sub}</div>` : ''}`;
  const backBtn = (label = 'Back') => `<button class="tl-back" data-act="back">‹ ${label}</button>`;
  // (the play time, always shown: the user asked to see play hours, DESIGN.md 19)
  const slotText = i => `<b>${esc(langLabel(i.lang, i.script))} · ${esc(i.name)}</b><span>${esc(i.where)}</span><small>⏱ <b class="tl-time">${esc(i.time)}</b> played · ${i.words} words${i.when ? ' · saved ' + esc(i.when) : ''}</small>`;

  const langBtn = l => `<button class="tl-btn tl-lang${l.script ? ' tl-half' : ''}" data-act="lang" data-lang="${l.k}"${l.script ? ` data-script="${l.script}"` : ''}>`
    + `<i style="background:${l.col}">${l.k.toUpperCase()}</i><span><b${l.tag ? ` lang="${l.tag}"` : ''}>${esc(l.name)}</b><small>${esc(l.sub)}</small></span></button>`;
  function render(view, arg = {}) {
    S.view = view; S.arg = arg;
    const box = $('tl-menu');
    let html = '';
    if (view === 'main') {
      const last = latest(), any = S.slots.some(s => s.info);
      html = (last ? btn('continue', 'Continue', `Save ${last.n} · ${esc(langLabel(last.info.lang, last.info.script))} · ${esc(last.info.name)} · ${esc(last.info.where)} · ⏱ ${esc(last.info.time)} played`, 'primary') : '')
        + btn('new', 'New game', any ? 'A fresh start, in any of the five languages' : 'Meet Mimo, and go find Noa')
        // (with no saves yet it's still there: a save file from another computer comes in through it)
        + btn('load', 'Load game', any ? 'Your three save files' : 'Bring in a save file from another computer');
    } else if (view === 'lang') {
      const slot = arg.slot || (S.slots.find(s => !s.info) || {}).n;
      html = head('Which language will you learn?', slot ? `Your adventure starts in save file ${slot}.` : 'All three save files are in use, so next you’ll pick one to replace.')
        + LANGS.filter(l => !l.script).map(langBtn).join('')
        + `<div class="tl-cjk">${LANGS.filter(l => l.script).map(langBtn).join('')}</div>`      // (Chinese and Japanese: two modes each, side by side)
        + backBtn();
    } else if (view === 'load' || view === 'replace') {
      const rep = view === 'replace', files = !rep && S.onExport && S.onImport;
      html = head(rep ? 'Replace which save?' : 'Your save files', rep ? `The new game (${esc(langLabel(arg.lang, arg.script))}) takes its place.` : arg.note ? esc(arg.note) : '')
        + '<div id="slots">' + S.slots.map(s => s.info
          ? `<div class="slot"><div class="snum">${s.n}</div><div class="sinfo">${slotText(s.info)}</div>`
            + (rep ? `<button class="go danger" data-act="rep" data-slot="${s.n}">Replace</button>`
              : `<button class="go" data-act="go" data-slot="${s.n}">Continue</button>`
                + (files ? `<button class="exp" data-act="exp" data-slot="${s.n}" title="Save a copy of this save to a file">⬇</button>` : '')
                + `<button class="del" data-act="del" data-slot="${s.n}" title="Delete this save">✕</button>`) + '</div>'
          : `<div class="slot empty"><div class="snum">${s.n}</div><div class="sinfo"><b>Empty</b><span>Start a new adventure here</span></div><button class="go" data-act="newin" data-slot="${s.n}">New game</button></div>`).join('') + '</div>'
        // (saves live in this browser: ⬇ keeps a copy in a file, to back it up or take it to another computer, and this brings one in)
        + (files ? `<div class="tl-row tl-files"><button class="tl-back" data-act="imp">⬆ Load a save file…</button><span class="tl-fnote">Saves live in this browser. ⬇ saves a copy to a file.</span></div>` : '')
        + backBtn();
    } else if (view === 'import') {
      // a save file read in: which of the three files it goes into (an empty one, or one it replaces)
      const i = arg.info;
      html = head('Put this save in which file?', i ? `${esc(langLabel(i.lang, i.script))} · ${esc(i.name)} · ${esc(i.where)} · ⏱ ${esc(i.time)} played` : '')
        + '<div id="slots">' + S.slots.map(s => s.info
          ? `<div class="slot"><div class="snum">${s.n}</div><div class="sinfo">${slotText(s.info)}</div><button class="go danger" data-act="impconf" data-slot="${s.n}">Replace</button></div>`
          : `<div class="slot empty"><div class="snum">${s.n}</div><div class="sinfo"><b>Empty</b><span>Free for this save</span></div><button class="go" data-act="impto" data-slot="${s.n}">Put it here</button></div>`).join('') + '</div>'
        + backBtn();
    } else if (view === 'confirm') {
      const s = S.slots.find(x => x.n === arg.slot), who = s && s.info ? ` (${esc(langLabel(s.info.lang, s.info.script))} · ${esc(s.info.name)})` : '';
      html = head(arg.kind === 'del' ? `Delete save ${arg.slot}${who}?` : `Replace save ${arg.slot}${who}?`, 'This can’t be undone.')
        + `<div class="tl-row">${btn('yes', arg.kind === 'del' ? 'Delete it' : 'Replace it', '', 'danger')}${btn('back', 'Keep it')}</div>`;
    }
    box.innerHTML = html;
    box.className = 'tl-view-' + view;
    $('title').classList.toggle('deep', view !== 'main');      // past the first menu the logo shrinks to make room
    // (a yes/no question starts on the safe answer)
    const first = view === 'confirm' ? box.querySelector('.tl-btn[data-act="back"]') : (box.querySelector('.tl-btn.primary') || box.querySelector('button'));
    if (first) first.focus({ preventScroll: true });
  }
  function backOf() {
    switch (S.view) {
      case 'lang': return S.arg.slot ? ['load'] : ['main'];
      case 'load': return ['main'];
      case 'import': return ['load'];
      case 'replace': return ['lang', {}];
      case 'confirm': return S.arg.kind === 'del' ? ['load'] : S.arg.kind === 'imp' ? ['import', { data: S.arg.data, info: S.arg.info }] : ['replace', { lang: S.arg.lang, script: S.arg.script }];
      default: return null;
    }
  }
  function act(b) {
    const a = b.dataset.act, n = +b.dataset.slot;
    Sound.play('click');
    switch (a) {
      case 'continue': { const last = latest(); if (last) finish({ mode: 'continue', slot: last.n }); break; }
      case 'new': render('lang', {}); hop(); break;
      case 'load': render('load'); break;
      case 'lang': {
        const lang = b.dataset.lang, script = b.dataset.script || undefined, slot = S.arg.slot || (S.slots.find(s => !s.info) || {}).n;
        if (slot) finish({ mode: 'new', slot, lang, script }); else render('replace', { lang, script });
        break;
      }
      case 'go': finish({ mode: 'continue', slot: n }); break;
      case 'newin': render('lang', { slot: n }); break;
      case 'del': render('confirm', { kind: 'del', slot: n }); break;
      case 'rep': render('confirm', { kind: 'rep', slot: n, lang: S.arg.lang, script: S.arg.script }); break;
      // save files: ⬇ a copy out, ⬆ one in
      case 'exp': {
        const name = S.onExport ? S.onExport(n) : null;
        render('load', { note: name ? `Saved a copy of save ${n}: ${name} (in your Downloads)` : 'That save couldn’t be copied to a file.' });
        break;
      }
      case 'imp': pickFile(); break;
      case 'impto': putSave(n, S.arg.data); break;
      case 'impconf': render('confirm', { kind: 'imp', slot: n, data: S.arg.data, info: S.arg.info }); break;
      case 'yes': {
        const { kind, slot, lang, script } = S.arg, s = S.slots.find(x => x.n === slot);
        if (kind === 'imp') { putSave(slot, S.arg.data); break; }
        if (s) s.info = S.onDelete ? S.onDelete(slot) : null;     // (a replaced save is cleared right away, as promised)
        if (kind === 'rep') finish({ mode: 'new', slot, lang, script });
        else render(S.slots.some(x => x.info) ? 'load' : 'main');
        break;
      }
      case 'back': { const to = backOf(); if (to) render(to[0], to[1]); break; }
    }
  }
  // a save file from disk (main.js reads and checks it: S.readSave(text) → { ok, data, info } or { ok: false, why })
  function pickFile() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f || !S) return;
      if (f.size > 30e6) { render('load', { note: 'That file is too big to be a save.' }); return; }
      const rd = new FileReader();
      rd.onload = () => {
        if (!S || S.stage === 'done') return;
        const r = S.readSave ? S.readSave(String(rd.result || '')) : { ok: false };
        if (!r || !r.ok) { Sound.play('click'); render('load', { note: (r && r.why) || 'That file isn’t a save from The Hush.' }); return; }
        Sound.play('review'); hop(0.6);
        render('import', { data: r.data, info: r.info });
      };
      rd.onerror = () => { if (S) render('load', { note: 'That file couldn’t be read.' }); };
      rd.readAsText(f);
    };
    inp.click();
  }
  function putSave(n, data) {
    const s = S.slots.find(x => x.n === n), info = S.onImport ? S.onImport(n, data) : null;
    if (s) s.info = info;
    if (info) { Sound.play('learned'); hop(1); }
    render('load', { note: info ? `The save is in file ${n} now. Press Continue to play it.` : 'That save couldn’t be stored (is the browser’s storage full or blocked?).' });
  }
  function toMenu() {
    if (S.stage !== 'press') return;
    S.stage = 'menu';
    $('tl-press').classList.add('hidden'); $('tl-menu').classList.remove('hidden');
    render('main'); Sound.play('review'); hop(0.6);
  }
  function finish(r) {
    if (S.stage === 'done') return;
    S.stage = 'done'; Sound.play('learned'); hop(1.2);
    $('tl-menu').classList.add('picked');
    const res = S.resolve; setTimeout(() => res(r), 420);
  }

  // ------------------------------------------------------------ keys and clicks
  function onKey(e) {
    if (!S || S.stage === 'done') return;
    if (S.stage === 'press') { if (!['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'KeyM'].includes(e.code)) { e.preventDefault(); toMenu(); } return; }
    const list = [...$('tl-menu').querySelectorAll('button')], i = list.indexOf(document.activeElement);
    const move = d => { e.preventDefault(); const j = i < 0 ? 0 : (i + d + list.length) % list.length; list[j].focus({ preventScroll: true }); Sound.play('pip'); if (Math.random() < 0.35) hop(); };
    switch (e.code) {
      case 'ArrowDown': case 'KeyS': case 'ArrowRight': case 'KeyD': move(1); break;
      case 'ArrowUp': case 'KeyW': case 'ArrowLeft': case 'KeyA': move(-1); break;
      case 'Tab': move(e.shiftKey ? -1 : 1); break;
      case 'Enter': case 'Space': case 'KeyE': e.preventDefault(); if (i >= 0) act(list[i]); break;
      case 'Escape': case 'Backspace': { e.preventDefault(); const to = backOf(); if (to) { Sound.play('click'); render(to[0], to[1]); } break; }
    }
  }
  function onClick(e) {
    if (!S || S.stage === 'done') return;
    if (S.stage === 'press') { toMenu(); return; }
    const b = e.target.closest('#tl-menu button'); if (b) act(b);
  }
  function onHover(e) { const b = e.target.closest && e.target.closest('#tl-menu button'); if (b && document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('pip'); } }

  // ------------------------------------------------------------ the contract
  function show(o) {
    return new Promise(resolve => {
      S = { scene: o.scene, camera: o.camera, cam: o.cam, slots: o.slots, onDelete: o.onDelete, onExport: o.onExport, onImport: o.onImport, readSave: o.readSave, resolve, stage: 'press', view: null, arg: {}, t: 0, tag: 0 };
      // the camera starts right on its path (no swoop in from the station)
      const c = shot(0, { pos: new THREE.Vector3(), look: new THREE.Vector3() });
      S.camera.position.copy(c.pos); S.cam._look = c.look.clone(); S.cam.override = c; S.cam.back = 0;
      S.mimo = makeMimo(o.scene);
      const el = $('title');
      el.classList.remove('hidden'); $('tl-press').classList.remove('hidden'); $('tl-menu').classList.add('hidden'); $('tl-menu').classList.remove('picked');
      $('tl-tag').textContent = TAGS[0];
      S.tagTimer = setInterval(() => {
        const t = $('tl-tag'); t.classList.add('out');
        setTimeout(() => {
          if (S) { S.tag = (S.tag + 1) % TAGS.length; t.textContent = TAGS[S.tag]; }
          const L = /[぀-ヿ]/.test(t.textContent) ? 'ja' : /[一-鿿]/.test(t.textContent) ? 'zh-Hans' : '';     // (the right glyphs)
          if (L) t.lang = L; else t.removeAttribute('lang');
          t.classList.remove('out');
        }, 380);
      }, 3600);
      if (!$('tl-cjk-css')) {                  // (the Chinese and Japanese buttons: two modes each, side by side)
        const st = document.createElement('style'); st.id = 'tl-cjk-css';
        st.textContent = '#tl-menu .tl-cjk { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; width: min(560px, calc(100vw - 52px)); }'
          + ' #tl-menu .tl-btn.tl-half { width: auto; padding: 7px 10px 8px 38px; gap: 9px; } #tl-menu .tl-btn.tl-half b { font-size: 19px; } #tl-menu .tl-btn.tl-half small { font-size: 11.5px; }'
          + ' #tl-menu .tl-btn.tl-half i { font-size: 13px; padding: 3px 5px; } #tl-menu .tl-btn.tl-half:focus, #tl-menu .tl-btn.tl-half:hover { transform: translateY(-2px); }'
          + ' #tl-menu .tl-btn.tl-half::before { left: 12px; }'
          // (seven languages and Back still fit a 720-pixel-tall window)
          + ' #tl-menu.tl-view-lang { gap: 6px; } #title.deep #tl-menu.tl-view-lang { margin-top: 12px; }'
          + ' #tl-menu.tl-view-lang .tl-btn { padding-top: 5px; padding-bottom: 6px; } #tl-menu.tl-view-lang .tl-btn small { line-height: 1.2; }';
        document.head.appendChild(st);
      }
      const mu = $('tl-music'), sync = () => { mu.textContent = Sound.music ? '♪ Music on' : '♪ Music off'; mu.classList.toggle('off', !Sound.music); };
      mu.onclick = e => { e.stopPropagation(); Sound.start(); Sound.music = !Sound.music; sync(); const chip = $('music'); if (chip) chip.classList.toggle('on', Sound.music); };
      sync(); S.syncMusic = sync;
      addEventListener('keydown', onKey, true);
      el.addEventListener('click', onClick); el.addEventListener('mouseover', onHover);
    });
  }
  function update(dt, t) {
    if (!S) return;
    S.t += dt;
    if (S.cam.override) shot(S.t, S.cam.override);
    placeMimo(dt, t);
    if (S.syncMusic && (S._mu !== Sound.music)) { S._mu = Sound.music; S.syncMusic(); }    // (M still toggles it)
  }
  function close() {
    if (!S) return;
    removeEventListener('keydown', onKey, true);
    const el = $('title'); el.removeEventListener('click', onClick); el.removeEventListener('mouseover', onHover); el.classList.add('hidden');
    clearInterval(S.tagTimer);
    S.mimo.m.root.parent && S.mimo.m.root.parent.remove(S.mimo.m.root);
    S.cam.override = null; S.cam._look = null; S.cam.back = 0;
    S = null;
  }
  return { show, update, close, get on() { return !!S; }, get stage() { return S && S.stage; }, _: { shot, render: (v, a) => render(v, a), toMenu: () => toMenu() } };
})();
