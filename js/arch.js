// Building generators, one per architectural type seen on campus.
import * as THREE from 'three';
import * as L from './layout.js';
import { M, FH, Frame, prism, openings, bands, parapetRect, hipRoof, gableRoof, stair, rand, rr, cnv, tex, MAT, TILE, colliders, toW } from './kit.js';

export const extras = { tanks: [], clothes: [], meshes: [], labels: [], footprints: [] };
const rectWalls = (x0, z0, x1, z1) => [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]];      // facing out
const innerWalls = (x0, z0, x1, z1) => [[x1, z0, x0, z0], [x0, z0, x0, z1], [x0, z1, x1, z1], [x1, z1, x1, z0]];    // facing in
const SIDE = { n: 0, e: 1, s: 2, w: 3 };

export function signMesh(text, w, h, { bg = '#c8261e', fg = '#ffffff', font = 600, sub } = {}) {
  const pxw = 512, pxh = Math.round(512 * h / w), [c, g] = cnv(pxw, pxh);
  g.fillStyle = bg; g.fillRect(0, 0, pxw, pxh); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = pxh * (sub ? 0.5 : 0.62); g.font = `${font} ${fs}px system-ui`; while (g.measureText(text).width > pxw * 0.9) { fs *= 0.92; g.font = `${font} ${fs}px system-ui`; }
  g.fillText(text, pxw / 2, sub ? pxh * 0.38 : pxh / 2);
  if (sub) { g.font = `400 ${pxh * 0.22}px system-ui`; g.fillText(sub, pxw / 2, pxh * 0.75); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.6 }));
  m.castShadow = true; extras.meshes.push(m); return m;
}
// place an object at local (x,z,y) facing local direction (nx,nz)
function placeAt(F, obj, x, z, y, nx, nz) { const [wx, wz] = F.w(x, z), [dx, dz] = F.dir(nx, nz); obj.position.set(wx + dx * 0.02, y, wz + dz * 0.02); obj.rotation.y = Math.atan2(dx, dz); }
function tank(F, x, z, y) { const [wx, wz] = F.w(x, z); extras.tanks.push([wx, y, wz]); }
function label(b, y) { if (b.noLabel) return; const [x, z] = toW(b.x, b.y); extras.labels.push({ name: b.name, sub: b.sub, x, y, z, low: b.confidence === 'low' }); }
function footprint(F, x0, z0, x1, z1) { extras.footprints.push(F.rect(x0, z0, x1, z1)); }

