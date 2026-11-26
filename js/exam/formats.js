'use strict';
// MOCK: the exam hall's practice papers in real formats (DESIGN.md 21.2 C; EX2). A practice paper is an EXAM paper (exam.js) with
// timed sections, clip plays, prep time and the real exam's way of scoring and passing. Its tasks are ordinary EXAM tasks (the
// content is in js/exam/papers/), so the graders, the review, "What to practice" and DICT.log work as they do in the level exams.
//   MOCK.add(lang, fmt, level, { tasks, sections: { <section id>: [task ids] } })   a paper's content
//   MOCK.paper(lang, fmt, level, { timed, only }) → the EXAM paper (only: one section on its own, a drill)
//   MOCK.run(lang, fmt, level, o) → Promise<attempt> · MOCK.resume(key) · MOCK.rows(lang) (the chooser's list)
//   MOCK.result(att) → the report's numbers (sections, groups, total, pass line, the result word) · MOCK.best(key) · MOCK.F
// FORMATS keeps each format's numbers in one table: section times, item counts, clip plays, scales, pass lines and grade words.
// They're AS MODELED from the exam boards' public descriptions (2026-11), so check them against the official sites when a format
// changes: DELE examenes.cervantes.es · Goethe goethe.de · HSK chinesetest.cn · JLPT jlpt.jp · Celpe-Bras gov.br/inep.

