// Title screen + drive-in cutscene.
// Motion language (from the hyperframes-animation skill): waterfall title entry (power4.out, binary opacity,
// overlapping stagger), multi-phase camera (crane / track / push) with Lissajous micro-drift, power3.out
// settles, expo.inOut for scene cuts, letterbox for the cinematic register.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { toW, rand, rr, cnv, tex, MAT } from './kit.js';
import * as L from './layout.js';
import { GROADS } from './geodata.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const W3 = (px, py, y = 0) => { const [x, z] = toW(px, py); return V(x, y, z); };

// Telav–Ghuma Road extended north beyond the satellite tile, then the spur to the main gate.
const GHUMA_PX = [[420, -2600], [330, -1300], [267, -512], [172, 60], [102, 478], [-48, 1258], [-213, 2560]];
const SPUR_PX = [[63, 701], [100, 711], [146, 730]];
const DRIVE_PX = [[208, -160], [172, 60], [137, 265], [110, 430], [86, 560], [70, 650], [66, 688], [80, 705], [105, 714], [123, 719]];

// ---------------------------------------------------------------- road outside campus
function ribbon(points, halfW, y, mat, vScale) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal'), len = curve.getLength(), n = Math.ceil(len / 3);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPointAt(t), tg = curve.getTangentAt(t), nx = -tg.z, nz = tg.x;
    pos.push(p.x + nx * halfW, y, p.z + nz * halfW, p.x - nx * halfW, y, p.z - nz * halfW);
    uv.push(0, t * len / vScale, 1, t * len / vScale);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return { mesh: m, curve, len };
}
function asphaltTexture() {
  const [c, g] = cnv(128, 512); g.fillStyle = '#4a4a48'; g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 2500; i++) { const v = 55 + rand() * 40; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(rand() * 128, rand() * 512, 2, 2); }
  g.fillStyle = '#e8e2cf'; g.fillRect(62, 40, 4, 200);                        // centre dash
  g.fillStyle = 'rgba(230,225,210,.75)'; g.fillRect(4, 0, 3, 512); g.fillRect(121, 0, 3, 512);  // edge lines
  const t = tex(c); return t;
}
function buildOutside(scene) {
  const asphalt = new THREE.MeshStandardMaterial({ map: asphaltTexture(), roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const shoulder = new THREE.MeshStandardMaterial({ color: 0xa48a64, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const pts = GHUMA_PX.map(([x, y]) => W3(x, y));
  scene.add(ribbon(pts, 5.6, 0.02, shoulder, 6).mesh);
  const road = ribbon(pts, 3.7, 0.04, asphalt, 12); scene.add(road.mesh);
  scene.add(ribbon(SPUR_PX.map(([x, y]) => W3(x, y)), 3.2, 0.045, asphalt, 12).mesh);

  // fields, trees and electricity poles along the road north of the campus
  const fieldCols = ['#b9a06e', '#8a9a4a', '#a37c55', '#c4ad7c', '#6f8a3e'];
  const fieldMat = c => { const [cv, g] = cnv(64, 64); g.fillStyle = c; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < 64; y += 6) g.fillRect(0, y, 64, 2); const t = tex(cv); t.repeat.set(4, 4); return new THREE.MeshStandardMaterial({ map: t, roughness: 1, polygonOffset: true, polygonOffsetFactor: -0.5, polygonOffsetUnits: -0.5 }); };
  const mats = fieldCols.map(fieldMat);
  const trees = [], poles = [];
  const curve = road.curve, L2 = road.len;
  for (let s = 0; s < L2; s += 7) {
    const t = s / L2, p = curve.getPointAt(t), tg = curve.getTangentAt(t), nx = -tg.z, nz = tg.x;
    const [, py] = [0, p.z / L.M_PER_PX + L.ORIGIN_PX[1]];
    if (py > 640) continue;                     // keep the gate approach clear
    const outside = py < 30;                    // north of the satellite tile: also add fields
    for (const side of [-1, 1]) {
      if (rand() < 0.55) trees.push([p.x + nx * side * rr(8, 16), p.z + nz * side * rr(8, 16), rr(0.8, 1.3)]);
      if (s % 42 < 7 && side === 1) poles.push([p.x + nx * 6.5, p.z + nz * 6.5]);
      if (outside && s % 70 < 7) {
        const f = new THREE.Mesh(new THREE.PlaneGeometry(rr(40, 70), rr(50, 80)).rotateX(-Math.PI / 2), mats[(rand() * mats.length) | 0]);
        f.position.set(p.x + nx * side * rr(45, 60), 0.01, p.z + nz * side * rr(45, 60)); f.rotation.y = rr(-0.2, 0.2); f.receiveShadow = true; scene.add(f);
      }
    }
  }
  const trunkG = new THREE.CylinderGeometry(0.15, 0.25, 3.4, 6).translate(0, 1.7, 0), crownG = new THREE.IcosahedronGeometry(2.8, 1);
  const tm = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 1 }), trees.length);
  const cm = new THREE.InstancedMesh(crownG, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), trees.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), greens = [0x3f6d30, 0x4b7b36, 0x5c8b3d, 0x6a8f3f].map(c => new THREE.Color(c));
  trees.forEach(([x, z, k], i) => {
    m4.compose(p3.set(x, 0, z), q.identity(), s3.set(k, k, k)); tm.setMatrixAt(i, m4);
    m4.compose(p3.set(x, 4.2 * k, z), q.setFromAxisAngle(V(0, 1, 0), rand() * 6), s3.set(k, k * 0.75, k)); cm.setMatrixAt(i, m4); cm.setColorAt(i, greens[(rand() * 4) | 0]);
  });
  tm.castShadow = cm.castShadow = true; scene.add(tm, cm);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xa9a59b, roughness: 0.9 }), wire = new THREE.LineBasicMaterial({ color: 0x222222 });
  poles.forEach(([x, z], i) => {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 8, 0.22), poleMat); pole.position.set(x, 4, z); pole.castShadow = true; scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), poleMat); arm.position.set(x, 7.6, z); arm.lookAt(x + 1, 7.6, z); scene.add(arm);
    if (i) { const [px, pz] = poles[i - 1]; scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(px, 7.6, pz), V((px + x) / 2, 7.0, (pz + z) / 2), V(x, 7.6, z)]), wire)); }
  });
}

