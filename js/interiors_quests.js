'use strict';
// The homes' side quests (DESIGN.md 16, playtest 4: "explore the house and its UNIQUE residents (make add some side
// quests here)"). Eighteen of them, in the town files (interiors_alba.js / _molinar.js / _remanso.js); this is the engine.
//   • Output-first: someone uses a phrase in front of you (their line goes through the weave like everyone's, with the
//     phrase in the language, glossed, and said out loud; the whole English is on EN), then you say it yourself in the
//     "Say it" box, graded S–D like the rest of the game. Tab gives a hint, ? shows the answer (a D), and after two misses
//     the answer is shown anyway.
//   • Rewards: coins (more for a better grade), the phrase in your Phrasebook (LEX kind 'phrase'), sometimes a keepsake.
//   • They're SIDE quests in QUESTS.LIST and never take the tracker's focus (nothing here calls QUESTS.track).
//   • They plug into interiors.js through INTERIORS.hook: a resident's Talk, things to press E on, a ◆ / ! over whoever has
//     something for you, and small props (a lost key on the rug, a drawing on a wall).
// HQ.quest(def) · HQ.T(en, es, pt, de, zh, ja) (a line) · HQ.phrase(def) · HQ.keep(def) · HQ.ask(task, o) (the box) · HQ.grade(text, task)
// State: G.state.hq = { [quest id]: stage, grades: { [quest id]: 'S'…'D' } }.
const HQ = (() => {
  if (typeof INTERIORS === 'undefined') return null;
  let G = null;
  const QS = [], PH = {}, KEEP = {};
  const lang = () => (typeof UI !== 'undefined' && UI.lang) || 'es';
  const isC = l => typeof CJK !== 'undefined' && CJK.isCJK(l || lang());
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const S = () => (G.state.hq = G.state.hq || {});
  const stage = id => (G && G.state && G.state.hq && G.state.hq[id]) || 0;
  function setStage(id, n) { S()[id] = n; if (G.save) G.save(); }
  const LANG_EN = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  // a home's person by profile id: their name in this game's language ('Don Anselmo', 'Oma Hilde', 安塞尔莫 爷爷 …)
  function personDef(pid) {
    for (const [hid, h] of Object.entries(INTERIORS.homes)) {
      const p = INTERIORS.profileOf(hid) || h;
      for (const part of [p, p.up || {}]) for (const c of (part.people || []).concat(part.pets || [])) if (c.id === pid) return { home: hid, c };
    }
    return null;
  }
  const n = pid => { const d = personDef(pid); return d ? INTERIORS.displayName(d.c.role || d.c.kind, d.c.name) : pid; };
  const plainOf = (src, l = lang()) => (isC(l) ? CJK.plain(src, { lang: l }) : String(src || ''));

  // ============================================================ phrases and keepsakes
  // phrase: { id, en, note, es, pt, de, zh, ja } → a LEX item of kind 'phrase' (the journal's Phrasebook lists it once taught)
  function phrase(d) { if (!LEX.item(d.id)) LEX.register([Object.assign({ kind: 'phrase', register: 'casual', icon: d.icon || 'speech', region: d.region || '' }, d)]); PH[d.id] = d; return d; }
  function teachPhrase(id) {
    const it = LEX.item(id); if (!it || !it[lang()]) return false;
    // (another module may already have taught the same words, like adolf.js's «Lecker!»: the Phrasebook keeps one)
    const same = s => String(s || '').toLowerCase().replace(/[¡!¿?.\s]/g, '');
    if (LEX.taughtList().some(o => o !== id && LEX.item(o) && LEX.item(o).kind === 'phrase' && same(LEX.item(o)[lang()]) === same(it[lang()]))) return false;
    const s = LEX.st(id), t = Date.now() / 1000, had = s.stage >= 2; LEX.expose(id);
    if (s.stage < 3) s.stage = 3;
    s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;     // (kept out of reviews: whoever taught it asks again)
    return !had;
  }
  // keepsake: { id: 'k.hq…', en, es, pt, de, zh, ja, icon, g } → a key item in the bag
  function keep(d) { if (!LEX.item(d.id)) LEX.register([Object.assign({ kind: 'key' }, d)]); KEEP[d.id] = d; return d; }
  const bag = () => (G.state.bag = G.state.bag || {});
  const has = id => (bag()[id] || 0) > 0;
  function give(id, k = 1) { bag()[id] = (bag()[id] || 0) + k; LEX.expose(id); }
  function take(id) { if (bag()[id]) bag()[id] = Math.max(0, bag()[id] - 1); if (!bag()[id]) delete bag()[id]; }
  const itemName = id => { const it = LEX.item(id) || {}; return isC() && it[lang()] ? CJK.plain(it[lang()], { lang: lang() }) : (it[lang()] || it.en || id); };

  // ============================================================ grading what you typed
  // task: { en (what it means), model: { es, pt, de, zh, ja }, ok: { es: [...] } (other right answers), keys: { es: ['aqui',
  // 'aca'] , … } (each entry: the alternatives for one key word; all of them heard is a B, some a C) }
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  const canonL = (s, l) => { let t = String(s || '').toLowerCase().normalize('NFC'); if (l === 'de') t = t.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); return t.replace(/[¡!¿?.,;:«»"“”'’()…\-–—]/g, ' ').replace(/\s+/g, ' ').trim(); };
  const loose = (s, l) => { let t = canonL(s, l).normalize('NFD').replace(/[̀-ͯ]/g, ''); if (l === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const canonC = (s, l) => { try { return CJK.canon(String(s || ''), l); } catch (e) { return ''; } };
  const EN_WORDS = new Set(['the', 'is', 'it', 'you', 'your', 'happy', 'thank', 'thanks', 'good', 'here', 'come', 'please', 'sorry', 'hello', 'night', 'morning', 'get', 'well', 'soon', 'for', 'what', 'name', 'trip', 'have', 'a', 'are', 'my', 'delicious', 'congratulations', 'sit', 'bye']);
  function grade(text, task, l = lang()) {
    const out = { g: null, note: '', english: false };
    const models = [task.model[l]].concat((task.ok && task.ok[l]) || []).filter(Boolean);
    if (!String(text || '').trim()) return out;
    if (isC(l)) {
      const t = canonC(text, l); if (!t) return out;
      const ms = models.map(m => canonC(m, l));
      if (ms.includes(t)) { out.g = 'S'; return out; }
      if (ms.some(m => m.length > 6 && lev(t, m) <= 1)) { out.g = 'A'; out.note = 'Almost: one letter off'; return out; }
      const keys = (task.keys && task.keys[l]) || [], hit = keys.filter(alts => [].concat(alts).some(a => t.includes(canonC(a, l))));
      if (keys.length && hit.length === keys.length) { out.g = task.keyGrade || 'B'; out.note = out.g === 'A' ? 'Good!' : 'Close!'; return out; }
      if (hit.length) { out.g = 'C'; out.note = 'Part of it'; return out; }
      if (/^[a-z ]+$/i.test(String(text)) && String(text).toLowerCase().split(/\s+/).filter(w => EN_WORDS.has(w)).length >= 2) out.english = true;
      return out;
    }
    const t = canonL(text, l), tl = loose(text, l);
    if (models.some(m => canonL(m, l) === t)) { out.g = 'S'; return out; }
    // (only accents apart: no grade lost, a tip shows the phrase with them; unless the accent makes another form, as typed; P6a, accents.js)
    if (models.some(m => loose(m, l) === tl)) {
      const m0 = models.find(m => loose(m, l) === tl), ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, m0, l) : { keep: true, why: '' };
      if (ac.keep) { out.g = 'A'; out.note = ac.why || (l === 'de' ? 'Check the umlauts (ä ö ü)' : 'Check the accents'); return out; }
      out.g = 'S'; out.note = ac.tip || ''; return out;
    }
    if (models.some(m => { const x = loose(m, l); return x.length > 6 && lev(tl, x) <= 1; })) { out.g = 'A'; out.note = 'Almost: one letter off'; return out; }
    const words = ' ' + tl + ' ', keys = (task.keys && task.keys[l]) || [];
    const hit = keys.filter(alts => [].concat(alts).some(a => words.includes(' ' + loose(a, l) + ' ')));
    if (keys.length && hit.length === keys.length) { out.g = task.keyGrade || 'B'; out.note = out.g === 'A' ? 'Good!' : 'Close!'; return out; }
    if (hit.length) { out.g = 'C'; out.note = 'Part of it'; return out; }
    if (tl.split(' ').filter(w => EN_WORDS.has(w)).length >= 2 || loose(task.en || '', 'en') === tl) out.english = true;
    return out;
  }

  // ============================================================ the "Say it" box (the teach box's look; the IME in zh / ja)
  let box = null;
  function dom() {
    if (box || typeof document === 'undefined') return;
    const css = document.createElement('style');
    css.textContent = `
      #hq-say .hq-gr { display: inline-block; font: 900 17px Bahnschrift, sans-serif; color: #fff; border: 2.5px solid #2b2235; border-radius: 99px; padding: 0 11px; margin-right: 8px; transform: rotate(-3deg); }
      #hq-say .hq-gr.S { background: #e0a020; } #hq-say .hq-gr.A { background: #1fa3a0; } #hq-say .hq-gr.B { background: #3f7fc9; } #hq-say .hq-gr.C { background: #8a5ab0; } #hq-say .hq-gr.D { background: #8a8f9e; }
      #hq-say .hq-mean { font-size: 13px; opacity: .7; margin-top: -2px; }
      #hq-say .learnword { display: none; } #hq-say.learn .learnword { display: flex; }
      #hq-say .hq-res { min-height: 22px; font-weight: 700; font-size: 15px; }`;
    document.head.appendChild(css);
    box = document.createElement('div'); box.id = 'hq-say'; box.className = 'panel hidden';
    box.innerHTML = '<canvas class="pic" width="96" height="96" style="grid-row: span 5; background:#fff; border-radius:14px; border:2px dashed rgba(43,34,53,.3)"></canvas><div class="ptitle"></div><div class="hq-mean"></div>'
      + '<div class="learnword"></div><div class="hint"></div><div class="hq-res"></div>'
      + '<form autocomplete="off"><input spellcheck="false" placeholder="say it…"><button type="submit">Say it</button></form>'
      + '<div class="prow"><button type="button" data-a="hint">Hint (Tab)</button><button type="button" data-a="idk">I don’t know (?)</button><button type="button" data-a="esc">Not now (Esc)</button></div>';
    document.body.appendChild(box);
    if (typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(box.querySelector('input'));
  }
  // o: { title (en), icon, who (a name, for the title) } → Promise<{ grade, text } | { cancelled: true }>
  function ask(task, o = {}) {
    dom();
    return new Promise(resolve => {
      const l = lang(), cj = isC(l), model = task.model[l] || '', input = box.querySelector('input'), hintEl = box.querySelector('.hint'), res = box.querySelector('.hq-res'), learn = box.querySelector('.learnword');
      const spell = cj ? CJK.roman(model, { lang: l }) : model, chars = cj && CJK.mode(l) === 'chars';
      let hints = 0, tries = 0, shown = false, done = false;
      ICONS.draw(box.querySelector('canvas'), o.icon || 'speech');
      box.querySelector('.ptitle').textContent = o.title || `Say it in ${LANG_EN[l] || 'the language'}`;
      box.querySelector('.hq-mean').textContent = task.en ? `(“${task.en}”)` : '';
      box.classList.remove('learn'); learn.innerHTML = ''; res.innerHTML = ''; input.value = '';
      const showHint = () => {
        hintEl.classList.toggle('given', hints > 0);
        hintEl.textContent = hints ? [...spell].map((ch, i) => (/[\s,.!?¡¿。！？、，]/.test(ch) || i === 0 || hints >= 3 || (hints >= 2 && i % 2 === 0) || (i > 0 && /\s/.test(spell[i - 1])) ? ch : '_')).join('')
          : (o.hint || (chars ? `Type it in ${l === 'zh' ? 'pinyin, then pick the characters' : 'rōmaji (Space for kanji)'} · Tab: a hint · ?: show me` : 'You just heard it! · Tab: a hint · ?: show me'));
      };
      const reveal = () => {
        shown = true; box.classList.add('learn');
        learn.innerHTML = `<b>${cj ? CJK.html(model, { lang: l, ruby: 'always' }) : esc(model)}</b><span>${esc(task.en || '')}</span><button type="button">🔊</button>`;
        learn.querySelector('button').onclick = () => { try { UI.speak(UI.sayText(model)); } catch (e) { /* (no voice) */ } input.focus(); };
        try { UI.speak(UI.sayText(model)); } catch (e) { /* (no voice) */ }
        hintEl.classList.remove('given'); hintEl.textContent = 'Here it is. Type it to say it!'; input.value = ''; input.placeholder = cj ? spell : model; input.focus();
      };
      const finish = r => {
        if (done) return; done = true;
        setTimeout(() => { box.classList.add('hidden'); Input.typing = false; input.blur(); input.placeholder = 'say it…'; cleanup(); resolve(r); }, r.cancelled ? 0 : 1100);
      };
      const submit = e => {
        e.preventDefault(); if (done) return;
        const text = input.value.trim(); if (!text) return;
        if (!shown && /^\s*[?？]+\s*$|^(idk|i dont know|i don't know)$/i.test(text)) { reveal(); return; }
        const r = grade(text, task, l);
        if (r.english) { res.innerHTML = `In ${LANG_EN[l]}, please!`; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); input.select(); return; }
        if (!r.g) {
          tries++; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); Sound.play('wrong');
          if (tries >= 2 && !shown) { res.textContent = 'Not quite… here’s how:'; reveal(); }
          else { hints = Math.min(3, hints + 1); showHint(); res.textContent = shown ? 'Type what’s shown above.' : 'Not quite. Try again!'; input.select(); }
          return;
        }
        let g = r.g;
        if (shown) g = 'D'; else if (hints >= 2 && 'SAB'.includes(g)) g = g === 'S' ? 'B' : 'C'; else if (hints === 1 && g === 'S') g = 'A';
        if (tries && g === 'S') g = 'A';
        const better = g !== 'S' ? ` · ${cj ? '' : '«' + esc(model) + '»'}` : '';
        res.innerHTML = `<span class="hq-gr ${g}">${g}</span>${g === 'S' ? 'Perfect!' + (r.note ? ' ' + esc(r.note) : '') : esc(r.note || (g === 'D' ? 'You said it!' : 'Good!'))}${better}`;
        if (cj && g !== 'S') res.innerHTML += ` <span style="font-size:13px">${CJK.html(model, { lang: l, ruby: 'always' })}</span>`;
        Sound.play(g === 'S' ? 'perfect' : 'review');
        if (cj) try { CJK.used(text, model, { lang: l }); } catch (er) { /* */ }
        finish({ grade: g, text });
      };
      const key = e => {
        if (e.isComposing || e.keyCode === 229) { e.stopPropagation(); return; }
        if (e.key === 'Tab') { e.preventDefault(); if (!shown) { hints = Math.min(3, hints + 1); showHint(); } }
        if (e.key === 'Escape') { e.preventDefault(); finish({ cancelled: true }); }
        e.stopPropagation();
      };
      const click = e => { const a = e.target.dataset && e.target.dataset.a; if (!a) return; if (a === 'hint' && !shown) { hints = Math.min(3, hints + 1); showHint(); input.focus(); } if (a === 'idk' && !shown) reveal(); if (a === 'esc') finish({ cancelled: true }); };
      const form = box.querySelector('form');
      form.addEventListener('submit', submit); input.addEventListener('keydown', key); box.addEventListener('click', click);
      function cleanup() { form.removeEventListener('submit', submit); input.removeEventListener('keydown', key); box.removeEventListener('click', click); }
      showHint(); box.classList.remove('hidden'); Input.typing = true; setTimeout(() => input.focus(), 30);
      HQ._.open = { submit: txt => { input.value = txt; form.dispatchEvent(new Event('submit', { cancelable: true })); }, key: k => input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), state: () => ({ hints, tries, shown, done }) };
    });
  }

  // ============================================================ scenes: lines, demonstrations, your own lines
  const lock = on => { if (G && G.sim) G.sim.lock = on ? 1 : 0; };
  // someone in the room says L, through the weave like every resident (the user: never the whole line in the language with
  // the English under it by default; lines are mixed by the weave, and the whole English is on EN)
  async function say(p, L) {
    if (!p) return;
    const api = p.api || p; api.lines = L;
    if (typeof STORY !== 'undefined' && STORY.sayInline) await STORY.sayInline(api);
  }
  // A demonstration (DESIGN.md 7.9 and 16: you hear it before you're asked). The line is woven like any other; what you'll
  // be asked for is the one thing that's always in the language: in the line, glossed, and said out loud.
  // show: a task, or a list of tasks, [the English words in the line, task] pairs, and word ids (let into the weave first)
  const core = s => String(s || '').replace(/[\s.!?…。！？]+$/u, '');
  const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function weaveIn(en, task, match, l) {
    const src = task.model[l]; if (!src || !match) return en;
    let n = 0;
    return en.replace(new RegExp(`(^|[^\\p{L}])(${rxEsc(match)})(?![\\p{L}])`, 'giu'), (all, pre, m, off, whole) => {
      let t = core(isC(l) ? CJK.plain(src, { lang: l, cap: false }) : src);
      if (!isC(l)) {
        const before = whole.slice(0, off + pre.length).trimEnd(), start = !before || /[.!?…:“"«„「(]$/.test(before);
        if (!start || /^[a-z]/.test(m)) t = t.replace(/^([¡¿]?)(.)/u, (a, p, c) => p + c.toLowerCase());
        const rest = whole.slice(off + all.length), mark = (rest.match(/[.!?…”"»]/) || [''])[0];
        if ((t[0] === '¡' && mark !== '!') || (t[0] === '¿' && mark !== '?')) t = t.slice(1);
      }
      const rd = isC(l) && CJK.mode(l) === 'chars' ? core(CJK.roman(src, { lang: l })) + ': ' : '';
      return pre + t + (n++ ? '' : ` (${rd}${m})`);
    });
  }
  async function demo(p, L, show) {
    if (!p) return;
    const l = lang(), items = [].concat(show || []), heard = [];
    let en = L.en || '';
    for (const it of items) {
      if (typeof it === 'string') { if (typeof STORY !== 'undefined' && STORY.introduce) STORY.introduce(it); continue; }
      const [match, task] = Array.isArray(it) ? it : [core(it.en), it];
      if (!task || !task.model || !task.model[l]) continue;
      en = weaveIn(en, task, match, l); heard.push(UI.sayText(task.model[l]));
    }
    if (heard.length) setTimeout(() => { try { UI.speak(heard.join(isC(l) ? '、' : ', ')); } catch (e) { /* (no voice on this PC) */ } }, 250);
    return say(p, en === L.en ? L : Object.assign({}, L, { en }));
  }
  const me = text => STORY.you(text);
  // your own line with the phrase in it, in the language, glossed: meSays('So it’s «', task, '»!')
  const meSays = (before, task, after) => STORY.youWord(before, STORY.wordPart(null, task.model[lang()] || task.model.es, task.en), after || '');
  const think = (text, s) => STORY.think(text, s);
  const wait = s => STORY.wait(s);
  const mimo = (text, s = 1.8) => { const M = G.sim.mimo; G.sim.mimoSay(text, s); M.happy = Math.max(M.happy || 0, 0.8); };
  const person = pid => INTERIORS.person(pid);
  // the grade's reaction from the person, then the rewards
  function reward(q, g) {
    const coins = (q.coins || 6) + ({ S: 3, A: 2, B: 1 }[g] || 0), st = S();
    G.state.coins = (G.state.coins || 0) + coins;
    st.grades = st.grades || {}; st.grades[q.id] = g;
    UI.toast(`🪙 +${coins} coins`);
    if (q.phrase && teachPhrase(q.phrase)) { const it = LEX.item(q.phrase); setTimeout(() => UI.toast(`📖 New in your Phrasebook: «${plainOf(it[lang()])}»`), 700); }
    if (q.keep) { give(q.keep); setTimeout(() => UI.toast(`🎁 ${itemName(q.keep)} (in your bag)`), 1400); }
    Sound.play('chest');
    if (typeof DICT !== 'undefined' && DICT.log) try { DICT.log('talk', 1, g); } catch (e) { /* */ }
  }

  // ============================================================ the quests
  // def: { id, home, giver (a pid), done (the last stage), coins, phrase, keep, title(), who(), steps: [{ until, text(),
  // why, hint, at: [home, pid?] }], story(), talk: { [pid]: st → async fn | null }, extras(st, ctx) → [{ x, z, r, label,
  // run }], props(st, ctx) → [...], mark: { [pid]: st → '!' | '◆' | null } }
  function quest(def) { QS.push(def); return def; }
  // where the compass points: the person, when you're in their room; their front door from outside
  function targetOf(at) {
    if (!at) return null;
    const [home, pid] = at, cur = INTERIORS.current;
    if (cur && cur.id === home) { const p = pid && person(pid); if (p) return { x: p.api.x, z: p.api.z }; return null; }
    if (cur) return null;
    const d = INTERIORS.doors(G).find(x => x.id === home); return d ? { x: d.x, z: d.z } : null;
  }
  function questEntry(q) {
    const id = q.id, stg = s => (s && s.hq && s.hq[id]) || 0;
    return { id, kind: 'side', get title() { return q.title(); }, get giver() { return q.who(); },
      started: s => stg(s) >= 1,
      steps: q.steps.map(sp => ({ get text() { return typeof sp.text === 'function' ? sp.text() : sp.text; }, get why() { return typeof sp.why === 'function' ? sp.why() : sp.why; }, hint: sp.hint || '',
        done: s => stg(s) >= sp.until, target: () => targetOf(sp.at) })),
      story: q.story ? [{ when: s => stg(s) >= q.done, get text() { return q.story(); } }] : [] };
  }
  const here = q => { const c = INTERIORS.current; return c && c.id === q.home; };
  INTERIORS.hook({
    talk(ctx) {
      if (!ctx.door || !ctx.pid) return null;
      for (const q of QS) {
        const f = q.talk && q.talk[ctx.pid]; if (!f) continue;
        const home = q.homes ? q.homes[ctx.pid] : q.home; if (home && home !== ctx.door.id) continue;
        const fn = f(stage(q.id), ctx.p, ctx); if (fn) return () => Promise.resolve(fn()).catch(e => console.error('[hq] ' + q.id, e)).finally(() => { lock(false); });
      }
      return null;
    },
    extras(ctx) { const out = []; if (!ctx.door) return out; for (const q of QS) if (q.extras) { const homes = q.homes ? Object.values(q.homes).concat(q.home) : [q.home]; if (homes.includes(ctx.door.id)) out.push(...(q.extras(stage(q.id), ctx) || [])); } return out; },
    mark(ctx) { if (!ctx.pid || !ctx.door) return null; for (const q of QS) { const f = q.mark && q.mark[ctx.pid]; if (!f) continue; const home = q.homes ? q.homes[ctx.pid] : q.home; if (home && home !== ctx.door.id) continue; const m = f(stage(q.id), ctx); if (m) return m; } return null; },
    props(ctx) { const out = []; if (!ctx.door) return out; for (const q of QS) if (q.props) { const homes = q.homes ? Object.values(q.homes).concat(q.home) : [q.home]; if (homes.includes(ctx.door.id)) out.push(...(q.props(stage(q.id), ctx) || [])); } return out; },
  });
  // zh / ja strings, for CJK.validate (INTERIORS._.cjCheck() includes them) and for the IME's dictionary
  function cjSources() {
    const out = [], add = (where, src, l) => { if (src) out.push({ where, src, l }); };
    for (const q of QS) for (const [k, v] of Object.entries(q.lines || {})) for (const l of ['zh', 'ja']) add(`${q.id} ${k}`, v[l], l);
    for (const q of QS) for (const [k, t] of Object.entries(q.tasks || {})) for (const l of ['zh', 'ja']) { add(`${q.id} task ${k}`, t.model[l], l); ((t.ok && t.ok[l]) || []).forEach(s => add(`${q.id} task ${k} ok`, s, l)); }
    for (const d of Object.values(PH).concat(Object.values(KEEP))) for (const l of ['zh', 'ja']) add(d.id, d[l], l);
    return out;
  }
  INTERIORS.cjMore(cjSources);
  function init(game) {
    G = game;
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST) for (const q of QS) if (!QUESTS.LIST.some(x => x.id === q.id)) QUESTS.LIST.push(questEntry(q));
    if (typeof CJK !== 'undefined' && CJK.addSource) try { for (const l of ['zh', 'ja']) CJK.addSource(cjSources().filter(s => s.l === l).map(s => s.src), l); } catch (e) { console.error('[hq]', e); }
  }
  const coins = k => { G.state.coins = (G.state.coins || 0) + k; UI.toast(`🪙 +${k} coins`); Sound.play('review'); };
  return { T, quest, phrase, keep, teachPhrase, ask, grade, say, demo, me, meSays, think, wait, mimo, person, reward, give, take, has, itemName, stage, setStage, n, lock, init,
    plainOf, lang, isC, coins, get quests() { return QS; }, get G() { return G; },
    _: { open: null, questEntry, targetOf, cjSources, PH, KEEP, here, weaveIn } };
})();
// (INTERIORS.init calls the quests' init: one more line there, so main.js stays as it is)