const MOCK = (() => {
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const at = (v, lv) => (v != null && typeof v === 'object' && !Array.isArray(v) ? v[lv] : v);
  const round = (v, step = 0.5) => Math.round(v / step) * step;

  // ------------------------------------------------------------ the formats (as modeled: check against the official sites)
  const FORMATS = {
    // DELE (Instituto Cervantes), 2020 format. Four pruebas of 25; APTO needs 30 of 50 in Grupo 1 (reading + writing) and in
    // Grupo 2 (listening + speaking). The oral has preparation time before it.
    dele: {
      lang: 'es', name: 'DELE', levels: ['A1', 'A2', 'B1', 'B2'], band: { A1: 1, A2: 2, B1: 3, B2: 4 }, site: 'examenes.cervantes.es',
      sections: [
        { id: 'lectura', part: 'read', name: 'Comprensión de lectura', en: 'Reading', max: 25, time: { A1: 45, A2: 60, B1: 70, B2: 70 }, tasks: { A1: 4, A2: 4, B1: 5, B2: 4 }, items: { A1: 25, A2: 25, B1: 30, B2: 36 } },
        { id: 'auditiva', part: 'listen', name: 'Comprensión auditiva', en: 'Listening', max: 25, time: { A1: 20, A2: 40, B1: 40, B2: 40 }, tasks: { A1: 4, A2: 4, B1: 5, B2: 5 }, items: { A1: 25, A2: 25, B1: 30, B2: 30 }, plays: 2 },
        { id: 'escrita', part: 'write', name: 'Expresión e interacción escritas', en: 'Writing', max: 25, time: { A1: 25, A2: 45, B1: 60, B2: 80 }, tasks: { A1: 2, A2: 2, B1: 2, B2: 2 } },
        { id: 'oral', part: 'speak', name: 'Expresión e interacción orales', en: 'Speaking', max: 25, time: { A1: 10, A2: 12, B1: 15, B2: 20 }, prep: { A1: 10, A2: 12, B1: 15, B2: 20 }, tasks: { A1: 4, A2: 3, B1: 4, B2: 3 } },
      ],
      pass: { kind: 'groups', groups: [{ id: 'g1', name: 'Grupo 1', en: 'Group 1', of: ['lectura', 'escrita'], max: 50, min: 30 }, { id: 'g2', name: 'Grupo 2', en: 'Group 2', of: ['auditiva', 'oral'], max: 50, min: 30 }] },
      total: 100, words: { pass: 'APTO', fail: 'NO APTO' }, taskWord: ['Tarea', 'Task'], optWord: 'Opción',
      practice: ['Práctica con el formato del DELE {level}. Preguntas propias; no es un examen oficial.', 'Practice in the format of the DELE {level}. Our own questions; not an official exam.'],
      note: ['Puntuación calculada como en el examen real, en la medida en que podemos reproducirla. El examen real puede ser distinto.', 'Scored the way the real exam is, as closely as we can model it; the real exam may differ.'],
      lab: { report: 'Calificaciones', section: 'Prueba', score: 'Puntuación', min: 'mínimo', group: 'Grupo', final: 'Calificación final' },
      hello: ['Buenos días. Hoy practicamos con el formato del DELE {level}: cuatro pruebas, en el mismo orden que el examen real. Cuando quiera, empezamos.', 'Good morning. Today we’re practicing in the format of the DELE {level}: four papers, in the same order as the real exam. We’ll start whenever you like.'],
    },
    // Goethe-Zertifikat (Goethe-Institut). A1 (Start Deutsch 1) and A2: one exam out of 100, a pass at 60. B1 and B2: modular,
    // each module out of 100 and passed at 60 on its own. Some Hören parts play twice, some once.
    goethe: {
      lang: 'de', name: 'Goethe-Zertifikat', levels: ['A1', 'A2', 'B1', 'B2'], band: { A1: 1, A2: 2, B1: 3, B2: 4 }, site: 'goethe.de',
      title: { A1: 'Goethe-Zertifikat A1: Start Deutsch 1', A2: 'Goethe-Zertifikat A2', B1: 'Goethe-Zertifikat B1', B2: 'Goethe-Zertifikat B2' },
      sections: [
        { id: 'lesen', part: 'read', name: 'Lesen', en: 'Reading', max: { A1: 25, A2: 25, B1: 100, B2: 100 }, time: { A1: 25, A2: 30, B1: 65, B2: 65 }, tasks: { A1: 3, A2: 4, B1: 5, B2: 5 }, items: { A1: 15, A2: 20, B1: 30, B2: 30 } },
        { id: 'hoeren', part: 'listen', name: 'Hören', en: 'Listening', max: { A1: 25, A2: 25, B1: 100, B2: 100 }, time: { A1: 20, A2: 30, B1: 40, B2: 40 }, tasks: { A1: 3, A2: 4, B1: 4, B2: 4 }, items: { A1: 15, A2: 20, B1: 30, B2: 25 },
          plays: { A1: [2, 1, 2], A2: [2, 1, 1, 2], B1: [2, 1, 1, 2], B2: [1, 1, 1, 2] } },
        { id: 'schreiben', part: 'write', name: 'Schreiben', en: 'Writing', max: { A1: 25, A2: 25, B1: 100, B2: 100 }, time: { A1: 20, A2: 30, B1: 60, B2: 75 }, tasks: { A1: 2, A2: 2, B1: 3, B2: 2 } },
        { id: 'sprechen', part: 'speak', name: 'Sprechen', en: 'Speaking', max: { A1: 25, A2: 25, B1: 100, B2: 100 }, time: { A1: 15, A2: 15, B1: 15, B2: 15 }, prep: { B1: 15, B2: 15 }, tasks: { A1: 3, A2: 3, B1: 3, B2: 2 } },
      ],
      order: { A1: ['hoeren', 'lesen', 'schreiben', 'sprechen'] },
      pass: { A1: { kind: 'total', min: 60 }, A2: { kind: 'total', min: 60 }, B1: { kind: 'modules', min: 60 }, B2: { kind: 'modules', min: 60 } },
      total: { A1: 100, A2: 100 }, grades: [[90, 'sehr gut'], [80, 'gut'], [70, 'befriedigend'], [60, 'ausreichend'], [0, 'nicht bestanden']],
      words: { pass: 'bestanden', fail: 'nicht bestanden' }, taskWord: ['Teil', 'Part'], optWord: 'Thema',
      practice: ['Übung im Format des Goethe-Zertifikats {level}. Eigene Aufgaben; keine offizielle Prüfung.', 'Practice in the format of the {title}. Our own questions; not an official exam.'],
      note: ['Bewertet wie die echte Prüfung, so genau wir sie nachbilden können. Die echte Prüfung kann abweichen.', 'Scored the way the real exam is, as closely as we can model it; the real exam may differ.'],
      lab: { report: 'Ergebnis', section: 'Modul', score: 'Punkte', min: 'zum Bestehen', final: 'Gesamtergebnis' },
      hello: ['Guten Tag! Heute üben wir im Format des Goethe-Zertifikats {level}. Die Teile kommen in derselben Reihenfolge wie in der echten Prüfung. Wir fangen an, wenn Sie bereit sind.', 'Good afternoon! Today we’re practicing in the format of the {title}. The parts come in the same order as in the real exam. We’ll start when you’re ready.'],
    },
    // HSK (the six-level format), levels 1–4. Each section is scaled to 100; a pass is 120 of 200 (HSK 1–2) or 180 of 300 (3–4),
    // with no minimum per section. HSK 1–3 recordings play twice, HSK 4 once. No speaking (the HSKK is a separate exam).
    hsk: {
      lang: 'zh', name: 'HSK', levels: ['1', '2', '3', '4'], band: { 1: 1, 2: 2, 3: 3, 4: 4 }, site: 'chinesetest.cn',
      sections: [
        { id: 'tingli', part: 'listen', name: '[听力|tīng lì]', en: 'Listening', max: 100, time: { 1: 15, 2: 25, 3: 35, 4: 30 }, tasks: { 1: 4, 2: 4, 3: 4, 4: 3 }, items: { 1: 20, 2: 35, 3: 40, 4: 45 }, plays: { 1: 2, 2: 2, 3: 2, 4: 1 } },
        { id: 'yuedu', part: 'read', name: '[阅读|yuè dú]', en: 'Reading', max: 100, time: { 1: 17, 2: 22, 3: 30, 4: 40 }, tasks: { 1: 4, 2: 4, 3: 3, 4: 3 }, items: { 1: 20, 2: 25, 3: 30, 4: 40 } },
        { id: 'shuxie', part: 'write', kind: 'items', name: '[书写|shū xiě]', en: 'Writing', max: 100, time: { 3: 15, 4: 25 }, tasks: { 3: 2, 4: 2 }, items: { 3: 10, 4: 15 } },
      ],
      pass: { 1: { kind: 'total', min: 120 }, 2: { kind: 'total', min: 120 }, 3: { kind: 'total', min: 180 }, 4: { kind: 'total', min: 180 } },
      total: { 1: 200, 2: 200, 3: 300, 4: 300 }, words: { pass: '[合格|hé gé]', fail: '[不合格|bù hé gé]' }, taskWord: ['[第|dì] {n} [部分|bù fen]', 'Part {n}'],
      nospeak: ['[这|zhè] [份|fèn] [练习|liàn xí] [没有|méi yǒu] [口语|kǒu yǔ] [部分|bù fen] 。 HSKK [是|shì] [另|lìng] [一|yī] [种|zhǒng] [考试|kǎo shì] 。', 'There’s no speaking section: the HSKK is a separate exam.'],
      practice: ['[按照|àn zhào] HSK {level} [级|jí] [的|de] [格式|gé shì] [练习|liàn xí] 。 [题目|tí mù] [是|shì] [学院|xué yuàn] [自己|zì jǐ] [编写|biān xiě] [的|de] ， [不是|bù shì] [正式|zhèng shì] [考试|kǎo shì] 。', 'Practice in the format of HSK level {level}. Our own questions; not an official exam.'],
      note: ['[按照|àn zhào] [真实|zhēn shí] [考试|kǎo shì] [的|de] [方法|fāng fǎ] [计分|jì fēn] ， [尽量|jǐn liàng] [接近|jiē jìn] 。 [真实|zhēn shí] [考试|kǎo shì] [可能|kě néng] [不|bù] [一样|yī yàng] 。', 'Scored the way the real exam is, as closely as we can model it; the real exam may differ.'],
      lab: { report: '[成绩|chéng jì] [报告|bào gào]', section: '[部分|bù fen]', score: '[分数|fēn shù]', min: '[合格|hé gé] [分数线|fēn shù xiàn]', final: '[总分|zǒng fēn]' },
      hello: ['[您好|nín hǎo] ！ [今天|jīn tiān] [我们|wǒ men] [做|zuò] [一|yī] [份|fèn] HSK {level} [级|jí] [的|de] [练习|liàn xí] [试卷|shì juàn] 。 [您|nín] [准备|zhǔn bèi] [好|hǎo] [了|le] [我们|wǒ men] [就|jiù] [开始|kāi shǐ] 。', 'Hello! Today we’re doing an HSK level {level} practice paper. We’ll start when you’re ready.'],
    },
    // JLPT (Japan Foundation / JEES), N5–N3. Scored in scaled sections out of 180, with a minimum in each scoring section
    // (N5/N4: language knowledge + reading out of 120, at least 38; listening out of 60, at least 19. N3: three sections out of 60,
    // at least 19 each). Recordings play once. No speaking or writing section.
    jlpt: {
      lang: 'ja', name: 'JLPT', levels: ['N5', 'N4', 'N3'], band: { N5: 1, N4: 2, N3: 3 }, site: 'jlpt.jp',
      sections: [
        // (N5 and N4 with the shorter tests from December 2020: fewer questions per mondai)
        { id: 'moji', part: 'read', name: '[言語|げんご] [知識|ちしき] （ [文字|もじ] ・ [語彙|ごい] ）', en: 'Language knowledge: vocabulary', time: { N5: 20, N4: 25, N3: 30 }, items: { N5: 21, N4: 28, N3: 35 }, tasks: { N5: 4, N4: 5, N3: 5 }, grp: 'gengo' },
        { id: 'bunpo', part: 'read', name: '[言語|げんご] [知識|ちしき] （ [文法|ぶんぽう] ） ・ [読解|どっかい]', en: 'Language knowledge: grammar · Reading', time: { N5: 40, N4: 55, N3: 70 }, items: { N5: 22, N4: 29, N3: 39 }, tasks: { N5: 6, N4: 6, N3: 7 } },
        { id: 'chokai', part: 'listen', name: '[聴解|ちょうかい]', en: 'Listening', time: { N5: 30, N4: 35, N3: 40 }, items: { N5: 24, N4: 28, N3: 28 }, tasks: { N5: 4, N4: 4, N3: 5 }, plays: 1, grp: 'choukai' },
      ],
      scoring: {
        N5: [{ id: 'gd', name: '[言語|げんご] [知識|ちしき] （ [文字|もじ] ・ [語彙|ごい] ・ [文法|ぶんぽう] ） ・ [読解|どっかい]', of: ['gengo', 'dokkai'], max: 120, min: 38 }, { id: 'ch', name: '[聴解|ちょうかい]', of: ['choukai'], max: 60, min: 19 }],
        N4: [{ id: 'gd', name: '[言語|げんご] [知識|ちしき] （ [文字|もじ] ・ [語彙|ごい] ・ [文法|ぶんぽう] ） ・ [読解|どっかい]', of: ['gengo', 'dokkai'], max: 120, min: 38 }, { id: 'ch', name: '[聴解|ちょうかい]', of: ['choukai'], max: 60, min: 19 }],
        N3: [{ id: 'g', name: '[言語|げんご] [知識|ちしき] （ [文字|もじ] ・ [語彙|ごい] ・ [文法|ぶんぽう] ）', of: ['gengo'], max: 60, min: 19 }, { id: 'd', name: '[読解|どっかい]', of: ['dokkai'], max: 60, min: 19 }, { id: 'c', name: '[聴解|ちょうかい]', of: ['choukai'], max: 60, min: 19 }],
      },
      pass: { N5: { kind: 'scaled', min: 80 }, N4: { kind: 'scaled', min: 90 }, N3: { kind: 'scaled', min: 95 } },
      // (the JLPT numbers its options 1–4, as its instructions say; the other formats letter them)
      total: 180, words: { pass: '[合格|ごうかく]', fail: '[不合格|ふごうかく]' }, taskWord: ['[問題|もんだい] {n}', 'Mondai {n}'], optLabels: '1234',
      nospeak: ['JLPT に は 「 [話|はな]す 」 と 「 [書|か]く 」 の [試験|しけん] は ありません 。', 'The JLPT has no speaking or writing section.'],
      practice: ['JLPT {level} の [形式|けいしき] で の [練習|れんしゅう] です 。 [問題|もんだい] は オリジナル で 、 [公式|こうしき] の [試験|しけん] で は ありません 。', 'Practice in the format of the JLPT {level}. Our own questions; not an official exam.'],
      note: ['[実際|じっさい] の [試験|しけん] に できる だけ [近|ちか]い [方法|ほうほう] で [採点|さいてん] して います が 、 [実際|じっさい] の [試験|しけん] と は [異|こと]なる [場合|ばあい] が あります 。', 'Scored the way the real exam is, as closely as we can model it; the real exam may differ.'],
      lab: { report: '[得点|とくてん] [区分|くぶん] [別|べつ] [得点|とくてん]', section: '[得点|とくてん] [区分|くぶん]', score: '[得点|とくてん]', min: '[基準点|きじゅんてん]', final: '[総合|そうごう] [得点|とくてん]' },
      hello: ['[今日|きょう] は JLPT {level} の [形式|けいしき] で [練習|れんしゅう] します 。 [準備|じゅんび] が できたら 、 [始|はじ]めましょう 。', 'Today we’ll practice in the JLPT {level} format. When you’re ready, let’s begin.'],
    },
    // Celpe-Bras (Inep): one exam for every level. A written part of four integrated tasks (a video, an audio, two readings),
    // each graded 0–5, and a 20-minute interview graded 0–5; the lower part decides the level band. Here the video is a scene
    // with a picture and a recording.
    celpe: {
      lang: 'pt', name: 'Celpe-Bras', levels: ['B1', 'B2'], band: { B1: 3, B2: 4 }, site: 'gov.br/inep',
      sections: [
        { id: 'coletiva', part: 'write', name: 'Parte Coletiva', en: 'Written part: integrated tasks', max: 5, step: 0.01, time: 180, tasks: 4 },
        { id: 'individual', part: 'speak', name: 'Parte Individual', en: 'Oral part: the interview', max: 5, step: 0.01, time: 20 },
      ],
      pass: { kind: 'bands', bands: [[4.26, 'Avançado Superior'], [3.51, 'Avançado'], [2.76, 'Intermediário Superior'], [2.0, 'Intermediário'], [0, 'Sem certificação']] },
      total: 5, words: { pass: 'Certificado', fail: 'Sem certificação' }, taskWord: ['Tarefa', 'Task'],
      practice: ['Prática no formato do Celpe-Bras (nível visado: {level}). Questões nossas; não é um exame oficial.', 'Practice in the format of the Celpe-Bras (aiming at {level}). Our own questions; not an official exam.'],
      note: ['Avaliado como no exame real, o mais perto que conseguimos. O exame real pode ser diferente.', 'Scored the way the real exam is, as closely as we can model it; the real exam may differ.'],
      lab: { report: 'Resultado', section: 'Parte', score: 'Nota', min: '', final: 'Nível' },
      hello: ['Olá! Hoje você faz uma prova no formato do Celpe-Bras: primeiro a parte coletiva, com quatro tarefas escritas, depois a nossa entrevista. Quando quiser, a gente começa.', 'Hello! Today you’re taking a paper in the Celpe-Bras format: first the written part with four tasks, then our interview. We’ll start whenever you like.'],
    },
    // The Academy's own Portuguese papers at A1–A2, in the Celpe-Bras spirit: integrated tasks and a short interview, 0–5 each,
    // the lower part deciding. Our own bands (Básico, Pré-intermediário); not modeled on any certificate.
    ptint: {
      lang: 'pt', name: 'Prova integrada', own: true, levels: ['A1', 'A2'], band: { A1: 1, A2: 2 },
      sections: [
        { id: 'escrita', part: 'write', name: 'Parte escrita', en: 'Written part: integrated tasks', max: 5, step: 0.01, time: { A1: 45, A2: 60 }, tasks: 2 },
        { id: 'oral', part: 'speak', name: 'Parte oral', en: 'Oral part: a short interview', max: 5, step: 0.01, time: 10 },
      ],
      pass: { kind: 'bands', bands: { A1: [[2.5, 'Básico'], [0, 'Ainda não']], A2: [[2.5, 'Pré-intermediário'], [1.5, 'Básico'], [0, 'Ainda não']] } },
      total: 5, words: { pass: 'Aprovado', fail: 'Ainda não' }, taskWord: ['Tarefa', 'Task'],
      practice: ['Prova integrada da Academia, nível {level}, no espírito do Celpe-Bras. Questões nossas; não é um exame oficial.', 'The Academy’s integrated paper, level {level}, in the spirit of the Celpe-Bras. Our own questions; not an official exam.'],
      note: ['Faixas criadas pela Academia; nenhum exame oficial usa estas notas.', 'The bands are the Academy’s own; no official exam uses them.'],
      lab: { report: 'Resultado', section: 'Parte', score: 'Nota', min: '', final: 'Faixa' },
      hello: ['Olá! Hoje você faz a prova integrada da Academia, nível {level}: duas tarefas escritas e uma conversa comigo. Quando quiser, a gente começa.', 'Hello! Today you’re taking the Academy’s integrated paper, level {level}: two writing tasks and a conversation with me. We’ll start whenever you like.'],
    },
  };
  const BY_LANG = { es: ['dele'], pt: ['ptint', 'celpe'], de: ['goethe'], zh: ['hsk'], ja: ['jlpt'] };

  // ------------------------------------------------------------ content: MOCK.add
  const CONTENT = {};
  const keyOf = (lang, fmt, level) => `${lang}.${fmt}.${level}`;
  function add(lang, fmt, level, def = {}) {
    const key = keyOf(lang, fmt, level), F = FORMATS[fmt];
    const tasks = arr(def.tasks).map(t => {
      const o = Object.assign({ slot: 'mock', band: F ? F.band[level] : 1 }, t, { mock: key });
      // (several recordings or texts in one task: their lines also as the task's own, for the checks, the review and the words met)
      if (o.clips && !o.lines) o.lines = o.clips.flatMap(c => c.lines || []);
      if (o.blocks && o.text) o.textOwn = true;
      else if (o.blocks) o.text = o.blocks.flatMap(b => EXAM._.linesOf(b.text || []));
      return o;
    });
    if (typeof EXAM !== 'undefined') EXAM.add(lang, { tasks });
    CONTENT[key] = Object.assign({ key, lang, fmt, level }, def, { tasks: tasks.map(t => t.id) });
    return CONTENT[key];
  }
  const has = (lang, fmt, level) => !!CONTENT[keyOf(lang, fmt, level)];

  // ------------------------------------------------------------ a paper: the format's sections at that level, with their tasks
  function sectionsOf(F, level) {
    let list = F.sections.filter(s => at(s.time, level) != null);
    const ord = F.order && F.order[level];
    if (ord) list = ord.map(id => list.find(s => s.id === id)).filter(Boolean);
    return list;
  }
  function paper(lang, fmt, level, o = {}) {
    const F = FORMATS[fmt], key = keyOf(lang, fmt, level), C = CONTENT[key];
    if (!F || !C) return null;
    const secs = sectionsOf(F, level).filter(s => !o.only || s.id === o.only).map(s => {
      const plays = at(s.plays, level);
      return {
        id: s.id, part: s.part, kind: s.kind || null, skill: s.part === 'speak' ? 'talk' : s.part, grp: s.grp || null,
        title: { t: s.name, en: `${stripRuby(s.name)} · ${s.en}` }, max: at(s.max, level) != null ? at(s.max, level) : (at(s.items, level) || 25), min: 0,
        step: s.step || 0.5, time: at(s.time, level), prep: at(s.prep, level) || 0, plays: Array.isArray(plays) ? null : plays, playsBy: Array.isArray(plays) ? plays : null,
        items: at(s.items, level) || 0, ntasks: at(s.tasks, level) || 0, tasks: arr((C.sections || {})[s.id]).slice(),
      };
    });
    if (!secs.length) return null;
    return {
      id: o.only ? `${key}~${o.only}` : key, key, kind: 'mock', format: fmt, level, lang, band: F.band[level], timed: !!o.timed, drill: o.only || null,
      title: { en: `${titleOf(F, level)}${o.only ? ' · ' + secs[0].title.en.split(' · ')[1] + ' drill' : ''} · practice` }, sections: secs,
    };
  }
  const stripRuby = s => String(s || '').replace(/\[([^|\]]+)\|[^\]]*\]/g, '$1').replace(/\s+/g, ' ').trim();
  const titleOf = (F, level) => (F.title && F.title[level]) || `${F.name} ${level}`;
  function run(lang, fmt, level, o = {}) {
    const p = paper(lang, fmt, level, o); if (!p) return Promise.resolve(null);
    return EXAM.run(p, o);
  }
  // a paused practice paper (its finished sections kept), or none
  function paused(id) { const s = EXAM.state, aid = s.curMock && s.curMock[id]; const a = aid && EXAM._.attById(aid); return a && !a.done ? a : null; }
  function resume(id) { const a = paused(id); return a ? EXAMUI.run(a) : Promise.resolve(null); }

  // ------------------------------------------------------------ scoring: the report's numbers, the way each format scores
  // → { rows: [{ id, name, score, max, min, ok }], groups: [{ name, score, max, min, ok }], total, totalMax, line, passed,
  //     word, grade, band, drill }
  function result(att) {
    const F = FORMATS[att.format], lv = att.level, sc = att.scores || {}, drill = !!att.drill;
    const secs = att.sections, out = { rows: [], groups: [], total: 0, totalMax: 0, line: null, passed: false, word: '', grade: '', band: '', drill };
    if (!F) return out;
    const P = at(F.pass, lv) && at(F.pass, lv).kind ? at(F.pass, lv) : F.pass;
    if (P.kind === 'scaled') {
      // JLPT: the items regrouped into scoring sections (vocabulary, grammar and reading, listening), each scaled to its max
      const raw = {}; const add2 = (g, s, p) => { raw[g] = raw[g] || { s: 0, p: 0 }; raw[g].s += s; raw[g].p += p; };
      for (const sec of secs) { const r = att.res[sec.id]; for (const x of (r && r.items) || []) { const t = EXAM.task(x.task, att.lang) || {}; add2(t.grp || sec.grp || 'dokkai', (x.s || 0) * (x.pts || 1), x.pts || 1); } }
      for (const g of F.scoring[lv]) {
        const s = g.of.reduce((a, k) => a + (raw[k] ? raw[k].s : 0), 0), p = g.of.reduce((a, k) => a + (raw[k] ? raw[k].p : 0), 0);
        if (drill && !p) continue;
        const v = p ? Math.round(g.max * s / p) : 0;
        out.rows.push({ id: g.id, name: g.name, score: v, max: g.max, min: g.min, ok: v >= g.min });
      }
      out.total = out.rows.reduce((a, r) => a + r.score, 0); out.totalMax = drill ? out.rows.reduce((a, r) => a + r.max, 0) : F.total; out.line = drill ? null : P.min;
      out.passed = !drill && out.total >= P.min && out.rows.every(r => r.ok);
      out.word = drill ? (out.rows.every(r => r.ok) ? 'OK' : '—') : out.passed ? F.words.pass : F.words.fail;
      return out;
    }
    for (const sec of secs) out.rows.push({ id: sec.id, name: sec.title.t, score: sc[sec.id] || 0, max: sec.max, min: null, ok: true });
    if (P.kind === 'groups') {
      // DELE: each prueba out of 25; APTO when every group (two pruebas) reaches its minimum
      for (const g of P.groups) {
        const rows = out.rows.filter(r => g.of.includes(r.id)); if (!rows.length || drill) continue;
        const v = rows.reduce((a, r) => a + r.score, 0); out.groups.push({ id: g.id, name: g.name, en: g.en, of: g.of, score: v, max: g.max, min: g.min, ok: !drill && v >= g.min, part: rows.length < g.of.length });
      }
      out.total = out.rows.reduce((a, r) => a + r.score, 0); out.totalMax = out.rows.reduce((a, r) => a + r.max, 0);
      out.passed = !drill && out.groups.every(g => g.ok); out.word = drill ? '' : out.passed ? F.words.pass : F.words.fail;
    } else if (P.kind === 'total') {
      out.total = out.rows.reduce((a, r) => a + r.score, 0); out.totalMax = drill ? out.rows.reduce((a, r) => a + r.max, 0) : at(F.total, lv); out.line = drill ? null : P.min;
      out.passed = !drill && out.total >= P.min; out.word = drill ? '' : out.passed ? F.words.pass : F.words.fail;
      if (F.grades && !drill) out.grade = gradeWord(F, 100 * out.total / out.totalMax);
    } else if (P.kind === 'modules') {
      // Goethe B1/B2: each module out of 100, passed at 60 on its own (a module certificate)
      // (a module on its own is a real result here: the drill of one module is passed or not like the module itself)
      for (const r of out.rows) { r.min = P.min; r.ok = r.score >= P.min; r.grade = gradeWord(F, r.score); }
      out.total = out.rows.reduce((a, r) => a + r.score, 0); out.totalMax = out.rows.reduce((a, r) => a + r.max, 0);
      out.passed = out.rows.every(r => r.ok); out.word = out.passed ? F.words.pass : F.words.fail; out.modular = true;
    } else if (P.kind === 'bands') {
      // Celpe-Bras (and the Academy's own A1–A2): each part 0–5; the lower part decides the band
      celpeParts(att, out);
      const lo = Math.min(...out.rows.map(r => r.score)), bands = at(P.bands, lv) && Array.isArray(at(P.bands, lv)) ? at(P.bands, lv) : P.bands;
      const b = bands.find(x => lo >= x[0] - 1e-9) || bands[bands.length - 1];
      out.total = round(lo, 0.01); out.totalMax = 5; out.band = drill ? '' : b[1]; out.passed = !drill && b !== bands[bands.length - 1];
      out.word = drill ? '' : out.band;
    }
    return out;
  }
  const gradeWord = (F, pct) => { const g = (F.grades || []).find(x => pct >= x[0] - 1e-9); return g ? g[1] : ''; };
  // Celpe-Bras's holistic 0–5 for a written task: fitting the context (the purpose, the reader, the points), the genre and its
  // organization, and the language; from the writing grader's parts (points of 6, accuracy of 4, range of 1.5, length of 1)
  const holistic = x => !x || x.zero ? 0 : round(5 * (0.45 * ((x.points || []).filter(Boolean).length / Math.max(1, (x.points || []).length))
    + 0.35 * ((x.acc || 0) / 4) + 0.2 * (0.5 * (x.range || 0) / 1.5 + 0.5 * (x.len || 0))), 0.01);
  function celpeParts(att, out) {
    for (const r of out.rows) {
      const sec = att.sections.find(s => s.id === r.id), res = att.res[r.id];
      if (sec && sec.part === 'write' && res) {
        const per = (res.tasks || []).map(holistic); r.tasks = per;
        r.score = per.length ? round(per.reduce((a, b) => a + b, 0) / Math.max(per.length, sec.tasks.length), 0.01) : 0;
      }
    }
  }

  // ------------------------------------------------------------ the end of a practice paper: the result, kept with your best
  function finish(att) {
    const r = result(att);
    att.report = r; att.passedIt = r.passed; att.why = r.word || '';
    const s = EXAM.state; s.mocks = s.mocks || {};
    const k = att.paper, old = s.mocks[k];
    const keep = { total: r.total, totalMax: r.totalMax, word: r.word, band: r.band, passed: r.passed, at: att.end || Date.now(), att: att.id, timed: !!att.timed,
      rows: r.rows.map(x => ({ id: x.id, score: x.score, max: x.max })) };
    const better = !old || !old.best || (r.passed && !old.best.passed) || (r.passed === old.best.passed && r.total > old.best.total);
    s.mocks[k] = { n: ((old && old.n) || 0) + 1, best: better ? keep : old.best, last: keep };
    if (s.curMock && s.curMock[att.paper] === att.id) delete s.curMock[att.paper];
    return r;
  }
  const best = id => { const m = (EXAM.state.mocks || {})[id]; return m ? m.best : null; };

  // ------------------------------------------------------------ the chooser's rows (mock_ui.js draws them): every paper of the language
  function rows(lang = L()) {
    const out = [];
    for (const fmt of BY_LANG[lang] || []) {
      const F = FORMATS[fmt];
      for (const lv of F.levels) {
        const key = keyOf(lang, fmt, lv); if (!CONTENT[key]) continue;
        const secs = sectionsOf(F, lv), mins = secs.reduce((a, s) => a + (at(s.time, lv) || 0) + (at(s.prep, lv) || 0), 0);
        out.push({ key, fmt, level: lv, F, band: F.band[lv], title: titleOf(F, lv), minutes: mins, best: best(key), paused: paused(key),
          drills: secs.map(s => ({ id: s.id, name: s.name, en: s.en, part: s.part, time: at(s.time, lv), prep: at(s.prep, lv) || 0, best: best(`${key}~${s.id}`), paused: paused(`${key}~${s.id}`) })) });
      }
    }
    return out;
  }

  // ------------------------------------------------------------ tests (MOCK._.tests(lang); the game never calls them)
  // simulate: a paper answered without the panel ('model' | 'nose' | 'wrong' | 'weak' | 'english', or one per part) → result()
  const IDK = { es: 'No sé.', pt: 'Não sei.', de: 'Ich weiß es nicht.', zh: '我不知道。', ja: 'わかりません。' };
  function simulate(key, mode, o = {}) {
    const C = CONTENT[key]; if (!C) return null;
    const p = paper(C.lang, C.fmt, C.level, o), l = C.lang, idk = IDK[l];
    const how = part => (typeof mode === 'string' ? mode : mode[part] || 'model');
    const att = { id: 'sim', kind: 'mock', format: C.fmt, level: C.level, lang: l, band: p.band, seed: o.seed || 5, sections: p.sections, res: {}, drill: p.drill, timed: !!o.timed };
    const answer = (it, m) => {
      if (m === 'model') return it.type === 'short' ? it.model : Array.isArray(it.key) ? it.key.slice() : it.key;
      if (m === 'wrong') return it.type === 'short' ? idk : it.type === 'tf' ? !it.key : it.type === 'tfn' ? (it.key === true ? false : true) : Array.isArray(it.key) ? it.key.map((x, i, k) => k[(i + 1) % k.length]) : it.opts ? (it.key + 1) % it.opts.length : null;
      return it.type === 'short' ? idk : null;
    };
    for (const sec of p.sections) {
      const m = how(sec.part), res = { items: [], tasks: [], turns: [] };
      for (const tid of sec.tasks) {
        const t = EXAM._.resolve(EXAM.task(tid, l), att); if (!t) continue;
        if (sec.part === 'listen' || sec.part === 'read' || sec.kind === 'items') for (const it of t.items || []) res.items.push({ task: tid, k: it.k, s: EXAM.grade.item(it, answer(it, m), l), pts: it.pts || 1 });
        else if (sec.part === 'write') {
          const text = m === 'model' ? (t.model && t.model.t) : m === 'weak' ? t.weak : m === 'english' ? 'I am writing to tell you that I am fine and I will come back on Saturday. Thank you very much.' : idk;
          res.tasks.push(Object.assign({ id: tid }, EXAM.grade.write(text, t, p.band, l)));
        } else {
          const text = m === 'model' ? (t.model && t.model.t) : m === 'english' || m === 'weak' ? (t.model && t.model.en) : idk;
          res.turns.push(Object.assign({ id: tid }, EXAM.grade.turn(text, t, p.band, l)));
        }
      }
      res.score = EXAM.grade.section(sec, res); res.done = true; att.res[sec.id] = res;
    }
    att.scores = {}; for (const sec of p.sections) att.scores[sec.id] = att.res[sec.id].score;
    return result(att);
  }
  // tests: every paper of the language: its shape against its format (the items, the tasks), the model answers pass, «I don't
  // know» everywhere fails, wrong answers fail, English speaking fails where speaking counts, and a drill has no pass
  function tests(lang = L()) {
    const was = typeof LEX !== 'undefined' ? LEX.lang : lang; if (typeof LEX !== 'undefined') LEX.lang = lang;
    const fails = [], ok = (c, what) => { if (!c) fails.push(what); return c; }, papers = [], t0 = Date.now();
    try {
      for (const fmt of BY_LANG[lang] || []) for (const lv of FORMATS[fmt].levels) {
        const key = keyOf(lang, fmt, lv); if (!CONTENT[key]) continue;
        const F = FORMATS[fmt], p = paper(lang, fmt, lv), row = { key, sections: {} };
        for (const sec of p.sections) {
          const ts = sec.tasks.map(id => EXAM.task(id, lang));
          ok(ts.every(Boolean), `${key} ${sec.id}: a task id that isn’t there (${sec.tasks.filter(id => !EXAM.task(id, lang)).join(', ')})`);
          const its = ts.filter(Boolean).flatMap(t => (t.items || []).map(it => it.pts || (it.type === 'match' ? (it.pairs || []).length : 1))).reduce((a, b) => a + b, 0);
          const tareas = new Set(ts.filter(Boolean).map(t => t.tarea || t.id)).size;
          row.sections[sec.id] = { tasks: tareas, items: its };
          if (sec.items) ok(its === sec.items, `${key} ${sec.id}: ${its} items (the format has ${sec.items})`);
          if (sec.ntasks) ok(tareas === sec.ntasks, `${key} ${sec.id}: ${tareas} tasks (the format has ${sec.ntasks})`);
          ok(!!sec.time, `${key} ${sec.id}: no time`);
        }
        const m = simulate(key, 'model'), n = simulate(key, 'nose'), w = simulate(key, { listen: 'wrong', read: 'wrong' });
        row.model = { total: m.total, word: m.word, rows: m.rows.map(r => `${r.id} ${r.score}/${r.max}`) };
        ok(m.passed, `${key}: the model answers don’t pass (${JSON.stringify(row.model)})`);
        ok(m.rows.every(r => r.score >= 0.6 * r.max), `${key}: a section is under 60% with the model answers (${JSON.stringify(row.model.rows)})`);
        ok(!n.passed, `${key}: «${IDK[lang]}» everywhere passes`);
        if (p.sections.some(s => s.part === 'listen' || s.part === 'read')) ok(!w.passed, `${key}: wrong answers in listening and reading pass (${w.total})`);
        // (English in speaking scores 0 there; it fails the paper where speaking has its own pass line (DELE's groups, Goethe's
        // modules, the bands), not where only the total counts (Goethe A1–A2: the other three parts can carry it))
        if (p.sections.some(s => s.part === 'speak')) {
          const e = simulate(key, { speak: 'english' }), sp = p.sections.find(s => s.part === 'speak'), P = at(F.pass, lv) && at(F.pass, lv).kind ? at(F.pass, lv) : F.pass;
          const row = e.rows.find(r => r.id === sp.id);
          if (P.kind === 'total') ok(row && row.score === 0, `${key}: English in speaking scores ${row && row.score}`);
          else ok(!e.passed, `${key}: English in speaking passes (${JSON.stringify(e.rows.map(r => r.score))})`);
        }
        const d = simulate(key, 'model', { only: p.sections[0].id });
        ok(d && d.drill && (!d.passed || d.modular) && d.rows.length >= 1, `${key}: a drill of ${p.sections[0].id} has a pass or no rows`);
        ok(!!paper(lang, fmt, lv, { timed: true }).timed, `${key}: the timed paper isn’t timed`);
        papers.push(row);
      }
      if (!papers.length) fails.push('no practice papers in ' + lang);
    } catch (e) { fails.push('threw: ' + (e && e.stack || e)); }
    finally { if (typeof LEX !== 'undefined') LEX.lang = was; }
    return { lang, ok: !fails.length, fails, papers, ms: Date.now() - t0 };
  }

  return { F: FORMATS, FORMATS, BY_LANG, add, has, paper, run, resume, paused, result, finish, best, rows, keyOf, titleOf, stripRuby, holistic, at, CONTENT, _: { simulate, tests } };
})();
