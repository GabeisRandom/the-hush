'use strict';
// G · Time battles (DESIGN.md 13.2, 13.3 rung 7, 17.2b): in the time realms every command is told in the realm's tense.
//   The Past («el Ayer», opts.realm = 'past'): a command told as a memory, «Mimo saltó sobre el rojo», replays it and the
//     echo takes the hit. The present (or a plain «¡Salta!») confuses Mimo ("that's not how memories work"): ×½, and a
//     tense slip. The imperfect sets the scene: «El rojo estaba dormido» puts it to sleep in the memory (a surprise ×2 on
//     the next hit; said with the action, «El rojo estaba dormido y Mimo saltó sobre él», at once).
//   The Future («el Mañana», opts.realm = 'future'): «Mimo saltará sobre el rojo» queues the move: it lands at the start
//     of your next turn, ×1.5, and moves that land together stack (×1.75, ×2…). Each turn one foe shows a glimpse of what
//     it will do (it rises: high; it crouches: low); predicting it, «El azul atacará por arriba», makes its attack whiff
//     (a perfect dodge) and Mimo counters ×1.5. Later, traps: «Si el rojo salta, Mimo lo golpeará» springs when it attacks.
//   Every language with its own forms, graded S–D like any command (the slips go into the clause, so flow.js's gradeOf
//   counts them): es/pt preterite and imperfect, future and ir a / vou + infinitive, si/se clauses; de Perfekt and
//   Präteritum, werden + infinitive, wenn … (würde); zh 了 / 过, 会 / 要 / 将, 如果…就…; ja た / ～ていた, the non-past
//   with つもり / でしょう, ～たら.
//
// ------------------------------------------------------------------------------------------------ THE API (realm helpers)
// BATTLE._.tense (TB):
//   Fights   game.fight({ foes, realm: 'past' | 'future', boss: '<id>', tb: {…} }): main.js passes realm and tb through.
//            Everything below is on in any fight with a realm; nothing changes in fights without one.
//   TB.realm(opts?)          'past' | 'future' | null (of opts, or of the fight running now)
//   TB.STAGES                ['pret', 'impf', 'fut', 'pred', 'cond']: the realm ladder (13.2)
//   TB.LESSONS               { pret: 'Gp', impf: 'Gi', fut: 'Gf', cond: 'Gc' }: the yard board's skills (focus 'tac:Gp' …);
//                            'Gf' teaches the prediction too
//   TB.learned(key) / TB.learn(key) / TB.unlock(key)
//                            game.state.tac[key]; unlock opens a lesson at the yard before its default (Gp: flags.towerLost,
//                            Gi: Gp learned, Gf: flags.futureOpen, Gc: Gf learned). Call TB.unlock('Gf') when the Future opens.
//   TB.lesson(key, o)        a demonstration (o.by: a speaker { x, y, z, name, top } for STORY.demoLine; default Bruno at
//                            the yard) then the practice fight (o.coach: 'Noa' …, o.place). Resolves like game.fight.
//   TB.demo(key)             the demonstration ({ es, pt, de, zh, ja, en, marks }) for STORY.demoLine / your own scenes
//   TB.example(stage, l?)    a model: [the sentence in the language, English], e.g. example('pret') →
//                            ['¡Mimo saltó sobre el rojo!', 'Mimo jumped on the red one!']; stage 'scene' = 'impf'
//   TB.tip(stage, l?)        the tip line (English, the language in «»); TB.frame(stage, l?): the box's frame
//   TB.read(text, l?)        how a sentence reads in time: { kind: 'command'|'scene'|'pred'|'trap'|null, tense:
//                            'past'|'impf'|'fut'|'cond'|'pres'|null, ok: bool } (no fight needed: for your own checks)
//   TB.on(ev, fn)            listeners: 'judge' (r; previews too) · 'memory' (c) · 'queue' (c) · 'fire' (c) · 'scene' (f) ·
//                            'predict' (f, right) · 'trap' (f) · 'spring' (f) · 'confused' (c)
//   TB.modelFor(f, verb, stage)  in a fight: the model sentence for that foe («¡Mimo saltó sobre el rojo!», «Die Rote …»)
//   Bosses   opts.tb (all optional):
//              judge(c, r)       after this file's judge, per clause (c.tb: { tense, realm }; set c.tacMult / c.tacSub)
//              scene(f) → false  this one won't fall asleep in the memory («Ese recuerdo no cambia»)
//              noGlimpse, noQueue: switch those off; mult: extra × on every right-tense hit
//            A plug-in boss with its own loop (flow.js _.plugins) calls `await BATTLE._.tac.turn()` before each ask
//            (queued moves land, the glimpse shows) and `await BATTLE._.tac.afterFoes()` after the foes act.
//   Tests    BATTLE._.tense.auto = { glimpse: 'high' | 'low' | false }; TB.state() = what's queued / planned / trapped.
// ----------------------------------------------------------------------------------------------------------------------
(() => {
  const B = window.BATTLE, _ = B && B._;
  if (!_ || !_.P || !_.tac || !_.tac.h) return;
  const P = _.P, T = _.tac, H = T.h, nrm = P.nrm;
  const X = () => _.flow;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const TB = (_.tense = _.tense || {});
  TB.STAGES = ['pret', 'impf', 'fut', 'pred', 'cond'];
  TB.LESSONS = { pret: 'Gp', impf: 'Gi', fut: 'Gf', pred: 'Gf', cond: 'Gc' };
  const KEY_STAGE = { Gp: 'pret', Gi: 'impf', Gf: 'fut', Gc: 'cond' };
  const KEY_REALM = { Gp: 'past', Gi: 'past', Gf: 'future', Gc: 'future' };
  TB.auto = null;
  const listeners = {};
  TB.on = (ev, fn) => { (listeners[ev] || (listeners[ev] = [])).push(fn); };
  const fire = (ev, ...a) => { for (const fn of listeners[ev] || []) try { fn(...a); } catch (e) { console.error('[time]', ev, e); } };
  const bossOpt = k => { const x = X(), o = x && x.G.opts && x.G.opts.tb; return o ? o[k] : undefined; };

  // ------------------------------------------------------------ which realm
  TB.realm = opts => {
    const x = X();
    if (opts) return opts.realm === 'past' || opts.realm === 'future' ? opts.realm : null;
    if (!x || !x.G.running) return null;
    const G = x.G;
    if (G.practice) { const k = String(G.focus || '').slice(4); return KEY_REALM[k] || null; }
    return TB.realm(G.opts || {});
  };
  const realmNow = () => TB.realm();

  // ------------------------------------------------------------ what each language says ([text, English])
  const LX = (TB.LX = {});
  LX.es = {
    confPast: ['¿Ahora? Esto es un recuerdo… ¡cuéntamelo en pasado!', 'Now? This is a memory… tell it to me in the past!'],
    confFut: ['¿Ahora? Aquí todo es mañana… ¡dime qué pasará!', 'Now? Everything here is tomorrow… tell me what will happen!'],
    memory: ['¡Así fue!', 'That’s how it was!'], plan: ['¡Así será!', 'So it will be!'], came: ['¡Te lo dije!', 'I told you so!'],
    knew: ['¡Lo sabía!', 'I knew it!'], unsure: ['Mmm… ¿seguro?', 'Hmm… are you sure?'], trap: ['Te espero…', 'I’ll be waiting…'], sprung: ['¡Trampa!', 'Trap!'],
    asleep: ['Zzz…', 'Zzz…'], noChange: ['Ese recuerdo no cambia.', 'That memory won’t change.'],
    ex: { pret: ['¡Mimo saltó sobre el rojo!', 'Mimo jumped on the red one!'], impf: ['El rojo estaba dormido.', 'The red one was asleep.'], fut: ['¡Mimo saltará sobre el rojo!', 'Mimo will jump on the red one!'],
      pred: ['El azul atacará por arriba.', 'The blue one will attack from above.'], cond: ['Si el rojo salta, Mimo lo golpeará.', 'If the red one jumps, Mimo will hit it.'] },
    frame: { pret: 'Mimo ___ó sobre el ___', impf: 'El ___ estaba dormido', fut: 'Mimo ___ará sobre el ___', pred: 'El ___ atacará por arriba · por abajo', cond: 'Si el ___ salta, Mimo lo ___ará' },
    tips: {
      pret: 'In the Past every command is a memory: tell it in the past (the preterite): «Mimo saltó sobre el rojo», «Mimo golpeó al azul».',
      pres: 'That’s the present, and this is a memory: Mimo only half gets it (½). Tell it in the past: «{ex}».',
      aspect: 'One finished action takes the preterite: «saltó», «golpeó». The imperfect («saltaba») sets the scene: «El rojo estaba dormido».',
      impf: 'Set the scene with the imperfect: «El rojo estaba dormido» (the red one was asleep) puts it to sleep in the memory: the next hit is a SURPRISE ×2.',
      fut: 'In the Future, say what will happen: «Mimo saltará sobre el rojo» (or «va a saltar»). It lands next turn, ×1.5, and moves that land together stack.',
      futPres: 'That’s the present, and this is the Future: Mimo only half gets it (½). Say what will happen: «{ex}».',
      pred: 'You can see what’s coming! Say it: «{ex}». Its attack will miss you, and Mimo counters ×1.5.',
      cond: 'Set a trap: «Si el rojo salta, Mimo lo golpeará» (if the red one jumps, Mimo will hit it). After «si», the present: «salta».',
    },
    why: {
      tbPast: 'In the Past, tell it as a memory, in the preterite: «salta» → «saltó», «golpea» → «golpeó».',
      tbFut: 'In the Future, say what will happen: «salta» → «saltará» (or «va a saltar»).',
      tbAspect: 'One finished action: the preterite («saltó»). The imperfect («saltaba») is for the scene: what was going on.',
      tbPerson: 'It’s Mimo who does it: «saltó» / «saltará» (he / she / it), not «salté» (I) or «saltaste» (you).',
      tbSi: 'After «si» comes the present, never the future: «si el rojo salta», not «si el rojo saltará».',
      tbSeq: 'Match the halves: «si salta…, lo golpeará» or «si saltara…, lo golpearía».',
      tbState: 'The scene is how things were: «estaba dormido» (the imperfect), not «estuvo» or «está».',
    },
    slip: { tbPast: 'Tense slip (say it in the past)', tbFut: 'Tense slip (say what will happen)', tbAspect: 'Aspect slip (saltó, not saltaba)', tbPerson: 'Person slip (Mimo: él)',
      tbSi: '«si» + present', tbSeq: '«si» slip', tbState: 'Scene slip (estaba)', tbAux: 'Helper-verb slip', tbOrder: 'Word-order slip', tbSubj: 'Missing who' },
    gloss: { 'saltó': 'jumped', 'golpeó': 'hit (past)', 'empujó': 'pushed', estaba: 'was (estar, the scene)', dormido: 'asleep', 'saltará': 'will jump', 'golpeará': 'will hit',
      'atacará': 'will attack', arriba: 'above (por arriba: from above)', abajo: 'below', si: 'if', lo: 'it / him', recuerdo: 'memory', 'mañana': 'tomorrow', 'pasará': 'will happen' },
  };
  LX.pt = {
    confPast: ['Agora? Isso é uma lembrança… me conta no passado!', 'Now? This is a memory… tell it to me in the past!'],
    confFut: ['Agora? Aqui tudo é amanhã… me diz o que vai acontecer!', 'Now? Everything here is tomorrow… tell me what will happen!'],
    memory: ['Foi assim!', 'That’s how it was!'], plan: ['Vai ser assim!', 'So it will be!'], came: ['Eu falei!', 'I told you so!'],
    knew: ['Eu sabia!', 'I knew it!'], unsure: ['Hmm… tem certeza?', 'Hmm… are you sure?'], trap: ['Tô te esperando…', 'I’m waiting for you…'], sprung: ['Armadilha!', 'Trap!'],
    asleep: ['Zzz…', 'Zzz…'], noChange: ['Essa lembrança não muda.', 'That memory won’t change.'],
    ex: { pret: ['Mimo pulou no vermelho!', 'Mimo jumped on the red one!'], impf: ['O vermelho estava dormindo.', 'The red one was sleeping.'], fut: ['Mimo vai pular no vermelho!', 'Mimo will jump on the red one!'],
      pred: ['O azul vai atacar por cima.', 'The blue one will attack from above.'], cond: ['Se o vermelho pular, Mimo vai bater nele.', 'If the red one jumps, Mimo will hit it.'] },
    frame: { pret: 'Mimo ___ou no ___', impf: 'O ___ estava dormindo', fut: 'Mimo vai ___ no ___', pred: 'O ___ vai atacar por cima · por baixo', cond: 'Se o ___ pular, Mimo vai ___ nele' },
    tips: {
      pret: 'In the Past every command is a memory: tell it in the past (the preterite): «Mimo pulou no vermelho», «Mimo bateu no azul».',
      pres: 'That’s the present, and this is a memory: Mimo only half gets it (½). Tell it in the past: «{ex}».',
      aspect: 'One finished action takes the preterite: «pulou», «bateu». The imperfect («pulava») sets the scene: «O vermelho estava dormindo».',
      impf: 'Set the scene with the imperfect: «O vermelho estava dormindo» puts it to sleep in the memory: the next hit is a SURPRISE ×2.',
      fut: 'In the Future, say what will happen: «Mimo vai pular no vermelho» (or «pulará»). It lands next turn, ×1.5, and moves that land together stack.',
      futPres: 'That’s the present, and this is the Future: Mimo only half gets it (½). Say what will happen: «{ex}».',
      pred: 'You can see what’s coming! Say it: «{ex}». Its attack will miss you, and Mimo counters ×1.5.',
      cond: 'Set a trap: «Se o vermelho pular, Mimo vai bater nele». After «se», the future subjunctive, which looks like the infinitive: «pular».',
    },
    why: {
      tbPast: 'In the Past, tell it as a memory, in the preterite: «pula» → «pulou», «bate» → «bateu».',
      tbFut: 'In the Future, say what will happen: «vai pular» (or «pulará»).',
      tbAspect: 'One finished action: the preterite («pulou»). The imperfect («pulava») is for the scene.',
      tbPerson: 'It’s Mimo who does it: «pulou» / «vai pular» (ele / ela), not «pulei» (I).',
      tbSi: 'After «se», something still to come takes the future subjunctive: «se o vermelho pular» (not «pula» or «vai pular»).',
      tbSeq: 'Match the halves: «se pular…, vai bater» or «se pulasse…, bateria».',
      tbState: 'The scene is how things were: «estava dormindo» (the imperfect).',
    },
    slip: { tbPast: 'Tense slip (say it in the past)', tbFut: 'Tense slip (say what will happen)', tbAspect: 'Aspect slip (pulou, not pulava)', tbPerson: 'Person slip (Mimo: ele)',
      tbSi: '«se» + pular', tbSeq: '«se» slip', tbState: 'Scene slip (estava)', tbAux: 'Helper-verb slip', tbOrder: 'Word-order slip', tbSubj: 'Missing who' },
    gloss: { pulou: 'jumped', bateu: 'hit (past)', estava: 'was (the scene)', dormindo: 'sleeping', vai: 'is going to (vai + verb: will)', cima: 'above (por cima: from above)', baixo: 'below',
      se: 'if', nele: 'on it / him', 'lembrança': 'memory', 'amanhã': 'tomorrow', acontecer: 'happen' },
  };
  LX.de = {
    confPast: ['Jetzt? Das ist eine Erinnerung… erzähl es mir in der Vergangenheit!', 'Now? This is a memory… tell it to me in the past!'],
    confFut: ['Jetzt? Hier ist alles morgen… sag mir, was passieren wird!', 'Now? Everything here is tomorrow… tell me what will happen!'],
    memory: ['So war es!', 'That’s how it was!'], plan: ['So wird es sein!', 'So it will be!'], came: ['Hab ich doch gesagt!', 'I told you so!'],
    knew: ['Wusste ich’s doch!', 'I knew it!'], unsure: ['Hmm… sicher?', 'Hmm… sure?'], trap: ['Ich warte…', 'I’m waiting…'], sprung: ['Falle!', 'Trap!'],
    asleep: ['Zzz…', 'Zzz…'], noChange: ['Diese Erinnerung ändert sich nicht.', 'That memory won’t change.'],
    ex: { pret: ['Mimo sprang auf den Roten!', 'Mimo jumped on the red one!'], impf: ['Der Rote schlief.', 'The red one was sleeping.'], fut: ['Mimo wird auf den Roten springen!', 'Mimo will jump on the red one!'],
      pred: ['Der Blaue wird von oben angreifen.', 'The blue one will attack from above.'], cond: ['Wenn der Rote springt, wird Mimo ihn schlagen.', 'If the red one jumps, Mimo will hit it.'] },
    frame: { pret: 'Mimo sprang auf den ___ · Mimo hat den ___ geschlagen', impf: 'Der ___ schlief', fut: 'Mimo wird den ___ schlagen', pred: 'Der ___ wird von oben · von unten angreifen', cond: 'Wenn der ___ springt, wird Mimo ihn ___' },
    tips: {
      pret: 'In the Past every command is a memory: tell it in the past: «Mimo sprang auf den Roten» (Präteritum) or «Mimo ist auf den Roten gesprungen» (Perfekt).',
      pres: 'That’s the present, and this is a memory: Mimo only half gets it (½). Tell it in the past: «{ex}».',
      aspect: 'Tell the action in the past: «Mimo sprang…» or «Mimo hat … geschlagen».',
      impf: 'Set the scene: «Der Rote schlief» (the red one was sleeping) puts it to sleep in the memory: the next hit is a SURPRISE ×2.',
      fut: 'In the Future, say what will happen: «Mimo wird den Roten schlagen» (werden + the infinitive at the end). It lands next turn, ×1.5, and moves that land together stack.',
      futPres: 'That’s the present, and this is the Future: Mimo only half gets it (½). Say what will happen: «{ex}».',
      pred: 'You can see what’s coming! Say it: «{ex}». Its attack will miss you, and Mimo counters ×1.5.',
      cond: 'Set a trap: «Wenn der Rote springt, wird Mimo ihn schlagen». After «wenn» the verb goes to the end; then «wird» comes first.',
    },
    why: {
      tbPast: 'In the Past, tell it as a memory: «Mimo sprang auf den Roten» or «Mimo ist auf den Roten gesprungen».',
      tbFut: 'In the Future, say what will happen: «Mimo wird … springen» (werden + infinitive).',
      tbAspect: 'Tell the action in the past: Präteritum or Perfekt.',
      tbPerson: 'Mimo is er / sie / es: «wird», «hat», «ist», «sprang».',
      tbAux: 'Moving from place to place takes «sein»: «ist gesprungen», «ist geklettert»; the rest take «haben»: «hat geschlagen».',
      tbOrder: 'The second part goes to the very end: «Mimo hat den Roten geschlagen», «Mimo wird den Roten schlagen».',
      tbSubj: 'German needs who: «Mimo sprang…» (or «er sprang…»).',
      tbSi: 'In a «wenn» clause the verb goes to the end: «wenn der Rote springt».',
      tbSeq: 'Match the halves: «wenn er springt, wird Mimo ihn schlagen» or «wenn er springen würde, würde Mimo ihn schlagen».',
      tbState: 'The scene is how things were: «schlief» (or «hat geschlafen»), not «schläft».',
    },
    slip: { tbPast: 'Tense slip (say it in the past)', tbFut: 'Tense slip (say what will happen)', tbAspect: 'Tense slip', tbPerson: 'Person slip (Mimo: er)',
      tbSi: 'Word-order slip (wenn … springt)', tbSeq: '«wenn» slip', tbState: 'Scene slip (schlief)', tbAux: 'Helper-verb slip (ist / hat)', tbOrder: 'Word-order slip (verb at the end)', tbSubj: 'Missing who (Mimo)' },
    gloss: { sprang: 'jumped', gesprungen: 'jumped (ist gesprungen)', geschlagen: 'hit (hat geschlagen)', schlief: 'was sleeping', wird: 'will (wird + verb)', oben: 'above (von oben: from above)',
      unten: 'below', wenn: 'if / when', ihn: 'him / it', Erinnerung: 'memory', morgen: 'tomorrow', passieren: 'happen' },
  };
  LX.zh = {
    confPast: ['[现在|xiàn zài] ？ [这|zhè] [是|shì] [回忆|huí yì] … [用|yòng] [过去|guò qù] [说|shuō] ！', 'Now? This is a memory… say it in the past!'],
    confFut: ['[现在|xiàn zài] ？ [这里|zhè lǐ] [都|dōu] [是|shì] [明天|míng tiān] … [说|shuō] [会|huì] [发生|fā shēng] [什么|shén me] ！', 'Now? Everything here is tomorrow… say what will happen!'],
    memory: ['[就是|jiù shì] [这样|zhè yàng] ！', 'That’s how it was!'], plan: ['[就|jiù] [这么|zhè me] [办|bàn] ！', 'So it will be!'], came: ['[我|wǒ] [说|shuō] [过|guò] [吧|ba] ！', 'Told you so!'],
    knew: ['[我|wǒ] [就|jiù] [知道|zhī dào] ！', 'I knew it!'], unsure: ['[咦|yí] … [真|zhēn] [的|de] [吗|ma] ？', 'Huh… really?'], trap: ['[我|wǒ] [等|děng] [着|zhe] …', 'I’m waiting…'], sprung: ['[中计|zhòng jì] [了|le] ！', 'Got you!'],
    asleep: ['[呼|hū] [呼|hū] …', 'Zzz…'], noChange: ['[这个|zhè ge] [回忆|huí yì] [改|gǎi] [不|bù] [了|liǎo] 。', 'That memory can’t be changed.'],
    ex: { pret: ['[米莫|Mǐ mò] [打|dǎ] [了|le] [红色|hóng sè] [的|de] ！', 'Mimo hit the red one!'], impf: ['[红色|hóng sè] [的|de] [在|zài] [睡觉|shuì jiào] 。', 'The red one was sleeping.'],
      fut: ['[米莫|Mǐ mò] [会|huì] [打|dǎ] [红色|hóng sè] [的|de] ！', 'Mimo will hit the red one!'], pred: ['[蓝色|lán sè] [的|de] [会|huì] [从|cóng] [上面|shàng miàn] [攻击|gōng jī] 。', 'The blue one will attack from above.'],
      cond: ['[如果|rú guǒ] [红色|hóng sè] [的|de] [跳|tiào] ， [米莫|Mǐ mò] [就|jiù] [打|dǎ] [它|tā] 。', 'If the red one jumps, Mimo will hit it.'] },
    frame: { pret: '[米莫|Mǐ mò] ___ [了|le] …', impf: '___ [的|de] [在|zài] [睡觉|shuì jiào]', fut: '[米莫|Mǐ mò] [会|huì] ___ …', pred: '___ [的|de] [会|huì] [从|cóng] [上面|shàng miàn] · [下面|xià miàn] [攻击|gōng jī]', cond: '[如果|rú guǒ] ___ [跳|tiào] ， [米莫|Mǐ mò] [就|jiù] ___ [它|tā]' },
    tips: {
      pret: 'In the Past every command is a memory: say it happened, with 了 after the verb: «米莫打了红色的» (Mimo hit the red one). 过 works too: «打过».',
      pres: 'That’s a command for now, and this is a memory: Mimo only half gets it (½). Say it happened: «{ex}».',
      aspect: 'For one action that happened, 了 after the verb: «打了».',
      impf: 'Set the scene: «红色的在睡觉» (the red one was sleeping) puts it to sleep in the memory: the next hit is a SURPRISE ×2.',
      fut: 'In the Future, say what will happen with 会 (or 要 / 将) before the verb: «米莫会打红色的». It lands next turn, ×1.5, and moves that land together stack.',
      futPres: 'That’s a command for now, and this is the Future: Mimo only half gets it (½). Say what will happen: «{ex}».',
      pred: 'You can see what’s coming! Say it: «{ex}». Its attack will miss you, and Mimo counters ×1.5.',
      cond: 'Set a trap: «如果红色的跳，米莫就打它» (if the red one jumps, Mimo will hit it): 如果… then 就….',
    },
    why: {
      tbPast: 'In the Past, say it happened: 了 right after the verb («打了»), or 过 («打过»).',
      tbFut: 'In the Future, 会 / 要 / 将 before the verb: «米莫会打…».',
      tbAspect: 'For one action that happened, 了 after the verb.',
      tbSi: '«如果…，就…»: 就 goes before the second verb: «如果红色的跳，米莫就打它».',
      tbState: 'The scene: 在 + the verb, «在睡觉», or «睡着了».',
    },
    slip: { tbPast: 'Tense slip (了: it happened)', tbFut: 'Tense slip (会: it will)', tbAspect: '了 slip', tbSi: '就 slip', tbState: 'Scene slip (在睡觉)', tbPerson: 'Who slip', tbSeq: '如果 slip' },
    gloss: { 了: '(it happened)', 过: '(has done it before)', 会: 'will', 要: 'going to', 将: 'will (formal)', 在: '(-ing: in the middle of)', 睡觉: 'sleep', 从: 'from', 上面: 'above', 下面: 'below',
      攻击: 'attack', 如果: 'if', 就: 'then', 回忆: 'memory', 明天: 'tomorrow', 发生: 'happen', 过去: 'the past' },
  };
  LX.ja = {
    confPast: ['[今|いま] ？ これ は [思|おも]い[出|で] だ よ … [過去形|かこけい] で [言|い]って ！', 'Now? This is a memory… say it in the past!'],
    confFut: ['[今|いま] ？ ここ は ぜんぶ あした … これから [何|なに] が [起|お]きる か [言|い]って ！', 'Now? Everything here is tomorrow… say what will happen!'],
    memory: ['そう だった ！', 'That’s how it was!'], plan: ['そう なる よ ！', 'So it will be!'], came: ['[言|い]った でしょ ！', 'Told you so!'],
    knew: ['やっぱり ！', 'I knew it!'], unsure: ['うーん … ほんと ？', 'Hmm… really?'], trap: ['[待|ま]って る よ …', 'I’m waiting…'], sprung: ['わな だ ！', 'Trap!'],
    asleep: ['すやすや …', 'Zzz…'], noChange: ['その [思|おも]い[出|で] は [変|か]わらない 。', 'That memory won’t change.'],
    ex: { pret: ['ミモ は [赤|あか]い の を [叩|たた]いた ！', 'Mimo hit the red one!'], impf: ['[赤|あか]い の は [寝|ね]て いた 。', 'The red one was sleeping.'],
      fut: ['ミモ は [赤|あか]い の を [叩|たた]く つもり ！', 'Mimo is going to hit the red one!'], pred: ['[青|あお]い の は [上|うえ] から [来|く]る でしょう 。', 'The blue one will come from above.'],
      cond: ['[赤|あか]い の が [跳|と]んだら 、 ミモ が [叩|たた]く 。', 'If the red one jumps, Mimo will hit it.'] },
    frame: { pret: 'ミモ は ___ を [叩|たた]いた', impf: '___ は [寝|ね]て いた', fut: 'ミモ は ___ を ___ つもり', pred: '___ は [上|うえ] · [下|した] から [来|く]る でしょう', cond: '___ が [跳|と]んだら 、 ミモ が ___' },
    tips: {
      pret: 'In the Past every command is a memory: say it with the た-form: «ミモは赤いのを叩いた» (Mimo hit the red one). 叩いて → 叩いた.',
      pres: 'That’s a request for now (the て-form), and this is a memory: Mimo only half gets it (½). Say it happened: «{ex}».',
      aspect: 'For one action that happened, the た-form: 叩いた.',
      impf: 'Set the scene with ～ていた: «赤いのは寝ていた» (the red one was sleeping) puts it to sleep in the memory: the next hit is a SURPRISE ×2.',
      fut: 'In the Future, say what will happen with the plain non-past: «ミモは赤いのを叩くつもり» (つもり: plans to). It lands next turn, ×1.5, and moves that land together stack.',
      futPres: 'That’s a request for now (the て-form), and this is the Future: Mimo only half gets it (½). Say what will happen: «{ex}».',
      pred: 'You can see what’s coming! Say it: «{ex}» (でしょう: will, probably). Its attack will miss you, and Mimo counters ×1.5.',
      cond: 'Set a trap: «赤いのが跳んだら、ミモが叩く» (if the red one jumps, Mimo hits it): the た-form + ら.',
    },
    why: {
      tbPast: 'In the Past, the た-form: 叩いて → 叩いた, 跳んで → 跳んだ.',
      tbFut: 'In the Future, the plain non-past: 叩く, 叩くつもり (plans to), 来るでしょう (will, probably).',
      tbAspect: 'For one action that happened, the た-form.',
      tbSi: 'たら is the た-form + ら: 跳ぶ → 跳んだ → 跳んだら.',
      tbState: 'The scene: ～ていた, «寝ていた» (was sleeping), not «寝ている».',
    },
    slip: { tbPast: 'Tense slip (the た-form)', tbFut: 'Tense slip (the plain form)', tbAspect: 'た slip', tbSi: 'たら slip', tbState: 'Scene slip (ていた)', tbPerson: 'Who slip', tbSeq: 'たら slip' },
    gloss: { 叩いた: 'hit (past)', 跳んだ: 'jumped', 寝ていた: 'was sleeping', つもり: 'plan to', でしょう: 'will (probably)', から: 'from', 上: 'above', 下: 'below', 跳んだら: 'if it jumps',
      思い出: 'memory', あした: 'tomorrow', 起きる: 'happen', 過去形: 'the past form' },
  };
  // the slips' names, the why's and the glosses join the battle language's tables (without overwriting any); the wrong
  // tense in a realm is a big slip (C), like ser / estar
  TB.mergeLang = () => {
    for (const [code, t] of Object.entries(LX)) {
      const L = _.LANGS && _.LANGS[code]; if (!L) continue;
      L.slip = Object.assign({ tbCond: 'Would-slip (say what will happen)' }, t.slip || {}, L.slip || {});
      L.why = Object.assign({ tbCond: 'In the Future, say what will happen (the future), not what would happen (the conditional).' }, t.why || {}, L.why || {});
      L.gloss = Object.assign({}, t.gloss || {}, L.gloss || {});
      L.soft = Object.assign({ tbPron: 'Say who', tbMain: 'Say the second half in the future', tbWhich: 'Say which one' }, L.soft || {});
    }
    P.MAJOR.add('tbPast'); P.MAJOR.add('tbFut');
  };
  TB.mergeLang();
  const lx = l => LX[l || (X() && X().G.lang) || 'es'] || LX.es;
  const curLang = () => (X() && X().G.running ? X().G.lang : (typeof LEX !== 'undefined' && LEX.lang) || 'es');
  TB.example = (stage, l) => { const t = lx(l || curLang()); const s = stage === 'scene' ? 'impf' : stage; return t.ex[s] || LX.es.ex[s] || null; };
  TB.frame = (stage, l) => { const t = lx(l || curLang()); return (t.frame || {})[stage === 'scene' ? 'impf' : stage] || ''; };
  TB.tip = (stage, l) => { const t = lx(l || curLang()); return (t.tips || {})[stage === 'scene' ? 'impf' : stage] || ''; };
  // a line for the battle's language, with the name in it
  const line = key => { const t = lx(), l = t[key] || LX.es[key], name = (X() && X().G.name) || 'Mimo'; return l ? [String(l[0]).replace(/\{name\}/g, name), String(l[1]).replace(/\{name\}/g, name)] : [key, key]; };
  const mimoSay = (key, dur = 1.8) => { const x = X(), [t, en] = line(key); x.say(x.A.mimo, t, { cls: 'mimo', en, dur }); };
  const foeSay = (f, key, dur = 1.8) => { const x = X(), [t, en] = line(key); x.say(f, t, { cls: 'foe', en, dur }); };
  // a tip in the corner, the first times only (the language in «» bolded)
  function tip(key, vars = {}, always) {
    const x = X(), G = x.G, s = (lx().tips || {})[key] || (LX.es.tips || {})[key];
    if (!s) return;
    G.tbTips = G.tbTips || {};
    if (G.tbTips[key] && !always) return;
    G.tbTips[key] = 1;
    const st = typeof LEX !== 'undefined' && LEX.st ? LEX.st('x.tbTip.' + key) : null;
    if (st && !always) { st.n = (st.n || 0) + 1; if (st.n > 5) return; }
    let text = String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)).replace(/([.!?…。！？]\s*)([»“」”])\./g, '$1$2');     // (an example that ends its own sentence takes no second period after the quote)
    text = text.replace(/«([^»]+)»/g, (m, w) => `<b class="tl">«${x.UI.esc(H.plain(w))}»</b>`);
    x.UI.tip(text);
  }

  // ------------------------------------------------------------ the verbs' forms: es / pt (by rule, checked against the dictionary)
  const DP = l => (typeof DICT !== 'undefined' && DICT.pack ? DICT.pack(l) : null);
  const infl = (l, lemma, f) => { const p = DP(l); if (!p || !p.inflect) return null; try { return p.inflect(l + ':' + lemma, f) || null; } catch (e) { return null; } };
  function lemmaOf(l, imp) {
    const p = DP(l);
    if (p && p.find) { try { const e = (p.find(imp) || []).find(x => x.pos === 'v'); if (e) return e.lemma; } catch (e) { /* (no pack: by rule) */ } }
    return /^[a-zñç]+[ae]$/.test(imp) ? imp + 'r' : null;
  }
  // slot → [tense, person]: 'pret' preterite, 'impf' imperfect, 'fut' future, 'cond' conditional, 'pres' present (the tú
  // command looks the same), 'subj' / 'isubj' present / imperfect subjunctive, 'inf' (pt: also the future subjunctive)
  const SLOT = { pret3: ['pret', 3], pret1: ['pret', 1], pret2: ['pret', 2], impf3: ['impf', 3], impf2: ['impf', 2], fut3: ['fut', 3], fut1: ['fut', 1], fut2: ['fut', 2],
    cond3: ['cond', 3], pres3: ['pres', 3], pres1: ['pres', 1], pres2: ['pres', 2], subj3: ['subj', 3], isubj3: ['isubj', 3], inf: ['inf', 0] };
  const IRREG = {
    es: { venir: { pret3: 'vino', impf3: 'venía', fut3: 'vendrá', fut1: 'vendré', cond3: 'vendría', pres3: 'viene', pres1: 'vengo', subj3: 'venga', isubj3: 'viniera', inf: 'venir' },
      ir: { pret3: 'fue', impf3: 'iba', fut3: 'irá', fut1: 'iré', cond3: 'iría', pres3: 'va', pres1: 'voy', subj3: 'vaya', isubj3: 'fuera', inf: 'ir' } },
    pt: { vir: { pret3: 'veio', impf3: 'vinha', fut3: 'virá', fut1: 'virei', cond3: 'viria', pres3: 'vem', pres1: 'venho', subj3: 'venha', isubj3: 'viesse', inf: 'vir', fsubj: 'vier' },
      ir: { pret3: 'foi', impf3: 'ia', fut3: 'irá', fut1: 'irei', cond3: 'iria', pres3: 'vai', pres1: 'vou', subj3: 'vá', isubj3: 'fosse', inf: 'ir', fsubj: 'for' } },
  };
  const conjCache = {};
  function romConj(l, lemma) {
    const ck = l + ':' + lemma; if (conjCache[ck]) return conjCache[ck];
    if (IRREG[l] && IRREG[l][lemma]) return (conjCache[ck] = Object.assign({}, IRREG[l][lemma]));
    const st = lemma.slice(0, -2), end = lemma.slice(-2), ar = end === 'ar', er = end === 'er';
    const R = l === 'es' ? {
      pret3: st + (ar ? 'ó' : 'ió'), pret1: st + (ar ? 'é' : 'í'), pret2: st + (ar ? 'aste' : 'iste'), impf3: st + (ar ? 'aba' : 'ía'), impf2: st + (ar ? 'abas' : 'ías'),
      fut3: lemma + 'á', fut1: lemma + 'é', fut2: lemma + 'ás', cond3: lemma + 'ía', pres3: st + (ar ? 'a' : 'e'), pres1: st + 'o', pres2: st + (ar ? 'as' : 'es'),
      subj3: st + (ar ? 'e' : 'a'), isubj3: st + (ar ? 'ara' : 'iera'), inf: lemma,
    } : {
      pret3: st + (ar ? 'ou' : er ? 'eu' : 'iu'), pret1: st + (ar ? 'ei' : 'i'), pret2: st + (ar ? 'aste' : er ? 'este' : 'iste'), impf3: st + (ar ? 'ava' : 'ia'), impf2: st + (ar ? 'avas' : 'ias'),
      fut3: lemma + 'á', fut1: lemma + 'ei', fut2: lemma + 'ás', cond3: lemma + 'ia', pres3: st + (ar ? 'a' : 'e'), pres1: st + 'o', pres2: st + (ar ? 'as' : 'es'),
      subj3: st + (ar ? 'e' : 'a'), isubj3: st + (ar ? 'asse' : er ? 'esse' : 'isse'), inf: lemma,
    };
    // the dictionary knows the irregular bits («pegué», pt «sobe»)
    const D = { pret3: ['past', 3], pret1: ['past', 1], impf3: ['impf', 3], fut3: ['fut', 3], cond3: ['cond', 3], pres3: ['pres', 3], pres1: ['pres', 1] };
    for (const [k, [tense, person]] of Object.entries(D)) { const v = infl(l, lemma, { tense, person, number: 's' }); if (v && !/\s/.test(v)) R[k] = v; }
    return (conjCache[ck] = R);
  }
  // what a foe does, for predictions and traps: attack, jump, come
  const FOE_V = { es: { attack: ['atacar'], jump: ['saltar', 'brincar'], come: ['venir', 'ir'] }, pt: { attack: ['atacar'], jump: ['pular', 'saltar'], come: ['vir', 'ir'] } };
  // n (normalized) → [{ form, key, lemma, imp, tense, person, slot }]
  function romMap(L, foe) {
    const prop = foe ? 'tbFoeMap' : 'tbMap';
    if (L[prop]) return L[prop];
    const l = L.code, M = new Map();
    const add = (form, info) => { if (!form) return; const n = nrm(form), a = M.get(n) || []; if (!a.some(x => x.form === form && x.slot === info.slot && x.key === info.key)) a.push(Object.assign({ form }, info)); M.set(n, a); };
    const put = (key, lemma, imp) => {
      const cj = romConj(l, lemma);
      for (const [slot, [tense, person]] of Object.entries(SLOT)) add(cj[slot], { key, lemma, imp, tense, person, slot });
      if (cj.fsubj) add(cj.fsubj, { key, lemma, imp, tense: 'inf', person: 0, slot: 'fsubj' });
    };
    if (foe) for (const [key, lemmas] of Object.entries(FOE_V[l] || {})) for (const lemma of lemmas) put(key, lemma, romConj(l, lemma).pres3);
    else for (const [k0, v] of Object.entries(L.verbs)) {
      const key = v.as || k0, seen = new Set();
      for (const f of v.forms) {
        if (/\s/.test(f)) continue;
        const lemma = lemmaOf(l, f); if (!lemma || seen.has(lemma)) continue;
        if (nrm(romConj(l, lemma).pres3) !== nrm(f)) continue;          // (only the plain command: «salta», not «salte» or «golpéalo»)
        seen.add(lemma); put(key, lemma, f);
      }
    }
    L[prop] = M;
    return M;
  }
  const PERI = { es: { va: 3, vas: 2, voy: 1, vamos: 4, van: 6 }, pt: { vai: 3, vais: 2, vou: 1, vamos: 4, vao: 6 } };
  // a word the battle already knows as something else (a color, a creature, a part): never a misspelled verb («Blauen» ≠ «blasen»)
  function otherWord(L, n) {
    const I = P.indexLang(L);
    if (I.species.has(n) || I.parts.has(n) || (I.adjs && I.adjs.has(n)) || (I.pos && I.pos.has(n)) || I.arts.has(n) || I.preps.has(n)) return true;
    return L.code === 'de' && !!P.deAdj(I, n);
  }
  // the verbs in a row of words: [{ k (first word), end (the verb's word), key, lemma, imp, tense, person, accent, typo, peri, raw }]
  // prefer: the reading to take when spellings collide («salto»: I jump, or «saltó» without its accent; «saltara» / «saltará»)
  function romVerbs(t, L, M, prefer) {
    const out = [], l = L.code;
    for (let k = 0; k < t.length; k++) {
      const w = t[k], pp = PERI[l] && PERI[l][w.n];
      if (pp) {            // «va a saltar», «vai pular»: the future with ir
        let j = k + 1; if (l === 'es' && t[j] && t[j].n === 'a') j++;
        const inf = t[j] && (M.get(t[j].n) || []).find(x => x.tense === 'inf');
        if (inf && j > k) { out.push(Object.assign({}, inf, { k, end: j, tense: 'fut', person: pp, peri: true, accent: false, typo: false, raw: t[j].raw })); k = j; continue; }
      }
      let list = M.get(w.n), typo = false;
      if (!list && w.n.length >= 6 && !otherWord(L, w.n)) for (const [n, a] of M) if (n.length >= 6 && P.near1(w.n, n)) { list = a; typo = true; break; }
      if (!list) continue;
      const raw = w.raw.toLowerCase();
      const pick = (!typo && list.find(x => x.form.toLowerCase() === raw && (!prefer || x.tense === prefer || !list.some(y => y.tense === prefer && y.person === 3))))
        || (prefer && list.find(x => x.tense === prefer && x.person === 3)) || list.find(x => x.form.toLowerCase() === raw) || list.find(x => x.person === 3) || list[0];
      // (accentWord, P6a: what you typed is, exactly, this verb in another plain tense, «salto» (I jump) read as «saltó»: the accent
      // makes another word the realm tells apart, so it still costs the S; a plain missing accent is only a tip, and so is a
      // subjunctive nobody would mean there, «saltara» for «saltará»: accents.js TELLS)
      const accent = !typo && pick.form.toLowerCase() !== raw;
      out.push(Object.assign({}, pick, { k, end: k, accent, accentWord: accent && list.some(x => x !== pick && x.form.toLowerCase() === raw && x.tense !== pick.tense && !/subj|^inf$/.test(x.tense)), typo, raw: w.raw }));
    }
    return out;
  }

  // ------------------------------------------------------------ the verbs' forms: de (a table; «sein» for moving)
  const DE_V = {
    jump: [['springen', 'spring', 'springt', 'sprang', 'gesprungen', 'sein'], ['hüpfen', 'hüpf', 'hüpft', 'hüpfte', 'gehüpft', 'sein']],
    hit: [['schlagen', 'schlag', 'schlägt', 'schlug', 'geschlagen'], ['hauen', 'hau', 'haut', 'haute', 'gehauen']],
    attack: [['angreifen', 'greif', 'greift', 'griff', 'angegriffen', 'haben', 'an']],
    push: [['schieben', 'schieb', 'schiebt', 'schob', 'geschoben'], ['stoßen', 'stoß', 'stößt', 'stieß', 'gestoßen'], ['schubsen', 'schubs', 'schubst', 'schubste', 'geschubst']],
    eat: [['essen', 'iss', 'isst', 'aß', 'gegessen'], ['fressen', 'friss', 'frisst', 'fraß', 'gefressen']],
    sing: [['singen', 'sing', 'singt', 'sang', 'gesungen']],
    climb: [['klettern', 'kletter', 'klettert', 'kletterte', 'geklettert', 'sein']],
    blow: [['pusten', 'puste', 'pustet', 'pustete', 'gepustet'], ['blasen', 'blas', 'bläst', 'blies', 'geblasen']],
    call: [['rufen', 'ruf', 'ruft', 'rief', 'gerufen']],
    light: [['leuchten', 'leucht', 'leuchtet', 'leuchtete', 'geleuchtet']],
    dig: [['graben', 'grab', 'gräbt', 'grub', 'gegraben'], ['buddeln', 'buddel', 'buddelt', 'buddelte', 'gebuddelt']],
  };
  const DE_FOE = { attack: [['angreifen', 'greif', 'greift', 'griff', 'angegriffen', 'haben', 'an']], jump: DE_V.jump, come: [['kommen', 'komm', 'kommt', 'kam', 'gekommen', 'sein']] };
  const deRow = (key, r) => ({ key, lemma: r[0], imp: r[1], pres3: r[2], pret: r[3], part: r[4], aux: r[5] || 'haben', sep: r[6] || null });
  function deMap(L, foe) {
    const prop = foe ? 'tbFoeMap' : 'tbMap';
    if (L[prop]) return L[prop];
    const M = new Map(), add = (form, info) => { const n = nrm(form), a = M.get(n) || []; a.push(Object.assign({ form }, info)); M.set(n, a); };
    const keys = foe ? Object.keys(DE_FOE) : Object.keys(DE_V).filter(k => L.verbs[k] || Object.values(L.verbs).some(v => v.as === k));
    for (const key of keys) for (const r of (foe ? DE_FOE : DE_V)[key]) {
      const v = deRow(key, r), st = v.sep ? v.lemma.slice(v.sep.length) : v.lemma;   // (greifen: the verb without its «an»)
      add(v.imp, Object.assign({ tense: 'pres', person: 2, slot: 'imp' }, v)); add(v.imp + 'e', Object.assign({ tense: 'pres', person: 1, slot: 'imp' }, v));
      add(v.pres3, Object.assign({ tense: 'pres', person: 3, slot: 'pres3' }, v));
      add(v.pret, Object.assign({ tense: 'pret', person: 3, slot: 'pret' }, v)); add(v.pret + (/e$/.test(v.pret) ? 'st' : 'st'), Object.assign({ tense: 'pret', person: 2, slot: 'pret2' }, v));
      add(v.part, Object.assign({ tense: 'part', person: 0, slot: 'part' }, v));
      add(v.lemma, Object.assign({ tense: 'inf', person: 0, slot: 'inf' }, v));
      if (v.sep) add(st, Object.assign({ tense: 'inf', person: 0, slot: 'inf', bare: true }, v));     // («wird ihn … greifen» without «an»)
    }
    L[prop] = M;
    return M;
  }
  // werden (the future), würde (would), haben / sein (the Perfekt): + the infinitive or participle at the end of the clause
  const DE_AUX = { wird: ['fut', 3, 'inf'], werde: ['fut', 1, 'inf'], wirst: ['fut', 2, 'inf'], wurde: ['cond', 3, 'inf'], wurdest: ['cond', 2, 'inf'],
    hat: ['perf', 3, 'part', 'haben'], habe: ['perf', 1, 'part', 'haben'], hast: ['perf', 2, 'part', 'haben'], ist: ['perf', 3, 'part', 'sein'], bin: ['perf', 1, 'part', 'sein'], bist: ['perf', 2, 'part', 'sein'] };
  const clauseEnd = (t, k) => { for (let j = k + 1; j < t.length; j++) if (t[j - 1].comma || t[j].n === 'und') return j; return t.length; };
  function deVerbs(t, L, M) {
    const out = [], used = new Set();
    for (let k = 0; k < t.length; k++) {
      const a = DE_AUX[t[k].n]; if (!a) continue;
      const end = clauseEnd(t, k);
      let m = null;
      for (let j = end - 1; j > k; j--) { const x = (M.get(t[j].n) || []).find(y => y.tense === a[2]); if (x) { m = { j, x }; break; } }
      if (!m) continue;
      used.add(k); used.add(m.j);
      // the particle: «wird … angreifen» (or «greifen … an»), «hat … angegriffen»
      const tail = t.slice(m.j + 1, end).filter(w => !(m.x.sep && w.n === m.x.sep));
      out.push(Object.assign({}, m.x, { k, end: m.j, tense: a[0], person: a[1], auxWord: t[k].raw, auxNeed: a[3] || null, last: !tail.length, raw: t[m.j].raw, accent: false, typo: false }));
    }
    for (let k = 0; k < t.length; k++) {
      if (used.has(k)) continue;
      let list = M.get(t[k].n), typo = false;
      if (!list && t[k].n.length >= 6 && !otherWord(L, t[k].n)) for (const [n, a] of M) if (n.length >= 6 && P.near1(t[k].n, n)) { list = a; typo = true; break; }
      if (!list) continue;
      const raw = t[k].raw;
      const pick = list.find(x => x.form === raw || x.form.toLowerCase() === raw.toLowerCase()) || list.find(x => x.slot === 'pret') || list[0];
      out.push(Object.assign({}, pick, { k, end: k, accent: !typo && pick.form.toLowerCase() !== raw.toLowerCase(), typo, raw }));
    }
    return out.sort((a, b) => a.k - b.k);
  }

  // ------------------------------------------------------------ reading a sentence in time: es / pt / de
  const SUBJ_ART = { es: ['el'], pt: ['o'], de: ['der'] };
  const isMimo = (w, ctx) => !!w && (w.n === 'mimo' || !!(ctx.voc && ctx.voc.has(w.n)));
  const PRON_AFTER = {          // a pronoun for who, after the verb: [words, gender]
    es: [[['sobre', 'el'], 'm'], [['sobre', 'ella'], 'f'], [['encima', 'de', 'el'], 'm'], [['encima', 'de', 'ella'], 'f'], [['a', 'el'], 'm'], [['a', 'ella'], 'f']],
    pt: [[['em', 'cima', 'dele'], 'm'], [['em', 'cima', 'dela'], 'f'], [['nele'], 'm'], [['nela'], 'f'], [['ele'], 'm'], [['ela'], 'f']],
    de: [[['auf', 'ihn'], 'm'], [['auf', 'sie'], 'f'], [['auf', 'es'], 'n'], [['ihn'], 'm'], [['ihm'], 'm']],
  };
  const PRON_BEFORE = { es: { lo: 'm', la: 'f', le: null } };
  // The command part: the verbs in the realm's tense become the plain command the parser reads («Mimo saltó sobre el rojo»
  // → «salta sobre el rojo»), and come back on its clauses (c.tb) with the slips; the canon is said in the realm's tense.
  // ref: the one a pronoun means («Si el rojo salta, Mimo lo golpeará»; «El rojo estaba dormido y Mimo saltó sobre él»)
  function latCommand(text, ctx, realm, t, ref) {
    const L = ctx.L, l = L.code;
    const M = l === 'de' ? deMap(L) : romMap(L);
    const occ = l === 'de' ? deVerbs(t, L, M) : romVerbs(t, L, M, realm === 'past' ? 'pret' : realm === 'future' ? 'fut' : null);
    if (!occ.length) return null;
    const drop = new Set(), swap = new Map(), addAt = new Map();
    let subj = false;
    for (let k = 0; k < t.length; k++) if (isMimo(t[k], ctx)) { drop.add(k); subj = true; if (k > 0 && SUBJ_ART[l].includes(t[k - 1].n)) drop.add(k - 1); }
    for (const o of occ) {
      if (l === 'de') {
        swap.set(o.k, o.imp);
        if (o.auxWord) { drop.add(o.end); if (o.sep && !o.bare) addAt.set(o.end, o.sep); }
        if (o.k > 0 && t[o.k + 1] && t[o.k + 1].n === 'er') { drop.add(o.k + 1); subj = true; }     // («… und dann schlug er den Blauen»)
      } else {
        for (let j = o.k; j < o.end; j++) drop.add(j);          // («va a»)
        swap.set(o.end, o.imp);
        const p = t[o.k - 1];
        if (p && PRON_BEFORE[l] && PRON_BEFORE[l][p.n] !== undefined) { drop.add(o.k - 1); o.pron = PRON_BEFORE[l][p.n] || 'm'; }
      }
      // a pronoun after it: «sobre él», «nele», «ihn» (before the next verb, or at the end)
      const next = occ.find(q => q.k > o.end), stop = next ? next.k : t.length;
      // (only at the end of its clause: «sobre el rojo» is no pronoun)
      const CONJ = new Set(['y', 'luego', 'despues', 'e', 'depois', 'und', 'dann', 'entonces', 'al', 'final']);
      const endsAt = j => { for (let k = j; k < stop; k++) if (k !== o.end && !drop.has(k) && !CONJ.has(t[k].n)) return false; return true; };
      for (const [seq, g] of PRON_AFTER[l] || []) {
        let at = -1;
        for (let k = (o.auxWord ? o.k : o.end) + 1; k + seq.length <= stop; k++) if (k !== o.end && seq.every((w, j) => t[k + j].n === w) && !drop.has(k) && endsAt(k + seq.length)) { at = k; break; }
        if (at < 0) continue;
        if (l === 'es' && seq[seq.length - 1] === 'el' && t[at + seq.length - 1].raw.toLowerCase() !== 'él') o.pronAccent = true;
        for (let j = 0; j < seq.length; j++) drop.add(at + j);
        o.pron = g; if (seq[seq.length - 1] === 'ihm') o.pronCase = true;
        break;
      }
    }
    const words = [];
    for (let k = 0; k < t.length; k++) {
      if (!drop.has(k)) words.push(swap.has(k) ? swap.get(k) : t[k].raw);
      if (addAt.has(k)) words.push(addAt.get(k));
    }
    const r = parseT(words.join(' '), Object.assign({}, ctx, { tbSkip: true }));
    if (!r || !r.ok) return Object.assign({}, r || { reason: 'noverb' }, { ok: false, raw: text });
    if (r.kind !== 'command') return r;
    r.raw = text;                       // (what you typed: the bubble and the recast show it, not the command it became)
    // back onto each clause: the tense, the slips, the canon in the realm's tense
    const cl = r.clauses;
    cl.forEach((c, i) => {
      const o = occ[i] || occ[occ.length - 1];
      c.tb = { realm, tense: o.tense === 'perf' ? 'pret' : o.tense, person: o.person, o };
      if (o.accent) c.fixes.push(o.accentWord ? 'accentWord' : 'accent'); if (o.typo) c.fixes.push('spelling'); if (o.pronAccent) c.fixes.push('accent');
      if (o.pronCase) H.err(c.errors, 'case');
      if (o.pron && c.auto) {
        const f = ref && ref.alive && !ref.gone ? ref : null;
        if (f) { c.target = f; c.auto = false; c.desc = Object.assign({ adjs: [], preps: [] }, c.desc || {}, { described: true }); if (o.pron && H.gender(f) !== o.pron && !(l === 'de' && o.pron === 'm' && H.gender(f) === 'n')) H.err(c.errors, 'gender'); }
        c.tbPron = f ? H.gender(f) : o.pron;
      }
      tenseSlips(c, o, realm, L, i === 0 && !subj);
    });
    finishCanon(r, L, realm);
    return r;
  }
  // the slips of a clause's time, for the realm it's in (none outside the realms)
  function tenseSlips(c, o, realm, L, noSubj) {
    const tn = c.tb.tense, l = L.code;
    if (!realm) return;
    const ok = realm === 'past' ? tn === 'pret' : tn === 'fut';
    if (realm === 'past') {
      if (tn === 'impf') H.err(c.errors, 'tbAspect');
      else if (!ok) { H.err(c.errors, 'tbPast', true); c.tbWrong = true; }
    } else if (tn === 'cond') H.err(c.errors, 'tbCond');
    else if (!ok) { H.err(c.errors, 'tbFut', true); c.tbWrong = true; }
    if ((ok || tn === 'impf' || tn === 'cond') && o.person && o.person !== 3) H.err(c.errors, 'tbPerson');
    if (l === 'de' && (ok || tn === 'cond')) {
      if (o.auxNeed && o.auxNeed !== o.aux) H.err(c.errors, 'tbAux');
      if (o.auxWord && !o.last) H.err(c.errors, 'tbOrder');
      if (noSubj) H.err(c.errors, 'tbSubj');
    }
  }
  // the verb said right in the realm (es / pt): the preterite; the future (pt: «vai» + infinitive, unless you said «pulará»)
  function romRight(o, realm, l) {
    const cj = romConj(l, o.lemma);
    if (realm === 'past') return cj.pret3;
    if (o.peri || (l === 'pt' && o.tense !== 'fut')) return (l === 'es' ? 'va a ' : 'vai ') + cj.inf;
    return cj.fut3;
  }
  const deAcc = g => ({ m: 'ihn', f: 'sie', n: 'es' }[g] || 'ihn');
  // one clause's canon in the realm's tense; first: the first clause (de: who comes after the verb in the others)
  function clauseCanon(c, realm, L, first) {
    const l = L.code, o = c.tb.o, words = String(c.canon).trim().split(/\s+/);
    if (l === 'de') {
      let rest = words.slice(1);
      if (o.sep && nrm(rest[rest.length - 1] || '') === o.sep) rest = rest.slice(0, -1);
      if (c.tbPron) rest = (c.verb === 'jump' ? ['auf', deAcc(c.tbPron)] : [deAcc(c.tbPron)]).concat(rest);
      const core = rest.join(' '), er = first ? '' : ' er';
      if (realm === 'past') {
        if (c.tb.tense === 'pret' && o.auxWord) return `${o.aux === 'sein' ? 'ist' : 'hat'}${er} ${core} ${o.part}`.replace(/\s+/g, ' ');
        return `${o.pret}${er} ${core}${o.sep ? ' ' + o.sep : ''}`.replace(/\s+/g, ' ');
      }
      if (realm === 'future') return `wird${er} ${core} ${o.lemma}`.replace(/\s+/g, ' ');
      return words.join(' ');
    }
    const v = realm ? romRight(o, realm, l) : words[0], rest = words.slice(1).join(' ');
    if (c.tbPron) {
      const g = c.tbPron;
      if (l === 'es') return c.verb === 'jump' ? `${v} sobre ${g === 'f' ? 'ella' : 'él'}` : `${g === 'f' ? 'la' : 'lo'} ${v}`;
      return c.verb === 'push' ? `${v} ${g === 'f' ? 'ela' : 'ele'}` : `${v} ${g === 'f' ? 'nela' : 'nele'}`;
    }
    return [v, rest].filter(Boolean).join(' ');
  }
  function finishCanon(r, L, realm) {
    if (!realm || L.cjk) return;
    const name = X().G.name || 'Mimo', parts = r.clauses.map((c, i) => clauseCanon(c, realm, L, i === 0));
    const s = L.code === 'de' ? `${name} ${parts.join(' und dann ')}` : `${name} ${parts.join(` ${L.joiner} `)}`;
    r.canon = P.wrapS(L, s);
    r.errors = r.clauses.flatMap(c => c.errors); r.fixes = r.clauses.flatMap(c => c.fixes);
    r.recast = r.errors.length > 0 || r.fixes.length > 0 || r.recast || r.clauses.some(c => c.tbWrong);
    r.patterns = [...new Set((r.patterns || []).concat([realm === 'past' ? 'past' : 'future']))];
  }

  // ---------------------------------------------------------------- the scene (the Past): «El rojo estaba dormido»
  const SCENE = {
    es: { cop: { estaba: 'impf', estaban: 'impf', estuvo: 'pret', esta: 'pres', estan: 'pres' }, adj: { dormido: 'm', dormida: 'f', dormidos: 'm', dormidas: 'f' },
      verb: { dormia: 'impf', durmio: 'pret', duerme: 'pres' }, links: ['cuando', 'mientras'], and: ['y'], art: { el: 'm', la: 'f' }, say: g => (g === 'f' ? 'estaba dormida' : 'estaba dormido') },
    pt: { cop: { estava: 'impf', tava: 'impf', estavam: 'impf', esteve: 'pret', esta: 'pres', ta: 'pres' }, adj: { dormindo: 'mf', dormido: 'm', dormida: 'f', adormecido: 'm', adormecida: 'f' },
      verb: { dormia: 'impf', dormiu: 'pret', dorme: 'pres' }, links: ['quando', 'enquanto'], and: ['e'], art: { o: 'm', a: 'f' }, say: () => 'estava dormindo' },
    de: { verb: { schlief: 'impf', schlaft: 'pres', geschlafen: 'impf', eingeschlafen: 'impf' }, links: ['als', 'wahrend'], and: ['und'], art: { der: 'm', die: 'f', das: 'n' }, say: () => 'schlief' },
  };
  // → { s (its first word), e (after its last), tense, np: [words], link, foes, errors, fixes, g (said gender) } or null
  function latScene(t, ctx) {
    const L = ctx.L, S = SCENE[L.code]; if (!S) return null;
    let s = -1, e = -1, tense = null, adjG = null;
    for (let k = 0; k < t.length && s < 0; k++) {
      const n = t[k].n;
      if (S.cop && S.cop[n] && t[k + 1] && S.adj[t[k + 1].n]) { s = k; e = k + 2; tense = S.cop[n]; adjG = S.adj[t[k + 1].n]; }
      else if (S.verb[n]) { s = k; e = k + 1; tense = S.verb[n]; if (L.code === 'de' && /^(war|ist|hat)$/.test((t[k - 1] || {}).n || '')) s = k - 1; }
    }
    if (s < 0) return null;
    if (L.code === 'de' && S.verb[t[e - 1].n] && /^(geschlafen|eingeschlafen)$/.test(t[e - 1].n) && !(t[s] && /^(war|ist|hat)$/.test(t[s].n))) {
      // «Der Rote hat … geschlafen»: the helper is before
      for (let k = e - 2; k >= 0; k--) if (/^(war|ist|hat)$/.test(t[k].n)) { s = k; break; }
    }
    // who: the words before it, back to the start of its clause
    let a = s;
    while (a > 0 && !t[a - 1].comma && !S.and.includes(t[a - 1].n) && !S.links.includes(t[a - 1].n)) a--;
    let link = null;
    if (a > 0 && S.links.includes(t[a - 1].n)) { link = t[a - 1].raw.toLowerCase(); a--; }
    const np = t.slice(link ? a + 1 : a, s).filter(w => !(L.code === 'de' && /^(war|ist|hat)$/.test(w.n)));
    if (np.some(w => isMimo(w, ctx))) return null;
    const errors = [], fixes = [];
    let foes = null;
    if (np.length) {
      foes = H.byWords(np, ctx.foes);
      if (!foes) return null;
    }
    if (tense === 'pret') H.err(errors, 'tbState');
    const art = np[0] && S.art[np[0].n];
    return { s: a, e, tense, np, link, foes, errors, fixes, art, adjG, raw: t.slice(a, e).map(w => w.raw).join(' ') };
  }
  // its grammar, once we know who: the article and «dormido / dormida» agree with it
  function sceneAgree(sc, f, L) {
    const g = H.gender(f);
    if (sc.art && sc.art !== g && !(L.code === 'de' && sc.art === 'n' && g === 'n')) H.err(sc.errors, 'gender');
    if (sc.adjG && sc.adjG !== 'mf' && sc.adjG !== (g === 'f' ? 'f' : 'm')) H.err(sc.errors, 'gender');
  }
  // the scene said right: «El rojo estaba dormido», «O vermelho estava dormindo», «Der Rote schlief»
  function sceneCanon(sc, f, L) {
    const S = SCENE[L.code], np = sc.np.length ? npSay(L, f, sc.np) : '';
    if (L.code === 'de') return np ? `${np} schlief` : 'schlief';
    return np ? `${np} ${S.say(H.gender(f))}` : S.say(H.gender(f));
  }
  // who, said right: the article for its gender, and the words you used for it (de: as you said them)
  function npSay(L, f, np) {
    const g = H.gender(f), S = SCENE[L.code];
    const words = np.map(w => w.raw);
    if (S.art[np[0].n] !== undefined) words[0] = L.code === 'de' ? ({ m: 'der', f: 'die', n: 'das' }[g]) : L.code === 'es' ? (g === 'f' ? 'la' : 'el') : (g === 'f' ? 'a' : 'o');
    if (L.code !== 'de') {
      const I = P.indexLang(L);
      for (let i = 1; i < words.length; i++) { const a = I.adjs.get(nrm(words[i])); if (a && a.g !== 'mf') { const A = L.adjs[a.key]; const lx = (A.forms[a.lex || 0] || A.forms[0]); words[i] = g === 'f' ? lx.f : lx.m; } }
    }
    return words.join(' ');
  }

  // ---------------------------------------------------------------- the prediction (the Future): «El azul atacará por arriba»
  const DIR = { es: { high: ['arriba'], low: ['abajo'], pre: ['por'] }, pt: { high: ['cima'], low: ['baixo', 'embaixo'], pre: ['por', 'em', 'de'] }, de: { high: ['oben'], low: ['unten'], pre: ['von', 'nach'] } };
  function latPredict(t, ctx) {
    const L = ctx.L, D = DIR[L.code]; if (!D) return null;
    const di = t.findIndex(w => D.high.includes(w.n) || D.low.includes(w.n));
    if (di < 0) return null;
    const high = D.high.includes(t[di].n);
    const M = L.code === 'de' ? deMap(L, true) : romMap(L, true);
    const occ = (L.code === 'de' ? deVerbs(t, L, M) : romVerbs(t, L, M, 'fut')).filter(o => Math.abs(o.k - di) <= 4 || Math.abs(o.end - di) <= 4);
    if (!occ.length) return null;
    const o = occ[0];
    // who: the words before the verb (its helper), from the start of the clause
    let a = o.k; while (a > 0 && !t[a - 1].comma && !['y', 'e', 'und'].includes(t[a - 1].n)) a--;
    const np = t.slice(a, o.k).filter(w => !D.pre.includes(w.n));
    if (!np.length || np.some(w => isMimo(w, ctx))) return null;
    const foes = H.byWords(np, ctx.foes);
    if (!foes) return null;
    let e = Math.max(di, o.end) + 1;
    if (L.code === 'de' && o.sep && t[e] && t[e].n === o.sep) e++;
    const errors = [], fixes = [];
    if (o.accent) fixes.push(o.accentWord ? 'accentWord' : 'accent'); if (o.typo) fixes.push('spelling');
    if (o.tense === 'fut' && o.person && o.person !== 3) H.err(errors, 'tbPerson');
    if (L.code === 'de' && o.tense === 'fut' && !o.last && t[o.end + 1] && !(D.high.includes(t[o.end + 1].n) || D.low.includes(t[o.end + 1].n))) H.err(errors, 'tbOrder');
    if (D.pre.length && !(t[di - 1] && D.pre.includes(t[di - 1].n)) && L.code !== 'pt') H.err(errors, 'prep');
    return { s: a, e, high, np, foes, o, tense: o.tense === 'cond' ? 'cond' : o.tense, errors, fixes, art: SCENE[L.code].art[np[0].n] };
  }
  function predCanon(p, f, L) {
    const np = npSay(L, f, p.np), D = L.dodgeWords ? L.dodgeWords(1) : { high: 'up', low: 'down' }, where = p.high ? D.high : D.low;
    if (L.code === 'de') return `${np} wird ${where} ${p.o.lemma}`;
    const cj = romConj(L.code, p.o.lemma);
    return `${np} ${p.o.peri || L.code === 'pt' ? (L.code === 'es' ? 'va a ' : 'vai ') + cj.inf : cj.fut3} ${where}`;
  }

  // ---------------------------------------------------------------- the trap (the Future): «Si el rojo salta, Mimo lo golpeará»
  const IF = { es: ['si'], pt: ['se'], de: ['wenn', 'falls'] };
  function latTrap(text, t, ctx) {
    const L = ctx.L, l = L.code;
    if (!t.length || !(IF[l] || []).includes(t[0].n)) return null;
    // the «if» half: up to its comma, or up to Mimo / the second verb
    const FM = l === 'de' ? deMap(L, true) : romMap(L, true);
    let cEnd = t.findIndex(w => w.comma) + 1;
    if (cEnd <= 0) { const m = t.findIndex((w, k) => k > 1 && isMimo(w, ctx)); cEnd = m > 0 ? m : -1; }
    if (cEnd <= 1) return null;
    const ifT = t.slice(1, cEnd), mainT = t.slice(cEnd);
    let fo = (l === 'de' ? deVerbs(ifT, L, FM) : romVerbs(ifT, L, FM, l === 'es' ? 'pres' : 'inf'))[0];
    if (!fo) return { fail: 'tb:trapVerb' };
    let np = ifT.slice(0, fo.k).filter(w => !(l === 'de' && w.n === 'wurde'));
    if (!np.length && l === 'de') np = ifT.slice(fo.k + 1).filter(w => w.n !== 'wurde');     // («wenn springt der Rote»: the verb belongs at the end)
    const foes = np.length ? H.byWords(np, ctx.foes) : null;
    if (!foes || !foes.length) return { fail: np.length ? 'none' : 'tb:trapWho' };
    const errors = [], fixes = [];
    if (fo.accent) fixes.push(fo.accentWord ? 'accentWord' : 'accent'); if (fo.typo) fixes.push('spelling');
    // the «if» half's verb: es the present (or «saltara»), pt the future subjunctive «pular» (or «pulasse»), de at the end
    let second = false;
    if (l === 'es') { if (fo.tense === 'isubj') second = true; else if (fo.tense !== 'pres') H.err(errors, 'tbSi'); }
    else if (l === 'pt') { if (fo.tense === 'isubj') second = true; else if (fo.tense !== 'inf') H.err(errors, 'tbSi'); }
    else {
      if (fo.tense === 'cond') second = true;
      else if (fo.tense !== 'pres' || fo.person !== 3) H.err(errors, 'tbSi');
      if (!fo.auxWord && fo.k !== ifT.length - 1) H.err(errors, 'tbSi');
    }
    if (l === 'de' && fo.tense === 'inf' && ifT.some((w, k) => k > fo.k && w.n === 'wurde')) { second = true; errors.length = 0; }     // («wenn er springen würde»)
    if (!mainT.length) return { fail: 'tb:trapMain' };
    return { foes, np, fo, second, errors, fixes, mainT, ifRaw: ifT.map(w => w.raw).join(' ') };
  }

  // ---------------------------------------------------------------- zh / ja: units (CJK.typed), as tactics.js reads them
  const W = (src, l) => CJ().wordOf(src, l);
  function cjFind(U, list, l, from = 0, to = U.length) {
    for (let i = Math.max(0, from); i < to; i++) for (const src of list) { const m = CJ().matchAt(W(src, l), U, i, l, { homo: true }); if (m && m.j <= to) return Object.assign({ i, src }, m); }
    return null;
  }
  function cjText(U, ranges, l, marks) {
    let s = '';
    U.forEach((u, k) => {
      if (ranges.some(([a, b]) => k >= a && k < b)) return;
      if (marks && marks[k] && s) s += l === 'ja' ? '、' : ' ， ';
      if (u.han || l === 'ja') s += u.raw;
      else s += (s && !/\s$/.test(s) ? ' ' : '') + u.raw + ' ';
    });
    return s.trim();
  }
  // which foes a run of units names: a kind, a color («红色的», «赤いの»)
  function cjFoes(U, a, b, L, foes, l) {
    let list = foes.slice(), said = false;
    for (const [key, s] of Object.entries(L.species)) if (cjFind(U, [s.w].concat(s.alt || []), l, a, b)) { list = list.filter(f => f.species === key); said = true; }
    for (const [key, A] of Object.entries(L.adjs)) {
      if (A.state) continue;
      const forms = (A.cj || []).filter(x => x[1] !== 'bad').map(x => x[0]).concat(A.forms.map(x => x.m));
      if (cjFind(U, forms, l, a, b)) { list = list.filter(f => P.hasTrait(f, key)); said = true; }
    }
    return said ? list : null;
  }
  const cjName = l => { const n = (X() && X().G.name) || 'Mimo'; return n === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : n; };
  const cjMimo = (U, l) => cjFind(U, l === 'zh' ? ['[米莫|Mǐ mò]'] : ['ミモ'], l, 0, Math.min(U.length, 3));
  const tokOf = s => String(s).trim().split(/\s+/).filter(x => !/^[！？。!?]$/.test(x));

  // ---------------------------------------------------------------- zh: 了 / 过, 会 / 要 / 将
  const ZH = { fut: ['[将要|jiāng yào]', '[就要|jiù yào]', '[会|huì]', '[要|yào]', '[将|jiāng]'], past: ['[了|le]', '[过|guò]'], prog: ['[正在|zhèng zài]', '[在|zài]'], ta: ['[它|tā]', '[他|tā]', '[她|tā]'], jiu: '[就|jiù]', dao: '[到|dào]' };
  const zhVerbs = L => L.tbVW || (L.tbVW = Object.entries(L.verbs).flatMap(([k0, v]) => (v.cj || [[v.show]]).map(c => ({ src: c[0], key: v.as || k0 }))).sort((a, b) => b.src.length - a.src.length));
  function zhScan(U, L, from = 0, to = U.length) {
    const out = [];
    for (let i = from; i < to; i++) {
      let hit = null;
      for (const v of zhVerbs(L)) { const m = CJ().matchAt(W(v.src, 'zh'), U, i, 'zh', { homo: true }); if (m && m.j <= to) { hit = Object.assign({ i, src: v.src, key: v.key }, m); break; } }
      if (!hit) continue;
      // before it: 会 / 要 / 将 (the future), 在 (in the middle of); after it (or after 到): 了 / 过
      const f = cjFind(U, ZH.fut, 'zh', Math.max(from, i - 2), i), pr = cjFind(U, ZH.prog, 'zh', Math.max(from, i - 2), i);
      let after = cjFind(U, ZH.past, 'zh', hit.j, Math.min(to, hit.j + 1));
      if (!after) { const d = cjFind(U, [ZH.dao], 'zh', hit.j, Math.min(to, hit.j + 1)); if (d) after = cjFind(U, ZH.past, 'zh', d.j, Math.min(to, d.j + 1)); }
      hit.fut = f && f.j === i ? f : null; hit.prog = pr && pr.j === i ? pr : null; hit.past = after;
      out.push(hit); i = hit.j - 1;
    }
    // 了 at the very end of a clause counts for its verb («米莫跳到红色的上面了»)
    for (let k = 0; k < out.length; k++) {
      const o = out[k], end = k + 1 < out.length ? out[k + 1].i : to;
      if (!o.past) for (let i = end - 1; i >= o.j; i--) { const m = cjFind(U, ['[了|le]'], 'zh', i, i + 1); if (m && m.j === end) { o.past = m; o.finalLe = true; } if (m) break; }
      o.tense = o.fut ? 'fut' : o.past ? 'pret' : o.prog ? 'impf' : 'pres';
    }
    return out;
  }
  function zhCommand(text, ctx, realm, ref) {
    const C = CJ(); if (!C) return null;
    const L = ctx.L, { U, marks } = C.typed(text, 'zh');
    const occ = zhScan(U, L); if (!occ.length) return null;
    const cut = [];
    const s = cjMimo(U, 'zh'); if (s) cut.push([s.i, s.j]);
    for (const o of occ) {
      if (o.fut) cut.push([o.fut.i, o.fut.j]); if (o.prog) cut.push([o.prog.i, o.prog.j]); if (o.past) cut.push([o.past.i, o.past.j]);
      const jiu = cjFind(U, [ZH.jiu], 'zh', Math.max(0, (o.fut || o).i - 1), (o.fut || o).i); if (jiu) cut.push([jiu.i, jiu.j]);
      const p = cjFind(U, ZH.ta, 'zh', o.j, Math.min(U.length, o.j + 3)); if (p && ref) { cut.push([p.i, p.j]); o.pron = true; }
    }
    const r = parseT(cjText(U, cut, 'zh', marks), Object.assign({}, ctx, { tbSkip: true }));
    if (!r || !r.ok) return Object.assign({}, r || { reason: 'noverb' }, { ok: false, raw: text });
    if (r.kind !== 'command') return r;
    r.raw = text;                       // (what you typed: the bubble and the recast show it, not the command it became)
    r.clauses.forEach((c, i) => {
      const o = occ[i] || occ[occ.length - 1];
      c.tb = { realm, tense: o.tense, person: 3, o };
      if (o.pron && c.auto && ref && ref.alive) { c.target = ref; c.auto = false; c.tbPron = 'n'; c.desc = Object.assign({ adjs: [], preps: [] }, c.desc || {}, { described: true }); }
      tenseSlips(c, o, realm, L, false);
    });
    cjCanon(r, L, realm, 'zh');
    return r;
  }
  function zhClause(c, realm) {
    const o = c.tb.o, toks = tokOf(c.canon);
    let vi = toks.findIndex(x => x === c.verbShow); if (vi < 0) vi = toks.findIndex(x => zhVerbs(c.L || X().G.L).some(v => v.src === x)); if (vi < 0) vi = 0;
    if (c.tbPron) toks.splice(vi + 1, 0, '[它|tā]');
    if (realm === 'past') {
      const mark = o.past && /过/.test(o.past.src) ? '[过|guò]' : '[了|le]';
      if (toks.includes('[把|bǎ]') || o.finalLe) toks.push('[了|le]');
      else toks.splice(toks[vi + 1] && /^\[到\|/.test(toks[vi + 1]) ? vi + 2 : vi + 1, 0, mark);
    } else if (realm === 'future') toks.unshift(o.fut ? o.fut.src : '[会|huì]');
    return toks.join(' ');
  }

  // ---------------------------------------------------------------- ja: た / ～ていた, the non-past (つもり / でしょう)
  const headOf = s => String(s).replace(/\s*(して|する|します|しろ)$/, '').replace(/[ぁ-ゖ]+$/, '');
  // per verb: { key, te, ta, dict, masu, masuta, imp: [...] }
  function jaGroups(L) {
    if (L.tbJG) return L.tbJG;
    const out = [];
    for (const [k0, v] of Object.entries(L.verbs)) {
      const key = v.as || k0, cj = v.cj || [[v.show, 'te']];
      for (const [src, style] of cj) {
        if (style !== 'te') continue;
        const h = headOf(src), same = st => (cj.find(x => x[1] === st && headOf(x[0]) === h) || [])[0] || null;
        let dict = same('dict'), masu = same('masu');
        if (/ して$/.test(src)) { dict = dict || src.replace(/して$/, 'する'); masu = masu || src.replace(/して$/, 'します'); }
        out.push({ key, te: src, ta: src.replace(/て$/, 'た').replace(/で$/, 'だ'), dict, masu, masuta: masu ? masu.replace(/ます$/, 'ました') : null,
          tei: src + ' いた', imp: cj.filter(x => x[1] === 'imp' && headOf(x[0]) === h).map(x => x[0]) });
      }
    }
    return (L.tbJG = out);
  }
  const JA_AFTER = ['つもり です', 'つもり だ', 'つもり', 'でしょう', 'だろう', 'です', 'よ', 'ぞ'];
  function jaScan(U, L, from = 0, to = U.length) {
    const out = [], G = jaGroups(L);
    for (let i = from; i < to; i++) {
      let hit = null;
      for (const g of G) {
        for (const [src, tense, style] of [[g.masuta, 'pret', 'masuta'], [g.tei, 'impf', 'tei'], [g.ta, 'pret', 'ta'], [g.masu, 'fut', 'masu'], [g.te, 'pres', 'te'], [g.dict, 'fut', 'dict']].concat(g.imp.map(s => [s, 'pres', 'imp']))) {
          if (!src) continue;
          const m = CJ().matchAt(W(src, 'ja'), U, i, 'ja', { homo: true });
          if (m && m.j <= to && (!hit || m.j > hit.j)) hit = Object.assign({ i, src, g, key: g.key, tense, style }, m);
        }
      }
      if (!hit) continue;
      if (hit.style === 'dict' || hit.style === 'masu') { const a0 = cjFind(U, JA_AFTER, 'ja', hit.j, Math.min(to, hit.j + 8)), a = a0 && a0.i === hit.j ? a0 : null; if (a) { hit.after = a; if (/でしょう|だろう/.test(a.src)) hit.guess = true; if (/つもり/.test(a.src)) hit.plan = true; } }
      out.push(hit); i = (hit.after ? hit.after.j : hit.j) - 1;
    }
    return out;
  }
  function jaCommand(text, ctx, realm, ref) {
    const C = CJ(); if (!C) return null;
    const L = ctx.L, { U, marks } = C.typed(text, 'ja');
    const occ = jaScan(U, L); if (!occ.length) return null;
    const cut = [], swaps = [];
    const s = cjMimo(U, 'ja');
    if (s) { cut.push([s.i, s.j]); const p = cjFind(U, ['は', 'が', 'わ'], 'ja', s.j, s.j + 1); if (p) cut.push([p.i, p.j]); }
    for (const o of occ) {
      if (o.after) cut.push([o.after.i, o.after.j]);
      if (o.style !== 'te') swaps.push(o);
      const p = cjFind(U, ['あいつ を', 'それ を', 'あいつ', 'それ'], 'ja', Math.max(0, o.i - 3), o.i); if (p && ref) { cut.push([p.i, p.j]); o.pron = true; }
    }
    // the verbs go back to the request the parser reads («叩いた» → «叩いて»), in place
    let typed = '';
    U.forEach((u, k) => {
      const sw = swaps.find(o => o.i === k);
      if (sw) { typed += CJ().plain ? CJ().plain(sw.g.te, { lang: 'ja', cap: false }).replace(/\s+/g, '') : sw.g.te; return; }
      if (swaps.some(o => k > o.i && k < o.j) || cut.some(([a, b]) => k >= a && k < b)) return;
      if (marks && marks[k] && typed) typed += '、';
      typed += u.raw;
    });
    const r = parseT(typed, Object.assign({}, ctx, { tbSkip: true }));
    if (!r || !r.ok) return Object.assign({}, r || { reason: 'noverb' }, { ok: false, raw: text });
    if (r.kind !== 'command') return r;
    r.raw = text;                       // (what you typed: the bubble and the recast show it, not the command it became)
    r.clauses.forEach((c, i) => {
      const o = occ[i] || occ[occ.length - 1];
      // the non-past is the future in the Future, and the present (the wrong time) in the Past
      c.tb = { realm, tense: o.tense === 'fut' && realm === 'past' ? 'pres' : o.tense, person: 3, o };
      if (o.pron && c.auto && ref && ref.alive) { c.target = ref; c.auto = false; c.tbPron = 'n'; c.desc = Object.assign({ adjs: [], preps: [] }, c.desc || {}, { described: true }); }
      tenseSlips(c, o, realm, L, false);
    });
    cjCanon(r, L, realm, 'ja');
    return r;
  }
  function jaClause(c, realm) {
    const o = c.tb.o, g = o.g; let s = String(c.canon).trim().replace(/\s*[！？。]$/, '');
    if (c.tbPron) s = 'あいつ を ' + s;
    const at = s.lastIndexOf(g.te);
    if (at < 0) return s;
    const v = realm === 'past' ? (o.style === 'masuta' ? g.masuta : g.ta) : realm === 'future' ? (o.style === 'masu' ? g.masu : (g.dict || g.masu || g.te) + (o.guess ? ' でしょう' : ' つもり')) : g.te;
    return s.slice(0, at) + v + s.slice(at + g.te.length);
  }
  // zh / ja: the canon in the realm's tense, with Mimo said first
  function cjCanon(r, L, realm, l) {
    if (!realm) return;
    const parts = r.clauses.map(c => (l === 'zh' ? zhClause(c, realm) : jaClause(c, realm)));
    const join = l === 'zh' ? ' ， [然后|rán hòu] ' : ' 、 それから ';
    r.canon = `${cjName(l)} ${l === 'ja' ? 'は ' : ''}${parts.join(join)} ！`;
    r.errors = r.clauses.flatMap(c => c.errors); r.fixes = r.clauses.flatMap(c => c.fixes);
    r.recast = r.errors.length > 0 || r.fixes.length > 0 || r.recast || r.clauses.some(c => c.tbWrong);
    r.patterns = [...new Set((r.patterns || []).concat([realm === 'past' ? 'past' : 'future']))];
  }

  // ---------------------------------------------------------------- zh / ja: the scene, the prediction, the trap
  const CJ_SCENE = {
    zh: { ok: ['[正在|zhèng zài] [睡觉|shuì jiào]', '[在|zài] [睡觉|shuì jiào]', '[睡着|shuì zháo] [了|le]', '[在|zài] [睡|shuì]', '[睡着|shuì zháo]'], pres: [], pret: [], lead: ['[那时候|nà shí hou]', '[那时|nà shí]', '[当时|dāng shí]'] },
    ja: { ok: ['[寝|ね]て いました', '[眠|ねむ]って いました', '[寝|ね]て いた', '[寝|ね]てた', '[眠|ねむ]って いた', '[眠|ねむ]ってた'], pres: ['[寝|ね]て います', '[寝|ね]て いる', '[寝|ね]てる', '[眠|ねむ]って いる', '[眠|ねむ]ってる'], pret: ['[寝|ね]た', '[眠|ねむ]った'], lead: ['その とき', 'あの とき'] },
  };
  function cjScene(U, ctx, l) {
    const S = CJ_SCENE[l], L = ctx.L;
    let m = cjFind(U, S.ok, l), tense = 'impf';
    if (!m) { m = cjFind(U, S.pres, l); tense = 'pres'; }
    if (!m) { m = cjFind(U, S.pret, l); tense = 'pret'; }
    if (!m) return null;
    const lead = cjFind(U, S.lead, l, 0, m.i);
    let a = lead ? lead.j : 0;
    // back to the start of its clause (a comma, then 然后 / それから …)
    for (let k = m.i - 1; k >= a; k--) if (cjFind(U, l === 'zh' ? ['，', '[然后|rán hòu]'] : ['、', 'それから'], l, k, k + 1)) { a = k + 1; break; }
    let b = m.i; const pt = l === 'ja' ? cjFind(U, ['は', 'が'], l, Math.max(a, m.i - 1), m.i) : null; if (pt) b = pt.i;
    if (cjMimo(U.slice(a, b), l)) return null;
    const foes = b > a ? cjFoes(U, a, b, L, ctx.foes, l) : null;
    if (b > a && !foes) return null;
    const errors = [];
    if (tense === 'pret') H.err(errors, 'tbState');
    return { s: lead ? lead.i : a, e: m.j, tense, foes, errors, fixes: m.toneBad ? ['accent'] : [], npU: [a, b], npText: cjText(U.slice(a, b), [], l), cj: true };
  }
  const CJ_DIR = { zh: { high: ['[上面|shàng miàn]', '[上边|shàng biān]', '[上|shàng]'], low: ['[下面|xià miàn]', '[下边|xià biān]', '[下|xià]'], verbs: ['[攻击|gōng jī]', '[冲过来|chōng guò lái]', '[过来|guò lái]', '[打|dǎ]', '[跳|tiào]', '[来|lái]'] },
    ja: { high: ['[上|うえ] から'], low: ['[下|した] から'], verbs: ['[攻撃|こうげき] する', '[攻撃|こうげき] します', '[来|く]る', '[来|き]ます', '[跳|と]ぶ', '[跳|と]びます', 'くる'], bad: ['[来|き]て', '[攻撃|こうげき] して', '[跳|と]んで'] } };
  function cjPredict(U, ctx, l) {
    const D = CJ_DIR[l], L = ctx.L;
    const hi = cjFind(U, D.high, l), lo = hi ? null : cjFind(U, D.low, l), d = hi || lo;
    if (!d) return null;
    let e = d.j, tense = 'fut', errors = [], a = 0, b = d.i;
    if (l === 'zh') {
      const f = cjFind(U, ZH.fut, 'zh', 0, d.i), cong = cjFind(U, ['[从|cóng]'], 'zh', Math.max(0, d.i - 1), d.i);
      b = f ? f.i : cong ? cong.i : d.i;
      const v = cjFind(U, D.verbs, 'zh', d.j, Math.min(U.length, d.j + 5)); if (v) e = v.j;
      if (!f) tense = 'pres';
    } else {
      const v = cjFind(U, D.verbs, 'ja', d.j, Math.min(U.length, d.j + 9)), bad = v ? null : cjFind(U, D.bad, 'ja', d.j, Math.min(U.length, d.j + 9));
      if (!v && !bad) return null;
      if (bad) tense = 'pres';
      e = (v || bad).j;
      const a2 = cjFind(U, JA_AFTER, 'ja', e, Math.min(U.length, e + 8)); if (a2 && a2.i === e) e = a2.j;
      const pt = cjFind(U, ['は', 'が'], 'ja', Math.max(0, d.i - 1), d.i); if (pt) b = pt.i;
    }
    if (b <= a || cjMimo(U.slice(a, b), l)) return null;
    const foes = cjFoes(U, a, b, L, ctx.foes, l);
    if (!foes) return null;
    return { s: 0, e, high: !!hi, foes, tense, errors, fixes: [], npText: cjText(U.slice(a, b), [], l), cj: true };
  }
  function cjTrap(text, U, ctx, l) {
    const L = ctx.L;
    if (l === 'zh') {
      const ifw = cjFind(U, ['[如果|rú guǒ]', '[要是|yào shi]', '[假如|jiǎ rú]'], 'zh', 0, Math.min(U.length, 3)); if (!ifw || ifw.i !== 0) return null;
      const v = cjFind(U, ['[跳|tiào]', '[攻击|gōng jī]', '[动|dòng]', '[打|dǎ] [过来|guò lái]', '[过来|guò lái]'], 'zh', ifw.j);
      if (!v) return { fail: 'tb:trapVerb' };
      const foes = cjFoes(U, ifw.j, v.i, L, ctx.foes, 'zh');
      if (!foes || !foes.length) return { fail: 'tb:trapWho' };
      let m0 = v.j; const dh = cjFind(U, ['[的话|de huà]'], 'zh', m0, m0 + 1); if (dh) m0 = dh.j;
      const errors = [];
      const jiu = cjFind(U, [ZH.jiu], 'zh', m0);
      if (!jiu) H.err(errors, 'tbSi');
      return { foes, errors, fixes: [], mainU: [m0, U.length], second: false, ifText: cjText(U.slice(ifw.j, m0), [], 'zh') };
    }
    const tara = cjFind(U, ['[跳|と]んだら', '[飛|と]んだら', 'ジャンプ したら', '[攻撃|こうげき] したら', '[来|き]たら', '[動|うご]いたら'], 'ja'), bad = tara ? null : cjFind(U, ['[跳|と]ぶたら', '[跳|と]びたら', '[来|く]るたら', '[攻撃|こうげき] するたら'], 'ja');
    const m = tara || bad; if (!m) return null;
    const pt = cjFind(U, ['が', 'は'], 'ja', Math.max(0, m.i - 1), m.i), b = pt ? pt.i : m.i;
    const foes = cjFoes(U, 0, b, L, ctx.foes, 'ja');
    if (!foes || !foes.length) return { fail: 'tb:trapWho' };
    const errors = []; if (bad) H.err(errors, 'tbSi');
    return { foes, errors, fixes: [], mainU: [m.j, U.length], second: false, ifText: cjText(U.slice(0, m.j), [], 'ja') };
  }

  // ---------------------------------------------------------------- who, said: «el azul», «o azul», «der Blaue», «蓝色的», «青いの»
  function npOf(f, L) {
    const l = L.code, g = H.gender(f), x = X(), same = x.targetable().filter(k => k !== f && k.color === f.color).length > 0, S = L.species[f.species] || {};
    const A = L.adjs[f.color];
    if (l === 'zh') { const c = A && A.cj ? A.cj[0][0] : '[红色|hóng sè]'; return same ? `${c} [的|de] ${S.w}` : `${c} [的|de]`; }
    if (l === 'ja') { const c = A && A.cj ? (A.cj.find(z => z[1] === 'i') || A.cj[0])[0] : '[赤|あか]い'; const iAdj = A && A.cj && A.cj.some(z => z[1] === 'i'); return same ? `${c}${iAdj ? '' : ' の'} ${S.w}` : `${c} の`; }
    if (l === 'de') { const art = { m: 'der', f: 'die', n: 'das' }[g] || 'der', st = A ? A.stem : 'rot'; return same ? `${art} ${st}e ${S.w}` : `${art} ${P.capF(st)}e`; }
    const art = l === 'es' ? (g === 'f' ? 'la' : 'el') : (g === 'f' ? 'a' : 'o'), adj = A ? (g === 'f' ? A.forms[0].f : A.forms[0].m) : '';
    return same ? `${art} ${S.w} ${adj}` : `${art} ${adj}`;
  }
  // the model prediction for one foe: «El azul atacará por arriba»
  function predModel(f, high, L) {
    const np = npOf(f, L), D = L.dodgeWords ? L.dodgeWords(1) : { high: '', low: '' }, where = high ? D.high : D.low;
    if (L.code === 'zh') return `${np} [会|huì] [从|cóng] ${where} [攻击|gōng jī] 。`;
    if (L.code === 'ja') return `${np} は ${where} から [来|く]る でしょう 。`;
    if (L.code === 'de') return `${P.capF(np)} wird ${where} angreifen.`;
    return `${P.capF(np)} ${L.code === 'es' ? 'atacará' : 'vai atacar'} ${where}.`;
  }

  // ---------------------------------------------------------------- what you said, as a whole: a command, a scene, a prediction, a trap
  const statement = (L, s) => (L.cjk ? `${String(s).trim()} 。` : P.capF(String(s).trim()) + '.');
  const unwrapS = s => H.unwrap(String(s)).replace(/^¡/, '');
  // a scene / a prediction: alone (a whole turn), or said before a command («El rojo estaba dormido y Mimo saltó sobre él»)
  function withPre(text, ctx, realm, item, kind, restText, cmd) {
    const L = ctx.L;
    if (item.tense === 'pres' || (kind === 'pred' && !['fut', 'cond'].includes(item.tense))) return { ok: false, raw: text, reason: kind === 'scene' ? 'tb:scenePres' : 'tb:predTense' };
    if (kind === 'pred' && item.tense === 'cond') H.err(item.errors, 'tbCond');
    // who it's about: the one it names (or, said with «cuando / mientras», the command's target)
    let r = null;
    if (cmd) { r = cmd(item.foes && item.foes.length === 1 ? item.foes[0] : null); if (r && !r.ok) return r; if (r && r.kind !== 'command') r = null; }
    const target = r && r.clauses[0] && r.clauses[0].target;
    let f = item.foes ? (item.foes.length === 1 ? item.foes[0] : item.foes.includes(target) ? target : item.foes[0]) : target;
    if (!f) return { ok: false, raw: text, reason: item.foes ? 'none' : 'tb:sceneWho' };
    const soft = [];
    if (item.foes && item.foes.length > 1 && !(target && item.foes.includes(target))) soft.push('tbWhich');
    if (!L.cjk && item.np && item.np.length) sceneAgree(item, f, L);
    // the canon: the scene or prediction said right (the words you said when there are no slips)
    const said = !item.errors.length && !item.fixes.length;
    let pre;
    if (L.cjk) pre = said ? null : kind === 'scene' ? `${npOf(f, L)} ${L.code === 'zh' ? '[在|zài] [睡觉|shuì jiào]' : 'は [寝|ね]て いた'}` : unwrapS(predModel(f, item.high, L));
    else pre = kind === 'scene' ? sceneCanon(item, f, L) : predCanon(item, f, L);
    const words = L.species[f.species] ? ['n.' + f.species] : [];
    const tb = { kind, f, high: item.high, realm };
    if (!r) {
      const canon = pre ? statement(L, pre) : String(text).trim();
      const errors = item.errors, fixes = item.fixes;
      const what = kind === 'scene' ? `set the scene: the ${f.species} was asleep <span class="bonus">surprise ×2 next hit</span>` : `predict: the ${f.color || ''} ${f.species} attacks ${item.high ? 'high' : 'low'}`;
      return { ok: true, kind: 'tac', tac: 'G', raw: text, canon, errors, fixes, soft, clauses: [], words, untaught: [], patterns: [kind === 'scene' ? 'scene' : 'predict'],
        key: P.tokenize(text).map(w => w.n).join(' '), recast: errors.length > 0 || fixes.length > 0, tbPre: tb, tacPreview: what, tacPerform: preWhole };
    }
    // with a command: the scene / prediction goes first, its slips with the first clause
    r.clauses[0].errors.push(...item.errors); r.clauses[0].fixes.push(...item.fixes); r.clauses[0].soft = (r.clauses[0].soft || []).concat(soft);
    r.tbPre = tb; r.raw = text;
    const join = L.code === 'es' ? ' y ' : L.code === 'pt' ? ' e ' : L.code === 'de' ? ' und ' : L.code === 'zh' ? ' ， ' : ' 、 ';
    const preS = pre || (L.cjk ? null : unwrapS(text));
    if (preS && item.link && !L.cjk) r.canon = P.wrapS(L, `${unwrapS(r.canon)} ${item.link} ${preS}`);     // («… cuando estaba dormido»: as you said it)
    else if (preS) r.canon = L.cjk ? `${preS}${join}${String(r.canon).trim()}` : P.wrapS(L, `${preS}${join}${unwrapS(r.canon)}`);
    r.errors = r.clauses.flatMap(c => c.errors); r.fixes = r.clauses.flatMap(c => c.fixes);
    r.recast = r.errors.length > 0 || r.fixes.length > 0 || r.recast;
    r.words = [...new Set((r.words || []).concat(words))];
    r.patterns = [...new Set((r.patterns || []).concat([kind === 'scene' ? 'scene' : 'predict']))];
    return r;
  }
  // the trap: «Si el rojo salta, Mimo lo golpeará» (a whole turn); it springs when that one attacks
  function trapResult(text, ctx, tr, mainCmd, ifCanon) {
    const L = ctx.L, f = tr.foes[0];
    const r2 = mainCmd(f);
    if (!r2 || !r2.ok) return Object.assign({}, r2 || {}, { ok: false, raw: text, reason: (r2 && r2.reason) || 'tb:trapMain' });
    if (r2.kind !== 'command' || !r2.clauses[0]) return { ok: false, raw: text, reason: 'tb:trapMain' };
    const c = r2.clauses[0];
    // the second half: the future (or, with «si saltara», the conditional); zh: «就» is enough
    c.errors = c.errors.filter(e => !['tbFut', 'tbCond'].includes(e.kind));
    const tn = c.tb ? c.tb.tense : 'pres';
    c.tbWrong = false;
    if (L.code === 'zh' && tn === 'pres') { /* «米莫就打它»: the future is in 如果…就 */ }
    else if (tn === 'cond') { if (!tr.second) H.err(c.errors, 'tbSeq'); }
    else if (tn === 'fut') { if (tr.second) H.err(c.errors, 'tbSeq'); }
    else if (c.tb && c.tb.o && (c.tb.o.slot === 'imp' || c.tb.o.style === 'te' || c.tb.o.style === 'imp' || (L.code !== 'de' && !L.cjk && !c.tb.o.k))) H.err(c.errors, 'tbFut', true);
    else (c.soft = c.soft || []).push('tbMain');
    const errors = tr.errors.concat(c.errors), fixes = tr.fixes.concat(c.fixes), soft = (tr.foes.length > 1 ? ['tbWhich'] : []).concat(c.soft || []);
    const said = !errors.length && !fixes.length && !soft.length;
    const canon = said ? String(text).trim() : ifCanon(f, c, r2);
    return { ok: true, kind: 'tac', tac: 'G', raw: text, canon, errors, fixes, soft, clauses: [], words: r2.words || [], untaught: [], patterns: ['trap'],
      key: P.tokenize(text).map(w => w.n).join(' '), recast: !said, tbTrap: { f, c, second: tr.second }, tacPreview: `a trap on the ${f.color || ''} ${f.species}: when it attacks, ${X().G.name} ${c.verb}s it <span class="bonus">×2</span>`,
      tacPerform: trapWhole };
  }
  function latTime(text, ctx, realm) {
    const L = ctx.L, l = L.code, t = H.toks(text);
    if (!t.length) return null;
    const rest = (a, b) => { const out = t.filter((w, k) => k < a || k >= b); while (out.length && ['y', 'e', 'und', 'entonces', 'dann'].includes(out[0].n)) out.shift(); return out; };
    if (realm === 'future') {
      const tr = latTrap(text, t, ctx);
      if (tr) {
        if (tr.fail) return { ok: false, raw: text, reason: tr.fail };
        return trapResult(text, ctx, tr, f => latCommand(tr.mainT.map(w => w.raw).join(' '), ctx, 'future', tr.mainT, f), (f, c, r2) => {
          const fo = tr.fo, np = npSay(L, f, tr.np), main = unwrapS(r2.canon), name = X().G.name || 'Mimo';
          if (l === 'de') {
            const core = clauseCanon(c, 'future', L, true).replace(/^wird\s+/, '').replace(new RegExp(`\\s+${c.tb.o.lemma}$`), '');
            const v = tr.second ? `${fo.lemma} würde` : fo.pres3;
            return `Wenn ${np} ${v}, ${tr.second ? 'würde' : 'wird'} ${name} ${core} ${c.tb.o.lemma}.`.replace(/\s+/g, ' ');
          }
          const cj = romConj(l, fo.lemma), v = tr.second ? cj.isubj3 : l === 'es' ? cj.pres3 : (cj.fsubj || cj.inf);
          let m = main;
          if (tr.second) { const cc = romConj(l, c.tb.o.lemma); m = main.replace(romRight(c.tb.o, 'future', l), cc.cond3); }
          return `${l === 'es' ? 'Si' : 'Se'} ${np} ${v}, ${m}.`;
        });
      }
      const p = latPredict(t, ctx);
      if (p) {
        const rt = rest(p.s, p.e);
        return withPre(text, ctx, realm, p, 'pred', null, rt.length ? (ref => latCommand(rt.map(w => w.raw).join(' '), ctx, realm, rt, ref)) : null);
      }
    } else if (realm === 'past') {
      const sc = latScene(t, ctx);
      if (sc) {
        const rt = rest(sc.s, sc.e);
        return withPre(text, ctx, realm, sc, 'scene', null, rt.length ? (ref => latCommand(rt.map(w => w.raw).join(' '), ctx, realm, rt, ref)) : null);
      }
    }
    return latCommand(text, ctx, realm, t, null);
  }
  function cjTime(text, ctx, realm) {
    const C = CJ(); if (!C) return null;
    const l = ctx.L.code, { U, marks } = C.typed(text, l);
    if (!U.length) return null;
    const restOf = (a, b) => cjText(U, [[a, b]], l, marks).replace(/^[，、,\s]+/, '').replace(/^(然后|それから|就)\s*/, '');
    const cmd = (s, ref) => (l === 'zh' ? zhCommand(s, ctx, realm, ref) : jaCommand(s, ctx, realm, ref));
    if (realm === 'future') {
      const tr = cjTrap(text, U, ctx, l);
      if (tr) {
        if (tr.fail) return { ok: false, raw: text, reason: tr.fail };
        const mainText = cjText(U, [[0, tr.mainU[0]]], l, marks).replace(/^[，、,\s]+/, '');
        return trapResult(text, ctx, tr, f => cmd(mainText, f), (f, c) => {
          const np = npOf(f, ctx.L), name = cjName(l);
          if (l === 'zh') return `[如果|rú guǒ] ${np} [跳|tiào] ， ${name} [就|jiù] ${c.verbShow} [它|tā] 。`;
          const g = c.tb && c.tb.o && c.tb.o.g;
          return `${np} が [跳|と]んだら 、 ${name} が ${g ? g.dict || g.masu || g.te : c.verbShow} 。`;
        });
      }
      const p = cjPredict(U, ctx, l);
      if (p) { const rt = restOf(p.s, p.e); return withPre(text, ctx, realm, p, 'pred', null, rt ? (ref => cmd(rt, ref)) : null); }
    } else if (realm === 'past') {
      const sc = cjScene(U, ctx, l);
      if (sc) { const rt = restOf(sc.s, sc.e); return withPre(text, ctx, realm, sc, 'scene', null, rt ? (ref => cmd(rt, ref)) : null); }
    }
    return cmd(text, null);
  }
  TB.parse = (text, ctx, realm) => (ctx.L.cjk ? cjTime(text, ctx, realm) : latTime(text, ctx, realm));

  // the parser, wrapped once more (over battle/tactics.js's): in a realm every sentence is read for its time first
  const parseT = P.parse;
  P.parse = (text, ctx) => {
    const realm = ctx && ctx.L && ctx.foes && !ctx.tbSkip ? realmNow() : null;
    if (!realm) return parseT(text, ctx);
    let r = null;
    try { r = TB.parse(String(text), ctx, realm); } catch (e) { console.error('[time] parse', e); r = null; }
    if (r && r.ok && r.kind === 'command') { for (const c of r.clauses) c.tbCanon = r.canon; r.echoLine = r.canon; }     // (Mimo says it back in the realm's tense)
    // what doesn't read in time but isn't a command either still reads as itself: a deal that talks one down («Si te vas, te doy una
    // manzana», skill E: its «if» isn't a trap's), talk, team orders (a command that doesn't read in time keeps the time's hint)
    if (r && !r.ok) { let r2 = null; try { r2 = parseT(text, ctx); } catch (e) { r2 = null; } if (r2 && r2.ok && r2.kind !== 'command') return r2; }
    return r || parseT(text, ctx);
  };
  // the tells (A) are for the present: in a realm, the realm's own sentences take their place
  const on0 = T.on;
  T.on = k => (k === 'A' && realmNow() ? false : on0(k));

  // ---------------------------------------------------------------- the grade and the moves
  // Past: the right tense replays the memory (its echo takes the hit); the wrong one confuses Mimo (½). Future: the right
  // tense queues the move for your next turn; the wrong one goes now, confused (½). A scene / prediction said first runs first.
  T.judgeHooks.push(r => {
    const realm = realmNow(); if (!realm || !r.clauses) return;
    const x = X(), pre = r.tbPre;
    r.clauses.forEach(c => {
      if (!c.tb) return;
      const prev = c.tacRun;
      if (c.tbWrong) {
        c.tacMult *= 0.5; c.tacSub = c.tacSub || 'CONFUSED ½';
        c.tacRun = async q => { await confusedRun(q); await (prev ? prev(q) : x.MOVES[q.verb](q)); };
      } else if (realm === 'past') {
        if (pre && pre.kind === 'scene' && pre.f === c.target) c.sneak = true;
        c.tacRun = async q => { await memoryRun(q); await (prev ? prev(q) : x.MOVES[q.verb](q)); };
        const m = bossOpt('mult'); if (m) c.tacMult *= m;
      } else if (!bossOpt('noQueue') && c.verb !== 'eat') {
        c.tacRun = async q => queueRun(q, prev);
        const m = bossOpt('mult'); if (m) c.tacMult *= m;
      }
      const bj = bossOpt('judge'); if (bj) try { bj(c, r); } catch (e) { console.error('[time] boss judge', e); }
    });
    if (pre && r.clauses[0]) { const c0 = r.clauses[0], inner = c0.tacRun; c0.tacRun = async q => { await preRun(pre, r); await (inner ? inner(q) : x.MOVES[q.verb](q)); }; }
    fire('judge', r);
  });
  // a little sepia ring and a «⟲»: the memory replays (Mimo says «¡Así fue!» the first times)
  async function memoryRun(c) {
    const x = X(), G = x.G, f = c.target;
    if (f && f.alive) { H.pop(f, '⟲', { color: '#e9c27a', size: 34, rise: 0.4, life: 0.9 }); x.ST.ring(f, '#e9c27a', 1.5); }
    G.tbMem = (G.tbMem || 0) + 1;
    if (G.tbMem <= 2) mimoSay('memory', 1.2);
    learnOnce(G.practice ? null : 'Gp');
    fire('memory', c);
    await x.wait(0.3);
  }
  async function confusedRun(c) {
    const x = X(), G = x.G, realm = realmNow();
    x.setMood(x.A.mimo, 'confused', 1.6);
    mimoSay(realm === 'past' ? 'confPast' : 'confFut', 2.2);
    tip(realm === 'past' ? 'pres' : 'futPres', { ex: c.tbCanon || '' }, true);
    fire('confused', c);
    await x.wait(0.9);
  }
  // the Future: the move waits for your next turn (a ⏳ over who it's for)
  async function queueRun(c, prev) {
    const x = X(), G = x.G, f = c.target;
    (G.tbQueue || (G.tbQueue = [])).push({ c, prev, turn: G.turn, base: c.tacMult || 1 });
    if (f && f.alive) { H.pop(f, '⏳', { color: '#7ff7ea', size: 34, rise: 0.4, life: 1.2 }); x.ST.ring(f, '#7ff7ea', 1.4); }
    x.setMood(x.A.mimo, 'perk', 1.2);
    if ((G.tbQueue.length || 0) <= 1) mimoSay('plan', 1.3);
    x.emit('learn', { id: 'tb.queue' });
    tip('fut');
    learnOnce(G.practice ? null : 'Gf');
    fire('queue', c);
    await x.wait(0.45);
  }
  // at the start of your turn: everything planned lands, one after another, stronger the more there are
  async function fireQueue() {
    const x = X(), G = x.G, Q = (G.tbQueue || []).filter(e => e.turn < G.turn);
    if (!Q.length) return;
    G.tbQueue = (G.tbQueue || []).filter(e => e.turn >= G.turn);
    x.ST.shot('wide');
    mimoSay('came', 1.3);
    await x.wait(0.5);
    let n = 0;
    for (const e of Q) {
      const c = e.c;
      if (!c.target || !c.target.alive || c.target.gone || c.target.calmed) { const alt = x.targetable().filter(f => !f.shy)[0]; if (!alt) continue; c.target = alt; }
      const m = 1.5 + 0.25 * n;
      c.tacMult = e.base * m; c.tacSub = n ? `STACK ×${m}` : 'FUTURE ×1.5';
      if (n) H.pop(x.A.mimo, `STACK ${n + 1}!`, { color: '#7ff7ea', size: 26 + 3 * n, life: 0.9 });
      n++;
      await (e.prev ? e.prev(c) : x.MOVES[c.verb](c));
      fire('fire', c);
      if (x.allDone()) break;
    }
    x.ST.shot('wide');
  }

  // ---------------------------------------------------------------- the scene and the prediction happen (said first, or a whole turn)
  async function preRun(pre, r) { if (pre.kind === 'scene') await sceneRun(pre.f, r); else await predictRun(pre.f, pre.high, r); }
  async function recastWhole(r) {
    const x = X(), G = x.G;
    if (!r.recast) return;
    x.noteMistake({ kind: 'grammar', typed: r.raw, right: r.canon, errors: [...new Set((r.errors || []).map(e => e.kind).concat(r.fixes || []))], grade: r.grade && r.grade.letter });
    x.say(x.A.mimo, P.recastHTML(r.canon, r.raw, x.UI.esc), { html: true, cls: 'mimo', dur: 2.8 });
    G.stats.recasts++; x.emit('recast');
    await x.wait(1.1);
  }
  async function preWhole(r) {
    const x = X(), pre = r.tbPre, letter = r.grade ? r.grade.letter : 'B';
    x.facing('foes');
    await recastWhole(r);
    if (letter === 'D' || !pre.f || !pre.f.alive) { x.setMood(x.A.mimo, 'confused', 1.4); mimoSay('unsure', 1.6); if (pre.f) x.showGrade(pre.f, { right: true }); await x.wait(1.2); return; }
    await preRun(pre, r);
    x.showGrade(pre.f, { right: true });
    await x.mimoReact(letter);
    x.ST.shot('wide');
  }
  // «El rojo estaba dormido»: in the memory, it was asleep (it doesn't attack, and the next hit is a SURPRISE ×2)
  async function sceneRun(f, r) {
    const x = X(), G = x.G;
    if (!f || !f.alive || f.gone) return;
    const bs = bossOpt('scene'), big = f.isBoss || (f.spec && (f.spec.giant || f.spec.queen));
    if ((bs && bs(f) === false) || (big && !bs)) { foeSay(f, 'noChange', 2.2); await x.wait(1.1); return; }
    x.ST.shot('action', x.A.mimo, f, { yaw: -0.05, up: 0.3 });
    x.ST.ring(f, '#e9c27a', 1.8); f.flash = 0.3;
    f.states.delete('angry'); f.states.add('asleep'); f.tbSlept = G.turn; f.tell = null;
    await x.tween(f, { sy: 0.86, sx: 1.08 }, 0.35, 'io'); x.tween(f, { sy: 1, sx: 1 }, 0.3);
    H.pop(f, 'z z z', { color: '#c9d6ff', size: 26, rise: 0.5, life: 1.4 });
    foeSay(f, 'asleep', 1.6);
    x.refreshLabels();
    learnOnce(G.practice ? null : 'Gi');
    if (G.tbLesson) G.tbLesson.scene = (G.tbLesson.scene || 0) + 1;
    fire('scene', f);
    await x.wait(0.6);
  }
  // «El azul atacará por arriba»: right about its glimpse, and its attack will whiff (a perfect dodge, and Mimo counters ×1.5)
  async function predictRun(f, high, r) {
    const x = X(), G = x.G, M = x.A.mimo;
    if (!f || !f.alive) return;
    f.tbPredict = { high, turn: G.turn, power: r && r.grade ? r.grade.mult : 1 };
    const plan = f.tbPlan && f.tbPlan.turn === G.turn ? f.tbPlan : null, right = !!plan && plan.high === high;
    x.ST.shot('action', M, f, { yaw: -0.05, up: 0.3 });
    if (right) { x.setMood(M, 'perk', 1.4); H.pop(f, high ? '⤒' : '⤓', { color: '#7ff7ea', size: 40, rise: 0.4, life: 1.2 }); x.ST.ring(f, '#7ff7ea', 1.6); mimoSay('knew', 1.4); }
    else { x.setMood(M, 'listen', 1.4); if (plan) mimoSay('unsure', 1.6); else H.pop(f, '?', { color: '#7ff7ea', size: 30, life: 0.9 }); }
    learnOnce(G.practice ? null : 'Gf');
    if (G.tbLesson && right) { G.tbLesson.pred = (G.tbLesson.pred || 0) + 1; G.tbLesson.predTurn = G.turn; }
    fire('predict', f, right);
    await x.wait(0.7);
  }
  // «Si el rojo salta, Mimo lo golpeará»: set; it springs when that one attacks (two rounds at most)
  async function trapWhole(r) {
    const x = X(), G = x.G, t = r.tbTrap, f = t.f, letter = r.grade ? r.grade.letter : 'B';
    x.facing('foes');
    await recastWhole(r);
    if (letter === 'D' || !f.alive) { x.setMood(x.A.mimo, 'confused', 1.4); mimoSay('unsure', 1.6); x.showGrade(f, { right: true }); await x.wait(1.2); return; }
    f.tbTrap = { c: t.c, turns: 2, power: r.grade ? r.grade.mult : 1, set: G.turn };
    x.ST.shot('action', x.A.mimo, f, { yaw: -0.05, up: 0.3 });
    H.pop(f, '⚠', { color: '#ffb347', size: 38, rise: 0.3, life: 1.4 }); x.ST.ring(f, '#ffb347', 1.8);
    mimoSay('trap', 1.6);
    x.showGrade(f, { right: true });
    learnOnce(G.practice ? null : 'Gc');
    if (G.tbLesson) G.tbLesson.set = (G.tbLesson.set || 0) + 1;
    fire('trap', f);
    await x.wait(0.7);
    await x.mimoReact(letter);
    x.ST.shot('wide');
  }

  // ---------------------------------------------------------------- the glimpse (the Future): one foe shows what it will do
  const canAttack = f => f.alive && !f.gone && !f.calmed && !f.shy && !f.hiding && !f.down && !f.flipped && !f.hidden && !f.states.has('asleep') && !f.tacDazed && !(f.dazed > 0) && !(f.turned > 0);
  async function glimpseTurn() {
    const x = X(), G = x.G;
    if (realmNow() !== 'future' || bossOpt('noGlimpse') || x.allDone()) return;
    if (G.practice && (!(G.tbLesson && G.tbLesson.glimpse) || lessonGoal(G, 'start'))) return;     // (a lesson round that's done: no new glimpse)
    const want = TB.auto && TB.auto.glimpse !== undefined ? TB.auto.glimpse : null;
    if (want === false) return;
    const list = x.targetable().filter(f => canAttack(f) && !f.tbTrap && !(f.spec && f.spec.shadow && !f.lit));
    if (!list.length) return;
    const f = list[Math.floor(Math.random() * list.length)];
    const high = want === 'high' ? true : want === 'low' ? false : f.floating ? Math.random() < 0.72 : Math.random() < 0.5;
    f.tbPlan = { high, turn: G.turn };
    await showGlimpse(f, high);
    tip('pred', { ex: predModel(f, high, G.L) });
  }
  async function showGlimpse(f, high) {
    const x = X(), G = x.G;
    x.ST.shot('action', f, x.A.mimo, { yaw: 0.05, up: 0.3 });
    f.flash = 0.25; x.ST.ring(f, '#7ff7ea', 1.4);
    H.pop(f, '⟳', { color: '#7ff7ea', size: 34, rise: 0.4, life: 1.2 });
    const [t, en] = G.L.shout(1, true, high);
    x.say(f, `( ${H.unwrap(t)} … )`, { cls: 'foe small', en: `(${en})`, dur: 3.4 });
    const y0 = f.y;
    if (high) { await x.tween(f, { y: y0 + 0.55, sy: 1.12, sx: 0.92 }, 0.3, 'out'); await x.tween(f, { y: y0, sy: 1, sx: 1 }, 0.3, 'in'); }
    else { await x.tween(f, { sy: 0.7, sx: 1.18, lean: 0.25 }, 0.3, 'out'); await x.tween(f, { sy: 1, sx: 1, lean: 0 }, 0.3); }
    await x.wait(0.5);
    x.ST.shot('wide');
  }
  // it attacks the way it showed, and you saw it coming: on time by itself, then Mimo counters ×1.5 (plain: a normal dodge, no counter)
  async function foreseenAttack(f, high, plain) {
    const x = X(), G = x.G, A = x.A, M = A.mimo, tgt = Math.random() < 0.5 ? M : A.you, power = f.tbPredict && f.tbPredict.power;
    f.tbPlan = null; f.tbPredict = null; f.tbForeseen = false;
    x.setMood(f, 'go');
    x.ST.shot('action', f, tgt, { yaw: 0.04, up: 0.3 });
    const [txt, en] = G.L.shout(G.tier, tgt === M, high);
    x.say(f, txt, { cls: 'foe shout', en, dur: 1.9 });
    x.emit('shout', { text: txt, high, foe: f });
    x.dodgeHint(true);
    x.turnTo(f, x.yawTo(f, tgt.x, tgt.z), 0.15);
    await x.tween(f, { sx: 1.25, sy: 0.74, lean: -0.22 }, plain ? 0.5 : 0.25, 'out');
    x.emit('windup', { foe: f, high });
    const auto0 = G.auto;
    if (!plain) G.auto = Object.assign({}, auto0 || {}, { dodge: 'perfect' });
    let grade = 'miss';
    try {
      const T0 = G.t + 0.62, tp = x.timingWindow(T0, high ? 'ArrowDown' : 'ArrowUp', () => x.ST.worldOf(tgt, 'mid'), { onPress: code => x.dodgeMove(tgt, code) });
      const x0 = f.x, z0 = f.z, y0 = f.y, ex = tgt.x + 0.7, ez = tgt.z + 0.05, top = high ? (tgt.kind === 'you' ? 1.2 : 0.7) : 0.05;
      x.emit('jump');
      x.tween(f, { sx: 0.86, sy: 1.18, lean: 0 }, 0.1);
      await x.along(0.62, u => { f.x = lerp(x0, ex, u); f.z = lerp(z0, ez, u); f.y = lerp(y0, top, u) + Math.sin(Math.PI * u) * (high ? 0.8 : 0.35); });
      grade = await tp;
    } finally { G.auto = auto0; }
    x.dodgeResult(f, tgt, grade, 1);
    f.lean = 0; f.sx = 1; f.sy = 1;
    await x.hopHome(f, 0.9, 0.45);
    x.turnTo(f, f.baseYaw, 0.2);
    x.setMood(f, 'idle');
    if (f.hp <= 0) { await x.defeat(f); return; }
    if (plain) return;
    // it stumbles: Mimo knew, and counters
    H.pop(f, 'FORESEEN!', { color: '#7ff7ea', size: 34, dy: 0.5 });
    x.emit('counter');
    G.stats.counters = (G.stats.counters || 0) + 1;
    await counterHit(f, 1.5, 'FORESEEN ×1.5', power || 1);
    if (f.alive && !f.gone) f.tacDazed = 1;
    if (G.tbLesson) G.tbLesson.foreseen = (G.tbLesson.foreseen || 0) + 1;
  }
  async function counterHit(f, mult, sub, power, verb) {
    const x = X(), auto0 = x.G.auto;
    const v = verb || (x.knows('v.hit') ? 'hit' : 'jump');
    const c = { verb: v, baseVerb: v, target: f, power: power || 1, tacMult: mult, tacSub: sub, errors: [], fixes: [], words: [], desc: { described: true } };
    if (x.G.practice) x.G.auto = Object.assign({}, auto0 || {}, { timing: (auto0 && auto0.timing) || null });
    try { await x.MOVES[v](c); } finally { x.G.auto = auto0; }
  }
  // the trap springs: it leaps, and Mimo meets it in the air with what you said (×2), and it sits the next round out
  async function trapSpring(f) {
    const x = X(), G = x.G, M = x.A.mimo, tr = f.tbTrap;
    f.tbTrap = null;
    if (!tr) return;
    x.ST.shot('action', M, f, { yaw: -0.06, up: 0.3 });
    x.setMood(f, 'go');
    x.emit('jump');
    await x.tween(f, { sx: 1.25, sy: 0.75 }, 0.16);
    x.tween(f, { sx: 0.86, sy: 1.18 }, 0.1);
    const x0 = f.x, z0 = f.z, y0 = f.y, mx = lerp(x0, M.x, 0.42), mz = lerp(z0, M.z, 0.42);
    await x.along(0.4, u => { f.x = lerp(x0, mx, u); f.z = lerp(z0, mz, u); f.y = y0 + Math.sin(Math.PI * 0.5 * u) * 1.4; });
    G.hitstop = 0.08;
    mimoSay('sprung', 1.4);
    H.pop(f, 'TRAP!', { color: '#ffb347', size: 36, dy: 0.5 });
    x.emit('counter');
    G.stats.counters = (G.stats.counters || 0) + 1;
    const c = tr.c, to = c.target && c.target !== f && c.target.alive && !c.target.gone ? c.target : f;
    Object.assign(c, { target: to, tacMult: 2, tacSub: 'TRAP ×2', power: tr.power || 1 });
    await x.MOVES[x.MOVES[c.verb] ? c.verb : 'hit'](c);
    if (f.alive && !f.gone) { await x.tween(f, { y: f.baseY || 0 }, 0.22, 'in'); f.tacDazed = 1; await x.hopHome(f, 0.6, 0.45); }
    if (G.tbLesson) G.tbLesson.sprung = (G.tbLesson.sprung || 0) + 1;
    fire('spring', f);
  }

  // ---------------------------------------------------------------- the hooks into a fight
  function learnOnce(k) { if (k && T.learn(k)) T.learnedBanner(k); }
  T.beginHooks.push(() => {
    const x = X(), G = x.G;
    G.tbQueue = []; G.tbMem = 0; G.tbTips = {}; G.tbLesson = null; G.tbIntroDone = false;
    for (const f of G.foes) { f.tbPlan = null; f.tbPredict = null; f.tbTrap = null; f.tbSlept = 0; f.tbHigh = null; }
  });
  // the first turn of a realm fight: the frame, the tip, and (until it's been done once) Mimo shows the form
  async function realmIntro() {
    const x = X(), G = x.G, realm = realmNow();
    if (!realm || G.practice || G.turn !== 1) return;
    const stage = realm === 'past' ? 'pret' : 'fut';
    try { G.frames.push({ text: TB.frame(stage), pat: realm }); x.renderFrames(); } catch (e) { /* (no frames here) */ }
    const f = x.targetable().find(k => !k.shy) || null, m = f ? modelFor(f, x.knows('v.jump') ? 'jump' : 'hit', stage) : TB.example(stage)[0];
    // the rung says the realm's own sentence (not the present's «¡Salta sobre el rojo!»)
    x.UI.rung(`${realm === 'past' ? 'The Past · tell it as a memory' : 'The Future · say what will happen'}: <b>«${x.UI.esc(H.plain(m))}»</b>`);
    if (!T.learned(TB.LESSONS[stage]) && !G.tbIntroDone) {
      G.tbIntroDone = true;
      x.ST.shot('party');
      x.say(x.A.mimo, m, { cls: 'mimo', en: TB.example(stage)[1], dur: 3.4, demo: true });     // (a demonstration: whole in the language, js/mixlines.js)
      await x.wait(1.6);
    }
    tip(stage);
  }
  T.turnHooks.push(fireQueue, realmIntro, glimpseTurn);
  T.afterHooks.push(async () => {
    const x = X(), G = x.G;
    for (const f of G.foes) {
      f.tbHigh = null;
      if (f.tbPlan && f.tbPlan.turn <= G.turn) f.tbPlan = null;
      if (f.tbPredict && f.tbPredict.turn <= G.turn) f.tbPredict = null;
      if (f.tbTrap && f.tbTrap.set < G.turn && --f.tbTrap.turns <= 0) { f.tbTrap = null; if (f.alive && !f.gone) H.pop(f, '…', { color: '#ffb347', size: 26, life: 0.9 }); }
      // asleep in a memory: two rounds at most
      if (f.tbSlept && G.turn - f.tbSlept >= 2 && f.states.has('asleep') && f.alive) { f.states.delete('asleep'); f.tbSlept = 0; H.pop(f, '!', { color: '#fff3a0', size: 30, life: 0.9 }); x.refreshLabels(); }
    }
  });
  // the foes' turn: a trapped one and the one that showed its move go first; a trap springs, a foreseen attack whiffs
  const at0 = T.attackers;
  T.attackers = async list => {
    const x = X(), G = x.G, dazed = new Set(G.foes.filter(f => f.tacDazed));
    let out = at0 ? await at0(list) : list;
    if (realmNow() !== 'future') return out;
    const want = G.foes.filter(f => (f.tbTrap || (f.tbPlan && f.tbPlan.turn === G.turn) || (f.tbPredict && f.tbPredict.turn === G.turn)) && !dazed.has(f) && canAttack(f));
    for (const f of want.slice().reverse()) if (!out.includes(f)) out = [f].concat(out);
    return out.slice(0, Math.max(2, want.length));
  };
  const fa0 = T.foeAttack;
  T.foeAttack = async f => {
    if (realmNow() === 'future') {
      const G = X().G;
      if (f.tbTrap) { await trapSpring(f); return true; }
      const plan = f.tbPlan && f.tbPlan.turn === G.turn ? f.tbPlan : null, pred = f.tbPredict && f.tbPredict.turn === G.turn ? f.tbPredict : null;
      let high = plan ? plan.high : null;
      if (pred && high === null) high = f.floating ? Math.random() < 0.72 : Math.random() < 0.5;
      if (pred && pred.high === high) { await foreseenAttack(f, high, false); return true; }
      if (high !== null) f.tbHigh = high;          // (flow.js's attack goes the way it showed)
    }
    return fa0 ? fa0(f) : false;
  };
  // what Mimo says when a sentence in time doesn't work out (no turn is used)
  const HINT = { 'tb:scenePres': ['impf', 'The scene is how things were, in the past:'], 'tb:sceneWho': ['impf', 'Say who was asleep:'], 'tb:predTense': ['pred', 'Say what it will do, in the future:'],
    'tb:trapVerb': ['cond', 'After «if», say what it does: it jumps or it attacks:'], 'tb:trapWho': ['cond', 'Say which one, after «if»:'], 'tb:trapMain': ['cond', 'Then say what Mimo will do:'] };
  T.explainHooks.push(r => {
    const h = HINT[r.reason]; if (!h || !realmNow()) return false;
    const x = X();
    x.setMood(x.A.mimo, 'confused', 1.4);
    mimoSay(realmNow() === 'past' ? 'confPast' : 'confFut', 1.8);
    x.UI.hint(`${h[1]} «${H.plain(TB.example(h[0])[0])}»`, true);
    return true;
  });

  // ---------------------------------------------------------------- a model for one foe, in the realm's tense
  function modelFor(f, verb, stage) {
    const x = X(), G = x.G, L = G.L, realm = stage === 'pret' || stage === 'impf' ? 'past' : 'future';
    try {
      const d = x.descOpts(x.uniqueDesc(f) || [f.color]);
      const s = P.sayClause(L, verb, f, d), v = L.verbs[verb];
      const c = { canon: s, verb, verbShow: v.show, L };
      if (L.code === 'zh') c.tb = { o: { tense: realm === 'past' ? 'pret' : 'fut' } };
      else if (L.code === 'ja') { const g = jaGroups(L).find(k => k.te === v.show) || jaGroups(L).find(k => k.key === verb); c.tb = { o: { g, style: 'te' } }; }
      else { const M = L.code === 'de' ? deMap(L) : romMap(L); const o = [...M.values()].flat().find(k => k.key === verb && (k.slot === 'pres3' || k.slot === 'imp') && nrm(k.imp) === nrm(v.show)); if (!o) return TB.example(stage)[0]; c.tb = { o, tense: realm === 'past' ? 'pret' : 'fut' }; }
      if (L.cjk) return `${cjName(L.code)} ${L.code === 'ja' ? 'は ' : ''}${L.code === 'zh' ? zhClause(c, realm) : jaClause(c, realm)} ！`;
      return P.wrapS(L, `${G.name || 'Mimo'} ${clauseCanon(c, realm, L, true)}`);
    } catch (e) { console.error('[time] model', e); return TB.example(stage)[0]; }
  }
  TB.modelFor = modelFor;

  // ---------------------------------------------------------------- the lessons at the yard (focus 'tac:Gp' / 'Gi' / 'Gf' / 'Gc')
  const LS = {
    es: { pHello: ['En el Ayer, {name} solo entiende recuerdos. Cuéntale lo que pasó, en pasado.', 'In the Past, {name} only understands memories. Tell it what happened, in the past.'],
      pWhy: ['«saltó» es «salta» en pasado: lo que ya pasó. «golpea» → «golpeó», «empuja» → «empujó».', '«saltó» is «salta» in the past: what already happened. «golpea» → «golpeó», «empuja» → «empujó».'],
      iHello: ['Ahora, la escena. Con «estaba» cuentas cómo eran las cosas: «El rojo estaba dormido». En el recuerdo, se duerme.', 'Now, the scene. With «estaba» you tell how things were: “The red one was asleep.” In the memory, it falls asleep.'],
      iWhy: ['«estaba», no «está»: cómo era todo en ese momento. Y si está dormido, el golpe es una sorpresa: ¡×2!', '«estaba», not «está»: how everything was at that moment. And if it’s asleep, the hit is a surprise: ×2!'],
      fHello: ['En el Mañana, todo es un plan. Dile a {name} lo que hará: pasa en el siguiente turno, y más fuerte.', 'In the Future, everything is a plan. Tell {name} what it will do: it happens next turn, and harder.'],
      fWhy: ['«saltará» es el futuro: «saltar» + «-á». También: «va a saltar». Varios planes juntos se suman.', '«saltará» is the future: «saltar» + «-á». Also: «va a saltar». Several plans together stack.'],
      fPred: ['¿Ves? Muestra lo que hará. Dilo: «{ex}». {name} lo esquiva y contraataca.', 'See? It shows what it will do. Say it, and {name} dodges and counters.'],
      cHello: ['Una trampa: «si…» y lo que pasará: «Si el rojo salta, Mimo lo golpeará».', 'A trap: «si…» and what will happen: “If the red one jumps, Mimo will hit it.”'],
      cWhy: ['Después de «si», el presente: «si salta», nunca «si saltará». Luego el futuro: «lo golpeará».', 'After «si», the present: «si salta», never «si saltará». Then the future: «lo golpeará».'],
      look: ['Mira: «{ex}»', 'Look!'], you: ['¡Ahora tú!', 'Now you!'], got: ['¡Eso es!', 'That’s it!'] },
    pt: { pHello: ['No Ontem, o {name} só entende lembranças. Conta pra ele o que aconteceu, no passado.', 'In the Past, {name} only understands memories. Tell it what happened, in the past.'],
      pWhy: ['«pulou» é «pula» no passado: o que já aconteceu. «bate» → «bateu», «empurra» → «empurrou».', '«pulou» is «pula» in the past: what already happened. «bate» → «bateu», «empurra» → «empurrou».'],
      iHello: ['Agora, a cena. Com «estava» você conta como as coisas eram: «O vermelho estava dormindo». Na lembrança, ele dorme.', 'Now, the scene. With «estava» you tell how things were: “The red one was sleeping.” In the memory, it falls asleep.'],
      iWhy: ['«estava», não «está»: como tudo era naquela hora. E se ele tá dormindo, o golpe é surpresa: ×2!', '«estava», not «está»: how everything was then. And if it’s asleep, the hit is a surprise: ×2!'],
      fHello: ['No Amanhã, tudo é plano. Diz pro {name} o que ele vai fazer: acontece no próximo turno, e mais forte.', 'In the Future, everything is a plan. Tell {name} what it will do: it happens next turn, and harder.'],
      fWhy: ['«vai pular» é o futuro: «vai» + o verbo. Também: «pulará». Vários planos juntos se somam.', '«vai pular» is the future: «vai» + the verb. Also: «pulará». Several plans together stack.'],
      fPred: ['Viu? Ele mostra o que vai fazer. Fala: «{ex}». O {name} desvia e contra-ataca.', 'See? It shows what it will do. Say it, and {name} dodges and counters.'],
      cHello: ['Uma armadilha: «se…» e o que vai acontecer: «Se o vermelho pular, Mimo vai bater nele».', 'A trap: «se…» and what will happen: “If the red one jumps, Mimo will hit it.”'],
      cWhy: ['Depois de «se», o verbo fica igual ao infinitivo: «se ele pular». Depois, o futuro: «vai bater nele».', 'After «se», the verb looks like the infinitive: «se ele pular». Then the future: «vai bater nele».'],
      look: ['Olha: «{ex}»', 'Look!'], you: ['Agora você!', 'Now you!'], got: ['Isso!', 'That’s it!'] },
    de: { pHello: ['Im Gestern versteht {name} nur Erinnerungen. Erzähl, was passiert ist, in der Vergangenheit.', 'In the Past, {name} only understands memories. Tell what happened, in the past.'],
      pWhy: ['„sprang“ ist „spring“ in der Vergangenheit. Oder mit „ist“: „ist … gesprungen“. Und „schlug“ oder „hat … geschlagen“.', '«sprang» is «spring» in the past. Or with «ist»: «ist … gesprungen». And «schlug» or «hat … geschlagen».'],
      iHello: ['Jetzt die Szene. Erzähl, wie es war: „Der Rote schlief.“ In der Erinnerung schläft er ein.', 'Now the scene. Tell how it was: “The red one was sleeping.” In the memory, it falls asleep.'],
      iWhy: ['„schlief“, nicht „schläft“: wie es in dem Moment war. Und wer schläft, wird überrascht: ×2!', '«schlief», not «schläft»: how it was at that moment. And a sleeper gets a surprise: ×2!'],
      fHello: ['Im Morgen ist alles ein Plan. Sag {name}, was es tun wird: Es passiert in der nächsten Runde, und stärker.', 'In the Future, everything is a plan. Tell {name} what it will do: it happens next round, and harder.'],
      fWhy: ['„wird … springen“: „wird“ an zweiter Stelle, das Verb ganz am Ende. Mehrere Pläne zusammen werden stärker.', '«wird … springen»: «wird» second, the verb at the very end. Several plans together stack.'],
      fPred: ['Siehst du? Er zeigt, was er tun wird. Sag es: „{ex}“. {name} weicht aus und kontert.', 'See? It shows what it will do. Say it, and {name} dodges and counters.'],
      cHello: ['Eine Falle: „wenn …“ und was passieren wird: „Wenn der Rote springt, wird Mimo ihn schlagen.“', 'A trap: «wenn …» and what will happen: “If the red one jumps, Mimo will hit it.”'],
      cWhy: ['Nach „wenn“ steht das Verb am Ende: „wenn der Rote springt“. Dann kommt „wird“ zuerst: „wird Mimo ihn schlagen“.', 'After «wenn» the verb goes to the end: «wenn der Rote springt». Then «wird» comes first: «wird Mimo ihn schlagen».'],
      look: ['Schau: „{ex}“', 'Look!'], you: ['Jetzt du!', 'Now you!'], got: ['Genau!', 'Exactly!'] },
    zh: { pHello: ['[在|zài] [过去|guò qù] ， {name} [只|zhǐ] [听得懂|tīng de dǒng] [回忆|huí yì] 。 [告诉|gào su] [它|tā] [发生|fā shēng] [了|le] [什么|shén me] 。', 'In the Past, {name} only understands memories. Tell it what happened.'],
      pWhy: ['[打|dǎ] [了|le] ： [了|le] [说|shuō] [事情|shì qing] [已经|yǐ jīng] [发生|fā shēng] [了|le] 。 [也|yě] [可以|kě yǐ] [说|shuō] [打|dǎ] [过|guò] 。', '打了: 了 says it already happened. You can also say 打过.'],
      iHello: ['[现在|xiàn zài] [说|shuō] [场景|chǎng jǐng] ： [红色|hóng sè] [的|de] [在|zài] [睡觉|shuì jiào] 。 [在|zài] [回忆|huí yì] [里|lǐ] ， [它|tā] [就|jiù] [睡着|shuì zháo] [了|le] 。', 'Now the scene: “The red one was sleeping.” In the memory, it falls asleep.'],
      iWhy: ['[在|zài] ＋ [动词|dòng cí] ： [那个|nà ge] [时候|shí hou] [正在|zhèng zài] [做|zuò] [的|de] [事|shì] 。 [睡着|shuì zháo] [的|de] [挨|ái] [打|dǎ] ， [两|liǎng] [倍|bèi] ！', '在 + verb: what was going on at that time. A sleeping one gets hit for double!'],
      fHello: ['[在|zài] [未来|wèi lái] ， [一切|yī qiè] [都|dōu] [是|shì] [计划|jì huà] 。 [说|shuō] {name} [会|huì] [做|zuò] [什么|shén me] ： [下|xià] [一|yī] [回合|huí hé] [打|dǎ] [中|zhòng] ， [更|gèng] [厉害|lì hai] 。', 'In the Future, everything is a plan. Say what {name} will do: it lands next round, harder.'],
      fWhy: ['[会|huì] ＋ [动词|dòng cí] ： [米莫|Mǐ mò] [会|huì] [打|dǎ] … [也|yě] [可以|kě yǐ] [用|yòng] [要|yào] [或|huò] [将|jiāng] 。', '会 + verb: 米莫会打…; 要 or 将 work too.'],
      fPred: ['[看到|kàn dào] [了|le] [吗|ma] ？ [它|tā] [要|yào] [做|zuò] [的|de] [事|shì] 。 [说|shuō] [出来|chū lái] ： {ex}', 'See? That’s what it will do. Say it, and {name} dodges and counters.'],
      cHello: ['[设|shè] [个|gè] [陷阱|xiàn jǐng] ： [如果|rú guǒ] [红色|hóng sè] [的|de] [跳|tiào] ， [米莫|Mǐ mò] [就|jiù] [打|dǎ] [它|tā] 。', 'Set a trap: if the red one jumps, Mimo will hit it.'],
      cWhy: ['[如果|rú guǒ] … ， … [就|jiù] … ： [就|jiù] [放|fàng] [在|zài] [第二|dì èr] [个|gè] [动词|dòng cí] [前面|qián miàn] 。', '如果…，…就…: 就 goes before the second verb.'],
      look: ['[看|kàn] ： {ex}', 'Look!'], you: ['[该|gāi] [你|nǐ] [了|le] ！', 'Your turn!'], got: ['[对|duì] [了|le] ！', 'That’s it!'] },
    ja: { pHello: ['[過去|かこ] で は 、 {name} は [思|おも]い[出|で] しか わかりません 。 [何|なに] が あった か 、 た[形|けい] で [言|い]って ください 。', 'In the Past, {name} only understands memories. Say what happened, with the た-form.'],
      pWhy: ['[叩|たた]いて → [叩|たた]いた 、 [跳|と]んで → [跳|と]んだ 。 て を た に [変|か]える だけ です 。', '叩いて → 叩いた, 跳んで → 跳んだ: just change て to た.'],
      iHello: ['[次|つぎ] は [場面|ばめん] です 。 「 [赤|あか]い の は [寝|ね]て いた 」 。 [思|おも]い[出|で] の [中|なか] で 、 [眠|ねむ]ります 。', 'Next, the scene: “The red one was sleeping.” In the memory, it falls asleep.'],
      iWhy: ['[寝|ね]て いた ： その とき 、 [何|なに] を して いた か 。 [寝|ね]て いる [子|こ] に は 、 [不意打|ふいう]ち で ２ [倍|ばい] ！', '～ていた: what was going on then. A sleeping one gets a surprise ×2!'],
      fHello: ['[未来|みらい] で は 、 ぜんぶ [予定|よてい] です 。 {name} が する こと を [言|い]って ください 。 [次|つぎ] の ターン に 、 もっと [強|つよ]く [当|あ]たります 。', 'In the Future, everything is a plan. Say what {name} will do: it hits next turn, harder.'],
      fWhy: ['[叩|たた]く つもり ： これから する こと 。 [辞書形|じしょけい] ＋ つもり 。', '叩くつもり: what it plans to do. The dictionary form + つもり.'],
      fPred: ['[見|み]えました か ？ これから する こと です 。 [言|い]って ください ： {ex}', 'See? That’s what it will do. Say it, and {name} dodges and counters.'],
      cHello: ['わな を しかけましょう 。 「 [赤|あか]い の が [跳|と]んだら 、 ミモ が [叩|たた]く 」 。', 'Let’s set a trap: “If the red one jumps, Mimo hits it.”'],
      cWhy: ['[跳|と]んだら ： た[形|けい] ＋ ら 。 [跳|と]ぶ → [跳|と]んだ → [跳|と]んだら 。', '跳んだら: the た-form + ら. 跳ぶ → 跳んだ → 跳んだら.'],
      look: ['[見|み]て ： {ex}', 'Look!'], you: ['あなた の [番|ばん] です ！', 'Your turn!'], got: ['その [調子|ちょうし] ！', 'That’s it!'] },
  };
  TB.LS = LS;
  const coach = (key, vars = {}) => {
    const x = X(), t = LS[x.G.lang] || LS.es, l = t[key] || LS.es[key], name = x.G.name || 'Mimo';
    const sub = (s, own) => String(s).replace(/\{name\}/g, own && x.G.L.cjk ? cjName(x.G.lang) : name).replace(/\{ex\}/g, vars.ex != null ? (own ? vars.ex : H.plain(vars.ex)) : '').replace(/([.!?…。！？]\s*)([»“」”])\./g, '$1$2');
    return x.coachSay([sub(l[0], true), sub(l[1], false)]);
  };
  // Mimo shows it on a dummy (nothing to press; the dummy's hearts come back after)
  async function demoMove(f, stage) {
    const x = X(), G = x.G, verb = x.knows('v.jump') ? 'jump' : 'hit';
    const c = { verb, baseVerb: verb, target: f, power: 1, errors: [], fixes: [], words: [], desc: { described: true }, demo: true };
    const auto0 = G.auto;
    G.auto = Object.assign({}, auto0 || {}, { timing: 'perfect', dodge: 'perfect' });
    try {
      if (stage === 'pret') { await memoryRun(c); await x.MOVES[verb](c); }
      else if (stage === 'impf') { await sceneRun(f, null); c.sneak = true; await memoryRun(c); await x.MOVES[verb](c); f.states.delete('angry'); f.states.delete('asleep'); }
      else if (stage === 'fut') {
        H.pop(f, '⏳', { color: '#7ff7ea', size: 34, rise: 0.4, life: 1.2 }); x.ST.ring(f, '#7ff7ea', 1.4); mimoSay('plan', 1.3);
        await x.wait(1.1); mimoSay('came', 1.2); await x.wait(0.4);
        c.tacMult = 1.5; c.tacSub = 'FUTURE ×1.5'; await x.MOVES[verb](c);
      } else if (stage === 'pred') { f.tbPlan = { high: true, turn: G.turn }; await showGlimpse(f, true); }
      else if (stage === 'cond') { f.tbTrap = { c: { verb: 'hit', baseVerb: 'hit', target: f, errors: [], fixes: [], words: [], desc: { described: true } }, turns: 1, power: 1, set: G.turn }; H.pop(f, '⚠', { color: '#ffb347', size: 38, life: 1.2 }); mimoSay('trap', 1.4); await x.wait(0.9); await trapSpring(f); }
    } finally { G.auto = auto0; }
    f.hp = f.maxHp; f.tacDazed = 0; f.tbPlan = null; f.tbTrap = null; f.tbSlept = 0; f.states.delete('asleep'); f.states.delete('angry');
    x.refreshLabels();
  }
  // a lesson's turns: the start of the turn (queued moves land, a glimpse), your sentence, the coach's word; then a dummy that
  // showed its move does it (no harm in practice) and a trap springs. o.done(): the round's goal is met, so it ends ('goal')
  async function lessonLoop(x, G, o = {}) {
    for (;;) {
      G.turn++;
      x.refreshLabels();
      const sat = G.foes.filter(k => k.tacDazed);         // (dazed last round: they sit this one out, then they're back, as in a fight)
      await T.turn();
      if (x.allDone()) return 'win';
      if (o.done && o.done('start')) return 'goal';
      const r = await x.askOrFlee('command');
      await x.perform(r);
      x.practiceFeedback(r);
      if (o.after) await o.after(r);
      if (x.allDone()) return 'win';
      for (const f of x.targetable().filter(k => k.tbTrap || (k.tbPlan && k.tbPlan.turn === G.turn))) {
        if (!f.alive || f.gone) continue;
        if (f.tbTrap) await trapSpring(f);
        else if (f.tbPlan) { const p = f.tbPredict && f.tbPredict.turn === G.turn ? f.tbPredict : null; await foreseenAttack(f, f.tbPlan.high, !(p && p.high === f.tbPlan.high)); }
        if (x.allDone()) return 'win';
      }
      await T.afterFoes();
      for (const f of sat) f.tacDazed = 0;
      if (o.done && o.done('end')) return 'goal';
    }
  }
  // a lesson round's goal (phase: 'start' of a turn, after planned moves land; 'end', after the foes): the skill done right
  // this round, and what it set off has played out: the plan landed, the trap sprang, the one asleep in the memory took its
  // surprise hit (or you had one more turn for it)
  function lessonGoal(G, phase) {
    const L = G.tbLesson;
    if (!L || !((L.got || 0) > (L.got0 || 0))) return false;
    if ((G.tbQueue || []).length) return false;
    const up = G.foes.filter(f => f.alive && !f.gone);
    if (up.some(f => f.tbTrap)) return false;
    if (up.some(f => f.states && f.states.has('asleep'))) return phase === 'end' && G.turn > (L.goalTurn || 0);
    return true;
  }
  const STAGE_KEY = { pret: 'Gp', impf: 'Gi', fut: 'Gf', cond: 'Gc' };
  function lessonOK(k, r) {
    if (!r || !r.grade || r.grade.letter === 'D' || r.grade.letter === 'C') return false;
    const L = X().G.tbLesson || {};
    if (k === 'Gp') return r.kind === 'command' && r.clauses.some(c => c.tb && !c.tbWrong);
    if (k === 'Gi') return !!(r.tbPre && r.tbPre.kind === 'scene');
    if (k === 'Gf') return (r.kind === 'command' && r.clauses.some(c => c.tb && !c.tbWrong)) || L.predTurn === X().G.turn;     // (a plan, or a prediction that was right this turn)
    if (k === 'Gc') return !!r.tbTrap;
    return false;
  }
  function lessonFor(k) {
    const stage = KEY_STAGE[k];
    return async (x, G) => {
      await x.intro();
      x.ST.shot('coach');
      G.tbLesson = { k };
      const d = G.foes.find(f => f.alive);
      const H0 = { Gp: 'pHello', Gi: 'iHello', Gf: 'fHello', Gc: 'cHello' }[k], W0 = { Gp: 'pWhy', Gi: 'iWhy', Gf: 'fWhy', Gc: 'cWhy' }[k];
      await coach(H0);
      if (stage !== 'cond') await coach('look', { ex: modelFor(d, x.knows('v.jump') ? 'jump' : 'hit', stage === 'impf' ? 'pret' : stage) });
      await demoMove(d, stage);
      await coach(W0);
      if (k === 'Gf') { G.tbLesson.glimpse = true; await demoMove(d, 'pred'); await coach('fPred', { ex: predModel(d, true, G.L) }); d.tbPlan = null; }
      await coach('you');
      for (;;) {
        x.setupScaffolds();
        try { G.frames.push({ text: TB.frame(stage), pat: KEY_REALM[k] }); if (k === 'Gf') G.frames.push({ text: TB.frame('pred'), pat: 'predict' }); x.renderFrames(); } catch (e) { /* (no frames) */ }
        x.UI.rung(`Skill · ${T.INFO[k].name}: <b>«${x.UI.esc(H.plain(TB.example(stage)[0]))}»</b>`);
        G.roundLog0 = G.stats.gradeLog.length;
        G.tbLesson.got0 = G.tbLesson.got || 0;
        const out = await lessonLoop(x, G, { after: async r => {
          if (!lessonOK(k, r)) return;
          G.tbLesson.got = (G.tbLesson.got || 0) + 1;
          if (G.tbLesson.got === G.tbLesson.got0 + 1) G.tbLesson.goalTurn = G.turn;
          if (T.learn(k)) T.learnedBanner(k);
          if (G.tbLesson.got === 1) await coach('got');
        }, done: ph => lessonGoal(G, ph) });
        // done right, and it's played out: the round's over (the dummies still standing topple), then Again or Done
        if (out === 'goal') await Promise.all(G.foes.filter(f => f.alive && !f.gone).map(f => x.topple(f)));
        await x.practiceCheer();
        if (!(await x.practiceCard())) break;
        G.round++;
        await T.newDummies(x, G, 2);
      }
      x.ST.shot('coach');
      await x.coachSay('pDone');
      return 'done';
    };
  }
  T.specsHooks.push((specs, opts) => {
    if (!opts.practice || !KEY_STAGE[String(opts.focus || '').slice(4)]) return;
    const x = X();
    specs.length = 0;
    for (const s of [{ kind: 'dummy', color: 'red', size: 'small', hp: 9 }, { kind: 'dummy', color: 'blue', size: 'small', hp: 9 }]) specs.push(x.normFoe(s, specs.length));
  });
  for (const k of Object.keys(KEY_STAGE)) T.lessons[k] = lessonFor(k);

  // ---------------------------------------------------------------- the yard board: four more skills, unlocked by the story
  Object.assign(T.INFO, {
    Gp: { name: 'Tell it as a memory (the Past)', sub: 'say what happened: the memory replays', wait: 'once the tower’s door has torn open' },
    Gi: { name: 'Set the scene (the Past)', sub: 'how things were: asleep in the memory, a surprise ×2', wait: 'after «Tell it as a memory»' },
    Gf: { name: 'Plans and predictions (the Future)', sub: 'say what will happen: it lands next turn, stronger; call their moves', wait: 'once the Future opens' },
    Gc: { name: 'Traps (the Future)', sub: 'if it jumps, Mimo will hit it', wait: 'after «Plans and predictions»' },
  });
  for (const k of Object.keys(KEY_STAGE)) if (!T.KEYS.includes(k)) T.KEYS.push(k);
  const gs = () => { const g = _.RW && _.RW.game; return (g && g.state) || (window.__g && window.__g.state) || null; };
  const un0 = T.unlocked;
  T.unlocked = k => {
    if (!KEY_STAGE[k]) return un0(k);
    if (T.force != null) return T.force.includes(k);
    const s = gs(); if (!s) return false;
    const f = s.flags || {}, open = s.tbOpen || {};
    if (open[k]) return true;
    return k === 'Gp' ? !!f.towerLost : k === 'Gi' ? T.learned('Gp') : k === 'Gf' ? !!(f.futureOpen || f.pastDone) : T.learned('Gf');
  };
  TB.learned = k => T.learned(k);
  TB.learn = k => { if (T.learn(k)) { const x = X(); if (x && x.G.running) T.learnedBanner(k); return true; } return false; };
  TB.unlock = k => { const s = gs(); if (s && KEY_STAGE[k]) (s.tbOpen || (s.tbOpen = {}))[k] = Date.now(); return !!s; };
  // what Bruno (or Noa's echo) shows first: the sentence whole in the language, the new words marked and glossed
  const DEMO = {
    Gp: { es: 'En el Ayer, todo es un recuerdo. Así que no digo «¡Salta!»: cuento lo que pasó. «¡{mimo} saltó sobre el rojo!»',
      pt: 'No Ontem, tudo é lembrança. Então eu não digo «Pula!»: eu conto o que aconteceu. «{mimo} pulou no vermelho!»',
      de: 'Im Gestern ist alles eine Erinnerung. Also sage ich nicht „Spring!“, ich erzähle, was passiert ist: „{mimo} sprang auf den Roten!“',
      zh: '[在|zài] [过去|guò qù] ， [一切|yī qiè] [都|dōu] [是|shì] [回忆|huí yì] 。 [所以|suǒ yǐ] [不|bù] [说|shuō] [打|dǎ] ！ [要|yào] [说|shuō] [发生|fā shēng] [了|le] [什么|shén me] ： {mimo} [打|dǎ] [了|le] [红色|hóng sè] [的|de] ！',
      ja: '[過去|かこ] で は 、 ぜんぶ [思|おも]い[出|で] です 。 だから 「 [叩|たた]いて 」 じゃ なくて 、 [何|なに] が あった か [言|い]います 。 「 {mimo} は [赤|あか]い の を [叩|たた]いた ！ 」',
      en: 'In the Past, everything is a memory. So I don’t say “Jump!”: I tell what happened. “{mimo} jumped on the red one!”',
      marks: { es: [['saltó', 'jumped'], ['recuerdo', 'memory'], ['pasó', 'happened']], pt: [['pulou', 'jumped'], ['lembrança', 'memory'], ['aconteceu', 'happened']], de: [['sprang', 'jumped'], ['Erinnerung', 'memory'], ['passiert ist', 'happened']],
        zh: [['[打|dǎ] [了|le]', 'hit (it happened)'], ['[回忆|huí yì]', 'memory']], ja: [['[叩|たた]いた', 'hit (it happened)'], ['[思|おも]い[出|で]', 'memory']] } },
    Gi: { es: 'En un recuerdo también cuentas cómo era todo: «El rojo estaba dormido». ¡Y en el recuerdo, se duerme! Luego: «¡{mimo} saltó sobre él!»',
      pt: 'Numa lembrança você também conta como tudo era: «O vermelho estava dormindo». E na lembrança, ele dorme! Depois: «{mimo} pulou nele!»',
      de: 'In einer Erinnerung erzählst du auch, wie alles war: „Der Rote schlief.“ Und in der Erinnerung schläft er ein! Dann: „{mimo} sprang auf ihn!“',
      zh: '[回忆|huí yì] [里|lǐ] [也|yě] [可以|kě yǐ] [说|shuō] [当时|dāng shí] [的|de] [样子|yàng zi] ： [红色|hóng sè] [的|de] [在|zài] [睡觉|shuì jiào] 。 [它|tā] [就|jiù] [睡着|shuì zháo] [了|le] ！ [然后|rán hòu] ： {mimo} [打|dǎ] [了|le] [它|tā] ！',
      ja: '[思|おも]い[出|で] の [中|なか] で は 、 その とき の [様子|ようす] も [言|い]えます 。 「 [赤|あか]い の は [寝|ね]て いた 」 。 すると 、 [本当|ほんとう]に [眠|ねむ]ります ！ それから 「 {mimo} は [赤|あか]い の を [叩|たた]いた ！ 」',
      en: 'In a memory you also tell how everything was: “The red one was asleep.” And in the memory, it falls asleep! Then: “{mimo} jumped on it!”',
      marks: { es: [['estaba dormido', 'was asleep']], pt: [['estava dormindo', 'was sleeping']], de: [['schlief', 'was sleeping']], zh: [['[在|zài] [睡觉|shuì jiào]', 'was sleeping']], ja: [['[寝|ね]て いた', 'was sleeping']] } },
    Gf: { es: 'En el Mañana, todo es un plan. «¡{mimo} saltará sobre el rojo!»: pasa en el siguiente turno, y más fuerte. Y si ves lo que hará uno: «El azul atacará por arriba».',
      pt: 'No Amanhã, tudo é plano. «{mimo} vai pular no vermelho!»: acontece no próximo turno, e mais forte. E se você vê o que um vai fazer: «O azul vai atacar por cima».',
      de: 'Im Morgen ist alles ein Plan. „{mimo} wird auf den Roten springen!“: Das passiert in der nächsten Runde, und stärker. Und wenn du siehst, was einer tun wird: „Der Blaue wird von oben angreifen.“',
      zh: '[在|zài] [未来|wèi lái] ， [一切|yī qiè] [都|dōu] [是|shì] [计划|jì huà] 。 {mimo} [会|huì] [打|dǎ] [红色|hóng sè] [的|de] ！ [下|xià] [一|yī] [回合|huí hé] [打|dǎ] [中|zhòng] ， [更|gèng] [厉害|lì hai] 。 [看到|kàn dào] [它|tā] [要|yào] [做|zuò] [什么|shén me] ， [就|jiù] [说|shuō] ： [蓝色|lán sè] [的|de] [会|huì] [从|cóng] [上面|shàng miàn] [攻击|gōng jī] 。',
      ja: '[未来|みらい] で は 、 ぜんぶ [予定|よてい] です 。 「 {mimo} は [赤|あか]い の を [叩|たた]く つもり ！ 」 [次|つぎ] の ターン に 、 もっと [強|つよ]く [当|あ]たります 。 [相手|あいて] が する こと が [見|み]えたら 、 「 [青|あお]い の は [上|うえ] から [来|く]る でしょう 」 。',
      en: 'In the Future, everything is a plan. “{mimo} will jump on the red one!”: it happens next turn, and harder. And if you see what one will do: “The blue one will attack from above.”',
      marks: { es: [['saltará', 'will jump'], ['atacará', 'will attack'], ['por arriba', 'from above']], pt: [['vai pular', 'will jump'], ['vai atacar', 'will attack'], ['por cima', 'from above']], de: [['wird', 'will'], ['von oben', 'from above']],
        zh: [['[会|huì]', 'will'], ['[从|cóng] [上面|shàng miàn]', 'from above']], ja: [['つもり', 'plan to'], ['でしょう', 'will (probably)'], ['[上|うえ] から', 'from above']] } },
    Gc: { es: 'Y una trampa: «Si el rojo salta, {mimo} lo golpeará». ¡Cuando salte, zas! Después de «si», el presente: «salta».',
      pt: 'E uma armadilha: «Se o vermelho pular, {mimo} vai bater nele». Quando ele pular, pá! Depois de «se»: «pular».',
      de: 'Und eine Falle: „Wenn der Rote springt, wird {mimo} ihn schlagen.“ Springt er, zack! Nach „wenn“ kommt das Verb ans Ende.',
      zh: '[再|zài] [设|shè] [个|gè] [陷阱|xiàn jǐng] ： [如果|rú guǒ] [红色|hóng sè] [的|de] [跳|tiào] ， {mimo} [就|jiù] [打|dǎ] [它|tā] 。',
      ja: 'わな も しかけられます 。 「 [赤|あか]い の が [跳|と]んだら 、 {mimo} が [叩|たた]く 」 。',
      en: 'And a trap: “If the red one jumps, {mimo} will hit it.” When it jumps, wham!',
      marks: { es: [['Si', 'if'], ['lo golpeará', 'will hit it']], pt: [['Se', 'if'], ['vai bater nele', 'will hit it']], de: [['Wenn', 'if'], ['ihn', 'it']], zh: [['[如果|rú guǒ]', 'if'], ['[就|jiù]', 'then']], ja: [['[跳|と]んだら', 'if it jumps'], ['わな', 'trap']] } },
  };
  if (BATTLE._.tacDemo) Object.assign(BATTLE._.tacDemo, DEMO); else BATTLE._.tacDemo = DEMO;
  TB.demo = k => DEMO[k] || null;
  // a lesson anywhere (a realm's own place, its own demonstrator): the demonstration, then the practice fight
  TB.lesson = async (k, o = {}) => {
    const game = o.game || (window.__g && window.__g.game);
    if (!game || !KEY_STAGE[k]) return null;
    const l = (game.state && game.state.lang) || 'es', D = DEMO[k];
    if (o.by && D && typeof STORY !== 'undefined' && STORY.demoLine) { try { await STORY.demoLine(o.by, D, (D.marks || {})[l]); } catch (e) { console.error('[time] demo', e); } }
    const place = o.place || (game.sim && game.sim.you ? { x: game.sim.you.x, z: game.sim.you.z } : undefined);
    const r = await game.fight({ practice: true, focus: 'tac:' + k, realm: KEY_REALM[k], place, coach: { name: o.coach || 'Bruno' } });
    if (game.save) game.save();
    return r;
  };
  // how a sentence reads in time, with no fight running (for your own checks)
  TB.read = (text, l) => {
    l = l || curLang();
    const L = _.LANGS && _.LANGS[l]; if (!L) return null;
    let o = null;
    try {
      if (L.cjk) { const C = CJ(); if (C) { const { U } = C.typed(text, l); o = (l === 'zh' ? zhScan(U, L) : jaScan(U, L))[0] || null; } }
      else { const t = H.toks(text); o = (l === 'de' ? deVerbs(t, L, deMap(L)) : romVerbs(t, L, romMap(L), null))[0] || null; }
    } catch (e) { console.error('[time] read', e); }
    const tense = o ? (o.tense === 'perf' ? 'pret' : o.tense) : null;
    return { kind: o ? 'command' : null, tense, verb: o ? o.key : null, ok: !!o };
  };
  TB.state = () => {
    const x = X(); if (!x || !x.G.running) return null;
    const G = x.G;
    return { realm: realmNow(), queued: (G.tbQueue || []).map(e => ({ verb: e.c.verb, foe: e.c.target && e.c.target.id, turn: e.turn })),
      plans: G.foes.filter(f => f.tbPlan).map(f => ({ foe: f.id, high: f.tbPlan.high })), traps: G.foes.filter(f => f.tbTrap).map(f => f.id),
      asleep: G.foes.filter(f => f.states && f.states.has('asleep')).map(f => f.id), turn: G.turn };
  };
  TB.lessonLoop = lessonLoop;
  TB.foreseenAttack = foreseenAttack; TB.trapSpring = trapSpring; TB.showGlimpse = showGlimpse;
  TB._ = { latCommand, deVerbs, deMap, romVerbs, romMap, zhScan, jaScan, jaGroups, latScene, latPredict, latTrap, cjScene, cjPredict, cjTrap };     // (for tests)
})();
