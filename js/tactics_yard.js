'use strict';
// Bruno's battle skills at the training yard (DESIGN.md 17.3; the skills themselves are js/battle/tactics.js).
// A notice board stands by the dummies (once Bruno's first lesson is done, like the yard's Train). Press E there: Bruno lists
// the skills (✓ learned, ★ ready to learn, 🔒 not yet, with when). Pick one: he shows it first with the story's demonstration
// kit (STORY.demoLine: the sentence whole in the language, the new words highlighted and glossed, the English on request),
// then a practice fight with focus 'tac:<key>' where Mimo acts it out and you try it; doing it once there turns it on in
// real fights (game.state.tac). New skills unlock with the story (A from the start, D after the hill, B after bell 1, E after
// bell 2, C after bell 8): a toast says so once (state.tacSeen), and the board's star glows while one waits to be learned.
(() => {
  if (typeof STORY === 'undefined' || typeof BATTLE === 'undefined') return;
  const TAC = () => (BATTLE._ && BATTLE._.tac) || null;
  let G = null, board = null, star = null, clock = 0;
  const SPOT = { x: -23.2, z: -160.6 };
  const init0 = STORY.init;
  STORY.init = function (game) { G = game; try { build(); } catch (e) { console.error('[tactics yard]', e); } return init0.apply(this, arguments); };

  // the board: two posts, a plank with a painted star and two crossed sticks
  function build() {
    if (!G || !G.w3d || !G.w3d.scene || typeof THREE === 'undefined' || typeof TK === 'undefined') return;
    const y = typeof WORLD !== 'undefined' && WORLD.terrainAt ? WORLD.terrainAt(SPOT.x, SPOT.z) : 0;
    const g = new THREE.Group(), wood = TK.toon('#8a6a42', { rim: 0.15 }), plank = TK.toon('#c9a46c', { rim: 0.2 });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(TK.G.box, wood); p.scale.set(0.12, 1.5, 0.12); p.position.set(s * 0.55, 0.75, 0); g.add(p); }
    const b = new THREE.Mesh(TK.G.box, plank); b.scale.set(1.4, 0.8, 0.08); b.position.set(0, 1.25, 0.04); g.add(b);
    const tex = TK.canvasTex(128, 72, c => {
      c.fillStyle = '#c9a46c'; c.fillRect(0, 0, 128, 72);
      c.strokeStyle = '#5a3f22'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(24, 14); c.lineTo(58, 58); c.moveTo(58, 14); c.lineTo(24, 58); c.stroke();
      c.fillStyle = '#e8b830'; c.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 9 : 22; c.lineTo(92 + Math.cos(a) * r, 36 + Math.sin(a) * r); }
      c.closePath(); c.fill(); c.strokeStyle = '#5a3f22'; c.lineWidth = 3; c.stroke();
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.74), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    face.position.set(0, 1.25, 0.09); g.add(face);
    star = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0 }));
    star.position.set(0.48, 1.25, 0.16); g.add(star);
    g.position.set(SPOT.x, y, SPOT.z); g.rotation.y = 0.35;
    G.w3d.scene.add(g); board = g;
  }

  // Bruno shows each skill: [es, pt, de, zh, ja, en] and the words to pick out (marks: [phrase, gloss] per language)
  const DEMO = {
    A: {
      es: '¿Ves? Si un calladito grita «¡Voy a saltar!», tú le dices a {mimo}: «¡Cuando salte, golpéalo!»',
      pt: 'Viu? Se um caladinho gritar «Vou pular!», você diz pro {mimo}: «Quando ele pular, bate nele!»',
      de: 'Siehst du? Wenn ein Schweigling ruft: „Ich springe gleich!“, sagst du {mimo}: „Wenn er springt, schlag ihn!“',
      zh: '[看到|kàn dào] [了|le] [吗|ma] ？ [小默默|xiǎo mò mò] [喊|hǎn] [我|wǒ] [要|yào] [跳|tiào] [了|le] ， [你|nǐ] [就|jiù] [对|duì] {mimo} [说|shuō] ： [它|tā] [跳|tiào] [的|de] [时候|shí hou] ， [打|dǎ] [它|tā] ！',
      ja: '[分|わ]かります か ？ だまりっこ が 「 [跳|と]ぶ ぞ 」 と [叫|さけ]んだら 、 {mimo} に 「 [跳|と]んだら 、 [叩|たた]いて ！ 」 と [言|い]って ください 。',
      en: 'See? If a hushling shouts “I’m going to jump!”, you tell {mimo}: “When it jumps, hit it!”',
      marks: { es: [['Cuando salte', 'when it jumps'], ['golpéalo', 'hit it']], pt: [['Quando ele pular', 'when it jumps'], ['bate nele', 'hit it']], de: [['Wenn er springt', 'when it jumps'], ['schlag ihn', 'hit it']],
        zh: [['[的|de] [时候|shí hou]', 'when …'], ['[打|dǎ] [它|tā]', 'hit it']], ja: [['[跳|と]んだら', 'when it jumps'], ['[叩|たた]いて', 'hit']] },
    },
  };
  DEMO.D = {
    es: 'Si hay tres iguales, dile cuál por cómo es: «¡Golpea al que tiene el escudo roto!» o «¡Golpea al más grande!»',
    pt: 'Se tiver três iguais, diz qual pelo jeito dele: «Bate no que tem o escudo quebrado!» ou «Bate no maior!»',
    de: 'Wenn drei gleich aussehen, sag, welchen du meinst, so wie er aussieht: „Schlag den mit dem kaputten Schild!“ oder „Schlag den größten!“',
    zh: '[三|sān] [个|gè] [一样|yí yàng] [的|de] [时候|shí hou] ， [说|shuō] [它|tā] [什么|shén me] [样|yàng] ： [打|dǎ] [盾牌|dùn pái] [破|pò] [了|le] [的|de] ！ [或者|huò zhě] [打|dǎ] [最|zuì] [大|dà] [的|de] ！',
    ja: '[三|さん] [体|たい] [同|おな]じ なら 、 どんな の か [言|い]います 。 「 [盾|たて] が [壊|こわ]れて いる の を [叩|たた]いて ！ 」 「 [一番|いちばん] [大|おお]きい の を [叩|たた]いて ！ 」',
    en: 'If three look the same, say which one by what it’s like: “Hit the one that has the broken shield!” or “Hit the biggest one!”',
    marks: { es: [['que tiene', 'that has'], ['escudo roto', 'broken shield'], ['más grande', 'biggest']], pt: [['que tem', 'that has'], ['escudo quebrado', 'broken shield'], ['maior', 'biggest']],
      de: [['mit dem kaputten Schild', 'with the broken shield'], ['größten', 'biggest']], zh: [['[盾牌|dùn pái]', 'shield'], ['[破|pò] [了|le]', 'broken'], ['[最|zuì] [大|dà]', 'biggest']],
      ja: [['[盾|たて]', 'shield'], ['[壊|こわ]れて いる', 'is broken'], ['[一番|いちばん] [大|おお]きい', 'biggest']] },
  };
  DEMO.B = {
    es: '¿Por qué una acción, si puedes decir tres? «¡Primero golpea al rojo, luego salta sobre el azul y al final golpea al verde!» Cada acción de más pega más fuerte.',
    pt: 'Por que uma ação só, se dá pra falar três? «Primeiro bate no vermelho, depois pula em cima do azul e por fim bate no verde!» Cada ação a mais bate mais forte.',
    de: 'Warum eine Aktion, wenn du drei sagen kannst? „Zuerst schlag den roten, dann spring auf den blauen und zum Schluss schlag den grünen!“ Jede Aktion mehr trifft härter.',
    zh: '[为什么|wèi shén me] [只|zhǐ] [说|shuō] [一个|yí gè] [动作|dòng zuò] ？ [先|xiān] [打|dǎ] [红色|hóng sè] [的|de] ， [然后|rán hòu] [跳|tiào] [到|dào] [蓝色|lán sè] [的|de] [身上|shēn shang] ， [最后|zuì hòu] [打|dǎ] [绿色|lǜ sè] [的|de] ！ [动作|dòng zuò] [越|yuè] [多|duō] ， [打|dǎ] [得|de] [越|yuè] [狠|hěn] 。',
    ja: 'どうして [一|ひと]つ だけ ？ 「 まず [赤|あか]い の を [叩|たた]いて 、 それから [青|あお]い やつ に [跳|と]んで 、 [最後|さいご]に [緑|みどり] の を [叩|たた]いて ！ 」 [動|うご]き が [多|おお]い ほど [強|つよ]く なります 。',
    en: 'Why one move when you can say three? “First hit the red one, then jump on the blue one, and finally hit the green one!” Every extra move hits harder.',
    marks: { es: [['Primero', 'first'], ['luego', 'then'], ['al final', 'finally']], pt: [['Primeiro', 'first'], ['depois', 'then'], ['por fim', 'finally']], de: [['Zuerst', 'first'], ['dann', 'then'], ['zum Schluss', 'finally']],
      zh: [['[先|xiān]', 'first'], ['[然后|rán hòu]', 'then'], ['[最后|zuì hòu]', 'finally']], ja: [['まず', 'first'], ['それから', 'then'], ['[最後|さいご]に', 'finally']] },
  };
  DEMO.E = {
    es: '¿Ves? No todo se gana a golpes. Si uno tiene hambre: «Si te vas, te doy una manzana». Al orgulloso: «¡Qué fuerte eres!». Y si no quieres pelear: «¡Nos vamos! No queremos pelear».',
    pt: 'Viu? Nem tudo se ganha na briga. Se um tá com fome: «Se você for embora, eu te dou uma maçã». Pro orgulhoso: «Você é muito forte!». E se você não quer brigar: «Vamos embora! A gente não quer brigar».',
    de: 'Siehst du? Nicht alles gewinnt man mit Schlägen. Hat einer Hunger: „Wenn du gehst, gebe ich dir einen Apfel.“ Dem Stolzen: „Du bist so stark!“ Und wenn du nicht kämpfen willst: „Wir gehen! Wir wollen nicht kämpfen.“',
    zh: '[看到|kàn dào] [了|le] [吗|ma] ？ [不|bù] [是|shì] [什么|shén me] [都|dōu] [要|yào] [打|dǎ] 。 [饿|è] [了|le] [的|de] ： [如果|rú guǒ] [你|nǐ] [走|zǒu] ， [我|wǒ] [就|jiù] [给|gěi] [你|nǐ] [一|yī] [个|gè] [苹果|píng guǒ] 。 [骄傲|jiāo ào] [的|de] ： [你|nǐ] [真|zhēn] [厉害|lì hai] ！ [不|bù] [想|xiǎng] [打|dǎ] [的|de] [话|huà] ： [我们|wǒ men] [走|zǒu] [吧|ba] ！',
    ja: '[分|わ]かります か ？ いつも たたかう わけ じゃ ありません 。 おなか が すいて いる [子|こ] に は 「 [帰|かえ]ったら 、 りんご を あげる よ 」 。 いばって いる [子|こ] に は 「 [強|つよ]い ね ！ 」 。 たたかいたくない とき は 「 [帰|かえ]ろう ！ 」 。',
    en: 'See? Not everything is won with hits. If one is hungry: “If you leave, I’ll give you an apple.” To a proud one: “How strong you are!” And if you don’t want to fight: “We’re leaving! We don’t want to fight.”',
    marks: { es: [['Si te vas', 'if you leave'], ['te doy', 'I give you'], ['fuerte', 'strong'], ['Nos vamos', 'we’re leaving']], pt: [['Se você for embora', 'if you leave'], ['eu te dou', 'I give you'], ['forte', 'strong'], ['Vamos embora', 'let’s go']],
      de: [['Wenn du gehst', 'if you go'], ['gebe ich dir', 'I give you'], ['stark', 'strong'], ['Wir gehen', 'we’re leaving']], zh: [['[给|gěi] [你|nǐ]', 'give you'], ['[就|jiù]', 'then'], ['[真|zhēn]', 'really'], ['[走|zǒu] [吧|ba]', 'let’s go']],
      ja: [['[帰|かえ]ったら', 'if you go home'], ['あげる', 'give'], ['[強|つよ]い', 'strong'], ['[帰|かえ]ろう', 'let’s go home']] },
  };
  BATTLE._.tacDemo = DEMO;          // (more skills add theirs: battle/tactics.js reads nothing from here)

  const lang = () => (typeof UI !== 'undefined' && UI.lang) || (G && G.state && G.state.lang) || 'es';
  async function lesson(k) {
    const T = TAC(), D = DEMO[k];
    if (D) {
      const B = G.sim.npc && G.sim.npc('bruno'), near = B && Math.hypot(B.x - SPOT.x, B.z - SPOT.z) < 9;
      const y = typeof WORLD !== 'undefined' && WORLD.terrainAt ? WORLD.terrainAt(SPOT.x, SPOT.z) : 0;
      const at = near ? B : { x: SPOT.x, y: y + 1.6, z: SPOT.z, top: 1.8, name: 'Bruno' };
      try { await STORY.demoLine(at, D, (D.marks || {})[lang()]); } catch (e) { console.error('[tactics yard] demo', e); }
    }
    G.state.flags.trained = (G.state.flags.trained || 0) + 1;
    await G.fight({ practice: true, focus: 'tac:' + k, place: { x: WORLD.L.yard.x, z: WORLD.L.yard.z }, coach: { name: 'Bruno' } });
    if (T && T.learned(k)) UI.toast(`✓ ${T.INFO[k].name}: on in your fights now.`);
    G.save();
  }
  async function menu() {
    const T = TAC(); if (!T) return;
    const opts = T.KEYS.map(k => {
      const un = T.unlocked(k), done = T.learned(k), ready = un && (T.lessons[k] || DEMO[k]);
      return { label: `${done ? '✓' : ready ? '★' : '🔒'} ${T.INFO[k].name}`, sub: ready ? T.INFO[k].sub + (done ? ' · practice again' : '') : un ? 'Bruno is still working this one out' : 'unlocks ' + T.INFO[k].wait, value: ready ? k : 'locked:' + k };
    });
    G.sim.lock = 1;
    let pick;
    try { pick = await UI.choose('Bruno: “Battle skills! Which one shall I show you?”', opts); } finally { G.sim.lock = 0; }
    if (!pick) return;
    if (String(pick).startsWith('locked:')) { const k = pick.slice(7); UI.toast(T.unlocked(k) ? 'Coming soon.' : `That one comes ${T.INFO[k].wait}.`); return; }
    await lesson(pick);
  }
  // a new skill unlocked by the story: once, a toast (when the yard is open)
  function notice() {
    const T = TAC(), S = G && G.state; if (!T || !S || !S.flags || (S.flags.lessons || 0) < 1) return false;
    let waiting = false;
    const away = !!(G.indoorMod && G.indoorMod());       // (in a room or a time realm: the toast waits till you're back out in town)
    S.tacSeen = S.tacSeen || {};
    for (const k of T.KEYS) {
      if (!T.unlocked(k) || !(T.lessons[k] || DEMO[k])) continue;
      if (!T.learned(k)) waiting = true;
      if (!S.tacSeen[k] && !away) { S.tacSeen[k] = Date.now(); if (typeof UI !== 'undefined' && UI.toast) UI.toast(`★ New battle skill at Bruno’s training yard: ${T.INFO[k].name}`); break; }
    }
    return waiting;
  }
  STORY.extra = STORY.extra || [];
  STORY.extra.push({
    interactables() {
      const S = G && G.state; if (!S || !board || (S.flags.lessons || 0) < 1 || !TAC()) return [];
      return [{ x: SPOT.x, z: SPOT.z, r: 2.4, label: 'Battle skills', run: menu }];
    },
    tick(dt) {
      clock += dt;
      if (clock < 1) { if (star) star.material.opacity = star.userData.on ? 0.6 + 0.4 * Math.sin(performance.now() / 300) : 0; return; }
      clock = 0;
      const waiting = notice();
      if (star) star.userData.on = waiting;
    },
  });
  BATTLE._.tacYard = { menu, lesson, SPOT, get board() { return board; } };
})();