// ---------------------------------------------------------------- courtyard building (hostels, Digicom, Main Academic Block)
function courtyard(b, o = {}) {
  const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, nF = b.floors, fh = o.fh || FH, H = nF * fh;
  const [ox, oz] = (b.courtOff || [0, 0]).map(v => v * M);
  const CW = b.court[0] * M, CD = b.court[1] * M, cx0 = ox - CW / 2, cx1 = ox + CW / 2, cz0 = oz - CD / 2, cz1 = oz + CD / 2;
  const x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
  const cd = Math.max(1.4, Math.min(2.2, cz0 - z0 - 3, z1 - cz1 - 3, cx0 - x0 - 3, x1 - cx1 - 3));
  const rx0 = cx0 - cd, rx1 = cx1 + cd, rz0 = cz0 - cd, rz1 = cz1 + cd;            // room-block inner edge
  const roof = b.roof === 'grey' ? 'roofGrey' : 'roofWhite', wall = o.wall || 'brick';
  const gap = 3.6, gate = b.gate;
  const blocks = { n: [x0, z0, x1, rz0], s: [x0, rz1, x1, z1], w: [x0, rz0, rx0, rz1], e: [rx1, rz0, x1, rz1] };
  for (const [k, [a0, b0, a1, b1]] of Object.entries(blocks)) {
    if (k === gate) {
      const horiz = k === 'n' || k === 's', mid = horiz ? ox : oz;
      const parts = horiz ? [[a0, b0, mid - gap / 2, b1], [mid + gap / 2, b0, a1, b1]] : [[a0, b0, a1, mid - gap / 2], [a0, mid + gap / 2, a1, b1]];
      for (const p of parts) F.box(...p, 0, H, wall, roof, { collide: true });
      const br = horiz ? [mid - gap / 2, b0, mid + gap / 2, b1] : [a0, mid - gap / 2, a1, mid + gap / 2];
      F.box(...br, fh, H, wall, roof, { bottom: 'concrete' });
    } else F.box(a0, b0, a1, b1, 0, H, wall, roof, { collide: true });
  }
  // outer facade: windows per floor, concrete bands, entrance in gate wall
  rectWalls(x0, z0, x1, z1).forEach(([ax, az, bx, bz], i) => {
    const isGate = 'nesw'[i] === gate, Lw = Math.hypot(bx - ax, bz - az);
    for (let f = 0; f < nF; f++) openings(F, ax, az, bx, bz, f * fh, o.outerType || 'std', { skip: isGate && f === 0 ? (k, n) => Math.abs((k + 0.5) / n - 0.5) * Lw < 3 : null });
    bands(F, ax, az, bx, bz, [...Array(nF - 1)].map((_, f) => (f + 1) * fh));
  });
  // corridor ring: slabs per floor + roof, brick piers on the court edge, solid concrete railings
  const ring = [[rx0, rz0, rx1, cz0], [rx0, cz1, rx1, rz1], [rx0, cz0, cx0, cz1], [cx1, cz0, rx1, cz1]];
  for (let f = 1; f <= nF; f++) for (const r of ring) F.box(...r, f * fh - 0.25, f * fh, 'concrete', f === nF ? roof : 'concrete', { bottom: 'concrete' });
  innerWalls(cx0, cz0, cx1, cz1).forEach(([ax, az, bx, bz]) => {
    const Lc = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(Lc / 3.3));
    for (let i = 0; i <= n; i++) {
      const t = i / n, px = ax + (bx - ax) * t, pz = az + (bz - az) * t;
      F.box(px - 0.22, pz - 0.22, px + 0.22, pz + 0.22, 0, H, wall, roof, { collide: true });
    }
  });
  // railings (skip the gap where the stair lands)
  const stairSide = o.stair === false ? null : b.stair, SL = Math.round(fh / 0.175) * 0.28;
  innerWalls(cx0, cz0, cx1, cz1).forEach(([ax, az, bx, bz], i) => {
    const Lc = Math.hypot(bx - ax, bz - az);
    for (let f = 1; f < nF; f++) {
      const y = f * fh;
      let spans = [[0, Lc]];
      if ('nwse'[i] === stairSide && f === 1) {     // innerWalls order is n,w,s,e; open the railing at both stair ends
        const a = (Lc - SL) / 2, c = (Lc + SL) / 2;
        spans = [[0, a - 1.3], [a + 1.3, c - 1.3], [c + 1.3, Lc]].filter(([s, e]) => e - s > 0.3);
      }
      for (const [s, e] of spans) F.seg(ax, az, bx, bz, (s + e) / 2 / Lc, e - s, 0.08, 0.08, y, y + 1.0, 'concrete');
      // laundry hanging over railings
      if (o.clothes) for (let k = 0; k < 4; k++) if (rand() < 0.6) {
        const t = rr(0.1, 0.9), px = ax + (bx - ax) * t, pz = az + (bz - az) * t, [wx, wz] = F.w(px, pz), [dx, dz] = F.dir(bx - ax, bz - az);
        extras.clothes.push([wx, y + 0.55, wz, Math.atan2(dz, -dx), rr(0.5, 0.9)]);
      }
    }
  });
  parapetRect(F, x0, z0, x1, z1, H);
  F.box(cx0 - 0.15, cz0 - 0.15, cx1 + 0.15, cz0 + 0.1, H, H + 0.9, 'concrete'); F.box(cx0 - 0.15, cz1 - 0.1, cx1 + 0.15, cz1 + 0.15, H, H + 0.9, 'concrete');
  F.box(cx0 - 0.15, cz0, cx0 + 0.1, cz1, H, H + 0.9, 'concrete'); F.box(cx1 - 0.1, cz0, cx1 + 0.15, cz1, H, H + 0.9, 'concrete');
  // room doors + windows on the corridor walls (ground and upper floors)
  innerWalls(rx0, rz0, rx1, rz1).forEach(([ax, az, bx, bz]) => {
    for (let f = 0; f < nF; f++) {
      openings(F, ax, az, bx, bz, f * fh, 'door', { margin: 2.6, bay: 3.4, chajja: false, shift: -0.8, doorMat: o.doorMat });
      openings(F, ax, az, bx, bz, f * fh, 'std', { margin: 2.6, bay: 3.4, chajja: false, shift: 0.9, dims: [0.9, 1.1, 1.0] });
    }
  });
  // cantilevered stair with the hostel's red name board
  if (stairSide) {
    const wv = 1.2, inset = wv / 2 + 0.15;
    const S = { n: [ox - SL / 2, cz0 + inset, 1, 0], s: [ox + SL / 2, cz1 - inset, -1, 0], w: [cx0 + inset, oz + SL / 2, 0, -1], e: [cx1 - inset, oz - SL / 2, 0, 1] }[stairSide];
    stair(F, S[0], S[1], S[2], S[3], wv, fh);
    if (o.sign) {
      const s = signMesh(o.sign.toUpperCase(), 2.6, 0.6);
      const nx = -S[3], nz = S[2];   // stair side facing the court centre
      const toC = (ox - S[0]) * nx + (oz - S[1]) * nz > 0 ? 1 : -1;
      placeAt(F, s, S[0] + S[2] * SL * 0.55 + nx * toC * (wv / 2 + 0.17), S[1] + S[3] * SL * 0.55 + nz * toC * (wv / 2 + 0.17), fh * 0.55 + 0.6, nx * toC, nz * toC);
    }
  }
  if (b.skylight) {     // glazed pyramid over the court
    const P = (x, z, y) => { const [a, c] = F.w(x, z); return new THREE.Vector3(a, y, c); }, top = P(ox, oz, H + 3.2), up = new THREE.Vector3(0, 1, 0);
    const cs = [[cx0, cz0], [cx1, cz0], [cx1, cz1], [cx0, cz1]];
    for (let i = 0; i < 4; i++) { const a = cs[i], c = cs[(i + 1) % 4]; B_glassTri(P(...a, H + 0.9), P(...c, H + 0.9), top); }
  }
  if (b.badminton) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(CW * 0.75, CD * 0.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2e9a6e, roughness: 0.8 }));
    const [wx, wz] = F.w(ox, oz); g.position.set(wx, 0.03, wz); g.rotation.y = -F.rot; g.receiveShadow = true; extras.meshes.push(g);
  }
  tank(F, x0 + 1.5, z0 + 1.5, H); if (W > 18) tank(F, x1 - 1.5, z1 - 1.5, H);
  footprint(F, x0, z0, x1, z1);
  return { F, H, x0, z0, x1, z1 };
}
let glassTris = [];
function B_glassTri(a, b, c) { glassTris.push(a, b, c); }

