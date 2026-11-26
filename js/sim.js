'use strict';
// The simulation: you, Mimo and the villagers moving through the world. Story and UI drive it;
// the renderer only reads it.

const STEP = 0.55;                  // highest step you walk up without jumping
const DEEP = WORLD.L.water - 0.6;   // ground below this is water too deep to wade

class Sim {
  constructor() {
    this.t = 0;
    this.events = [];
    this.lock = 0;                  // > 0 while a cutscene holds your controls
    const s = { x: 3.4, z: 61.8 };
    this.you = { x: s.x, z: s.z, y: 0, ry: 0, vx: 0, vy: 0, vz: 0, yaw: Math.PI, onGround: true, coyote: 0, buffer: 0,
      air: 0, phase: 0, speed: 0, land: 1, still: 0, look: undefined };
    this.mimo = { x: s.x + 1, z: s.z + 1, y: 0, ry: 0, yaw: Math.PI, hop: null, rest: 0, land: 1, perk: 0.3,
      ears: [{ a: 0.5, v: 0 }, { a: 0.5, v: 0 }], earBack: 0, blink: 0, nextBlink: 2.5, glow: 0, say: null, tilt: 0, tiltT: 0,
      happy: 0, sad: 0, scared: 0, copyJump: -1, station: null, look: null, wander: null, wanderT: 3, babbleT: 40, hidden: true };
    this.npcs = [];
    this.snap();
  }
  ground(x, z, y) { return WORLD.groundAt(x, z, y); }
  snap() {
    for (const a of [this.you, this.mimo]) a.y = a.ry = this.ground(a.x, a.z);
    for (const n of this.npcs) n.y = this.ground(n.x, n.z);
    this.mimo.hop = null;
  }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  addNpc(id, kind, x, z, yaw = 0) {
    const n = { id, kind, x, z, y: this.ground(x, z), yaw, baseYaw: yaw, talk: 0, near: false, wave: false };
    this.npcs.push(n); WORLD.extra.push({ x, z, r: 0.55, npc: id }); return n;
  }
  npc(id) { return this.npcs.find(n => n.id === id); }

  update(dt, inp, basis) {
    this.t += dt;
    const free = this.lock <= 0;
    // (stranded for a moment, outside any scene: Mimo pulls you ashore; see rescue())
    const Ys = this.you;
    if (free && Ys.onGround && !this.okAt(Ys.x, Ys.z, Ys.y + 0.3)) { Ys.stranded = (Ys.stranded || 0) + dt; if (Ys.stranded > 1.2) { Ys.stranded = 0; this.rescue(); } }
    else Ys.stranded = 0;
    this.updateYou(dt, free ? inp : NO_INPUT, basis);
    this.updateMimo(dt);
    for (const n of this.npcs) {
      const d = Math.hypot(this.you.x - n.x, this.you.z - n.z);
      n.near = d < 3.2;
      // villagers face you when you're near, or whatever a scene has them look at (n.look)
      n.yaw = dampAngle(n.yaw, n.look ? Math.atan2(n.look.x - n.x, n.look.z - n.z) : d < 8 ? Math.atan2(this.you.x - n.x, this.you.z - n.z) : n.baseYaw, 4, dt);
      n.talk = damp(n.talk, n.talking ? 1 : 0, 10, dt);
      n.y = this.ground(n.x, n.z);
    }
  }

