import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as L from './layout.js';
import { TREES, GROADS } from './geodata.js';
import { M, toW, toPx, rand, rr, cnv, tex, initMaterials, MAT, prism, Frame, colliders, flushBatches, openings } from './kit.js';
import { buildAll } from './arch.js';
import { initIntro } from './intro.js';

const [IW, IH] = L.IMG_SIZE;

// ---------------------------------------------------------------- renderer / scene
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
app.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position: 'fixed', top: '0', left: '0', pointerEvents: 'none' });
app.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.25, 4000);
// loading screen progress: each stage yields so the bar and caption repaint between heavy build steps
const ldFill = document.getElementById('ld-fill'), ldStage = document.getElementById('ld-stage'), ldPct = document.getElementById('ld-pct');
async function stage(text, pct) {
  ldStage.textContent = text; ldFill.style.transform = `scaleX(${pct / 100})`; ldPct.textContent = `${Math.round(pct)}%`;
  await new Promise(r => setTimeout(r, 30));
}
await stage('Mixing brick & concrete textures', 8);
initMaterials(renderer);

// physical sky + image-based lighting from it
const sky = new Sky(); sky.scale.setScalar(10000); scene.add(sky);
const skyU = sky.material.uniforms;
Object.assign(skyU.turbidity, { value: 6 }); Object.assign(skyU.rayleigh, { value: 1.4 }); Object.assign(skyU.mieCoefficient, { value: 0.006 }); Object.assign(skyU.mieDirectionalG, { value: 0.85 });
const pmrem = new THREE.PMREMGenerator(renderer);
const hemi = new THREE.HemisphereLight(0xdfeeff, 0x6f6146, 0.35); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 500 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const TIMES = [
  { name: 'morning', elev: 38, az: 120, sun: 0xfff3e0, si: 3.2, exp: 0.55, fog: 0xc9d8e6 },
  { name: 'golden hour', elev: 7, az: 250, sun: 0xffb070, si: 2.6, exp: 0.62, fog: 0xe8b993 },
  { name: 'noon', elev: 72, az: 180, sun: 0xffffff, si: 3.4, exp: 0.5, fog: 0xd2dfea },
];
let timeIdx = 0, envRT = null;
const sunDir = new THREE.Vector3();
function applyTime() {
  const t = TIMES[timeIdx];
  sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - t.elev), THREE.MathUtils.degToRad(t.az));
  skyU.sunPosition.value.copy(sunDir);
  sun.color.set(t.sun); sun.intensity = t.si; renderer.toneMappingExposure = t.exp;
  scene.fog = new THREE.Fog(t.fog, 250, 1400);
  const s2 = new THREE.Scene(); const sk = sky.clone(); s2.add(sk);
  envRT?.dispose(); envRT = pmrem.fromScene(s2, 0, 0.1, 20000); scene.environment = envRT.texture;
}
applyTime();

// ---------------------------------------------------------------- buildings
await stage('Raising hostels & academic blocks', 18);
const extras = buildAll(scene);
await stage('Building the boundary wall & main gate', 42);
const footprints = extras.footprints;

// boundary wall + gate
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function wall(a, b, h, t, side) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), nx = -dz / len * t / 2, nz = dx / len * t / 2;
  prism([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], 0, h, side, 'concrete', { collide: true });
  for (let s = 0; s < len; s += 3.2) {   // brick piers along the wall
    const px = a[0] + dx * s / len, pz = a[1] + dz * s / len;
    prism([[px - 0.25, pz - 0.25], [px + 0.25, pz - 0.25], [px + 0.25, pz + 0.25], [px - 0.25, pz + 0.25]], 0, h + 0.25, side, 'concrete');
  }
}
for (let i = 0; i < L.BOUNDARY.length; i++) {
  const a = L.BOUNDARY[i], b = L.BOUNDARY[(i + 1) % L.BOUNDARY.length];
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];                       // compare coordinates, not array identity
  const isGate = same(a, L.GATE.a) && same(b, L.GATE.b);
  const segs = isGate ? (() => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), gw = L.GATE.width / M / 2 / len; return [[a, lerp2(a, b, L.GATE.at - gw)], [lerp2(a, b, L.GATE.at + gw), b]]; })() : [[a, b]];
  for (const [p, q] of segs) wall(toW(...p), toW(...q), 2.1, 0.25, 'brick');
}
const gateMid = lerp2(L.GATE.a, L.GATE.b, L.GATE.at);
{
  const { a, b, at, width } = L.GATE, len = Math.hypot(b[0] - a[0], b[1] - a[1]), gw = width / M / 2 / len;
  for (const t of [at - gw, at + gw]) { const F = new Frame(...lerp2(a, b, t), 0); F.box(-0.7, -0.7, 0.7, 0.7, 0, 2.9, 'brick', 'concrete', { collide: true }); F.box(-0.85, -0.85, 0.85, 0.85, 2.9, 3.1, 'concrete'); }
  const S = new Frame(...lerp2(a, b, at - gw - 0.05), 0); S.box(1.5, -1.6, 4.5, 1.6, 0, 2.8, 'brick', 'roofWhite', { collide: true });  // brick security office with a rooftop tank (drone shot)
  S.box(1.4, -1.7, 4.6, 1.7, 2.8, 3.0, 'concrete', 'concrete');
  { const [tx, tz] = S.w(3.0, 0); const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.1, 14), MAT.black); tk.position.set(tx, 3.55, tz); tk.castShadow = true; scene.add(tk); }
  openings(S, 4.5, -1.6, 4.5, 1.6, 0, 'tall', { margin: 0.5, dims: [1.6, 1.1, 1.0], chajja: true });
  const [lx, lz] = toW(...gateMid); extras.labels.push({ name: 'Main Gate', sub: 'Security office · Telav–Ghuma Rd', x: lx, y: 5, z: lz });
}
// swinging main gate: two red barred leaves hinged on the brick pillars, swing into campus
const gate = { target: 0, value: 0, leaves: [], blocker: null, mid: toW(...gateMid) };
{
  const { a, b, at, width } = L.GATE, len = Math.hypot(b[0] - a[0], b[1] - a[1]), gw = width / M / 2 / len;
  const P1 = toW(...lerp2(a, b, at - gw)), P2 = toW(...lerp2(a, b, at + gw));
  const dx = P2[0] - P1[0], dz = P2[1] - P1[1], D = Math.hypot(dx, dz), ux = dx / D, uz = dz / D, leafLen = D / 2 - 0.78;
  const inside = [1, 0];                                                       // campus lies east (+x) of the gate line
  const red = new THREE.MeshStandardMaterial({ color: 0xb8221b, roughness: 0.45, metalness: 0.55, envMapIntensity: 0.8 });
  const bar = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), red); m.position.set(x, y, z); m.castShadow = true; return m; };
  for (const [P, sgn] of [[P1, 1], [P2, -1]]) {
    const pivot = new THREE.Group(), leaf = new THREE.Group();
    pivot.position.set(P[0] + ux * sgn * 0.74, 0, P[1] + uz * sgn * 0.74);
    leaf.add(bar(leafLen, 0.08, 0.08, leafLen / 2, 0.15, 0), bar(leafLen, 0.08, 0.08, leafLen / 2, 1.85, 0), bar(leafLen, 0.05, 0.05, leafLen / 2, 1.0, 0));
    leaf.add(bar(0.09, 1.8, 0.09, 0.05, 1.0, 0), bar(0.09, 1.8, 0.09, leafLen - 0.05, 1.0, 0));
    for (let x = 0.2; x < leafLen - 0.1; x += 0.16) leaf.add(bar(0.025, 1.7, 0.025, x, 1.0, 0));
    for (let x = 0.2; x < leafLen - 0.1; x += 0.16) leaf.add(bar(0.05, 0.12, 0.05, x, 1.95, 0));   // spear tips
    pivot.add(leaf); scene.add(pivot);
    const base = Math.atan2(-uz * sgn, ux * sgn);                              // local +x points across the opening
    const tip = th => [Math.cos(th), -Math.sin(th)];
    const open = [base + 1.75, base - 1.75].find(th => tip(th)[0] * inside[0] + tip(th)[1] * inside[1] > 0);
    gate.leaves.push({ pivot, base, open });
  }
  const nx = -uz * 0.15, nz = ux * 0.15;
  gate.blocker = [[P1[0] + nx, P1[1] + nz], [P2[0] + nx, P2[1] + nz], [P2[0] - nx, P2[1] - nz], [P1[0] - nx, P1[1] - nz]];
  colliders.push(gate.blocker);
}
// auto = gameplay proximity trigger (open within 6 m, close beyond 8.5 m); the cutscene drives gate.target itself
function updateGate(dt, auto) {
  if (auto) { const d = Math.hypot(player.position.x - gate.mid[0], player.position.z - gate.mid[1]); if (d < 6) gate.target = 1; else if (d > 8.5) gate.target = 0; }
  gate.value += Math.sign(gate.target - gate.value) * Math.min(Math.abs(gate.target - gate.value), dt * 0.55);
  const e = gate.value * gate.value * (3 - 2 * gate.value);                   // smoothstep: gentle start and stop
  for (const l of gate.leaves) l.pivot.rotation.y = l.base + (l.open - l.base) * e;
  const i = colliders.indexOf(gate.blocker);
  if (gate.value < 0.15 && i < 0) colliders.push(gate.blocker); else if (gate.value >= 0.15 && i >= 0) colliders.splice(i, 1);
}
const buildingMeshes = flushBatches(scene);

