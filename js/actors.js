'use strict';
// The cast in toon 3D: you, Mimo, Mimo's egg, and villagers (Rosa and others are presets).
// Each build function returns a root Group placed at the feet; each animate function takes the
// simulation state of that character.

const ACTORS = (() => {
  const { part, G, toon, outlineMat, glowTex } = TK;
  const lathe = (pts, n = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  const eye = (parent, x, y, z, sx, sy) => {
    const e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
    e.add(part(G.sphere, '#2b2235', null, [sx, sy, sx * 0.62], { ink: 0, rim: 0 }));
    const hl = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.scale.setScalar(sx * 0.42); hl.position.set(sx * 0.32, sy * 0.38, sx * 0.55); e.add(hl);
    return e;
  };
  const blush = (parent, x, y, z, s, ry) => { const b = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#ff8c9a', transparent: true, opacity: 0.5 })); b.scale.set(s, s * 0.55, s * 0.3); b.position.set(x, y, z); b.rotation.y = ry; parent.add(b); };

  // ------------------------------------------------------------ you
  const HERO = { coat: '#e8ad35', scarf: '#20a492', pants: '#3a4466', boot: '#7a4b2c', skin: '#f5cda2', hair: '#4a2f27', pack: '#a8673a', roll: '#ead9b2' };
  function hero() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const C = HERO;
    const legs = [-1, 1].map(s => {
      const hip = new THREE.Group(); hip.position.set(s * 0.12, 0.42, 0); body.add(hip);
      hip.add(part(G.cyl, C.pants, [0, -0.17, 0], [0.085, 0.34, 0.085]));
      hip.add(part(G.sphere, C.boot, [0, -0.36, 0.04], [0.11, 0.085, 0.15]));
      return hip;
    });
    const torso = new THREE.Group(); body.add(torso);
    torso.add(part(lathe([[0, 0.3], [0.3, 0.31], [0.32, 0.4], [0.28, 0.66], [0.23, 0.9], [0.12, 0.97], [0, 0.98]]), C.coat));
    torso.add(part(G.box, C.pack, [0, 0.66, -0.29], [0.4, 0.44, 0.2]));
    torso.add(part(G.cyl, C.roll, [0, 0.95, -0.3], [0.09, 0.5, 0.09], { rot: [0, 0, Math.PI / 2] }));
    const arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * 0.27, 0.86, 0); torso.add(sh);
      sh.add(part(G.cyl, C.coat, [0, -0.15, 0], [0.07, 0.3, 0.07]));
      sh.add(part(G.sphere, C.skin, [0, -0.33, 0], [0.075, 0.075, 0.075]));
      return sh;
    });
    const neck = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.07, 10, 20), toon(C.scarf)); neck.rotation.x = Math.PI / 2; neck.position.y = 0.95; neck.castShadow = true;
    neck.add(new THREE.Mesh(neck.geometry, outlineMat(0.018))); torso.add(neck);
    const tail = []; let prev = torso;
    for (let i = 0; i < 4; i++) {
      const seg = new THREE.Group(); seg.position.set(i ? 0 : 0.05, i ? -0.15 : 0.93, i ? 0 : -0.2); prev.add(seg);
      seg.add(part(G.box, C.scarf, [0, -0.08, 0], [0.13 - i * 0.015, 0.17, 0.03], { ink: 0.012 }));
      tail.push(seg); prev = seg;
    }
    const head = new THREE.Group(); head.position.y = 1.0; torso.add(head);
    head.add(part(G.sphere, C.skin, [0, 0.26, 0], [0.37, 0.36, 0.35]));
    head.add(part(new THREE.SphereGeometry(1, 24, 16, 0, TAU, 0, Math.PI * 0.56), C.hair, [0, 0.27, -0.02], [0.39, 0.39, 0.38], { rot: [-0.42, 0, 0] }));
    head.add(part(new THREE.ConeGeometry(0.07, 0.24, 8), C.hair, [0.03, 0.66, 0.02], null, { rot: [0.3, 0, -0.5] }));
    [-1, 1].forEach(s => head.add(part(G.sphere, C.skin, [s * 0.36, 0.24, -0.02], [0.06, 0.08, 0.05])));
    const eyes = [-1, 1].map(s => eye(head, s * 0.13, 0.26, 0.31, 0.055, 0.085));
    [-1, 1].forEach(s => blush(head, s * 0.22, 0.13, 0.29, 0.065, s * 0.5));
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: '#2b2235' }));
    mouth.position.set(0, 0.13, 0.335); mouth.rotation.z = Math.PI; head.add(mouth);
    // something held in both hands (the egg at the start)
    const hands = new THREE.Group(); hands.position.set(0, 0.62, 0.34); torso.add(hands);
    return { root, body, torso, legs, arms, tail, head, eyes, hands, holding: null };
  }
  function animateHero(h, Y, dt, t) {
    const walk = clamp(Y.speed / 5.4, 0, 1.6), ph = Y.phase, air = !Y.onGround;
    h.root.position.set(Y.x, Y.ry, Y.z); h.root.rotation.y = Y.yaw;
    const swing = Math.sin(ph) * 0.75 * Math.min(walk, 1.25);
    h.legs[0].rotation.x = air ? -0.75 : swing; h.legs[1].rotation.x = air ? 0.35 : -swing;
    const hold = !!h.holding;
    h.arms.forEach((a, i) => {
      if (hold) { a.rotation.x = damp(a.rotation.x, -1.1, 10, dt); a.rotation.z = damp(a.rotation.z, (i ? -1 : 1) * 0.35, 10, dt); return; }
      a.rotation.x = air ? -0.4 : (i ? swing : -swing) * 0.85;
      a.rotation.z = (i ? 1 : -1) * (air ? 1.3 : 0.12 + walk * 0.05);
    });
    h.body.position.y = air ? 0 : Math.abs(Math.cos(ph)) * 0.055 * Math.min(walk, 1.3);
    h.torso.rotation.x = damp(h.torso.rotation.x, walk * 0.13, 8, dt);
    const sq = Y.land < 1 ? 1 - 0.2 * Math.sin(Y.land * Math.PI) : air ? 1 + clamp(Y.vy * 0.012, -0.05, 0.1) : 1 + Math.sin(t * 2.2) * 0.012;
    h.body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    const lookY = Y.look !== undefined ? Y.look : (Y.still > 2 ? Math.sin(t * 0.6) * 0.45 : 0);
    h.head.rotation.y = damp(h.head.rotation.y, lookY, 6, dt);
    h.head.rotation.x = Math.sin(ph * 2) * 0.03 * walk;
    const blink = (t % 3.9) < 0.12;
    h.eyes.forEach(e => { e.scale.y = blink ? 0.12 : 1; });
    h.tail.forEach((s, i) => { s.rotation.x = 0.25 + walk * (0.35 + i * 0.12) + (air ? 0.4 : 0) + Math.sin(t * 8 + i * 0.9) * (0.06 + walk * 0.1); s.rotation.z = Math.sin(t * 5 + i) * 0.08; });
  }

  // ------------------------------------------------------------ Mimo
  const MIMO = { body: '#fbf1df', belly: '#fffaf2', inner: '#ff9b88', gem: '#2fd0c2' };
  function mimo() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.scale.setScalar(0.85);
    const C = MIMO;
    body.add(part(lathe([[0, 0], [0.2, 0.02], [0.3, 0.13], [0.33, 0.29], [0.3, 0.44], [0.2, 0.56], [0, 0.6]], 22), C.body, null, null, { ink: 0.018 }));
    body.add(part(G.sphere, C.belly, [0, 0.22, 0.25], [0.2, 0.15, 0.09], { ink: 0 }));
    const eyes = [-1, 1].map(s => eye(body, s * 0.12, 0.37, 0.28, 0.06, 0.09));
    [-1, 1].forEach(s => blush(body, s * 0.22, 0.27, 0.24, 0.06, s * 0.6));
    const mouth = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#2b2235' })); mouth.scale.set(0.03, 0.012, 0.01); mouth.position.set(0, 0.27, 0.32); body.add(mouth);
    const ears = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.15, 0.5, -0.02); body.add(pv);
      pv.add(part(G.sphere, C.body, [0, 0.27, 0], [0.095, 0.3, 0.05], { ink: 0.016 }));
      pv.add(part(G.sphere, C.inner, [0, 0.27, 0.03], [0.05, 0.21, 0.025], { ink: 0, rim: 0.1 }));
      return pv;
    });
    [-1, 1].forEach(s => body.add(part(G.sphere, C.body, [s * 0.13, 0.04, 0.13], [0.09, 0.06, 0.11], { ink: 0.014 })));
    body.add(part(G.sphere, C.body, [0, 0.2, -0.33], [0.11, 0.11, 0.11], { ink: 0.014 }));
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.065), new THREE.MeshToonMaterial({ color: C.gem, emissive: new THREE.Color('#0e6f68'), gradientMap: TK.grad }));
    gem.position.set(0, 0.56, 0.2); gem.rotation.x = 0.4; body.add(gem); gem.add(new THREE.Mesh(gem.geometry, outlineMat(0.012)));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#6ff5e6', transparent: true, opacity: 0, depthWrite: false }));
    glow.scale.setScalar(0.6); glow.position.copy(gem.position); body.add(glow);
    return { root, body, ears, eyes, mouth, gem, glow };
  }
  function animateMimo(m, M, dt, t) {
    m.root.position.set(M.x, M.ry, M.z); m.root.rotation.y = M.yaw;
    const s = M.land < 1 ? 1 - 0.25 * Math.sin(M.land * Math.PI) : M.hop ? 1 + Math.sin(M.hop.t * Math.PI) * 0.12 : 1 + Math.sin(t * 3) * 0.02;
    m.body.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
    m.body.rotation.z = M.tilt;
    m.ears.forEach((e, i) => { e.rotation.z = (i ? -1 : 1) * M.ears[i].a; e.rotation.x = -M.earBack; });
    m.eyes.forEach(e => { e.scale.y = M.blink > 0 ? 0.12 : M.happy > 0 ? 0.45 : 1; });
    m.mouth.scale.y = M.say && M.say.t > M.say.t0 - 0.7 ? 0.012 + Math.abs(Math.sin(t * 18)) * 0.03 : 0.012;
    m.gem.rotation.y = t * 1.5;
    m.glow.material.opacity = 0.25 + M.glow * 0.75 + Math.sin(t * 3) * 0.08;
  }

  // ------------------------------------------------------------ Mimo's egg
  function egg() {
    const root = new THREE.Group(), wob = new THREE.Group(); root.add(wob);
    const prof = [[0, 0], [0.16, 0.02], [0.24, 0.12], [0.26, 0.26], [0.22, 0.4], [0.13, 0.5], [0, 0.53]];
    const lower = new THREE.Group(), upper = new THREE.Group(); wob.add(lower, upper);
    lower.add(part(lathe(prof.slice(0, 4).concat([[0.26, 0.27]]), 20), '#fbf1df', null, null, { ink: 0.014 }));
    upper.position.y = 0.27;
    upper.add(part(lathe(prof.slice(3).map(([x, y]) => [x, y - 0.27]), 20), '#fbf1df', null, null, { ink: 0.014 }));
    [[0.12, 0.18, 0.2], [-0.16, 0.3, 0.12], [0.05, 0.42, -0.2], [-0.08, 0.12, -0.22]].forEach(([x, y, z], i) => {
      const spot = part(G.sphere, i % 2 ? '#2fd0c2' : '#ff9b88', [x, y - (y > 0.27 ? 0.27 : 0), z], [0.05, 0.05, 0.02], { ink: 0, rim: 0 });
      spot.lookAt(new THREE.Vector3(x * 4, (y - (y > 0.27 ? 0.27 : 0)), z * 4));
      (y > 0.27 ? upper : lower).add(spot);
    });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#8ff8ec', transparent: true, opacity: 0, depthWrite: false }));
    glow.scale.setScalar(1.4); glow.position.y = 0.3; root.add(glow);
    return { root, wob, lower, upper, glow };
  }

  // ------------------------------------------------------------ villagers (presets)
  const PRESETS = {
    rosa: { dress: '#8a4f7d', apron: '#fbf6ee', skin: '#efc29a', hair: '#f4f1ea', hat: 'straw', glasses: true, bun: true, eyes: 'happy', h: 1 },
    coach: { dress: '#3f6f9a', apron: null, skin: '#c98e62', hair: '#2e2420', hat: 'band', glasses: false, bun: false, eyes: 'open', h: 1.15, wide: 1.2 },
    kid: { dress: '#e0743c', apron: null, skin: '#f0c7a0', hair: '#6b3b25', hat: 'cap', glasses: false, bun: false, eyes: 'open', h: 0.78 },
    baker: { dress: '#f2e6d0', apron: '#ffffff', skin: '#e6b48c', hair: '#3a2b26', hat: 'chef', glasses: false, bun: false, eyes: 'open', h: 1.05, wide: 1.15 },
  };
  function villager(kind) {
    const P = PRESETS[kind] || PRESETS.rosa;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.scale.setScalar(P.h);
    const w = P.wide || 1;
    body.add(part(lathe([[0, 0], [0.38 * w, 0.02], [0.37 * w, 0.3], [0.28 * w, 0.68], [0.2 * w, 0.9], [0.1, 0.97], [0, 0.98]]), P.dress));
    if (P.apron) body.add(part(G.sphere, P.apron, [0, 0.42, 0.27 * w], [0.24, 0.32, 0.08], { ink: 0.012 }));
    const arms = [-1, 1].map(s => { const sh = new THREE.Group(); sh.position.set(s * 0.25 * w, 0.84, 0.05); sh.rotation.set(-0.5, 0, -s * 0.2); body.add(sh); sh.add(part(G.cyl, P.dress, [0, -0.14, 0], [0.07, 0.28, 0.07])); sh.add(part(G.sphere, P.skin, [0, -0.3, 0], [0.07, 0.07, 0.07])); return sh; });
    const head = new THREE.Group(); head.position.y = 0.98; body.add(head);
    head.add(part(G.sphere, P.skin, [0, 0.2, 0], [0.28, 0.27, 0.27]));
    head.add(part(new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, Math.PI * 0.5), P.hair, [0, 0.22, -0.02], [0.29, 0.29, 0.29], { rot: [-0.5, 0, 0] }));
    if (P.bun) head.add(part(G.sphere, P.hair, [0, 0.42, -0.2], [0.12, 0.12, 0.12]));
    const eyes = [-1, 1].map(s => {
      if (P.eyes === 'happy') { const e = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.011, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: '#2b2235' })); e.position.set(s * 0.1, 0.2, 0.255); head.add(e); return e; }
      return eye(head, s * 0.1, 0.21, 0.24, 0.04, 0.06);
    });
    if (P.glasses) [-1, 1].forEach(s => { const g = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.008, 6, 20), new THREE.MeshBasicMaterial({ color: '#2b2235' })); g.position.set(s * 0.1, 0.19, 0.265); head.add(g); });
    [-1, 1].forEach(s => blush(head, s * 0.17, 0.09, 0.23, 0.05, s * 0.4));
    const mouth = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#2b2235' })); mouth.scale.set(0.035, 0.012, 0.01); mouth.position.set(0, 0.07, 0.27); head.add(mouth);
    const hat = new THREE.Group(); hat.position.y = 0.4; head.add(hat);
    if (P.hat === 'straw') {
      hat.add(part(G.cyl, '#e8c57a', [0, 0, 0], [0.5, 0.035, 0.5], { ink: 0.012 }));
      hat.add(part(new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI / 2), '#e8c57a', [0, 0.01, 0], [0.22, 0.2, 0.22], { ink: 0.012 }));
      hat.add(part(G.cyl, '#e05a4b', [0, 0.05, 0], [0.225, 0.05, 0.225], { ink: 0 }));
    } else if (P.hat === 'band') {
      hat.add(part(new THREE.TorusGeometry(0.27, 0.035, 8, 24), '#d64b3c', [0, -0.12, 0], null, { rot: [Math.PI / 2 - 0.15, 0, 0], ink: 0 }));
    } else if (P.hat === 'cap') {
      hat.add(part(new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI / 2), '#3d7fd1', [0, -0.08, 0], [0.3, 0.22, 0.3], { ink: 0.012 }));
      hat.add(part(G.cyl, '#3d7fd1', [0, -0.08, 0.26], [0.16, 0.02, 0.12], { ink: 0.01 }));
    } else if (P.hat === 'chef') {
      hat.add(part(G.cyl, '#ffffff', [0, 0.02, 0], [0.22, 0.14, 0.22], { ink: 0.012 }));
      hat.add(part(G.sphere, '#ffffff', [0, 0.16, 0], [0.27, 0.16, 0.27], { ink: 0.012 }));
    }
    return { root, body, head, mouth, arms, eyes, kind };
  }
  function animateVillager(v, N, dt, t) {
    v.root.position.set(N.x, N.y, N.z); v.root.rotation.y = N.yaw;
    v.body.rotation.z = Math.sin(t * 1.2 + N.x) * 0.025;
    v.body.position.y = (N.talk || 0) * Math.abs(Math.sin(t * 13)) * 0.04;
    v.mouth.scale.y = (N.talk || 0) > 0.3 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : 0.012;
    if (N.wave) v.arms[1].rotation.set(-0.3, 0, -2.4 + Math.sin(t * 9) * 0.35); else v.arms[1].rotation.set(-0.5, 0, -0.2);
    // walking (no legs under the dress: a bounce, a sway and swinging arms)
    if (N.walking) {
      v.body.position.y += Math.abs(Math.sin(t * 9)) * 0.07; v.body.rotation.z += Math.sin(t * 9) * 0.05;
      v.arms[0].rotation.set(-0.5 + Math.sin(t * 9) * 0.5, 0, 0.2); if (!N.wave) v.arms[1].rotation.set(-0.5 - Math.sin(t * 9) * 0.5, 0, -0.2);
    } else v.arms[0].rotation.set(-0.5, 0, 0.2);
  }
  function blobShadow(scene, r = 0.42) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: '#203018', transparent: true, opacity: 0.22, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; scene.add(m); return m;
  }
  return { hero, animateHero, mimo, animateMimo, egg, villager, animateVillager, blobShadow, HERO, MIMO, PRESETS };
})();