// ---------------------------------------------------------------- car (right-hand-drive hatchback)
function buildCar() {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xf1f1ee, roughness: 0.32, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x1b2630, roughness: 0.05, metalness: 0.6, envMapIntensity: 1.5 });
  const black = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xcfd3d6, roughness: 0.25, metalness: 0.9 });
  const extrude = (pts, depth, mat, bevel = 0.04) => {
    const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
    const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3 });
    geo.translate(0, 0, -depth / 2); geo.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  };
  extrude([[1.92, 0.3], [1.96, 0.6], [1.35, 0.83], [0.78, 0.9], [-1.72, 0.94], [-1.86, 0.62], [-1.82, 0.3]], 1.56, paint);   // lower body
  extrude([[0.78, 0.9], [0.14, 1.41], [-1.34, 1.41], [-1.72, 0.95]], 1.42, glass, 0.02);                                     // glasshouse
  extrude([[0.24, 1.39], [0.16, 1.45], [-1.38, 1.45], [-1.36, 1.39]], 1.44, paint, 0.03);                                     // roof
  for (const z of [-0.45]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.5, 0.1), black); p.position.set(0, 1.16, z); g.add(p); }   // B-pillars
  for (const [z, w] of [[1.97, 1.5], [-1.87, 1.5]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.22, 0.16), black); b.position.set(0, 0.36, z); g.add(b); }
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: 0.8 }), tail = new THREE.MeshStandardMaterial({ color: 0x8a0d0d, emissive: 0xff2020, emissiveIntensity: 0.3 });
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.13, 0.08), head); h.position.set(s * 0.55, 0.66, 1.93); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.06), tail); t.position.set(s * 0.66, 0.78, -1.84); g.add(t);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.1), paint); mirror.position.set(s * 0.86, 1.0, 0.6); g.add(mirror);
  }
  for (const [z, y] of [[2.0, 0.42], [-1.92, 0.5]]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.02), new THREE.MeshStandardMaterial({ color: 0xf5f5f0 })); pl.position.set(0, y, z); g.add(pl); }
  const wheels = [], tyreG = new THREE.CylinderGeometry(0.31, 0.31, 0.21, 22).rotateZ(Math.PI / 2), hubG = new THREE.CylinderGeometry(0.19, 0.19, 0.22, 12).rotateZ(Math.PI / 2);
  for (const [x, z] of [[0.74, 1.22], [-0.74, 1.22], [0.74, -1.18], [-0.74, -1.18]]) {
    const w = new THREE.Group(); w.position.set(x, 0.31, z);
    const tyre = new THREE.Mesh(tyreG, black); tyre.castShadow = true; w.add(tyre); const hub = new THREE.Mesh(hubG, chrome); w.add(hub);
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.05, 0.32), chrome); w.add(spoke);
    g.add(w); wheels.push(w);
  }
  // driver's door (right side in India): hinged at its front edge, swings out
  const door = new THREE.Group(); door.position.set(-0.8, 0, 0.6); g.add(door);
  const dPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 1.05), paint); dPanel.position.set(-0.02, 0.6, -0.52); dPanel.castShadow = true; door.add(dPanel);
  const dGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.88), glass); dGlass.position.set(0.04, 1.13, -0.5); door.add(dGlass);
  return { group: g, wheels, door };
}