await stage('Laying roads, lawns & red pavers', 52);
// ---------------------------------------------------------------- ground (stylised, drawn in image px)
const satImg = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'assets/satellite_z19.jpg'; });
const inside = new Path2D(); L.BOUNDARY.forEach((p, i) => i ? inside.lineTo(...p) : inside.moveTo(...p)); inside.closePath();
function poly(g, pts) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); }
function line(g, pts, w, color) { g.lineJoin = g.lineCap = 'round'; g.lineWidth = w; g.strokeStyle = color; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); }
function rectPath(g, x, y, w, h, rot) { g.save(); g.translate(x, y); g.rotate(rot * Math.PI / 180); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.restore(); }
function fpPath(g, fp) { g.beginPath(); fp.forEach(([x, z], i) => { const [px, py] = toPx(x, z); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); }
const canalLine = GROADS.canal_rd, canalRoad = canalLine.map(([x, y]) => [x - 42, y]);
const internalRoads = ['entry', 'ring_n', 'north_spine', 'branch_w', 'branch_e', 'parking_loop'].map(k => GROADS[k]);
const S = 2;   // ground texture is 2x the satellite resolution
function drawGround(g, sat) {
  g.save(); g.scale(S, S);
  g.fillStyle = '#c1aa82'; g.fillRect(0, 0, IW, IH);
  g.globalAlpha = 0.5; g.drawImage(sat, 0, 0); g.globalAlpha = 1;
  g.save(); g.clip(inside); g.fillStyle = '#6f7f44'; g.fillRect(0, 0, IW, IH);
  g.globalAlpha = 0.3; g.drawImage(sat, 0, 0); g.globalAlpha = 1;
  for (let i = 0; i < 9000; i++) { g.fillStyle = rand() < 0.5 ? 'rgba(140,120,80,.12)' : 'rgba(60,80,40,.12)'; g.fillRect(rand() * IW, rand() * IH, rr(2, 7), rr(2, 7)); }
  g.restore();
  line(g, canalLine, 58, '#a9a596'); line(g, canalLine, 44, '#24504f'); line(g, canalLine, 24, '#1f4746');
  line(g, canalRoad, 20, '#55534f'); line(g, GROADS.ghuma, 28, '#4a4946'); line(g, GROADS.ghuma, 0.8, '#e8e4d8');
  const colors = { lawn: '#4b8a35', cricket: '#57983c', scrub: '#7a7550', paver: '#b9a68e', brickpave: '#a04a38' };
  for (const s of L.SURFACES) {
    g.fillStyle = colors[s.kind];
    if (s.ellipse) { g.beginPath(); g.ellipse(...s.ellipse, 0, 0, Math.PI * 2); g.fill(); } else { poly(g, s.pts); g.fill(); }
    g.save(); s.ellipse ? (g.beginPath(), g.ellipse(...s.ellipse, 0, 0, Math.PI * 2)) : poly(g, s.pts); g.clip();
    if (s.kind === 'lawn' || s.kind === 'cricket') { g.fillStyle = 'rgba(255,255,255,.05)'; for (let x = 0; x < IW; x += 22) g.fillRect(x, 0, 11, IH); }
    if (s.kind === 'paver' || s.kind === 'brickpave') { g.strokeStyle = 'rgba(70,45,30,.22)'; g.lineWidth = 0.3; for (let x = 0; x < IW; x += 1.1) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, IH); g.stroke(); } for (let y = 0; y < IH; y += 2.2) { g.beginPath(); g.moveTo(0, y); g.lineTo(IW, y); g.stroke(); } }
    if (s.kind === 'scrub') for (let i = 0; i < 3000; i++) { g.fillStyle = rand() < .5 ? '#5d5a3a' : '#958e62'; g.fillRect(150 + rand() * 650, 1430 + rand() * 470, 2.5, 2.5); }
    g.restore();
  }
  g.save(); g.translate(678, 485); g.rotate(-0.2); g.fillStyle = '#cdb88c'; g.fillRect(-6, -37, 12, 74); g.restore();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.6; g.beginPath(); g.ellipse(705, 505, 92, 131, 0, 0, Math.PI * 2); g.stroke();
  for (const p of L.PATHS) { line(g, p.pts, p.w / M + 1.5, '#8c7f6c'); line(g, p.pts, p.w / M, '#bdb09c'); }
  for (const r of internalRoads) { line(g, r, 23, '#c9c3b6'); line(g, r, 21.5, '#b6452f'); line(g, r, 19.5, '#55534f'); }
  for (const c of L.COURTS) court(g, c);
  g.fillStyle = 'rgba(70,64,58,.7)'; for (const fp of footprints) { fpPath(g, fp); g.fill(); }
  for (const b of L.BUILDINGS) if (b.court) {      // paved courtyards
    const ox = b.courtOff ? b.courtOff[0] : 0, oy = b.courtOff ? b.courtOff[1] : 0, a = (b.rot || 0) * Math.PI / 180;
    rectPath(g, b.x + ox * Math.cos(a) - oy * Math.sin(a), b.y + ox * Math.sin(a) + oy * Math.cos(a), b.court[0] + 14, b.court[1] + 14, b.rot || 0);
    g.fillStyle = '#c29f88'; g.fill();
  }
  g.restore();
}
function court(g, c) {
  const col = { basketball: '#3d8d82', tennis: '#b6593b', hardcourt: '#2f7a6b', badminton: '#2e9a6e', volleyball: '#c4a067' }[c.kind];
  g.save(); g.translate(c.x, c.y); g.rotate(c.rot * Math.PI / 180);
  g.fillStyle = col; g.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 0.4; const iw = c.w * 0.8, ih = c.h * 0.85;
  g.strokeRect(-iw / 2, -ih / 2, iw, ih); g.beginPath();
  if (c.h > c.w) { g.moveTo(-iw / 2, 0); g.lineTo(iw / 2, 0); g.moveTo(0, -ih * 0.27); g.lineTo(0, ih * 0.27); g.moveTo(-iw / 2, -ih * 0.27); g.lineTo(iw / 2, -ih * 0.27); g.moveTo(-iw / 2, ih * 0.27); g.lineTo(iw / 2, ih * 0.27); }
  else { g.moveTo(0, -ih / 2); g.lineTo(0, ih / 2); }
  g.stroke();
  if (c.kind === 'basketball') { g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(-iw / 2, 0, 20, -1.3, 1.3); g.stroke(); g.beginPath(); g.arc(iw / 2, 0, 20, Math.PI - 1.3, Math.PI + 1.3); g.stroke(); }
  g.restore();
}
const [groundC, gg] = cnv(IW * S, IH * S); drawGround(gg, satImg);
const groundTex = new THREE.CanvasTexture(groundC); groundTex.colorSpace = THREE.SRGBColorSpace; groundTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
const satTex = new THREE.Texture(satImg); satTex.colorSpace = THREE.SRGBColorSpace; satTex.needsUpdate = true; satTex.anisotropy = groundTex.anisotropy;
const detailTex = (() => { const [c, g] = cnv(256, 256); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 5000; i++) { const v = (rand() * 255) | 0; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(rand() * 256, rand() * 256, rr(1, 4), rr(1, 4)); } return tex(c, false); })();
const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1, envMapIntensity: 0.3 });
groundMat.onBeforeCompile = sh => {
  sh.uniforms.detail = { value: detailTex };
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D detail;')
    .replace('#include <map_fragment>', `#include <map_fragment>\n diffuseColor.rgb *= 0.72 + 0.56 * texture2D(detail, vMapUv * vec2(${(IW * M / 2.5).toFixed(1)}, ${(IH * M / 2.5).toFixed(1)})).r;`);
};
{
  const g = new THREE.Mesh(new THREE.PlaneGeometry(IW * M, IH * M), groundMat);
  g.rotation.x = -Math.PI / 2; const [cx, cz] = toW(IW / 2, IH / 2); g.position.set(cx, 0, cz); g.receiveShadow = true; scene.add(g);
  // farmland around the satellite tile: four flat planes framing it at ground level (no overlap, no z-fighting)
  const outerMat = new THREE.MeshStandardMaterial({ color: 0xb09872, roughness: 1 });
  const gw = IW * M, gh = IH * M, E = 3000;
  for (const [w, h, ox, oz] of [[gw + 2 * E, E, 0, -(gh + E) / 2], [gw + 2 * E, E, 0, (gh + E) / 2], [E, gh, -(gw + E) / 2, 0], [E, gh, (gw + E) / 2, 0]]) {
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), outerMat); o.rotation.x = -Math.PI / 2; o.position.set(cx + ox, 0, cz + oz); o.receiveShadow = true; scene.add(o);
  }
}

