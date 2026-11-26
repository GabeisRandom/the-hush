'use strict';
// MOCKUI: the practice papers' screens (DESIGN.md 21.2 C; EX2), drawn in EXAMUI's overlay (#ex):
//   MOCKUI.choose() → Promise<{ key, fmt, level, timed, only, resume } | null>   the list: every paper of the language, the full
//        paper or one section as a drill, untimed by default with a timed switch, your best results
//   MOCKUI.coverHTML(att) · reportHTML(att) · cardHTML(turn) · frameHTML(frame) · taskName(att, n)   pieces exam_ui.js puts in
// Every cover and report carries the honesty lines: our own questions, not an official exam, and the real exam may differ.

const MOCKUI = (() => {
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = s => (isC() ? CJK.html(String(s == null ? '' : s), { lang: L() }) : E(s));
  const fmt = v => (Math.round(v * 100) / 100).toString();
  const PL = s => (isC() ? CJK.plain(String(s == null ? '' : s), { lang: L() }) : MOCK.stripRuby(s));          // (a name as plain text, in the reading mode)
  const lineOf = x => EXAM._.lineOf(x);
  const X = () => EXAMUI._;
  const fill = (s, att) => String(s || '').replace(/\{level\}/g, att.level).replace(/\{title\}/g, MOCK.titleOf(MOCK.F[att.format], att.level));
  const mins = m => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);
  const PART_ICON = { listen: '🎧', read: '📖', write: '✍️', speak: '💬' };

  // the line every paper shows: practice in the format of…, our own questions, not an official exam
  function honestHTML(att, F) {
    const p = F.practice || ['', ''];
    return `<div class="honest"><b>${E(fill(p[1], att))}</b>${p[0] ? `<br>${T(fill(p[0], att))}` : ''}${F.nospeak ? `<br>${T(F.nospeak[0])} <i>(${E(F.nospeak[1])})</i>` : ''}</div>`;
  }
  // how the format is passed, in a sentence
  function ruleText(F, level) {
    const P = MOCK.at(F.pass, level) && MOCK.at(F.pass, level).kind ? MOCK.at(F.pass, level) : F.pass;
    const nm = id => { const s = F.sections.find(x => x.id === id); return s ? PL(s.name) : id; };
    if (P.kind === 'groups') return P.groups.map(g => `${g.en} (${g.of.map(nm).join(' + ')}) needs ${g.min} of ${g.max}`).join('; ') + `. Both groups: ${F.words.pass}.`;
    if (P.kind === 'total') return `A pass is ${P.min} of ${MOCK.at(F.total, level)}${F.grades ? ` (${F.grades.filter(g => g[0] > 0).map(g => `${g[1]} ${g[0]}+`).join(', ')})` : ''}, with no minimum per section.`;
    if (P.kind === 'modules') return `Each module is out of 100 and passed on its own at ${P.min}.`;
    if (P.kind === 'scaled') return `Scored out of ${F.total} in scoring sections (${F.scoring[level].map(g => `${PL(g.name)} ${g.max}, at least ${g.min}`).join('; ')}); a pass is ${P.min} overall.`;
    if (P.kind === 'bands') { const b = Array.isArray(P.bands) ? P.bands : P.bands[level]; return `Each part is marked 0–5; the lower part decides the band: ${b.filter(x => x[0] > 0).map(x => `${x[1]} ${x[0].toFixed(2)}+`).join(', ')}.`; }
    return '';
  }

  // ------------------------------------------------------------ the cover
  function coverHTML(att) {
    const F = MOCK.F[att.format]; if (!F) return '';
    const rows = att.sections.map(s => {
      const r = att.res[s.id], plays = s.playsBy ? s.playsBy.join(' / ') : s.plays ? String(s.plays) : '';
      return `<tr><td>${PART_ICON[s.part] || ''} ${T(s.title.t)}<br><small class="note">${E(s.title.en.split(' · ').slice(1).join(' · '))}</small></td>`
        + `<td class="n">${s.time ? mins(s.time) : '—'}${s.prep ? `<br><small class="note">+ ${s.prep} prep</small>` : ''}</td><td class="n">${s.ntasks || s.tasks.length}</td><td class="n">${s.items || ''}</td>`
        + `<td class="n">${plays ? plays + '×' : ''}</td><td class="n">${r && r.done ? `<b class="ok">${fmt(r.score)}</b> / ` : ''}${s.max}</td></tr>`;
    }).join('');
    const total = att.sections.reduce((a, s) => a + (s.time || 0) + (s.prep || 0), 0);
    return `<h2>${E(MOCK.titleOf(F, att.level))}${att.drill ? ' · drill' : ''}<span class="mk-mode ${att.timed ? 't' : ''}">${att.timed ? `⏱ timed · ${mins(total)}` : 'untimed'}</span></h2>`
      + honestHTML(att, F)
      + `<table class="mk-tbl"><tr><th>Section</th><th class="n">Time</th><th class="n">Tasks</th><th class="n">Items</th><th class="n">Plays</th><th class="n">Points</th></tr>${rows}</table>`
      + `<p class="note"><b>How it’s passed:</b> ${E(ruleText(F, att.level))}${att.drill ? ((MOCK.at(F.pass, att.level) || F.pass).kind === 'modules' ? ' This module is passed on its own, like the real one.' : ' A drill is one section on its own: you get its score, with no pass.') : ''}</p>`
      + `<ul class="rules">${att.timed ? '<li>Each section has the real exam’s time, shown at the top. At 0 it hands itself in; blank answers just score 0.</li>' : '<li>No clock: take your time. Timed mode is a switch on the practice list.</li>'}`
      + '<li>You can stop between sections; finished ones are kept.</li><li>No help: Mimo waits on the bench by the door.</li></ul>';
  }

  // ------------------------------------------------------------ the score report, shaped like the format's real one
  function reportHTML(att) {
    const F = MOCK.F[att.format]; if (!F) return '';
    const r = att.report || MOCK.result(att), lab = F.lab || {};
    const cell = (v, max) => `<td class="n">${fmt(v)}</td><td class="n">${max}</td>`;
    let rows = '';
    for (const x of r.rows) rows += `<tr><td>${T(x.name)}</td>${cell(x.score, x.max)}<td>${x.min != null ? `${x.min}${x.ok ? ' <span class="ok">✓</span>' : ' <span class="bad">✗</span>'}` : ''}${x.grade ? ` <i>${E(x.grade)}</i>` : ''}${x.tasks ? `<br><small class="note">${x.tasks.map((v, i) => `${E((F.taskWord || ['Task'])[0])} ${i + 1}: ${fmt(v)}`).join(' · ')}</small>` : ''}</td></tr>`;
    for (const g of r.groups) rows += `<tr class="grp"><td>${E(g.name)} <small class="note">(${E(g.of.map(id => PL((F.sections.find(s => s.id === id) || {}).name || id)).join(' + '))})</small></td>${cell(g.score, g.max)}<td>${g.part ? '<i>needs both sections</i>' : `${g.min}${g.ok ? ' <span class="ok">✓</span>' : ' <span class="bad">✗</span>'}`}</td></tr>`;
    const P = MOCK.at(F.pass, att.level) && MOCK.at(F.pass, att.level).kind ? MOCK.at(F.pass, att.level) : F.pass;
    if (P.kind !== 'groups' && P.kind !== 'bands' && P.kind !== 'modules') rows += `<tr class="fin"><td>${T(lab.final || 'Total')}</td>${cell(r.total, r.totalMax)}<td>${r.line != null ? r.line : ''}</td></tr>`;
    if (P.kind === 'bands') rows += `<tr class="fin"><td>${T(lab.final || 'Level')}</td><td class="n" colspan="2">${fmt(r.total)} / 5</td><td>${E(r.band || '—')}</td></tr>`;
    const used = att.sections.map(s => { const x = att.res[s.id]; return x && x.time ? `${PL(s.title.t)} ${Math.max(1, Math.round(x.time / 60000))} min${x.timeUp ? ' (time ran out)' : ''}` : ''; }).filter(Boolean);
    // (a drill shows its score, no pass; but a Goethe B1–B2 module stands on its own, so it's passed or not like the real one)
    const solo = r.drill && !r.modular, ok = r.passed, word = solo ? '' : r.word;
    return `<div class="rep"><h2>${T(lab.report || 'Results')} · ${E(MOCK.titleOf(F, att.level))}${att.drill ? ' · drill' : ''}</h2>`
      + (solo ? `<div class="res"><div class="big">${fmt(r.total)}<small> / ${r.totalMax}</small></div></div>`
        : `<p style="text-align:center;margin:6px 0">${word ? `<span class="verdict ${ok ? '' : 'no'}">${T(word)}</span>` : ''}${r.grade ? ` <b style="font-size:18px">${E(r.grade)}</b>` : ''}</p>`)
      + `<table class="mk-tbl"><tr><th>${T(lab.section || 'Section')}</th><th class="n">${T(lab.score || 'Score')}</th><th class="n">max</th><th>${lab.min === '' ? '' : T(lab.min || 'Pass line')}</th></tr>${rows}</table>`
      + (solo ? '<p class="note">A drill is one section on its own: here’s its score. The full paper decides a pass.</p>' : r.drill ? '<p class="note">Each module of this exam is passed on its own, so this one counts like the real module.</p>' : '')
      + `<p class="note">${att.timed ? '⏱ Timed, with the real section times.' : 'Untimed practice.'}${used.length ? ' Time you took: ' + E(used.join(' · ')) + '.' : ''}</p>`
      + honestHTML(att, F) + `<p class="note">${E((F.note || ['', ''])[1])}${F.note && F.note[0] ? ` <span class="note">${T(F.note[0])}</span>` : ''}</p></div>`;
  }

  // ------------------------------------------------------------ a speaking card (the topic and its prompts, a situation, a photo)
  function cardHTML(t) {
    const c = t.card || {}; const ti = c.title ? lineOf(c.title) : null;
    return `<div class="mk-card">${ti ? `<h4>${T(ti.t)} <span class="note">${E(ti.en)}</span></h4>` : ''}`
      + EXAM._.linesOf(c.lines || []).map(l => `<p style="margin:2px 0">${X().lineHTML(l)}</p>`).join('')
      + (c.list ? `<ul>${EXAM._.linesOf(c.list).map(l => `<li>${X().lineHTML(l)}</li>`).join('')}</ul>` : '')
      + (c.icons ? `<div class="opts">${c.icons.map(ic => `<canvas width="88" height="88" data-icon="${E(ic)}" style="width:64px;height:64px"></canvas>`).join('')}</div>` : '')
      + (c.pic ? `<canvas class="pic" width="480" height="300" data-pic="${E(c.pic)}"></canvas>` : '') + '</div>';
  }
  // Celpe-Bras's frame for a written task: the genre, who writes, to whom, and what for
  function frameHTML(fr) {
    const row = (k, en, v) => (v ? `<tr><td><b>${E(k)}</b> <small class="note">${E(en)}</small></td><td>${X().lineHTML(lineOf(v))}</td></tr>` : '');
    return `<table class="mk-tbl">${row('Gênero', 'genre', fr.genre)}${row('Quem escreve', 'you write as', fr.from)}${row('Para quem', 'to whom', fr.to)}${row('Para quê', 'what for', fr.purpose)}</table>`;
  }
  const taskName = (att, n) => { const F = MOCK.F[att.format] || {}; const w = (F.taskWord || ['Task {n}'])[0]; return PL(w.includes('{n}') ? w.replace('{n}', n) : `${w} ${n}`); };
  // the examiner's welcome to a practice paper (the format's own line: «four papers, in the real exam's order»)
  const hello = att => { const F = MOCK.F[att.format]; const ln = F && F.hello ? lineOf(F.hello) : null; return ln ? { t: fill(ln.t, att), en: fill(ln.en, att) } : null; };

  // ------------------------------------------------------------ the practice list: every paper, the full one or one section
  function choose() {
    return new Promise(resolve => {
      const f = X().frame({ title: 'Practice papers', sub: 'Real exam formats · our own questions · not official exams', steps: [] });
      let timed = false;
      try { timed = localStorage.getItem('ex.timed') === '1'; } catch (e) { /* */ }
      const draw = () => {
        const rows = MOCK.rows(L());
        if (!rows.length) { f.body.innerHTML = '<p>No practice papers in this language yet.</p>'; return; }
        f.body.innerHTML = `<p class="note">Papers in each exam’s real format, with our own questions. They aren’t official exams: the scores show how the real one is marked, and the real one may differ.</p>`
          + `<p><label style="font-weight:800;cursor:pointer"><input type="checkbox" data-timed ${timed ? 'checked' : ''}> ⏱ Timed, with the real section times</label> <span class="note">(off: no clock)</span></p>`
          + `<div class="mk-list">${rows.map(r => {
            const b = r.best;
            return `<div class="mk-row"><h4>${E(r.title)} <span class="note" style="font-size:13px">${mins(r.minutes)}</span></h4>`
              + (b ? `<div class="best">Your best: <b>${T(b.word || '')}</b> ${b.band ? '' : `${fmt(b.total)}/${b.totalMax}`}${b.timed ? ' · timed' : ''} · ${new Date(b.at).toLocaleDateString()}</div>` : '')
              + `<div class="acts">${r.paused ? `<button class="btn main" data-go="${E(r.key)}" data-resume="1">Go on with it ▸</button>` : ''}<button class="btn ${r.paused ? '' : 'main'}" data-go="${E(r.key)}">${r.paused ? 'Start over' : 'The full paper ▸'}</button></div>`
              + `<div class="drills"><span class="note" style="align-self:center">Or one section:</span>${r.drills.map(d => `<button class="btn sm" data-go="${E(r.key)}" data-only="${E(d.id)}" title="${E(d.en)}">${PART_ICON[d.part] || ''} ${T(d.name)} · ${d.time} min${d.best ? ` · best ${fmt(d.best.total)}/${d.best.totalMax}` : ''}</button>`).join('')}</div></div>`;
          }).join('')}</div>`;
        const cb = f.body.querySelector('[data-timed]');
        if (cb) cb.onchange = () => { timed = cb.checked; try { localStorage.setItem('ex.timed', timed ? '1' : '0'); } catch (e) { /* */ } };
        f.body.querySelectorAll('[data-go]').forEach(btn => btn.onclick = () => {
          const r = rows.find(x => x.key === btn.dataset.go); if (!r) return;
          done({ key: r.key, fmt: r.fmt, level: r.level, timed, only: btn.dataset.only || null, resume: !!btn.dataset.resume });
        });
      };
      let finished = false;
      const done = v => { if (finished) return; finished = true; EXAMUI.close(); resolve(v); };
      draw();
      const cl = document.createElement('button'); cl.className = 'btn'; cl.textContent = 'Close'; f.foot.appendChild(cl);
      cl.onclick = () => done(null); f.x.onclick = () => done(null);
    });
  }
  // the chosen paper, run (a paused one goes on; "start over" drops it)
  function start(v) {
    if (!v) return Promise.resolve(null);
    const id = v.only ? `${v.key}~${v.only}` : v.key;
    if (v.resume) return MOCK.resume(id);
    const pa = MOCK.paused(id); if (pa) { pa.abandoned = true; delete EXAM.state.curMock[id]; }
    return MOCK.run(L(), v.fmt, v.level, { timed: v.timed, only: v.only });
  }

  return { choose, start, coverHTML, reportHTML, cardHTML, frameHTML, taskName, hello, ruleText };
})();