// ---------------------------------------------------------------- per-type builders
const builders = {
  hostel: b => { courtyard(b, { sign: b.name, clothes: true }); label(b, b.floors * FH + 3); },
  courtyard: b => { courtyard(b, { stair: false, outerType: 'ribbon' }); label(b, b.floors * FH + 3); },
  mab: b => {
    b.courtOff = [-20, 12]; b.gate = 'w';
    const r = courtyard(b, { stair: false, outerType: 'ribbon' });
    const { F, H, x0, z0, x1, z1 } = r;
    // auditorium volume rising above the north-east wing, blank brick with concrete fins
    const ax0 = x1 - 0.45 * (x1 - x0), az0 = z0 + 1, ax1 = x1 - 1, az1 = z0 + 0.48 * (z1 - z0);
    F.box(ax0, az0, ax1, az1, 0, H + 3.8, 'brick', 'roofWhite');
    parapetRect(F, ax0, az0, ax1, az1, H + 3.8, 0.6);
    rectWalls(ax0, az0, ax1, az1).forEach(([a, c, d, e]) => { const Lw = Math.hypot(d - a, e - c); for (let i = 1; i < Lw / 4; i++) F.seg(a, c, d, e, i * 4 / Lw, 0.35, 0.45, 0, H, H + 3.8, 'concrete'); });
    // glazed reception at the west entrance with MICA red sign
    const ex = x0, ez = 0;
    F.seg(ex, z1 * 0.25, ex, z0 * 0.25, 0.5, 6, 2.6, 0, FH - 0.1, FH + 0.15, 'concrete');
    const s = signMesh('MICA', 2.4, 0.8, { bg: '#ffffff', fg: '#c8261e', font: 700 }); placeAt(r.F, s, ex - 2.62, ez, FH + 0.6, -1, 0);
    label(b, H + 6);
  },
  seminar: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, H = b.height, k = Math.min(W, D) * 0.29;
    const v = [[-W / 2 + k, -D / 2], [W / 2 - k, -D / 2], [W / 2, -D / 2 + k], [W / 2, D / 2 - k], [W / 2 - k, D / 2], [-W / 2 + k, D / 2], [-W / 2, D / 2 - k], [-W / 2, -D / 2 + k]];
    prism(v.map(p => F.w(...p)), 0, H, 'brick', 'roofWhite', { collide: true });
    const faces = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    v.forEach((a, i) => {
      const c = v[(i + 1) % 8], f = faces[i];
      bands(F, a[0], a[1], c[0], c[1], [4.0, H - 0.6], 0.1, 0.35);
      if (f === b.door) {
        F.quadOn(a[0], a[1], c[0], c[1], 0.5, 2.0, 0.03, 0, 2.5, 'glass'); F.seg(a[0], a[1], c[0], c[1], 0.5, 2.4, 0.15, 0, 2.5, 2.7, 'concrete');
        F.seg(a[0], a[1], c[0], c[1], 0.5, 3.4, 1.6, 0, 2.8, 3.0, 'concrete');   // entrance canopy
      } else if (i % 2 === 0) openings(F, a[0], a[1], c[0], c[1], 0, 'slit', { margin: 0.6 });
      else openings(F, a[0], a[1], c[0], c[1], 4.0, 'slit', { margin: 0.6, dims: [0.55, 2.4, 0.6] });
      if (f === b.stair) {
        const L2 = Math.hypot(c[0] - a[0], c[1] - a[1]), ux = (c[0] - a[0]) / L2, uz = (c[1] - a[1]) / L2, nx = uz, nz = -ux;
        const sx = a[0] + nx * 0.75 + ux * 0.2, sz = a[1] + nz * 0.75 + uz * 0.2;
        const [ex, ez] = stair(F, sx, sz, ux, uz, 1.15, 4.0);
        F.box(Math.min(ex, ex + nx * 1.5) - 0.7, Math.min(ez, ez + nz * 1.5) - 0.7, Math.max(ex, ex + nx * 1.5) + 0.7, Math.max(ez, ez + nz * 1.5) + 0.7, 3.8, 4.0, 'concrete');
        F.quadOn(a[0], a[1], c[0], c[1], 0.92, 1.0, 0.03, 4.0, 6.2, 'door');
      }
    });
    prism(v.map(p => F.w(p[0] * 1.0, p[1] * 1.0)), H, H + 0.8, 'concrete', null);
    for (const dz of [-0.2, 0.2]) F.box(-W * 0.3, dz * D - 0.6, W * 0.3, dz * D + 0.6, H, H + 0.7, 'concrete', 'glass');   // roof light slots
    tank(F, -W * 0.25, D * 0.3, H);
    extras.footprints.push(v.map(p => F.w(...p)));
    const s = signMesh(b.name.replace('Seminar Halls ', 'SH '), 1.4, 0.5); const [a, c] = [v[faces.indexOf(b.door)], v[(faces.indexOf(b.door) + 1) % 8]];
    const mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2, Lf = Math.hypot(c[0] - a[0], c[1] - a[1]); placeAt(F, s, mx + (c[0] - a[0]) / Lf * 1.8, mz + (c[1] - a[1]) / Lf * 1.8, 2.2, (c[1] - a[1]) / Lf, -(c[0] - a[0]) / Lf);
    label(b, H + 3);
  },
  office: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, H = b.floors * FH, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    F.box(x0, z0, x1, z1, 0, H, 'brick', 'roofWhite', { collide: true });
    rectWalls(x0, z0, x1, z1).forEach(([a, c, d, e], i) => {
      for (let f = 0; f < b.floors; f++) openings(F, a, c, d, e, f * FH, 'ribbon', { skip: i === 2 && f === 0 ? (k, n) => k === Math.floor(n / 2) : null });
      bands(F, a, c, d, e, [FH]);
      const Lw = Math.hypot(d - a, e - c); for (let p = 0; p <= Lw / 3.4; p++) F.seg(a, c, d, e, Math.min(1, (p * 3.4 + (Lw % 3.4) / 2) / Lw), 0.5, 0.18, 0, 0, H, 'brick', 'concrete');   // brick pilasters
    });
    F.quadOn(x1, z1, x0, z1, 0.5, 2.2, 0.03, 0, 2.6, 'glass'); F.seg(x1, z1, x0, z1, 0.5, 4, 1.8, 0, 2.8, 3.0, 'concrete');
    const s = signMesh('ACADEMIC BLOCK', 1.6, 0.32); placeAt(F, s, 2.4, z1, 2.0, 0, 1);
    stair(F, x0 - 0.8, z1 - 0.6, 0, -1, 1.2, FH);
    parapetRect(F, x0, z0, x1, z1, H); tank(F, x0 + 1.5, z0 + 1.5, H);
    footprint(F, x0, z0, x1, z1); label(b, H + 3);
  },
  keic: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, H = b.floors * FH + 0.6, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    F.box(x0, z0, x1, z1, 0, H, 'brick', 'roofWhite', { collide: true });
    rectWalls(x0, z0, x1, z1).forEach(([a, c, d, e], i) => {
      const glassy = i === 3 || i === 2;     // west + south: big library glazing
      for (let f = 0; f < b.floors; f++) openings(F, a, c, d, e, f * FH + 0.3, glassy ? 'tall' : 'std', { chajja: !glassy });
      bands(F, a, c, d, e, [FH + 0.3]);
      if (glassy) { const Lw = Math.hypot(d - a, e - c); for (let p = 1; p < Lw / 3.2; p++) F.seg(a, c, d, e, p * 3.2 / Lw, 0.3, 0.9, 0, 0, H, 'concrete'); }  // deep concrete fins
    });
    F.quadOn(x0, z1, x0, z0, 0.5, 3.0, 0.05, 0, 2.8, 'glass'); F.seg(x0, z1, x0, z0, 0.5, 5, 2.4, 0, 3.0, 3.25, 'concrete');
    const s = signMesh('Knowledge Exchange & Information Centre', 3.2, 0.42, { bg: '#f2f2ef', fg: '#c8261e', font: 600 }); placeAt(F, s, x0, 2.2, 3.6, -1, 0);
    F.box(-3, -3, 3, 3, H, H + 1.4, 'glass', 'glass');   // skylit atrium
    parapetRect(F, x0, z0, x1, z1, H); tank(F, x1 - 1.5, z0 + 1.5, H);
    footprint(F, x0, z0, x1, z1); label(b, H + 3);
  },
  ashoka: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, fh = 3.0, H = b.floors * fh, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    F.box(x0, z0, x1 - 1.4, z1, 0, H, 'brick', 'roofWhite', { collide: true });
    // east facade: balcony per room per floor
    const bx = x1 - 1.4, Lz = z1 - z0, nb = Math.floor(Lz / 3.3);
    for (let i = 0; i < nb; i++) {
      const zc = z0 + (i + 0.5) * Lz / nb;
      for (let f = 0; f < b.floors; f++) {
        const y = f * fh;
        F.quadOn(bx, zc - 1.4, bx, zc + 1.4, 0.5, 0.95, 0.03, y + 0.1, y + 2.2, 'glass');
        F.quadOn(bx, zc - 1.4, bx, zc + 1.4, 0.15, 0.8, 0.03, y + 1.0, y + 2.1, 'glass');
        if (f > 0) { F.box(bx, zc - 1.6, x1 + 0.2, zc + 1.6, y - 0.15, y + 0.05, 'concrete'); F.box(x1, zc - 1.6, x1 + 0.2, zc + 1.6, y, y + 1.0, 'concrete'); }
      }
      F.box(bx, zc + 1.6, x1 + 0.2, zc + 1.75, 0, H, 'brick', 'concrete');   // party-wall fins
    }
    // west corridor windows + lift/stair core with ASHOKA sign
    for (let f = 0; f < b.floors; f++) openings(F, x0, z1, x0, z0, f * fh, 'std', { dims: [1.2, 1.2, 0.9] });
    bands(F, x0, z1, x0, z0, [...Array(b.floors - 1)].map((_, f) => (f + 1) * fh));
    F.box(x0 - 4.5, z0 + 6, x0, z0 + 12, 0, H + 3, 'concrete', 'roofWhite', { collide: true });
    openings(F, x0 - 4.5, z0 + 12, x0 - 4.5, z0 + 6, 0, 'door', { margin: 1, chajja: false, dims: [1.6, 2.3, 0] });
    const s = signMesh('ASHOKA', 3.4, 0.8, { bg: '#c8261e' }); placeAt(F, s, x0 - 4.5, z0 + 9, H, -1, 0);
    parapetRect(F, x0, z0, x1 - 1.4, z1, H); tank(F, x0 + 2, z0 + 3, H); tank(F, x0 + 2, z1 - 3, H);
    footprint(F, x0, z0, x1, z1); label(b, H + 5);
  },
  // Shishya Gramah hutments (from Ayan's photos): raised oxide-red plinth/verandah, brick dado with white plaster above,
  // aluminium glass doors, green sheet gable roof with deep eaves on exposed rafters, red fascia, white PVC downpipes.
  hutment: b => {
    if (!MAT.oxide) { MAT.oxide = new THREE.MeshStandardMaterial({ color: 0x8a3324, roughness: 0.8, envMapIntensity: 0.5 }); TILE.oxide = [1, 1]; }
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, H = 3.2, P = 0.3, o = 1.3, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    const long = W >= D, ex0 = x0 - o, ex1 = x1 + o, ez0 = z0 - o, ez1 = z1 + o;
    F.box(ex0 + 0.15, ez0 + 0.15, ex1 - 0.15, ez1 - 0.15, 0, P, 'oxide', 'oxide');                 // plinth + verandahs
    F.box(x0, z0, x1, z1, P, 1.5, 'brick', null, { collide: true });                              // brick dado
    F.box(x0, z0, x1, z1, 1.5, H, 'plaster', null);                                               // white plaster
    F.box(x0 - 0.04, z0 - 0.04, x1 + 0.04, z1 + 0.04, 1.46, 1.54, 'concrete', null);
    gableRoof(F, x0, z0, x1, z1, H, 0.9, o, 'sheet', 'plaster');
    // red fascia on all eaves, exposed rafters under the long eaves
    if (long) {
      for (const z of [ez0, ez1]) F.box(ex0, z - 0.04, ex1, z + 0.04, H - 0.32, H, 'red');
      for (let x = x0 + 0.5; x < x1; x += 1.1) { F.box(x - 0.05, ez0, x + 0.05, z0, H - 0.2, H - 0.02, 'timber'); F.box(x - 0.05, z1, x + 0.05, ez1, H - 0.2, H - 0.02, 'timber'); }
    } else {
      for (const x of [ex0, ex1]) F.box(x - 0.04, ez0, x + 0.04, ez1, H - 0.32, H, 'red');
      for (let z = z0 + 0.5; z < z1; z += 1.1) { F.box(ex0, z - 0.05, x0, z + 0.05, H - 0.2, H - 0.02, 'timber'); F.box(x1, z - 0.05, ex1, z + 0.05, H - 0.2, H - 0.02, 'timber'); }
    }
    const walls = { n: [x0, z0, x1, z0], s: [x1, z1, x0, z1], e: [x1, z0, x1, z1], w: [x0, z1, x0, z0] };
    for (const side of b.doors || (long ? 'ns' : 'ew')) {
      const [a, c, d, e] = walls[side];
      openings(F, a, c, d, e, P, 'door', { bay: 3.4, margin: 1.2, chajja: false, shift: -0.8, doorMat: 'glass', frameMat: 'white', dims: [1.15, 2.1, 0] });
      openings(F, a, c, d, e, P, 'std', { bay: 3.4, margin: 1.2, chajja: false, shift: 0.9, dims: [0.9, 1.1, 0.9], frameMat: 'white' });
    }
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) F.box(x - 0.06, z - 0.06, x + 0.06, z + 0.06, P, H - 0.1, 'white');   // downpipes
    const ridgeLen = long ? W : D;
    for (let s = -ridgeLen / 2 + 4; s < ridgeLen / 2 - 3; s += 9) long ? F.box(s - 0.7, -0.5, s + 0.7, 0.5, H + 0.75, H + 1.15, 'white') : F.box(-0.5, s - 0.7, 0.5, s + 0.7, H + 0.75, H + 1.15, 'white');   // ridge units
    if (b.sign) {
      const s = signMesh(b.sign, 2.8, 0.7, { bg: '#f1ede4', fg: '#2f6e46' }), side = (b.doors || 'n')[0], [a, c, d, e] = walls[side];
      const nx = Math.sign(e - c), nz = -Math.sign(d - a);
      placeAt(F, s, a + (d - a) * 0.22, c + (e - c) * 0.22, 2.4, nx, nz);
    }
    footprint(F, x0, z0, x1, z1); label(b, H + 4);
  },
  dining: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, H = 7.5, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    F.box(x0, z0, x1, z1, 0, H, 'brick', 'roofWhite', { collide: true });
    rectWalls(x0, z0, x1, z1).forEach(([a, c, d, e]) => {
      openings(F, a, c, d, e, 0, 'tall', { dims: [2.0, 2.6, 0.9] });
      openings(F, a, c, d, e, 4.0, 'std');
      bands(F, a, c, d, e, [3.9]);
    });
    F.quadOn(x1, z1, x0, z1, 0.5, 2.4, 0.05, 0, 2.6, 'glass'); F.seg(x1, z1, x0, z1, 0.5, 6, 2.5, 0, 3.0, 3.2, 'concrete');
    const s = signMesh('DINING HALL', 2.6, 0.5); placeAt(F, s, 0, z1, 3.6, 0, 1);
    // Gym: ground-floor unit on the side facing the badminton court / Palaash, own entrance, not connected to the mess (Ayan, 01-11)
    F.box(x1, -2.2, x1 + 0.06, 2.2, 0, 2.9, 'brick', null);                                   // solid brick panel behind the gym door
    F.quadOn(x1, z0, x1, z1, 0.5, 1.7, 0.1, 0.05, 2.45, 'glass');
    F.seg(x1, z0, x1, z1, 0.5 - 0.95 / D, 0.12, 0.2, 0, 0, 2.6, 'frame'); F.seg(x1, z0, x1, z1, 0.5 + 0.95 / D, 0.12, 0.2, 0, 0, 2.6, 'frame');
    F.seg(x1, z0, x1, z1, 0.5, 2.0, 0.2, 0, 2.45, 2.6, 'frame'); F.seg(x1, z0, x1, z1, 0.5, 3.4, 1.4, 0, 2.95, 3.1, 'concrete');
    const gs = signMesh('FITNESS CENTRE', 1.3, 0.28, { bg: '#d6336c' }); placeAt(F, gs, x1 + 0.08, -1.6, 2.0, 1, 0);
    { const [gx, gz] = F.w(x1 + 1.5, 0); extras.labels.push({ name: 'Gym', sub: 'Fitness Centre · ground floor of the Mess, separate entrance', x: gx, y: 4.5, z: gz }); }
    // Students' Community Centre: glass pavilion with timber trusses on the roof + terrace
    const px0 = x0 + 1.5, px1 = x1 - 1.5, pz0 = z0 + 1.5, pz1 = 0;
    F.box(px0, pz0, px1, pz1, H, H + 0.2, 'concrete', 'concrete');
    rectWalls(px0, pz0, px1, pz1).forEach(([a, c, d, e]) => { F.quadOn(a, c, d, e, 0.5, Math.hypot(d - a, e - c), 0.02, H + 0.2, H + 3.6, 'glass'); const Lw = Math.hypot(d - a, e - c); for (let p = 0; p <= Lw / 3; p++) F.seg(a, c, d, e, Math.min(0.995, p * 3 / Lw + 0.005), 0.15, 0.1, 0.05, H + 0.2, H + 3.6, 'frame'); });
    gableRoof(F, px0, pz0, px1, pz1, H + 3.6, 1.2, 0.6, 'roofWhite', 'glass');
    for (let x = px0 + 1; x < px1; x += 3) F.box(x - 0.12, pz0, x + 0.12, pz1, H + 3.3, H + 3.55, 'timber');
    parapetRect(F, x0, z0, x1, z1, H, 1.0);
    tank(F, x1 - 2, z1 - 2, H);
    footprint(F, x0, z0, x1, z1); label(b, H + 7);
  },
  simple: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, H = b.floors * FH, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    const wall = b.wall || 'brick', roof = b.roof === 'grey' ? 'roofGrey' : 'roofWhite';
    F.box(x0, z0, x1, z1, 0, H, wall, roof, { collide: true });
    rectWalls(x0, z0, x1, z1).forEach(([a, c, d, e], i) => {
      for (let f = 0; f < b.floors; f++) openings(F, a, c, d, e, f * FH, i === 2 && f === 0 ? 'door' : 'std', { margin: 1, chajja: wall === 'brick' });
      if (b.floors > 1) bands(F, a, c, d, e, [FH]);
    });
    parapetRect(F, x0, z0, x1, z1, H, 0.7); if (W > 6) tank(F, x0 + 1.2, z0 + 1.2, H);
    footprint(F, x0, z0, x1, z1); label(b, H + 3);
  },
  // Chhota Canteen / Student Service Area: brick stall row (canteen, doctor, ATM, xerox) under a terracotta tiled roof
  // with a deep front overhang on posts; "CHHOTA CANTEEN" board (registration-day video, mica.ac.in photo)
  canteen: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, H = 3.3, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, zf = z0 + D * 0.55;
    F.box(x0, z0, x1, zf, 0, H, 'brick', null, { collide: true });
    const stalls = 4, sw = W / stalls;
    for (let i = 0; i < stalls; i++) {                                   // a lit counter opening per stall
      const cx = x0 + sw * (i + 0.5);
      F.quadOn(x1, zf, x0, zf, 1 - (cx - x0) / W, sw * 0.62, 0.03, 0.95, 2.4, i === 2 ? 'glass' : 'door');
      F.box(cx - sw * 0.33, zf, cx + sw * 0.33, zf + 0.55, 0, 0.95, i === 0 ? 'red' : 'concrete', 'concrete');
      if (i) F.box(x0 + sw * i - 0.15, zf, x0 + sw * i + 0.15, zf + 0.1, 0, H, 'brick', 'concrete');
    }
    const zr = zf + 2.6;                                                 // tiled roof over stalls + front verandah
    for (let x = x0 + 0.4; x <= x1 - 0.3; x += W / 5) F.box(x - 0.1, zr - 0.1, x + 0.1, zr + 0.1, 0, 2.7, 'timber');
    gableRoof(F, x0, z0, x1, zr, H, 1.4, 0.5, 'tile', 'brick');
    const s = signMesh('CHHOTA CANTEEN', 3.2, 0.5, { bg: '#1f6f8b' }); placeAt(F, s, x0 + W * 0.28, zf + 0.12, 2.7, 0, 1);
    footprint(F, x0, z0, x1, zf); label(b, 7);
  },
  temple: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    F.box(x0, z0, x1, z1, 0, 0.6, 'concrete', 'concrete', { collide: true });
    F.box(x0 + 0.6, z0 + 0.6, x0 + W * 0.4, z1 - 0.6, 0.6, 3.6, 'plaster', 'plaster');      // shrine room
    openings(F, x0 + W * 0.4, z0 + 0.6, x0 + W * 0.4, z1 - 0.6, 0.6, 'door', { margin: 0.5, chajja: false, doorMat: 'orange' });
    for (let x = x0 + W * 0.45; x <= x1 - 0.4; x += 3) for (const z of [z0 + 0.5, z1 - 0.5]) F.box(x - 0.2, z - 0.2, x + 0.2, z + 0.2, 0.6, 3.6, 'plaster');   // yoga pavilion columns
    hipRoof(F, x0 + 0.3, z0 + 0.3, x1 - 0.3, z1 - 0.3, 3.6, 2.0, 0.7, 'tile');
    const [sx, sz] = F.w(x0 + W * 0.2, 0);
    const shikhara = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 8), MAT.saffron); shikhara.position.set(sx, 6.4, sz); shikhara.castShadow = true; extras.meshes.push(shikhara);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), MAT.saffron); flag.position.set(sx + 0.45, 8.6, sz); extras.meshes.push(flag);
    footprint(F, x0, z0, x1, z1); label(b, 9);
  },
  bungalow: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M, H = 3.6, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    F.box(x0 + 2, z0 + 2, x1 - 2, z1 - 2, 0, H, 'brick', null, { collide: true });
    rectWalls(x0 + 2, z0 + 2, x1 - 2, z1 - 2).forEach(([a, c, d, e], i) => openings(F, a, c, d, e, 0, i === 2 ? 'door' : 'std', { chajja: false }));
    for (let x = x0 + 0.6; x <= x1 - 0.5; x += 3.2) F.box(x - 0.15, z1 - 0.75, x + 0.15, z1 - 0.45, 0, H, 'white');      // verandah posts
    hipRoof(F, x0 + 0.3, z0 + 0.3, x1 - 0.3, z1 - 0.3, H, 2.6, 0.6, 'tile');
    footprint(F, x0, z0, x1, z1); label(b, 8);
  },
  kiosk: b => {
    const F = new Frame(b.x, b.y, b.rot || 0), W = b.w * M, D = b.h * M;
    F.box(-W / 2, -D / 2, W / 2, D / 2, 0, 2.8, 'brick', 'roofGrey', { collide: true });
    F.box(-W / 2 - 0.2, D / 2, W / 2 + 0.2, D / 2 + 1.6, 2.5, 2.6, 'red', 'red');
    openings(F, W / 2, D / 2, -W / 2, D / 2, 0, 'tall', { margin: 0.4, dims: [W * 0.7, 1.1, 1.0], chajja: false });
    label(b, 5);
  },
};