await stage('Planting neem trees & bougainvillea', 68);
// ---------------------------------------------------------------- trees (positions detected from the satellite canopy)
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), eu = new THREE.Euler();
{
  const [mc, mg] = cnv(IW, IH);
  mg.fillStyle = '#fff'; mg.strokeStyle = '#fff';
  for (const fp of footprints) { fpPath(mg, fp); mg.lineWidth = 12; mg.fill(); mg.stroke(); }
  for (const r of internalRoads) line(mg, r, 26, '#fff');
  for (const p of L.PATHS) line(mg, p.pts, p.w / M + 6, '#fff');
  for (const s of L.SURFACES) if (s.kind !== 'scrub') { if (s.ellipse) { mg.beginPath(); mg.ellipse(...s.ellipse, 0, 0, Math.PI * 2); mg.fill(); } else { poly(mg, s.pts); mg.fill(); } }
  for (const c of L.COURTS) { rectPath(mg, c.x, c.y, c.w + 10, c.h + 10, c.rot); mg.fill(); }
  mg.beginPath(); mg.arc(L.OAT.x, L.OAT.y, L.OAT.r + 6, 0, 7); mg.fill();
  rectPath(mg, L.PERGOLA.x, L.PERGOLA.y, L.PERGOLA.w + 6, L.PERGOLA.h + 6, 0); mg.fill();
  line(mg, L.BOUNDARY.concat([L.BOUNDARY[0]]), 8, '#fff');
  const mask = mg.getImageData(0, 0, IW, IH).data;
  const pts = TREES.filter(([x, y]) => mask[(y * IW + x) * 4] < 128), n = pts.length;

  const trunkG = new THREE.CylinderGeometry(0.14, 0.26, 1, 7, 4); trunkG.translate(0, 0.5, 0);
  { const cols = [], pos = trunkG.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const c = new THREE.Color(y < 0.22 ? 0xc4502e : 0x5a4636); cols.push(c.r, c.g, c.b); } trunkG.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); }
  const trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), n);
  // lumpy canopy: jittered icosphere with darker underside
  const crownG = new THREE.IcosahedronGeometry(1, 1);
  { const pos = crownG.attributes.position, cols = [], seen = new Map();
    for (let i = 0; i < pos.count; i++) { const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`; let j = seen.get(k); if (j === undefined) { j = 0.82 + rand() * 0.32; seen.set(k, j); } pos.setXYZ(i, pos.getX(i) * j, pos.getY(i) * j, pos.getZ(i) * j); const sh = 0.55 + 0.45 * (pos.getY(i) * 0.5 + 0.5); cols.push(sh, sh, sh); }
    crownG.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); crownG.computeVertexNormals(); }
  const crownM = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true, vertexColors: true, envMapIntensity: 0.4 });
  crownM.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('void main() {', 'void main() {\n float cd = distance(vWPos, cameraPosition);\n if (cd < 9.0) { float th = (cd - 3.0) / 6.0; if (fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898,78.233))) * 43758.5453) > th) discard; }');
  };
  const crowns = new THREE.InstancedMesh(crownG, crownM, n * 2);
  const greens = [0x3f6d30, 0x4b7b36, 0x335c2a, 0x5c8b3d, 0x6a8f3f, 0x2f5427, 0x7a9440].map(c => new THREE.Color(c));
  pts.forEach(([px, py, k], i) => {
    const [x, z] = toW(px, py), th = rr(2.6, 4.6) * k;
    m4.compose(pv.set(x, 0, z), q.identity(), sv.set(k, th, k)); trunks.setMatrixAt(i, m4);
    const r = rr(2.4, 3.9) * k, col = greens[(rand() * greens.length) | 0];
    for (let j = 0; j < 2; j++) {
      eu.set(rand() * 3, rand() * 3, rand() * 3); q.setFromEuler(eu);
      const off = j ? [rr(-1.6, 1.6), rr(-0.6, 0.8), rr(-1.6, 1.6)] : [0, 0, 0], rj = j ? r * rr(0.55, 0.75) : r;
      m4.compose(pv.set(x + off[0] * k, th + rj * 0.4 + off[1], z + off[2] * k), q, sv.set(rj, rj * 0.7, rj));
      crowns.setMatrixAt(i * 2 + j, m4); crowns.setColorAt(i * 2 + j, col.clone().offsetHSL(rr(-0.02, 0.02), 0, rr(-0.05, 0.05)));
    }
  });
  trunks.castShadow = crowns.castShadow = true; crowns.receiveShadow = true;
  scene.add(trunks, crowns);
  for (const [px, py] of pts) { const [x, z] = toW(px, py); colliders.push([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]]); }

  // bougainvillea hugging buildings and the gate wall
  const bushes = [], bcols = [0xe0368a, 0xc4237a, 0xf0569e, 0xe8803a, 0xd23a6a].map(c => new THREE.Color(c));
  for (const fp of footprints) for (let k = 0; k < 3; k++) {
    const i = (rand() * fp.length) | 0, a = fp[i], b = fp[(i + 1) % fp.length], t = rand();
    const cx = fp.reduce((s, p) => s + p[0], 0) / fp.length, cz = fp.reduce((s, p) => s + p[1], 0) / fp.length;
    let x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; const dl = Math.hypot(x - cx, z - cz) || 1; x += (x - cx) / dl * 1.6; z += (z - cz) / dl * 1.6;
    bushes.push([x, z, rr(0.9, 1.7)]);
  }
  { // bougainvillea along the wall either side of the gate, never in the gateway itself
    const len = Math.hypot(L.GATE.b[0] - L.GATE.a[0], L.GATE.b[1] - L.GATE.a[1]), gw = L.GATE.width / M / 2 / len + 0.06;
    for (let k = 0; k < 16; k++) { let t = rr(-0.3, 1.2); if (Math.abs(t - L.GATE.at) < gw) t = L.GATE.at + Math.sign(t - L.GATE.at || 1) * (gw + rr(0, 0.15)); const [x, z] = toW(...lerp2(L.GATE.a, L.GATE.b, t)); bushes.push([x + rr(0.6, 1.5), z, rr(1.1, 2)]); }
  }
  const bm = new THREE.InstancedMesh(crownG, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true, vertexColors: true }), bushes.length);
  bushes.forEach(([x, z, r], i) => { m4.compose(pv.set(x, r * 0.7, z), q.identity(), sv.set(r, r * 0.85, r)); bm.setMatrixAt(i, m4); bm.setColorAt(i, bcols[(rand() * bcols.length) | 0]); });
  bm.castShadow = true; scene.add(bm);
}

// ---------------------------------------------------------------- labels
const labelGroup = new THREE.Group(); scene.add(labelGroup);
const labelAnchors = [];
for (const l of extras.labels) {
  const d = document.createElement('div'); d.className = 'label' + (l.low ? ' low' : '');
  d.innerHTML = `<b>${l.name}</b>${l.sub ? `<span>${l.sub}</span>` : ''}`;
  const o = new CSS2DObject(d); o.position.set(l.x, l.y, l.z); labelGroup.add(o);
  labelAnchors.push({ name: l.name, x: l.x, z: l.z, el: d, obj: o });
}

await stage('Painting signboards & marking courts', 82);
// ---------------------------------------------------------------- sports + props
function addMesh(geo, material, x, y, z, ry = 0) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m); return m; }
const fenceMat = new THREE.MeshStandardMaterial({ color: 0x2f6e46, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
for (const c of L.COURTS) {
  const [x, z] = toW(c.x, c.y), w = c.w * M, h = c.h * M;
  if (c.kind === 'basketball') for (const sgn of [-1, 1]) {
    const px = x + sgn * (w / 2 - 1.2);
    addMesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4), MAT.white, px + sgn * 0.7, 1.7, z);
    addMesh(new THREE.BoxGeometry(0.06, 1.05, 1.8), MAT.white, px, 3.3, z);
    addMesh(new THREE.TorusGeometry(0.23, 0.02, 6, 16).rotateX(Math.PI / 2), MAT.orange, px - sgn * 0.3, 3.05, z);
  }
  if (c.kind === 'tennis' || c.kind === 'hardcourt') {
    const vert = c.h > c.w;
    addMesh(new THREE.BoxGeometry(vert ? w * 0.85 : 0.04, 1, vert ? 0.04 : h * 0.85), fenceMat, x, 0.5, z);
    for (const [dx, dz, ww, dd] of [[0, -h / 2, w, 0.05], [0, h / 2, w, 0.05], [-w / 2, 0, 0.05, h], [w / 2, 0, 0.05, h]]) addMesh(new THREE.BoxGeometry(ww, 3.5, dd), fenceMat, x + dx, 1.75, z + dz);
  }
  if (c.kind === 'badminton' || c.kind === 'volleyball') {      // open courts: net top at 1.55 m (badminton) / 2.43 m (volleyball)
    const vert = c.h > c.w, span = (vert ? w : h) * (c.kind === 'volleyball' ? 1.1 : 0.85), top = c.kind === 'volleyball' ? 2.43 : 1.55, nh = c.kind === 'volleyball' ? 1.0 : 0.75;
    addMesh(new THREE.BoxGeometry(vert ? span : 0.03, nh, vert ? 0.03 : span), fenceMat, x, top - nh / 2, z);
    for (const s of [-1, 1]) addMesh(new THREE.CylinderGeometry(0.04, 0.04, top), MAT.white, x + (vert ? s * span / 2 : 0), top / 2, z + (vert ? 0 : s * span / 2));
  }
}
function signTexture(draw, w, h) { const [c, g] = cnv(w, h); draw(g, w, h); return tex(c); }
const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b3f44, roughness: 0.5, metalness: 0.6 });
const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffe2a8, emissiveIntensity: 0.6 });
const potMat = new THREE.MeshStandardMaterial({ color: 0xc8a27a, roughness: 0.9 });
const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6f7a3c, roughness: 0.9 });
const frondMat = new THREE.MeshStandardMaterial({ color: 0x4f8a2e, roughness: 0.8, side: THREE.DoubleSide });
const frondGeo = new THREE.PlaneGeometry(0.22, 1.0, 1, 3).rotateX(-Math.PI / 2).translate(0, 0, 0.5);
for (const pr of L.PROPS) {
  const [x, z] = toW(pr.x, pr.y), ry = -(pr.rot || 0) * Math.PI / 180;
  if (pr.kind === 'micaSign') {
    const t = signTexture((g, w, h) => {
      g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e2231a'; g.beginPath(); g.moveTo(w / 2, 22); g.lineTo(w / 2 + 70, 150); g.lineTo(w / 2 - 70, 150); g.closePath(); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 - 30, 120); g.lineTo(w / 2 + 40, 95); g.stroke();
      g.fillStyle = '#222'; g.font = '600 64px system-ui'; g.textAlign = 'center'; g.fillText('MICA', w / 2, 220); g.font = '22px system-ui'; g.fillText('THE SCHOOL OF IDEAS', w / 2, 255);
    }, 384, 280);
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; scene.add(grp);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.75, 0.08), [MAT.white, MAT.white, MAT.white, MAT.white, new THREE.MeshStandardMaterial({ map: t }), MAT.white]);
    board.position.y = 2.4; board.castShadow = true; grp.add(board);
    for (const dx of [-0.9, 0.9]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4), MAT.white); pole.position.set(dx, 1.2, -0.06); grp.add(pole); }
  }
  if (pr.kind === 'directionSign') {
    const lines = ['MAIN PARKING ↑', 'RECEPTION ↑', 'MAIN ACADEMIC BLOCK ↑', 'AUDITORIUM ↑', 'DIGICOMM CENTRE ↑', 'ACADEMIC BLOCK ↑', 'PROGRAMMES & ADMIN ↑', 'KEIC (LIBRARY) ↑', 'OPEN AIR THEATRE ↑', 'SEMINAR HALLS ↑', 'DINING HALL ↑', '← SPORTS COMPLEX', "← DIRECTOR'S BUNGALOW", '← GUEST HOUSE', '← CHOTA CANTEEN', '← STUDENT HOSTELS', '← CRICKET FIELD'];
    const t = signTexture((g, w, h) => { g.fillStyle = '#8a3b2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f3e6dc'; g.font = '600 19px system-ui'; lines.forEach((l, i) => g.fillText(l, 60, 34 + i * 25)); g.save(); g.translate(34, h / 2); g.rotate(-Math.PI / 2); g.font = '600 30px system-ui'; g.textAlign = 'center'; g.fillText('MICA', 0, 0); g.restore(); }, 320, 460);
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; scene.add(grp);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.7, 0.05), [MAT.black, MAT.black, MAT.black, MAT.black, new THREE.MeshStandardMaterial({ map: t }), MAT.black]);
    board.position.y = 1.9; grp.add(board); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8), MAT.black); pole.position.set(0.5, 1.4, -0.05); grp.add(pole);
  }
  if (pr.kind === 'questionWall') {
    const t = signTexture((g, w, h) => {
      g.fillStyle = '#eceae4'; g.fillRect(0, 0, w, h); g.font = '700 70px system-ui'; g.textBaseline = 'middle';
      const cs = ['#e2231a', '#1f6fd1', '#f4a300', '#2a9d4b', '#8b3fc7']; let px = 30;
      for (const ch of 'QUESTION EVERYTHING') { g.fillStyle = cs[(rand() * cs.length) | 0]; g.fillText(ch, px, h / 2); px += ch === ' ' ? 26 : 50; }
    }, 1024, 128);
    addMesh(new THREE.BoxGeometry(14, 1.8, 0.3), [MAT.white, MAT.white, MAT.white, MAT.white, new THREE.MeshStandardMaterial({ map: t }), MAT.white], x, 0.9, z, ry);
    colliders.push([[x - 7, z - 0.2], [x + 7, z - 0.2], [x + 7, z + 0.2], [x - 7, z + 0.2]]);
  }
  if (pr.kind === 'benches') for (let i = 0; i < 14; i++) addMesh(new THREE.BoxGeometry(rr(1.6, 2.6), 0.45, 0.6), MAT.orange, x + rr(-20, 20), 0.225, z + rr(-5, 5), rr(0, 3));
  if (pr.kind === 'goal') {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; scene.add(grp);
    for (const dx of [-3.6, 3.6]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), MAT.white); post.position.set(dx, 1.2, 0); grp.add(post); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.12, 0.12), MAT.white); bar.position.y = 2.4; grp.add(bar);
  }
  if (pr.kind === 'chhotaPlaza') {     // Chhota hangout: LED-wrapped trees on round brick planters, string lights, swings, charpoys, stools, art wall
    const led = new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff0c4, emissiveIntensity: 1.4 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.8 }), redP = new THREE.MeshStandardMaterial({ color: 0xd8262a, roughness: 0.55 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x9a6a3c, roughness: 0.85 }), bark = new THREE.MeshStandardMaterial({ color: 0x5e4a3a, roughness: 1 });
    const leaf = new THREE.MeshStandardMaterial({ color: 0x46782f, roughness: 0.95, flatShading: true }), rope = new THREE.MeshStandardMaterial({ color: 0xcdb68c });
    const trees = [[-3.2, -8], [2.6, -3.8], [-3.2, 0.6], [2.6, 4.6], [-3.2, 8.4]].map(([dx, dz]) => [x + dx, z + dz]);   // staggered down the N-S plaza
    for (const [tx, tz] of trees) {
      addMesh(new THREE.CylinderGeometry(1.7, 1.8, 0.45, 20), MAT.orange, tx, 0.225, tz);
      addMesh(new THREE.CylinderGeometry(0.22, 0.32, 5, 8), bark, tx, 2.5, tz);
      const helix = new THREE.CatmullRomCurve3([...Array(40)].map((_, i) => new THREE.Vector3(Math.cos(i * 0.9) * 0.3, 0.5 + i * 0.09, Math.sin(i * 0.9) * 0.3)));
      addMesh(new THREE.TubeGeometry(helix, 160, 0.035, 5), led, tx, 0, tz);
      addMesh(new THREE.IcosahedronGeometry(3.6, 1), leaf, tx, 6.2, tz).scale.set(1, 0.7, 1);
      colliders.push([[tx - 1.6, tz - 1.6], [tx + 1.6, tz - 1.6], [tx + 1.6, tz + 1.6], [tx - 1.6, tz + 1.6]]);
    }
    for (let i = 0; i < trees.length; i++) {          // string lights sagging between the trees
      const [ax, az] = trees[i], [bx, bz] = trees[(i + 1) % trees.length];
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(ax, 4.3, az), new THREE.Vector3((ax + bx) / 2, 3.5, (az + bz) / 2), new THREE.Vector3(bx, 4.3, bz));
      addMesh(new THREE.TubeGeometry(curve, 30, 0.03, 4), led, 0, 0, 0).castShadow = false;
    }
    for (const [tx, tz] of [trees[0], trees[2]]) {    // swings hung from a low branch
      addMesh(new THREE.CylinderGeometry(0.12, 0.15, 3, 6).rotateZ(Math.PI / 2), bark, tx + 1.6, 3.4, tz);
      for (const dz of [-0.3, 0.3]) addMesh(new THREE.CylinderGeometry(0.015, 0.015, 2.8), rope, tx + 2.4, 2.0, tz + dz);
      addMesh(new THREE.BoxGeometry(0.5, 0.06, 0.75), wood, tx + 2.4, 0.6, tz);
    }
    for (const [dx, dz, r] of [[0.6, -6.2, 1.5], [-0.4, 2.6, 1.4], [3.6, 7.6, 0.2]]) {   // blue charpoys
      const g = new THREE.Group(); g.position.set(x + dx, 0, z + dz); g.rotation.y = r; scene.add(g);
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.9), blue); top.position.y = 0.45; top.castShadow = true; g.add(top);
      for (const [lx, lz] of [[-0.9, -0.4], [0.9, -0.4], [0.9, 0.4], [-0.9, 0.4]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.07), blue); l.position.set(lx, 0.22, lz); g.add(l); }
    }
    for (let i = 0; i < 10; i++) addMesh(new THREE.CylinderGeometry(0.17, 0.14, 0.45, 10), redP, x + rr(-1.2, 4.8), 0.225, z + rr(-9, 9));          // plastic stools
    for (let i = 0; i < 4; i++) addMesh(new THREE.BoxGeometry(1.0, 0.45, 0.5), wood, x + rr(-1, 4.5), 0.225, z + rr(-8, 8), rr(0, 3));          // crate benches
    const t = signTexture((g, w, h) => {              // the Chhota art wall: painted tiles + Pac-Man "LEVEL UP"
      g.fillStyle = '#f2efe8'; g.fillRect(0, 0, w, h);
      const cs = ['#e2231a', '#1f6fd1', '#f4a300', '#2a9d4b', '#8b3fc7', '#ff7fae', '#20b2aa', '#333'];
      for (let yy = 8; yy < h - 40; yy += 46) for (let xx = 8; xx < w; xx += 46) if (rand() < 0.8) { g.fillStyle = cs[(rand() * cs.length) | 0]; g.fillRect(xx, yy, 40, 40); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(xx + 6 + rand() * 20, yy + 6 + rand() * 20, 10, 10); }
      g.fillStyle = '#f7c614'; g.beginPath(); g.moveTo(w * 0.55, h * 0.45); g.arc(w * 0.55, h * 0.45, h * 0.33, 0.6, Math.PI * 2 - 0.6); g.closePath(); g.fill();
      g.fillStyle = '#f7c614'; g.font = `800 ${h * 0.16}px Archivo, system-ui`; g.textAlign = 'center'; g.fillText('LEVEL UP', w * 0.55, h * 0.95);
    }, 1024, 200);
    const [wx, wz] = toW(901, 957);                   // along the plaza's north edge, painted face looking south over Chhota
    addMesh(new THREE.BoxGeometry(11, 2.4, 0.3), [MAT.white, MAT.white, MAT.white, MAT.white, new THREE.MeshStandardMaterial({ map: t }), MAT.white], wx, 1.2, wz);
    colliders.push([[wx - 5.5, wz - 0.2], [wx + 5.5, wz - 0.2], [wx + 5.5, wz + 0.2], [wx - 5.5, wz + 0.2]]);
  }
  if (pr.kind === 'carShade') {        // steel car shade over the parking row
    const steel = new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.5, metalness: 0.6 }), len = pr.len;
    for (let dx = -len / 2; dx <= len / 2 + 0.01; dx += 6) { addMesh(new THREE.BoxGeometry(0.15, 2.9, 0.15), steel, x + dx, 1.45, z - 2.4); addMesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), steel, x + dx, 1.25, z + 2.4); }
    addMesh(new THREE.BoxGeometry(len + 1, 0.08, 5.6), steel, x, 2.75, z).rotation.x = -0.075;
  }
  if (pr.kind === 'streetlight') {     // dark grey pole with a bent arm and LED head (as in the Shishya Gramah photos)
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; scene.add(grp);
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 6, 0.14), poleMat); pole.position.y = 3; pole.castShadow = true; grp.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.6), poleMat); arm.position.set(0, 6.25, 0.7); arm.rotation.x = -0.35; grp.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.5), lampMat); head.position.set(0, 6.5, 1.45); grp.add(head);
  }
  if (pr.kind === 'palm') {          // young areca palm in a terracotta pot
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = rr(0, 6); scene.add(grp);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 12), potMat); pot.position.y = 0.25; pot.castShadow = true; grp.add(pot);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.8, 6), palmTrunkMat); trunk.position.y = 1.35; grp.add(trunk);
    for (let i = 0; i < 7; i++) {
      const frond = new THREE.Mesh(frondGeo, frondMat); frond.position.y = 2.2; frond.rotation.set(0, i / 7 * Math.PI * 2, 0);
      frond.rotateX(-0.3 - rr(0, 0.45)); frond.castShadow = true; grp.add(frond);
    }
  }
}
for (const s of L.SURFACES) if (s.label) {
  const [px, py] = s.ellipse ? s.ellipse : [s.pts.reduce((a, p) => a + p[0], 0) / s.pts.length, s.pts.reduce((a, p) => a + p[1], 0) / s.pts.length];
  addTextLabel(s.name, null, ...toW(px, py), 2.5);
}
for (const c of L.COURTS) if (c.name) addTextLabel(c.name, null, ...toW(c.x, c.y), 3);
function addTextLabel(name, sub, x, z, y) {
  const d = document.createElement('div'); d.className = 'label'; d.innerHTML = `<b>${name}</b>${sub ? `<span>${sub}</span>` : ''}`;
  const o = new CSS2DObject(d); o.position.set(x, y, z); labelGroup.add(o); labelAnchors.push({ name, x, z, el: d, obj: o });
}

await stage('Parking your car on Telav–Ghuma Road', 92);
// ---------------------------------------------------------------- player
const player = new THREE.Group(); scene.add(player);
const P = { vel: new THREE.Vector3(), yaw: 0, onGround: true, walk: 0 };
const body = {};
{
  const skin = new THREE.MeshStandardMaterial({ color: 0xb98563, roughness: 0.7 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xe2231a, roughness: 0.85 });
  const jeans = new THREE.MeshStandardMaterial({ color: 0x31435e, roughness: 0.9 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x1b1410, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.42, 6, 12), shirt); torso.position.y = 1.2; torso.scale.z = 0.68;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 10), skin); neck.position.y = 1.52;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), skin); head.position.y = 1.65; head.scale.set(0.92, 1.1, 1);
  const hr = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), hair); hr.position.y = 1.68; hr.scale.set(0.95, 1.05, 1.05);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.14), MAT.black); pack.position.set(0, 1.2, -0.2);
  const limb = (r, h, m) => { const g = new THREE.CapsuleGeometry(r, h, 4, 8); g.translate(0, -h / 2 - r, 0); return new THREE.Mesh(g, m); };
  body.legL = limb(0.075, 0.72, jeans); body.legL.position.set(-0.1, 0.9, 0);
  body.legR = limb(0.075, 0.72, jeans); body.legR.position.set(0.1, 0.9, 0);
  body.armL = limb(0.05, 0.5, skin); body.armL.position.set(-0.27, 1.43, 0);
  body.armR = limb(0.05, 0.5, skin); body.armR.position.set(0.27, 1.43, 0);
  const sl = (x) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.12, 4, 8), shirt); m.position.set(x, 1.36, 0); return m; };
  for (const m of [torso, neck, head, hr, pack, body.legL, body.legR, body.armL, body.armR, sl(-0.27), sl(0.27)]) { m.castShadow = true; player.add(m); }
  const [sx, sz] = toW(L.SPAWN.x, L.SPAWN.y); player.position.set(sx, 0, sz);
  P.yaw = -L.SPAWN.facing * Math.PI / 180 + Math.PI / 2;
}

// ---------------------------------------------------------------- post-processing (ambient occlusion)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
gtao.updateGtaoMaterial({ radius: 1.2, distanceExponent: 1.5, thickness: 1.5, scale: 1.2 });
gtao.blendIntensity = 0.9;
composer.addPass(gtao);
composer.addPass(new OutputPass());
let useAO = true;

// ---------------------------------------------------------------- input + camera
const keys = {};
const cam = { yaw: P.yaw + Math.PI, pitch: 0.3, dist: 7, overview: false };
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyL') labelGroup.visible = !labelGroup.visible;
  if (e.code === 'KeyM') { groundMat.map = groundMat.map === groundTex ? satTex : groundTex; groundMat.needsUpdate = true; }
  if (e.code === 'KeyT') { timeIdx = (timeIdx + 1) % TIMES.length; applyTime(); }
  if (e.code === 'KeyO') useAO = !useAO;
  if (e.code === 'KeyV') { cam.overview = !cam.overview; cam.dist = cam.overview ? 260 : 7; cam.pitch = cam.overview ? 1.15 : 0.3; }
  if (e.code === 'KeyH') { const h = document.getElementById('help'); h.style.display = h.style.display === 'none' ? '' : 'none'; }
  if (e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', e => keys[e.code] = false);
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', e => {
  if (!drag) return; cam.yaw -= (e.clientX - drag[0]) * 0.005; cam.pitch = THREE.MathUtils.clamp(cam.pitch + (e.clientY - drag[1]) * 0.004, -0.25, 1.45); drag = [e.clientX, e.clientY];
});
addEventListener('pointerup', () => drag = null);
renderer.domElement.addEventListener('wheel', e => { cam.dist = THREE.MathUtils.clamp(cam.dist * (1 + Math.sign(e.deltaY) * 0.12), 2.5, 380); }, { passive: true });

const windCache = new WeakMap();
function windingSign(poly) { let s = windCache.get(poly); if (s === undefined) { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q2 = poly[(i + 1) % poly.length]; a += p[0] * q2[1] - q2[0] * p[1]; } s = Math.sign(a); windCache.set(poly, s); } return s; }
function collide(pos, r) {
  for (let iter = 0; iter < 2; iter++) for (const poly of colliders) {
    const p0 = poly[0]; if (Math.abs(p0[0] - pos.x) > 60 || Math.abs(p0[1] - pos.z) > 60) continue;
    let inside = true, best = Infinity, bx = 0, bz = 0; const ws = windingSign(poly);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ez = b[1] - a[1], len2 = ex * ex + ez * ez || 1;
      const t = THREE.MathUtils.clamp(((pos.x - a[0]) * ex + (pos.z - a[1]) * ez) / len2, 0, 1), cx = a[0] + ex * t, cz = a[1] + ez * t, d = Math.hypot(pos.x - cx, pos.z - cz);
      if (d < best) { best = d; bx = cx; bz = cz; }
      if ((ex * (pos.z - a[1]) - ez * (pos.x - a[0])) * ws < 0) inside = false;
    }
    if (inside) { const dx = bx - pos.x, dz = bz - pos.z, d = Math.hypot(dx, dz) || 1; pos.x = bx + dx / d * r; pos.z = bz + dz / d * r; }
    else if (best < r) { const dx = pos.x - bx, dz = pos.z - bz; pos.x = bx + dx / best * r; pos.z = bz + dz / best * r; }
  }
}

// ---------------------------------------------------------------- minimap
const mm = document.getElementById('minimap'), mg2 = mm.getContext('2d');
function drawMinimap() {
  const w = mm.width, h = mm.height, [px, py] = toPx(player.position.x, player.position.z), s = w / 700;
  mg2.save(); mg2.clearRect(0, 0, w, h); mg2.translate(w / 2, h / 2); mg2.scale(s / S, s / S); mg2.translate(-px * S, -py * S); mg2.drawImage(groundC, 0, 0); mg2.restore();
  mg2.save(); mg2.translate(w / 2, h / 2); mg2.rotate(-P.yaw + Math.PI); mg2.fillStyle = '#e2231a'; mg2.strokeStyle = '#fff'; mg2.lineWidth = 1.5;
  mg2.beginPath(); mg2.moveTo(0, -8); mg2.lineTo(6, 6); mg2.lineTo(-6, 6); mg2.closePath(); mg2.fill(); mg2.stroke(); mg2.restore();
}

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock(), nearEl = document.getElementById('near'), ray = new THREE.Raycaster(), tmp = new THREE.Vector3(), camTarget = new THREE.Vector3();
let mmTimer = 0;
const intro = initIntro({ scene, camera, player, body, P, cam, labelGroup, colliders, gate, setTime: i => { if (timeIdx !== i) { timeIdx = i; applyTime(); } } });
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateGate(dt, intro.state === 'play');
  if (intro.state !== 'play') {                 // title screen / cutscene own the camera
    const f = intro.update(dt);
    if (f) { Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90 }); sun.shadow.camera.updateProjectionMatrix(); sun.position.copy(f).addScaledVector(sunDir, 300); sun.target.position.copy(f); }
    if (useAO && camera.position.y < 40) composer.render(); else renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(tick);
    return;
  }
  const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const str = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const speed = keys.ShiftLeft || keys.ShiftRight ? 7 : 2.8;
  if (fwd || str) {
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = -fz, rz = fx;
    const mx = fx * fwd + rx * str, mz = fz * fwd + rz * str, ml = Math.hypot(mx, mz);
    player.position.x += mx / ml * speed * dt; player.position.z += mz / ml * speed * dt;
    let d = Math.atan2(mx, mz) - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 12);
    P.walk += dt * speed * 2.8;
  } else P.walk *= 0.85;
  if (keys.Space && P.onGround) { P.vel.y = 4.5; P.onGround = false; }
  P.vel.y -= 12 * dt; player.position.y += P.vel.y * dt;
  if (player.position.y <= 0) { player.position.y = 0; P.vel.y = 0; P.onGround = true; }
  collide(player.position, 0.35);
  player.rotation.y = P.yaw;
  const sw = Math.sin(P.walk) * (fwd || str ? 0.55 : 0.03);
  body.legL.rotation.x = sw; body.legR.rotation.x = -sw; body.armL.rotation.x = -sw * 0.8; body.armR.rotation.x = sw * 0.8;

  camTarget.set(player.position.x, player.position.y + 1.55, player.position.z);
  const cp = Math.cos(cam.pitch), want = tmp.set(Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp);
  let dist = cam.dist;
  if (dist < 60) { ray.set(camTarget, want); ray.far = dist; const hit = ray.intersectObjects(buildingMeshes, false)[0]; if (hit) dist = Math.max(1.0, hit.distance - 0.3); }
  camera.position.copy(camTarget).addScaledVector(want, dist);
  if (camera.position.y < 0.3) camera.position.y = 0.3;
  camera.lookAt(camTarget);

  // sun follows the player so the shadow map stays sharp
  const sd = cam.dist > 60 ? 260 : 80;
  Object.assign(sun.shadow.camera, { left: -sd, right: sd, top: sd, bottom: -sd }); sun.shadow.camera.updateProjectionMatrix();
  sun.position.copy(player.position).addScaledVector(sunDir, 300); sun.target.position.copy(player.position);

  document.body.classList.toggle('far', cam.dist > 30);
  let near = null, nd = 40;
  for (const a of labelAnchors) {
    const d = Math.hypot(a.x - player.position.x, a.z - player.position.z);
    a.obj.visible = cam.dist > 60 ? true : d < 75;
    a.el.style.opacity = cam.dist > 60 ? 0.95 : Math.max(0, Math.min(1, (75 - d) / 35));
    if (d < nd) { nd = d; near = a.name; }
  }
  nearEl.textContent = near ? `Near: ${near}` : 'Walking around MICA';
  if ((mmTimer += dt) > 0.1) { mmTimer = 0; drawMinimap(); }
  if (useAO && cam.dist < 60) composer.render(); else renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(tick);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight); });
// loading done: the overlay swaps its loader for "Click to start" and reveals the orbiting campus behind it
await stage('Campus ready', 100);
await new Promise(r => setTimeout(r, 350));       // let the bar visibly reach 100%
intro.showTitle();
window.__mica = { player, cam, colliders, scene, renderer, toW, intro, camera, gate };
tick();