// ---------------------------------------------------------------- controller
export function initIntro(ctx) {
  const { scene, camera, player, body, P, cam, setTime, labelGroup } = ctx;
  buildOutside(scene);
  const car = buildCar(); scene.add(car.group); car.group.visible = false;
  const path = new THREE.CatmullRomCurve3(DRIVE_PX.map(([x, y]) => W3(x, y)), false, 'centripetal');
  const LEN = path.getLength();
  // gate shot: roadside, across the spur, looking at the gate so the car turns in across frame
  const SPAWN = W3(L.SPAWN.x, L.SPAWN.y), GATE_CAM = W3(98, 760, 2.4), GATE_MID = W3(150, 728, 1.9);
  const TD = 17.5, T_EXIT = 18.4, WALK = 3.8, T_END = T_EXIT + 6.2;   // ~24.6 s
  const S = { state: 'loading', t: 0, s: 0, orbit: 0.6, done: false, prevS: 0 };
  const focus = V(0, 0, 0), tmp = V(0, 0, 0), look = V(0, 0, 0), exitFrom = V(0, 0, 0), camFrom = V(0, 0, 0);
  const ui = id => document.getElementById(id);

  // cruise-then-brake ease: constant speed, then uniform deceleration over the last 30% of the time
  const brakeEase = (p, b = 0.3) => { const k = 1 / (1 - b / 2); if (p < 1 - b) return k * p; const q = p - (1 - b); return k * (1 - b) + k * (q - q * q / (2 * b)); };
  const carAt = s => { const t = THREE.MathUtils.clamp(s / LEN, 0, 1); return [path.getPointAt(t), path.getTangentAt(t)]; };
  function placeCar(s) {
    const [p, tg] = carAt(s);
    car.group.position.copy(p); car.group.rotation.y = Math.atan2(tg.x, tg.z);
    const ds = s - S.prevS; S.prevS = s; for (const w of car.wheels) w.rotation.x += ds / 0.31;
    return [p, tg];
  }

  // ----- title screen
  // the overlay (title + loader) is already on screen from first paint; once the campus is built this flips it to
  // "ready": the solid backdrop fades to reveal the live orbit and "Click to start" replaces the loader
  function showTitle() {
    S.state = 'title'; document.body.classList.add('cine', 'titling');
    setTime(1);                                      // golden hour behind the overlay
    player.visible = false; labelGroup.visible = false;
    ui('title-screen').classList.remove('loading');
  }
  function startIntro() {
    if (S.state !== 'title') return;
    S.state = 'starting';
    gsap.timeline()
      .to('#title-screen .ts-inner', { y: -30, opacity: 0, duration: 0.45, ease: 'power3.in' }, 0)
      .to('#fader', { autoAlpha: 1, duration: 0.6, ease: 'expo.inOut' }, 0.15)
      .add(() => {
        gsap.set('#title-screen', { autoAlpha: 0 }); document.body.classList.remove('titling');
        setTime(0);                                  // morning: day one
        car.group.visible = true; S.t = 0; S.s = 0; S.prevS = 0; placeCar(0); S.state = 'intro';
        driveTL.restart();
      })
      .to('#letterbox .lb', { scaleY: 1, duration: 0.7, ease: 'power3.out' }, '+=0.05')
      .to('#fader', { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, '<0.1')
      .to('#skip', { autoAlpha: 0.85, duration: 0.4 }, '<0.5');
  }

  // ----- cutscene timeline (car distance + overlays); camera shots are computed per frame from S.t
  const prox = { p: 0, door: 0 };
  const driveTL = gsap.timeline({ paused: true });
  driveTL.to(prox, { p: 1, duration: TD, ease: brakeEase }, 0);
  // lower-third: location card (waterfall in, quick out)
  driveTL.set('#lower-third', { autoAlpha: 1 }, 1.2)
    .fromTo('#lower-third b', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power4.out' }, 1.2)
    .fromTo('#lower-third span', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.16, ease: 'power4.out' }, 1.37)
    .fromTo('#lower-third .bar', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, 1.2)
    .to('#lower-third', { autoAlpha: 0, y: 10, duration: 0.4, ease: 'power2.in' }, 5.2);
  // welcome card as the car turns in at the gate
  driveTL.set('#welcome', { autoAlpha: 1 }, 14.8)
    .fromTo('#welcome .w', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power4.out', stagger: 0.12 }, 14.8)
    .to('#welcome', { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 17.6);
  driveTL.to(prox, { door: 1, duration: 0.6, ease: 'power3.out' }, T_EXIT);
  // main gate: guard opens it as the car stops; it swings shut once the player is through (~T_EXIT+2.2)
  driveTL.add(() => { ctx.gate.target = 1; }, T_EXIT - 0.6).add(() => { ctx.gate.target = 0; }, T_EXIT + 2.8);
  driveTL.add(() => finish(false), T_END);

  function finish(skipped) {
    if (S.state !== 'intro') return;
    S.state = 'play'; driveTL.pause();
    placeCar(LEN); car.door.rotation.y = 1.15;
    if (skipped) { player.position.copy(SPAWN); P.yaw = Math.atan2(SPAWN.x - car.group.position.x, SPAWN.z - car.group.position.z); ctx.gate.target = 0; ctx.gate.value = 0; }
    player.visible = true; player.position.y = 0;
    // hand the camera over from wherever the shot ended
    const d = tmp.copy(camera.position).sub(V(player.position.x, player.position.y + 1.55, player.position.z));
    cam.dist = skipped ? 7 : THREE.MathUtils.clamp(d.length(), 4, 9); cam.yaw = skipped ? P.yaw + Math.PI : Math.atan2(d.x, d.z); cam.pitch = skipped ? 0.3 : THREE.MathUtils.clamp(Math.asin(d.y / d.length()), 0.1, 0.6);
    gsap.timeline()
      .to('#skip, #welcome, #lower-third', { autoAlpha: 0, duration: 0.3 }, 0)
      .to('#letterbox .lb', { scaleY: 0, duration: 0.6, ease: 'power3.out' }, 0)
      .add(() => { document.body.classList.remove('cine'); labelGroup.visible = true; }, 0.3)
      .fromTo('#hud, #help, #minimap', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.35);
    // the parked car becomes an obstacle
    const c = car.group, r = c.rotation.y, cs = Math.cos(r), sn = Math.sin(r);
    ctx.colliders.push([[-1, -2.1], [1, -2.1], [1, 2.1], [-1, 2.1]].map(([x, z]) => [c.position.x + x * cs + z * sn, c.position.z - x * sn + z * cs]));
    S.done = true;
  }

  // click anywhere on the overlay (except Controls) once it's ready
  ui('title-screen').addEventListener('click', e => { if (!e.target.closest('#btn-controls, #controls-card')) startIntro(); });
  ui('skip').addEventListener('click', () => finish(true));
  ui('btn-controls').addEventListener('click', () => ui('controls-card').classList.toggle('open'));
  addEventListener('keydown', e => {
    if (S.state === 'title' && (e.code === 'Enter' || e.code === 'Space')) startIntro();
    else if (S.state === 'intro' && (e.code === 'Escape' || e.code === 'Enter')) finish(true);
  });

  // ----- per-frame camera direction
  const center = W3(700, 1250);
  function update(dt) {
    if (S.state === 'title' || S.state === 'starting' || S.state === 'loading') {
      // slow drone orbit over the campus with Lissajous micro-drift
      S.orbit += dt * 0.035; S.t += dt;
      const r = 210, h = 95 + Math.sin(S.t * 0.21) * 6;
      camera.position.set(center.x + Math.sin(S.orbit) * r, h, center.z + Math.cos(S.orbit) * r);
      look.set(center.x + Math.sin(S.t * 0.13) * 6, 0, center.z + Math.sin(S.t * 0.17) * 6);
      camera.lookAt(look); focus.copy(center);
      return focus;
    }
    if (S.state !== 'intro') return null;
    const t = S.t = driveTL.time(), [p, tg] = placeCar(prox.p * LEN);   // one master clock: the GSAP timeline
    const left = V(tg.z, 0, -tg.x);                  // car's left (passenger side in India)
    const drift = (a, f) => Math.sin(t * f) * a;
    car.door.rotation.y = prox.door * 1.15;
    if (t < 5.2) {                                   // 1. crane down behind the car, looking down the road to campus
      const e = gsap.parseEase('power2.inOut')(Math.min(1, t / 5.2));
      camera.position.copy(p).addScaledVector(tg, -(30 - 12 * e)).addScaledVector(left, 5 + drift(0.6, 0.7)).setY(60 - 46 * e);
      look.copy(p).addScaledVector(tg, 40 - 25 * e).setY(0);
    } else if (t < 10.6) {                           // 2. side tracking shot, slowly sliding forward along the car
      const k = (t - 5.2) / 5.4;
      camera.position.copy(p).addScaledVector(left, 6.2 + drift(0.15, 1.1)).addScaledVector(tg, -2 + 4.5 * k).setY(1.25 + drift(0.08, 1.43));
      look.copy(p).addScaledVector(tg, 0.6 + 1.5 * k).setY(0.9);
    } else if (t < 14.6) {                           // 3. low front push-in
      const e = gsap.parseEase('power3.out')((t - 10.6) / 4);
      camera.position.copy(p).addScaledVector(tg, 13 - 5 * e).addScaledVector(left, 1.6).setY(0.75 + drift(0.05, 1.2));
      look.copy(p).setY(0.85);
    } else {
      // player: steps out of the driver's door at T_EXIT+0.4 and walks through the gate to the spawn point
      if (t >= T_EXIT + 0.4) {
        if (!player.visible) { player.visible = true; exitFrom.copy(p).addScaledVector(left, -1.5).setY(0); }
        const k = Math.min(1, (t - T_EXIT - 0.4) / WALK);
        player.position.lerpVectors(exitFrom, SPAWN, gsap.parseEase('power1.inOut')(k));
        const hd = tmp.copy(SPAWN).sub(exitFrom).normalize();
        P.yaw = Math.atan2(hd.x, hd.z); player.rotation.y = P.yaw;
        if (k < 1) P.walk += dt * 8;
        const sw = Math.sin(P.walk) * (k < 1 ? 0.5 : 0.03);
        body.legL.rotation.x = sw; body.legR.rotation.x = -sw; body.armL.rotation.x = -sw * 0.8; body.armR.rotation.x = sw * 0.8;
      }
      const head = V(player.position.x, 1.5, player.position.z), fwd = tmp.copy(SPAWN).sub(exitFrom.lengthSq() ? exitFrom : p).setY(0).normalize();
      if (t < T_EXIT + 2.0) {                        // 4. locked-off roadside shot: car turns in and brakes, door opens, gate swings open
        const e = gsap.parseEase('power2.out')(Math.min(1, (t - 14.6) / 4));
        camera.position.copy(GATE_CAM).setY(2.4 - 0.3 * e).addScaledVector(V(1, 0, 0), drift(0.1, 0.6));
        look.copy(p).lerp(GATE_MID, 0.25 + 0.35 * e).setY(1.1);
        if (player.visible) look.lerp(head, Math.min(1, (t - T_EXIT - 0.4) / 1.2) * 0.6);
      } else if (t < T_EXIT + 5.0) {                 // 5. reverse shot from inside campus: walking toward camera, gate closes behind
        const e = gsap.parseEase('sine.inOut')((t - T_EXIT - 2.0) / 3.0);
        const side = V(-fwd.z, 0, fwd.x);
        camera.position.copy(SPAWN).addScaledVector(fwd, 4.2 - 1.2 * e).addScaledVector(side, 1.3).setY(1.65 + drift(0.04, 0.9));
        look.copy(head).lerp(GATE_MID, 0.35 - 0.2 * e).setY(1.45);
        camFrom.copy(camera.position);
      } else {                                       // 6. swing round to behind the player for gameplay
        const e = gsap.parseEase('power3.inOut')(Math.min(1, (t - T_EXIT - 5.0) / (T_END - T_EXIT - 5.0)));
        const a0 = Math.atan2(camFrom.x - head.x, camFrom.z - head.z), a1 = Math.atan2(-fwd.x, -fwd.z);
        let da = a1 - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
        const a = a0 + da * e, r0 = Math.hypot(camFrom.x - head.x, camFrom.z - head.z), r = r0 + (6.5 - r0) * e;
        camera.position.set(head.x + Math.sin(a) * r, 1.65 + (2.4 - 1.65) * e, head.z + Math.cos(a) * r);
        look.copy(head).setY(1.45);
      }
    }
    camera.lookAt(look); focus.copy(p);
    return focus;
  }

  return { update, showTitle, get state() { return S.state; }, seek: t => { if (S.state === 'intro') { driveTL.pause(); driveTL.seek(t, false); } } };   // debug: freeze on a frame
}