export function buildAll(scene) {
  for (const b of L.BUILDINGS) (builders[b.kind] || builders.simple)(b);
  // other houses beyond the wall (no labels)
  for (const [x, y, w, h] of L.OTHER_HOUSES) builders.simple({ x, y, w, h, floors: 1, wall: 'plaster', roof: 'white', noLabel: true });
  // open air theatre: stepped semicircular seating facing a stage
  {
    const [x, z] = toW(L.OAT.x, L.OAT.y), r = L.OAT.r * M, prof = [new THREE.Vector2(r * 0.3, 0.02)];
    const steps = 7; for (let i = 0; i < steps; i++) { const rad = r * 0.3 + r * 0.7 * i / steps, hh = 0.42 * (i + 1); prof.push(new THREE.Vector2(rad, hh), new THREE.Vector2(rad + r * 0.7 / steps, hh)); }
    prof.push(new THREE.Vector2(r, 0));
    const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 40, 0, Math.PI), MAT.concrete);
    m.position.set(x, 0, z); m.rotation.y = L.OAT.facing * Math.PI / 180; m.castShadow = m.receiveShadow = true; extras.meshes.push(m);
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.5, 32, 1, false, 0, Math.PI), MAT.concrete);
    stage.position.set(x, 0.25, z); stage.rotation.y = L.OAT.facing * Math.PI / 180 + Math.PI; stage.receiveShadow = true; extras.meshes.push(stage);
    extras.labels.push({ name: L.OAT.name, sub: L.OAT.sub, x, y: 5, z });
  }
  // pergola grid between the seminar halls
  {
    const F = new Frame(L.PERGOLA.x, L.PERGOLA.y, 0), W = L.PERGOLA.w * M, D = L.PERGOLA.h * M;
    for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 4) F.box(x - 0.15, -D / 2, x + 0.15, D / 2, 3.9, 4.3, 'concrete');
    for (let z = -D / 2; z <= D / 2 + 0.01; z += D / 4) F.box(-W / 2, z - 0.15, W / 2, z + 0.15, 4.3, 4.6, 'concrete');
    for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]]) F.box(x - 0.25, z - 0.25, x + 0.25, z + 0.25, 0, 4.3, 'brick', 'concrete', { collide: true });
  }
  if (glassTris.length) {
    const g = new THREE.BufferGeometry().setFromPoints(glassTris); g.computeVertexNormals();
    const m = new THREE.Mesh(g, MAT.glass); m.material = MAT.glass.clone(); m.material.side = THREE.DoubleSide; extras.meshes.push(m);
  }
  // black Sintex rooftop water tanks
  const tg = new THREE.CylinderGeometry(0.75, 0.75, 1.3, 14); tg.translate(0, 0.65, 0);
  const tm = new THREE.InstancedMesh(tg, MAT.black, extras.tanks.length), m4 = new THREE.Matrix4();
  extras.tanks.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); tm.setMatrixAt(i, m4); }); tm.castShadow = true; extras.meshes.push(tm);
  // laundry drying on corridor railings
  if (extras.clothes.length) {
    const cg = new THREE.PlaneGeometry(1, 0.7); const cm = new THREE.InstancedMesh(cg, new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }), extras.clothes.length);
    const cols = [0xd94a4a, 0x3d6fd1, 0xf2f2f2, 0xf0b52e, 0x2f9e6a, 0x8a4fc7, 0x222222, 0xff7fae].map(c => new THREE.Color(c));
    const q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    extras.clothes.forEach(([x, y, z, ry, w], i) => { e.set(0, ry, 0); q.setFromEuler(e); m4.compose(p.set(x, y, z), q, s.set(w, 1, 1)); cm.setMatrixAt(i, m4); cm.setColorAt(i, cols[(rand() * cols.length) | 0]); });
    cm.castShadow = true; extras.meshes.push(cm);
  }
  for (const m of extras.meshes) scene.add(m);
  return extras;
}
