'use strict';
// The toon look, shared by the world and the battles: cel-shaded materials with a soft rim
// light, ink outlines (inverted hulls) for characters, merged meshes with vertex colors, and
// small particle effects. Needs THREE (r128) loaded first.

const TK = (() => {
  const fl = n => (Number.isInteger(n) ? n.toFixed(1) : String(n));
  const grad = (() => {
    const steps = [95, 160, 215, 255];
    const tex = new THREE.DataTexture(new Uint8Array(steps), steps.length, 1, THREE.LuminanceFormat);
    tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
    return tex;
  })();
  const mats = {};
  // A cel-shaded material. o: { rim (0..1), vc (vertex colors), emissive, side, opacity }
  function toon(color, o = {}) {
    const key = [color, o.rim, o.vc, o.emissive, o.side, o.opacity].join('|');
    if (mats[key]) return mats[key];
    const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: grad, vertexColors: !!o.vc,
      emissive: new THREE.Color(o.emissive || '#000000'), transparent: !!o.opacity, opacity: o.opacity || 1, side: o.side || THREE.FrontSide });
    const rim = o.rim === undefined ? 0.32 : o.rim;
    if (rim > 0) {
      m.onBeforeCompile = sh => {
        sh.uniforms.rimAmt = { value: rim };
        sh.fragmentShader = 'uniform float rimAmt;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>',
          'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\n' +
          'gl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
      };
      m.customProgramCacheKey = () => 'rim';
    }
    return (mats[key] = m);
  }
  const outlines = {};
  function outlineMat(w) {
    if (outlines[w]) return outlines[w];
    const m = new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide });
    m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${fl(w)};`); };
    m.customProgramCacheKey = () => 'outline' + w;
    return (outlines[w] = m);
  }
  // A mesh with an optional ink hull. o: { ink (hull width, 0 = none), rot, shadow, mat, ...toon options }
  function part(geo, color, pos, scale, o = {}) {
    const mesh = new THREE.Mesh(geo, o.mat || toon(color, o));
    if (pos) mesh.position.set(...pos);
    if (scale) mesh.scale.set(...scale);
    if (o.rot) mesh.rotation.set(...o.rot);
    mesh.castShadow = o.shadow !== false;
    if (o.ink !== 0) { const hull = new THREE.Mesh(geo, outlineMat(o.ink || 0.02)); hull.castShadow = false; mesh.add(hull); }
    return mesh;
  }
  const G = {
    sphere: new THREE.SphereGeometry(1, 28, 20), ico: new THREE.IcosahedronGeometry(1, 2), ico1: new THREE.IcosahedronGeometry(1, 1),
    ico0: new THREE.IcosahedronGeometry(1, 0), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), box: new THREE.BoxGeometry(1, 1, 1),
    cone: new THREE.ConeGeometry(1, 1, 9),
  };
  // Merge pieces { geo, m (Matrix4), color } into one geometry with vertex colors.
  function merge(pieces, flat = false) {
    let n = 0;
    const list = pieces.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; return { g, c: new THREE.Color(p.color) }; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    list.forEach(({ g, c }) => {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      for (let i = 0; i < g.attributes.position.count; i++) col.set([c.r, c.g, c.b], (o + i) * 3);
      o += g.attributes.position.count;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (flat) out.computeVertexNormals();
    return out;
  }
  const M4 = (x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz));
  const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); return new THREE.CanvasTexture(cv); };
  const glowTex = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const sparkTex = canvasTex(64, 64, (c) => { c.translate(32, 32); c.fillStyle = '#ffffff'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, r = i % 2 ? 7 : 28; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); });

  // Particles: dust puffs and sparkles, owned by one scene.
  function particles(scene) {
    const puffs = [], sparks = [];
    return {
      puff(x, y, z, n = 5, size = 0.2, color = '#ffffff', up = 1) {
        for (let i = 0; i < n; i++) {
          const m = new THREE.Mesh(G.ico1, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, depthWrite: false }));
          const a = Math.random() * TAU;
          m.position.set(x + Math.cos(a) * 0.2, y + 0.1, z + Math.sin(a) * 0.2); m.scale.setScalar(size * 0.6); scene.add(m);
          puffs.push({ m, vx: Math.cos(a) * 1.4, vy: up * (0.6 + Math.random() * 0.8), vz: Math.sin(a) * 1.4, life: 0, max: 0.45 + Math.random() * 0.2, size });
        }
      },
      sparkle(x, y, z, n = 14, colors = ['#fff3a0', '#7ff7ea']) {
        for (let i = 0; i < n; i++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, transparent: true, depthWrite: false, color: colors[i % colors.length] }));
          const a = Math.random() * TAU, sp = 1 + Math.random() * 2;
          s.position.set(x, y, z); s.scale.setScalar(0.32); scene.add(s);
          sparks.push({ s, vx: Math.cos(a) * sp, vy: 1.5 + Math.random() * 2.5, vz: Math.sin(a) * sp, life: 0, max: 0.8 + Math.random() * 0.5 });
        }
      },
      update(dt) {
        for (let i = puffs.length - 1; i >= 0; i--) {
          const p = puffs[i]; p.life += dt; const k = p.life / p.max;
          p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.vx *= 0.9; p.vz *= 0.9;
          p.m.scale.setScalar(p.size * (0.6 + k * 1.2)); p.m.material.opacity = 0.7 * (1 - k);
          if (k >= 1) { scene.remove(p.m); p.m.material.dispose(); puffs.splice(i, 1); }
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const p = sparks[i]; p.life += dt; const k = p.life / p.max;
          p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt; p.vy -= 3 * dt;
          p.s.scale.setScalar(0.32 * (1 - k * 0.6)); p.s.material.opacity = 1 - k; p.s.material.rotation += dt * 3;
          if (k >= 1) { scene.remove(p.s); p.s.material.dispose(); sparks.splice(i, 1); }
        }
      },
    };
  }
  // The building the camera is inside (main.js sets it each frame from its camera boxes). Its walls are only seen from inside, so
  // they vanish by themselves; this makes everything else on it vanish too (windows, frames, shutters, doors, awnings, the ink
  // outlines), in the towns' faded materials (town.js, molinar.js, lake.js, cemetery.js add camCut.decl and camCut.test).
  const camCut = {
    U: { uCamIn: { value: new THREE.Vector4(0, 0, 1, 0) }, uCamInS: { value: new THREE.Vector4(0, 0, 1, -1) } },
    decl: 'uniform vec4 uCamIn;\nuniform vec4 uCamInS;\n',
    test: `{ vec2 cd = vWP.xz - uCamIn.xy; vec2 cl = vec2(cd.x * uCamIn.z - cd.y * uCamIn.w, cd.x * uCamIn.w + cd.y * uCamIn.z);
      if (abs(cl.x) < uCamInS.x && abs(cl.y) < uCamInS.y && vWP.y > uCamInS.z && vWP.y < uCamInS.w) discard; }`,
    // b: { x, z, c, s, hw, hd, y0, h } (a camera box, rot's cos and sin) or null; the box grows a little, for what sticks out of the walls
    set(b) { const a = camCut.U.uCamIn.value, s = camCut.U.uCamInS.value; if (b) { a.set(b.x, b.z, b.c, b.s); s.set(b.hw + 0.6, b.hd + 0.6, b.y0, b.y0 + b.h + 2.5); } else s.set(0, 0, 1, -1); camCut.on = b; },
    on: null,
  };
  return { fl, grad, toon, outlineMat, part, G, merge, M4, canvasTex, glowTex, sparkTex, particles, camCut };
})();