  // ---------------------------------------------------------- you
  updateYou(dt, inp, basis) {
    const Y = this.you;
    let mx = basis.rx * inp.x + basis.fx * inp.y, mz = basis.rz * inp.x + basis.fz * inp.y;
    const m = Math.hypot(mx, mz);
    if (m > 1) { mx /= m; mz /= m; }
    const top = inp.run ? 8.6 : 5.4;
    const acc = Y.onGround ? (m > 0.05 ? 40 : 30) : 13;
    const dx = mx * top - Y.vx, dz = mz * top - Y.vz, dl = Math.hypot(dx, dz), step = acc * dt;
    if (dl <= step) { Y.vx += dx; Y.vz += dz; } else { Y.vx += (dx / dl) * step; Y.vz += (dz / dl) * step; }
    if (m > 0.1) Y.yaw = dampAngle(Y.yaw, Math.atan2(mx, mz), 14, dt);
    Y.buffer = inp.jumpPressed ? 0.14 : Y.buffer - dt;
    if (Y.buffer > 0 && (Y.onGround || Y.coyote > 0)) {
      Y.vy = 9.4; Y.onGround = false; Y.coyote = 0; Y.buffer = 0; Y.air = 0;
      this.emit('jump');
      if (!this.mimo.hidden && Math.hypot(this.mimo.x - Y.x, this.mimo.z - Y.z) < 4) this.mimo.copyJump = 0.18;
    }
    const nx0 = Y.x + Y.vx * dt, nz0 = Y.z + Y.vz * dt;
    const [nx, nz] = this.slide(Y.x, Y.z, nx0, nz0, Y.y, 0.42);
    if (Math.abs(nx - nx0) > 1e-3) Y.vx *= 0.5;
    if (Math.abs(nz - nz0) > 1e-3) Y.vz *= 0.5;
    Y.x = nx; Y.z = nz;
    const g = this.ground(Y.x, Y.z, Y.y);
    if (Y.onGround) {
      if (g >= Y.y - 0.6 && g <= Y.y + STEP) { Y.y = g; Y.vy = 0; Y.coyote = 0.12; }
      else { Y.onGround = false; Y.air = 0; Y.vy = 0; }
    }
    if (!Y.onGround) {
      Y.vy -= 26 * dt;
      if (!inp.jump && Y.vy > 0) Y.vy -= 34 * dt;
      Y.vy = Math.max(Y.vy, -32);
      Y.y += Y.vy * dt; Y.air += dt; Y.coyote -= dt;
      if (Y.y <= g) {
        if (Y.air > 0.12 || Y.vy < -6) { this.emit('land', { hard: -Y.vy }); Y.land = 0; }
        Y.y = g; Y.vy = 0; Y.onGround = true;
      }
    }
    Y.ry = Math.abs(Y.ry - Y.y) > 1.5 ? Y.y : damp(Y.ry, Y.y, 30, dt);
    Y.land = Math.min(1, Y.land + dt * 4.5);
    Y.speed = Math.hypot(Y.vx, Y.vz);
    if (Y.onGround && Y.speed > 0.3) {
      const before = Math.floor(Y.phase / Math.PI);
      Y.phase += dt * (3.4 + Y.speed * 1.45);
      if (Math.floor(Y.phase / Math.PI) !== before) this.emit('step', { run: Y.speed > 7, x: Y.x, z: Y.z, wet: g < WORLD.L.water });
    } else Y.phase = damp(Y.phase, Math.round(Y.phase / Math.PI) * Math.PI, 10, dt);
    Y.still = Y.speed < 0.2 && Y.onGround ? Y.still + dt : 0;
  }
  // where you could stand: ground within a step, not deep water (unless there's a deck over it: Remanso's boardwalks, a room's floor)
  // (WORLD.deepAt: a flood TIME.land lays over dry ground is deep water too)
  okAt(x, z, y) { const g = this.ground(x, z, y); return g <= y + STEP && WORLD.terrainAt(x, z) > DEEP && !(WORLD.deepAt && WORLD.deepAt(x, z)) || g > WORLD.terrainAt(x, z) + 0.2 && g <= y + STEP; }
  // Stranded: you're somewhere you couldn't have walked to (a save made on land that later changed, a deck that's gone). Mimo pulls
  // you to the nearest dry land you can stand on (rings outward, up to 90 steps away). Returns true if you were moved.
  rescue() {
    const Y = this.you;
    if (this.okAt(Y.x, Y.z, Y.y + 0.3)) return false;
    for (let r = 1.5; r <= 90; r += 1.5) {
      const n = Math.max(10, Math.round(r * 4));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, x = Y.x + Math.cos(a) * r, z = Y.z + Math.sin(a) * r;
        if (WORLD.terrainAt(x, z) < WORLD.L.water + 0.15 || (WORLD.deepAt && WORLD.deepAt(x, z))) continue;
        const [px, pz] = WORLD.pushOut(x, z, 0.42);
        if (Math.hypot(px - x, pz - z) > 0.6 || WORLD.terrainAt(px, pz) < WORLD.L.water + 0.15 || (WORLD.deepAt && WORLD.deepAt(px, pz))) continue;
        Y.x = px; Y.z = pz; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
        this.mimo.x = px + 1; this.mimo.z = pz + 1;
        this.snap(); this.emit('rescued', { x: px, z: pz });
        return true;
      }
    }
    return false;
  }
  slide(x0, z0, x1, z1, y, r) {
    const ok = (x, z) => this.okAt(x, z, y);
    // (stranded where you couldn't have walked: any step toward shallower ground is allowed, so you can always get back to land)
    if (!ok(x0, z0) && !this.okAt(x0, z0, y + 0.3)) { if (WORLD.terrainAt(x1, z1) >= WORLD.terrainAt(x0, z0) - 0.02) return WORLD.pushOut(x1, z1, r); return [x0, z0]; }
    let x = x1, z = z1;
    if (!ok(x, z)) { if (ok(x1, z0)) z = z0; else if (ok(x0, z1)) x = x0; else { x = x0; z = z0; } }
    [x, z] = WORLD.pushOut(x, z, r);
    if (!ok(x, z)) { x = x0; z = z0; }
    return [x, z];
  }

  // ---------------------------------------------------------- Mimo
  updateMimo(dt) {
    const M = this.mimo, Y = this.you;
    if (M.hidden) { M.x = Y.x; M.z = Y.z; M.y = M.ry = Y.ry; return; }
    const fx = Math.sin(Y.yaw), fz = Math.cos(Y.yaw);
    const close = M.scared > 0 ? 0.8 : 1.5;
    let goal = { x: Y.x - fx * close + fz * 0.95, z: Y.z - fz * close - fx * 0.95 };
    if (M.station) goal = M.station;
    else if (this.lock <= 0 && Y.still > 2.5) {
      if ((M.wanderT -= dt) <= 0 || !M.wander) {
        const a = Math.random() * TAU, r = 1.6 + Math.random() * 1.8;
        M.wander = { x: Y.x + Math.cos(a) * r, z: Y.z + Math.sin(a) * r }; M.wanderT = 3 + Math.random() * 4;
      }
      goal = M.wander;
    } else M.wander = null;
    const gx = goal.x - M.x, gz = goal.z - M.z, dist = Math.hypot(gx, gz);
    if (M.hop) {
      const H = M.hop;
      // a hop on the spot can be asked for as just { t: 0 } (a jump that does nothing, a rocking boulder): fill in the
      // rest, or the position goes NaN and the hop never ends (Mimo vanished for good after «¡salta!» at the boulder)
      if (!(H.dur > 0)) { const d = { x0: M.x, z0: M.z, x1: M.x, z1: M.z, y0: M.y, y1: M.y, t: 0, dur: 0.46, h: 0.8 }; for (const k in d) if (!(typeof H[k] === 'number' && isFinite(H[k]))) H[k] = d[k]; }
      H.t = Math.min(1, H.t + dt / H.dur);
      const e = H.t * H.t * (3 - 2 * H.t);
      M.x = lerp(H.x0, H.x1, e); M.z = lerp(H.z0, H.z1, e);
      M.y = lerp(H.y0, H.y1, H.t) + Math.sin(Math.PI * H.t) * H.h;
      if (H.t >= 1) {
        M.hop = null; M.land = 0;
        M.ears.forEach(ear => { ear.v += 6 + Math.random() * 3; });
        this.emit('mimo-land', { x: M.x, z: M.z, big: H.h > 0.7 });
      }
    } else {
      M.y = this.ground(M.x, M.z, M.y);
      if (dist > 15) {
        [M.x, M.z] = WORLD.pushOut(goal.x, goal.z, 0.3); M.y = this.ground(M.x, M.z);
        this.emit('poof', { x: M.x, z: M.z });
      } else if (M.copyJump > 0 && (M.copyJump -= dt) <= 0) {
        M.copyJump = -1;
        M.hop = { x0: M.x, z0: M.z, x1: M.x, z1: M.z, y0: M.y, y1: M.y, t: 0, dur: 0.46, h: 1.0 };
        this.emit('mimo-jump');
      } else if (dist > (Y.speed > 0.5 || M.station ? 0.5 : 1.0) && (M.rest -= dt) <= 0) {
        const len = Math.min(dist, dist > 5 ? 3.2 : dist > 2.5 ? 2.2 : 1.4);
        let x1 = M.x + (gx / dist) * len, z1 = M.z + (gz / dist) * len;
        [x1, z1] = WORLD.pushOut(x1, z1, 0.3);
        // (deep water stops a hop, unless there's a deck over it: Remanso's boardwalks, the docks)
        const t1 = WORLD.terrainAt(x1, z1);
        if ((t1 < DEEP || (WORLD.deepAt && WORLD.deepAt(x1, z1))) && !(this.ground(x1, z1, M.y + 1) > t1 + 0.2)) { x1 = M.x; z1 = M.z; }
        M.hop = { x0: M.x, z0: M.z, x1, z1, y0: M.y, y1: this.ground(x1, z1, M.y + 1), t: 0, dur: 0.21 + len * 0.04, h: 0.3 + len * 0.13 };
        M.rest = Y.speed > 0.5 ? 0.03 : 0.12 + Math.random() * 0.2;
      }
    }
    M.ry = M.hop ? M.y : damp(M.ry, M.y, 30, dt);
    if (Math.abs(M.ry - M.y) > 1.5) M.ry = M.y;
    let lx = Y.x, lz = Y.z;
    if (M.hop && (Math.abs(M.hop.x1 - M.hop.x0) + Math.abs(M.hop.z1 - M.hop.z0)) > 0.05) { lx = M.hop.x1 + (M.hop.x1 - M.hop.x0) * 3; lz = M.hop.z1 + (M.hop.z1 - M.hop.z0) * 3; }
    else if (M.look) { lx = M.look.x; lz = M.look.z; }
    if (Math.hypot(lx - M.x, lz - M.z) > 0.2) M.yaw = dampAngle(M.yaw, Math.atan2(lx - M.x, lz - M.z), 9, dt);
    const busy = !!M.look || M.happy > 0;
    const hush = WORLD.hushAt(M.x, M.z);
    const perkGoal = M.sad > 0 || M.scared > 0 ? -1 : busy ? 1 : 0.25 + 0.15 * Math.sin(this.t * 0.7) - hush * 0.9;
    M.perk = damp(M.perk, perkGoal, 6, dt);
    const target = M.perk >= 0 ? lerp(0.62, 0.1, M.perk) : lerp(0.62, 0.98, -M.perk);
    M.ears.forEach((ear, i) => {
      const twitch = Math.sin(this.t * (2.3 + i) + i * 4) > 0.985 ? 0.4 : 0;
      ear.v += ((target + twitch) - ear.a) * 150 * dt - ear.v * 9 * dt;
      ear.a += ear.v * dt;
      // (a droop, never a flop: scared near the hushed, or kicked by a landing, the ears used to swing out past
      // horizontal and down the body's sides, where they blended into it and seemed to vanish)
      if (ear.a > 1.05) { ear.a = 1.05; if (ear.v > 0) ear.v *= -0.25; }
      else if (ear.a < -0.15) { ear.a = -0.15; if (ear.v < 0) ear.v *= -0.25; }
    });
    const sp = M.hop ? Math.hypot(M.hop.x1 - M.hop.x0, M.hop.z1 - M.hop.z0) / M.hop.dur : 0;
    M.earBack = damp(M.earBack, clamp(sp * 0.09, 0, 0.7), 8, dt);
    if ((M.nextBlink -= dt) <= 0) { M.blink = 0.13; M.nextBlink = 2 + Math.random() * 3.5; }
    M.blink -= dt; M.land = Math.min(1, M.land + dt * 5); M.glow = damp(M.glow, 0, 1.1, dt);
    M.tiltT -= dt; M.tilt = damp(M.tilt, M.tiltT > 0 ? 0.38 : 0, 10, dt);
    M.sad -= dt; M.scared -= dt;
    if (M.happy > 0) { M.happy -= dt; if (!M.hop) M.hop = { x0: M.x, z0: M.z, x1: M.x, z1: M.z, y0: M.y, y1: M.y, t: 0, dur: 0.3, h: 0.45 }; }
    if (M.say && (M.say.t -= dt) <= 0) M.say = null;
  }
  mimoSay(text, t = 2) { this.mimo.say = { text, t, t0: t }; this.emit('mimo-talk'); }
  // Hop Mimo to a spot and have it look at something.
  mimoGo(spot, look) { this.mimo.station = spot ? { x: spot.x, z: spot.z } : null; this.mimo.look = look || null; }
}
