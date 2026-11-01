// Shared building kit: procedural PBR textures, materials, batched geometry and local-frame helpers.
import * as THREE from 'three';
import * as L from './layout.js';

export const M = L.M_PER_PX;
export const FH = L.FLOOR_H;
const [OX, OY] = L.ORIGIN_PX;
export const toW = (px, py) => [(px - OX) * M, (py - OY) * M];
export const toPx = (x, z) => [x / M + OX, z / M + OY];

let seed = 11;
export function rand() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
export const rr = (a, b) => a + rand() * (b - a);
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- textures
export function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
let ANISO = 8;
export function setAniso(a) { ANISO = a; }
export function tex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
// height canvas (grey) -> tangent-space normal map
function normalFrom(hc, strength = 2) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const [c, g] = cnv(w, h), out = g.createImageData(w, h), H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x - 1, y) - H(x + 1, y)) * strength, dy = (H(x, y - 1) - H(x, y + 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    out.data[i] = (dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0); return tex(c, false);
}
function brickSet() {
  const S = 512, ppm = S / 1.6, [c, g] = cnv(S, S), [hc, hg] = cnv(S, S);
  g.fillStyle = '#8e8a82'; g.fillRect(0, 0, S, S); hg.fillStyle = '#202020'; hg.fillRect(0, 0, S, S);
  const ch = 0.085 * ppm, bw = 0.235 * ppm;
  for (let r = 0, y = 0; y < S - 1; r++, y += ch) for (let x = -(r % 2) * bw / 2; x < S; x += bw) {
    const l = 36 + rand() * 13, s = 44 + rand() * 16, hue = 12 + rand() * 9;
    g.fillStyle = `hsl(${hue},${s}%,${l}%)`; g.fillRect(x + 1.3, y + 1.3, bw - 2.6, ch - 2.4);
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${rand() < .5 ? '60,30,20' : '230,170,140'},${rand() * .18})`; g.fillRect(x + rand() * bw, y + rand() * ch, rr(2, 6), rr(1, 3)); }
    const hv = 150 + rand() * 60; hg.fillStyle = `rgb(${hv},${hv},${hv})`; hg.fillRect(x + 1.3, y + 1.3, bw - 2.6, ch - 2.4);
  }
  // weathering streaks
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(40,30,25,${rand() * .06})`; g.fillRect(rand() * S, 0, rr(3, 14), S); }
  return { map: tex(c), normalMap: normalFrom(hc, 3.5) };
}
function noiseSet(base, spots, n, strength = 1.5, S = 256, sz = 4) {
  const [c, g] = cnv(S, S), [hc, hg] = cnv(S, S);
  g.fillStyle = base; g.fillRect(0, 0, S, S); hg.fillStyle = '#808080'; hg.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    const x = rand() * S, y = rand() * S, w = sz * rand() + 1, h = sz * rand() + 1;
    g.globalAlpha = rand() * 0.35; g.fillStyle = spots[(rand() * spots.length) | 0]; g.fillRect(x, y, w, h);
    hg.globalAlpha = 0.5; const v = (rand() * 255) | 0; hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(x, y, w, h);
  }
  g.globalAlpha = hg.globalAlpha = 1;
  return { map: tex(c), normalMap: normalFrom(hc, strength) };
}
function tileRoof() {
  const [c, g] = cnv(256, 256), [hc, hg] = cnv(256, 256); g.fillStyle = '#8e3a2a'; g.fillRect(0, 0, 256, 256); hg.fillStyle = '#000'; hg.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) for (let x = (y / 16 % 2) * 8; x < 256; x += 16) {
    g.fillStyle = `hsl(${8 + rand() * 8},${45 + rand() * 15}%,${30 + rand() * 12}%)`; g.fillRect(x, y, 15, 15);
    const gr = hg.createLinearGradient(0, y, 0, y + 15); gr.addColorStop(0, '#333'); gr.addColorStop(1, '#eee'); hg.fillStyle = gr; hg.fillRect(x, y, 15, 15);
  }
  return { map: tex(c), normalMap: normalFrom(hc, 4) };
}
function ribbed(base, rib, vertical = true) {
  const [c, g] = cnv(64, 64), [hc, hg] = cnv(64, 64); g.fillStyle = base; g.fillRect(0, 0, 64, 64); hg.fillStyle = '#000'; hg.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 64; i += 16) { g.fillStyle = rib; vertical ? g.fillRect(i, 0, 4, 64) : g.fillRect(0, i, 64, 4); hg.fillStyle = '#fff'; vertical ? hg.fillRect(i, 0, 5, 64) : hg.fillRect(0, i, 64, 5); }
  return { map: tex(c), normalMap: normalFrom(hc, 3) };
}
function panelSet() {
  const [c, g] = cnv(128, 128), [hc, hg] = cnv(128, 128); g.fillStyle = '#dcd8cc'; g.fillRect(0, 0, 128, 128); hg.fillStyle = '#ccc'; hg.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 64) { g.fillStyle = '#b9b5aa'; g.fillRect(x, 0, 2, 128); hg.fillStyle = '#000'; hg.fillRect(x, 0, 2, 128); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(120,110,90,${rand() * .08})`; g.fillRect(rand() * 128, rand() * 128, 3, 3); }
  return { map: tex(c), normalMap: normalFrom(hc, 2) };
}

const ENV = { intensity: 0.6 };
export let MAT, TILE;
export function initMaterials(renderer) {
  setAniso(renderer.capabilities.getMaxAnisotropy());
  const std = (set, o = {}) => new THREE.MeshStandardMaterial({ ...set, roughness: 0.9, metalness: 0, envMapIntensity: ENV.intensity, ...o });
  const col = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, envMapIntensity: ENV.intensity, ...o });
  MAT = {
    brick: std(brickSet(), { normalScale: new THREE.Vector2(0.9, 0.9) }),
    concrete: std(noiseSet('#b9b4aa', ['#8f8a80', '#d8d3c8', '#6f6a62'], 2500, 1.2)),
    plaster: std(noiseSet('#e2d6bc', ['#c4b493', '#f0e6d0'], 1200, 0.6)),
    roofWhite: std(noiseSet('#e4e1d9', ['#b8b2a6', '#9b958a', '#fff'], 1800, 0.8)),
    roofGrey: std(noiseSet('#8f8c86', ['#6f6c66', '#a5a29b'], 1800, 0.8)),
    tile: std(tileRoof()),
    sheet: std(ribbed('#3f7d55', '#2f6343'), { roughness: 0.45, metalness: 0.35 }),
    redSheet: std(ribbed('#a5372b', '#7f2a21'), { roughness: 0.5, metalness: 0.3 }),
    panel: std(panelSet(), { roughness: 0.6 }),
    paver: std(noiseSet('#b98f78', ['#8f6a58', '#d4ab94'], 1500, 1)),
    glass: new THREE.MeshStandardMaterial({ color: 0x24313b, roughness: 0.06, metalness: 0.9, envMapIntensity: 1.4 }),
    frame: col(0x3a3d40, { roughness: 0.5, metalness: 0.6 }),
    door: col(0x5a3b26, { roughness: 0.7 }),
    doorBlue: col(0x3d5a78, { roughness: 0.6 }),
    red: col(0xc8261e, { roughness: 0.55 }),
    white: col(0xf0efea, { roughness: 0.6 }),
    black: col(0x1c1c1c, { roughness: 0.6 }),
    timber: col(0xb8692e, { roughness: 0.6 }),
    rail: col(0x2a2c2e, { roughness: 0.4, metalness: 0.7 }),
    orange: col(0xc8582f, { roughness: 0.85 }),
    saffron: col(0xff8a1f, { roughness: 0.8, side: THREE.DoubleSide }),
    cloth: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
  };
  // world-space tile size (m) per material for UVs
  TILE = { brick: [1.6, 1.6], concrete: [3, 3], plaster: [3, 3], roofWhite: [6, 6], roofGrey: [6, 6], tile: [2.5, 2.5], sheet: [1.2, 1.2], redSheet: [1.2, 1.2],
    panel: [2.4, 2.4], paver: [2, 2], glass: [2, 2], frame: [1, 1], door: [1, 1], doorBlue: [1, 1], red: [1, 1], white: [1, 1], black: [1, 1], timber: [1, 1], rail: [1, 1], orange: [1, 1] };
  return MAT;
}

// ---------------------------------------------------------------- batched geometry
class Batch {
  constructor() { this.p = []; this.n = []; this.uv = []; }
  tri(a, b, c, ua, ub, uc) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    for (const [v, u] of [[a, ua], [b, ub], [c, uc]]) { this.p.push(v.x, v.y, v.z); this.n.push(n.x, n.y, n.z); this.uv.push(u[0], u[1]); }
  }
  quad(a, b, c, d, ua, ub, uc, ud, out) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (out && n.dot(out) < 0) { this.tri(a, c, b, ua, uc, ub); this.tri(a, d, c, ua, ud, uc); }
    else { this.tri(a, b, c, ua, ub, uc); this.tri(a, c, d, ua, uc, ud); }
  }
}
export const batches = {};
export const B = key => (batches[key] ||= new Batch());
export const colliders = [];
export function flushBatches(scene) {
  const meshes = [];
  for (const [k, bt] of Object.entries(batches)) {
    if (!bt.p.length) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(bt.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(bt.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(bt.uv, 2));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, MAT[k]); m.castShadow = k !== 'glass'; m.receiveShadow = true; scene.add(m); meshes.push(m);
  }
  return meshes;
}

// Extruded convex polygon (world xz pts).
export function prism(pts, y0, y1, side, top, opts = {}) {
  const [tu, tv] = TILE[side] || [1, 1];
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let u = opts.u0 || 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-4) continue;
    const out = V3((a[0] + b[0]) / 2 - cx, 0, (a[1] + b[1]) / 2 - cz);
    B(side).quad(V3(a[0], y0, a[1]), V3(b[0], y0, b[1]), V3(b[0], y1, b[1]), V3(a[0], y1, a[1]),
      [u / tu, y0 / tv], [(u + len) / tu, y0 / tv], [(u + len) / tu, y1 / tv], [u / tu, y1 / tv], out);
    u += len;
  }
  const capTop = (key, y, up) => {
    const [ru, rv] = TILE[key] || [1, 1];
    for (let i = 1; i < pts.length - 1; i++) {
      const tri = [pts[0], pts[i], pts[i + 1]].map(p => V3(p[0], y, p[1])), uvs = [pts[0], pts[i], pts[i + 1]].map(p => [p[0] / ru, p[1] / rv]);
      const n = new THREE.Vector3().subVectors(tri[1], tri[0]).cross(new THREE.Vector3().subVectors(tri[2], tri[0]));
      if ((n.y > 0) === up) B(key).tri(tri[0], tri[1], tri[2], ...uvs); else B(key).tri(tri[0], tri[2], tri[1], uvs[0], uvs[2], uvs[1]);
    }
  };
  if (top) capTop(top, y1, true);
  if (opts.bottom) capTop(opts.bottom, y0, false);
  if (opts.collide) colliders.push(pts);
}

// A building's local frame: metres, origin at its centre, x along width, z along depth, rotated like the image.
export class Frame {
  constructor(px, py, rotDeg = 0) { [this.cx, this.cz] = toW(px, py); const a = rotDeg * Math.PI / 180; this.c = Math.cos(a); this.s = Math.sin(a); this.rot = a; }
  w(x, z) { return [this.cx + x * this.c - z * this.s, this.cz + x * this.s + z * this.c]; }
  dir(x, z) { return [x * this.c - z * this.s, x * this.s + z * this.c]; }
  rect(x0, z0, x1, z1) { return [this.w(x0, z0), this.w(x1, z0), this.w(x1, z1), this.w(x0, z1)]; }
  box(x0, z0, x1, z1, y0, y1, side, top = side, opts = {}) { prism(this.rect(x0, z0, x1, z1), y0, y1, side, top, { bottom: opts.bottom, collide: opts.collide }); }
  // box centred on a point along a local segment, oriented with it
  seg(ax, az, bx, bz, t, len, depthOut, depthIn, y0, y1, mat, top) {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = uz, nz = -ux;  // n = right-hand normal
    const px = ax + dx * t, pz = az + dz * t, h = len / 2;
    const pts = [[px - ux * h - nx * depthIn, pz - uz * h - nz * depthIn], [px + ux * h - nx * depthIn, pz + uz * h - nz * depthIn],
      [px + ux * h + nx * depthOut, pz + uz * h + nz * depthOut], [px - ux * h + nx * depthOut, pz - uz * h + nz * depthOut]].map(([x, z]) => this.w(x, z));
    prism(pts, y0, y1, mat, top === undefined ? mat : top);
  }
  quadOn(ax, az, bx, bz, t, len, off, y0, y1, mat) {   // flat quad parallel to segment, offset along its right-hand normal
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = uz, nz = -ux, h = len / 2;
    const px = ax + dx * t + nx * off, pz = az + dz * t + nz * off;
    const [p0, p1] = [this.w(px - ux * h, pz - uz * h), this.w(px + ux * h, pz + uz * h)], [onx, onz] = this.dir(nx, nz);
    B(mat).quad(V3(p0[0], y0, p0[1]), V3(p1[0], y0, p1[1]), V3(p1[0], y1, p1[1]), V3(p0[0], y1, p0[1]), [0, 0], [len, 0], [len, y1 - y0], [0, y1 - y0], V3(onx, 0, onz));
  }
}

// Window / door units on a wall running a->b (local coords); outward side = right-hand normal of a->b.
// type: std | ribbon | slit | tall | door | vent
export function openings(F, ax, az, bx, bz, y0, type, opts = {}) {
  const L = Math.hypot(bx - ax, bz - az), bay = opts.bay || ({ ribbon: 3.4, slit: 2.4, tall: 3.2, door: 3.2, vent: 3.2 }[type] || 3.2);
  const n = Math.max(1, Math.floor((L - (opts.margin ?? 1.2)) / bay)), start = (L - n * bay) / 2 / L + bay / 2 / L;
  const dims = { std: [1.5, 1.45, 0.9], ribbon: [2.9, 1.6, 0.9], slit: [0.55, 2.6, 0.5], tall: [2.6, 2.9, 0.25], door: [1.05, 2.2, 0], vent: [1.2, 0.6, 2.2] }[type];
  const [ww, wh, sill] = opts.dims || dims;
  for (let i = 0; i < n; i++) {
    if (opts.skip && opts.skip(i, n)) continue;
    const t = start + i * bay / L + (opts.shift || 0) / L, ys = y0 + sill;
    const glassMat = type === 'door' ? (opts.doorMat || 'door') : 'glass';
    F.quadOn(ax, az, bx, bz, t, ww, 0.03, ys, ys + wh, glassMat);
    // concrete surround (projecting), mullion, and chajja sunshade above
    const fm = opts.frameMat || 'concrete', d = 0.14;
    F.seg(ax, az, bx, bz, t, ww + 0.24, d, 0, ys + wh, ys + wh + 0.12, fm);
    F.seg(ax, az, bx, bz, t, ww + 0.24, d, 0, ys - 0.12, ys, fm);
    F.seg(ax, az, bx, bz, t - (ww / 2 + 0.06) / L, 0.12, d, 0, ys, ys + wh, fm);
    F.seg(ax, az, bx, bz, t + (ww / 2 + 0.06) / L, 0.12, d, 0, ys, ys + wh, fm);
    if (type === 'ribbon' || type === 'tall') F.seg(ax, az, bx, bz, t, 0.06, 0.06, 0, ys, ys + wh, 'frame');
    if (type === 'std' || type === 'ribbon') for (let k = 1; k < 4; k++) F.seg(ax, az, bx, bz, t, ww, 0.05, 0, ys + wh * k / 4 - 0.02, ys + wh * k / 4 + 0.02, 'frame');
    if (opts.chajja !== false && type !== 'slit') F.seg(ax, az, bx, bz, t, ww + 0.6, 0.6, 0, ys + wh + 0.3, ys + wh + 0.42, 'concrete');
  }
}
// Projecting concrete floor bands along a wall (MICA's brick-and-concrete-band look)
export function bands(F, ax, az, bx, bz, levels, depth = 0.08, h = 0.28) {
  const L = Math.hypot(bx - ax, bz - az);
  for (const y of levels) F.seg(ax, az, bx, bz, 0.5, L + depth * 2, depth, 0, y - h, y, 'concrete');
}
// Rooftop parapet on a local rectangle
export function parapetRect(F, x0, z0, x1, z1, y, h = 0.9, t = 0.22) {
  F.box(x0, z0, x1, z0 + t, y, y + h, 'concrete'); F.box(x0, z1 - t, x1, z1, y, y + h, 'concrete');
  F.box(x0, z0 + t, x0 + t, z1 - t, y, y + h, 'concrete'); F.box(x1 - t, z0 + t, x1, z1 - t, y, y + h, 'concrete');
}
// Hip roof over a local rectangle (overhang o)
export function hipRoof(F, x0, z0, x1, z1, y, rise, o, mat) {
  x0 -= o; z0 -= o; x1 += o; z1 += o;
  const w = x1 - x0, d = z1 - z0, r = Math.min(w, d) / 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const [ra, rb] = w >= d ? [[x0 + r, cz], [x1 - r, cz]] : [[cx, z0 + r], [cx, z1 - r]];
  const P = (x, z, yy) => { const [a, b] = F.w(x, z); return V3(a, yy, b); };
  const c = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], up = V3(0, 1, 0);
  const ridgeFor = i => (w >= d ? [[ra, rb], [rb, rb], [rb, ra], [ra, ra]] : [[ra, ra], [ra, rb], [rb, rb], [rb, ra]])[i];
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4], [ra2, rb2] = ridgeFor(i);
    const pa = P(...a, y), pb = P(...b, y), qa = P(...ra2, y + rise), qb = P(...rb2, y + rise);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    B(mat).quad(pa, pb, qb, qa, [0, 0], [L / 2.5, 0], [L / 2.5, r / 2.5], [0, r / 2.5], up);
  }
  F.box(x0, z0, x1, z1, y - 0.15, y, mat, null, { bottom: 'white' });
}
export function gableRoof(F, x0, z0, x1, z1, y, rise, o, mat, gableMat) {
  x0 -= o; z0 -= o; x1 += o; z1 += o;
  const alongX = (x1 - x0) >= (z1 - z0), P = (x, z, yy) => { const [a, b] = F.w(x, z); return V3(a, yy, b); }, up = V3(0, 1, 0);
  if (alongX) {
    const zc = (z0 + z1) / 2, L = x1 - x0, D = (z1 - z0) / 2;
    B(mat).quad(P(x0, z0, y), P(x1, z0, y), P(x1, zc, y + rise), P(x0, zc, y + rise), [0, 0], [L, 0], [L, D], [0, D], up);
    B(mat).quad(P(x0, z1, y), P(x1, z1, y), P(x1, zc, y + rise), P(x0, zc, y + rise), [0, 0], [L, 0], [L, D], [0, D], up);
    if (gableMat) for (const x of [x0 + o, x1 - o]) B(gableMat).tri(P(x, z0 + o, y), P(x, z1 - o, y), P(x, zc, y + rise), [0, 0], [D * 2, 0], [D, rise]);
  } else {
    const xc = (x0 + x1) / 2, L = z1 - z0, D = (x1 - x0) / 2;
    B(mat).quad(P(x0, z0, y), P(x0, z1, y), P(xc, z1, y + rise), P(xc, z0, y + rise), [0, 0], [L, 0], [L, D], [0, D], up);
    B(mat).quad(P(x1, z0, y), P(x1, z1, y), P(xc, z1, y + rise), P(xc, z0, y + rise), [0, 0], [L, 0], [L, D], [0, D], up);
    if (gableMat) for (const z of [z0 + o, z1 - o]) B(gableMat).tri(P(x0 + o, z, y), P(x1 - o, z, y), P(xc, z, y + rise), [0, 0], [D * 2, 0], [D, rise]);
  }
}
// Straight cantilevered concrete stair (local), rising from (x,z) along direction (dx,dz) to height h
export function stair(F, x, z, dx, dz, width, h, mat = 'concrete') {
  const steps = Math.round(h / 0.175), go = 0.28, rise = h / steps, nx = -dz, nz = dx;
  for (let i = 0; i < steps; i++) {
    const cx = x + dx * (i + 0.5) * go, cz = z + dz * (i + 0.5) * go;
    const pts = [[cx - dx * go / 2 - nx * width / 2, cz - dz * go / 2 - nz * width / 2], [cx + dx * go / 2 - nx * width / 2, cz + dz * go / 2 - nz * width / 2],
      [cx + dx * go / 2 + nx * width / 2, cz + dz * go / 2 + nz * width / 2], [cx - dx * go / 2 + nx * width / 2, cz - dz * go / 2 + nz * width / 2]].map(p => F.w(...p));
    prism(pts, i * rise + rise - 0.18, (i + 1) * rise, mat, mat);
  }
  // sloped stringer + parapet-style side wall (MICA's solid concrete stair balustrade)
  const L = steps * go, ex = x + dx * L, ez = z + dz * L;
  for (let s = 0; s < 8; s++) {
    const t0 = s / 8, t1 = (s + 1) / 8, sx = x + dx * L * t0, sz = z + dz * L * t0, qx = x + dx * L * t1, qz = z + dz * L * t1;
    const off = width / 2;
    const pts = [[sx + nx * off, sz + nz * off], [qx + nx * off, qz + nz * off], [qx + nx * (off + 0.15), qz + nz * (off + 0.15)], [sx + nx * (off + 0.15), sz + nz * (off + 0.15)]].map(p => F.w(...p));
    prism(pts, h * t0 - 0.2, h * t1 + 0.95, mat, mat);
  }
  return [ex, ez];
}
