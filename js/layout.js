// MICA Ahmedabad (Shela) campus layout, v0.2.
// Coordinates are pixels in assets/satellite_z19.jpg (Esri World Imagery z19), 1 px = 0.2749 m.
// Footprints come from automatic roof detection (research/roofs.py) checked against Google satellite.
// Floors / heights / uses come from the architect's building schedule linked on mica.ac.in
// (Aakruti Architects, 21-11-2025, research/Barrier-free-Build-by-Architect.pdf).
// rot = degrees clockwise on the image. confidence: high | med | low.

export const M_PER_PX = 0.2749;
export const ORIGIN_PX = [606, 1087];
export const IMG_SIZE = [1536, 2304];
export const FLOOR_H = 3.5;

export const BUILDINGS = [
  // ---------------- academic ----------------
  { id: 'mab', kind: 'mab', name: 'Main Academic Block', sub: 'Reception · Auditorium · CR 1–4 · Faculty', x: 606, y: 1087, w: 150, h: 128, rot: -29,
    court: [50, 40], floors: 2, confidence: 'high', sched: 1 },
  { id: 'sh12', kind: 'seminar', name: 'Seminar Halls 1 & 2', x: 398, y: 1272, w: 52, h: 54, rot: 0, height: 8, door: 'se', stair: 'w', confidence: 'med', sched: 8 },
  { id: 'sh34', kind: 'seminar', name: 'Seminar Halls 3 & 4', x: 360, y: 1317, w: 54, h: 53, rot: 0, height: 8, door: 'e', stair: 's', confidence: 'med', sched: 9 },
  { id: 'sh56', kind: 'seminar', name: 'Seminar Halls 5 & 6', x: 459, y: 1331, w: 56, h: 59, rot: 0, height: 8, door: 'w', stair: 'n', confidence: 'med', sched: 10 },
  { id: 'sh78', kind: 'seminar', name: 'Seminar Halls 7 & 8', x: 420, y: 1372, w: 56, h: 58, rot: 0, height: 8, door: 'n', stair: 'e', confidence: 'med', sched: 11 },
  { id: 'newacad', kind: 'office', name: 'New Academic Block', sub: 'Academic & admin offices', x: 532, y: 1279, w: 60, h: 71, rot: 0, floors: 2, confidence: 'med', sched: 2 },
  { id: 'digicom', kind: 'courtyard', name: 'Digicom Building', sub: 'Digital studio · Radio station · Faculty', x: 520, y: 1396, w: 78, h: 84, rot: 0,
    court: [30, 30], floors: 2, gate: 'n', roof: 'white', confidence: 'med', sched: 3 },
  { id: 'keic', kind: 'keic', name: 'KEIC', sub: 'Knowledge Exchange & Information Centre · Library', x: 743, y: 1274, w: 78, h: 74, rot: -2, floors: 2, confidence: 'high', sched: 4 },

  // ---------------- hostels ----------------
  { id: 'champa', kind: 'hostel', name: 'Champa', sub: 'Hostel No. 1', x: 640, y: 1443, w: 72, h: 60, rot: 18, court: [32, 26], floors: 2, gate: 'e', stair: 'n', roof: 'grey', confidence: 'high', sched: 16 },
  { id: 'chandni', kind: 'hostel', name: 'Chandni', sub: 'Hostel No. 2', x: 720, y: 1466, w: 62, h: 52, rot: 25, court: [28, 22], floors: 2, gate: 'n', stair: 'w', roof: 'grey', confidence: 'high', sched: 17 },
  { id: 'amaltas', kind: 'hostel', name: 'Amaltas', sub: 'Hostel No. 3', x: 753, y: 1384, w: 58, h: 46, rot: 25, court: [26, 18], floors: 2, gate: 's', stair: 'e', roof: 'grey', confidence: 'high', sched: 18 },
  // Chinar & Gulmohar face each other across the road from Amaltas to Silver Oak (Ayan, 01-11): Chinar north, Gulmohar south.
  { id: 'chinar', kind: 'hostel', name: 'Chinar', sub: 'Hostel No. 5', x: 860, y: 1344, w: 80, h: 60, rot: 0, court: [42, 28], floors: 2, gate: 's', stair: 'e', roof: 'grey', confidence: 'high', sched: 20 },
  { id: 'gulmohar', kind: 'hostel', name: 'Gulmohar', sub: 'Hostel No. 4', x: 860, y: 1419, w: 80, h: 60, rot: 0, court: [40, 28], floors: 2, gate: 'n', stair: 'w', roof: 'grey', confidence: 'high', sched: 19 },
  { id: 'silveroak', kind: 'hostel', name: 'Silver Oak', sub: 'Hostel No. 7', x: 1000, y: 1395, w: 98, h: 91, rot: 0, court: [46, 48], floors: 2, gate: 's', stair: 'w', roof: 'white', confidence: 'high', sched: 22 },
  { id: 'ashoka', kind: 'ashoka', name: 'Ashoka', sub: 'Hostel No. 10 · G+4', x: 1078, y: 1495, w: 52, h: 165, rot: 0, floors: 5, confidence: 'high', sched: 25 },
  // Kachnar (north), Palaash (middle), Parijat (south) ring the open badminton court; its fourth (open) side faces the Mess (Ayan, 01-11).
  { id: 'kachnar', kind: 'hostel', name: 'Kachnar', sub: 'Hostel No. 6', x: 918, y: 1503, w: 66, h: 62, rot: 0, court: [38, 36], floors: 2, gate: 's', stair: 'e', roof: 'white', confidence: 'high', sched: 21 },
  { id: 'palaash', kind: 'hostel', name: 'Palaash', sub: 'Hostel No. 8', x: 1013, y: 1572, w: 69, h: 71, rot: 0, court: [42, 38], floors: 2, gate: 'w', stair: 'n', roof: 'white', confidence: 'high', sched: 23 },
  { id: 'parijat', kind: 'hostel', name: 'Parijat', sub: 'Hostel No. 9', x: 931, y: 1657, w: 93, h: 100, rot: 0, court: [48, 44], floors: 2, gate: 'n', stair: 'w', roof: 'white', skylight: true, confidence: 'high', sched: 24 },
  // Shishya Gramah — SOAC (School of Applied Communication / CCC) hostels: 6 prefab hutment clusters (schedule: 96 rooms).
  // Confirmed by Ayan's photos (Desktop/MICA 3D/WhatsApp Image 2026-11-01*): brick dado + white plaster, green sheet roofs
  // with red fascia, raised oxide-red plinths, facing rows across a red-paver street with a central lawn strip.
  { id: 'sg1', kind: 'hutment', name: 'Shishya Gramah', sub: 'SOAC / CCC hostels · hutments', x: 873, y: 1160, w: 90, h: 34, rot: 0, doors: 'ns', confidence: 'high', sched: 26, noLabel: true },
  { id: 'sg2', kind: 'hutment', name: 'Shishya Gramah', x: 978, y: 1160, w: 90, h: 34, rot: 0, doors: 'ns', confidence: 'high', noLabel: true },
  { id: 'sg3', kind: 'hutment', name: 'Shishya Gramah', sub: 'SOAC / CCC hostels · hutments', x: 884, y: 1233, w: 42, h: 86, rot: 0, doors: 'ew', confidence: 'high', sched: 26 },
  { id: 'sg4', kind: 'hutment', name: 'Shishya Gramah', x: 966, y: 1233, w: 42, h: 86, rot: 0, doors: 'ew', confidence: 'high', noLabel: true },
  { id: 'sg5', kind: 'hutment', name: 'Shishya Gramah', x: 1031, y: 1233, w: 56, h: 84, rot: 0, doors: 'ew', confidence: 'high', noLabel: true },
  { id: 'sg6', kind: 'hutment', name: 'The Healing Circle', sub: 'Counselling · Shishya Gramah', x: 1005, y: 1308, w: 104, h: 30, rot: 0, doors: 'ns', sign: 'THE HEALING CIRCLE', confidence: 'med' },

  // ---------------- student life & services ----------------
  // Mess: ground + 1st floor dining; 2nd floor = Students' Community Centre (TT, carrom) with open roof-terrace seating.
  { id: 'dining', kind: 'dining', name: 'Mess (Dining Hall)', sub: 'G + 1st: mess · 2nd: TT & carrom + roof terrace', x: 795, y: 1606, w: 89, h: 108, rot: -18, floors: 2, confidence: 'high', sched: 12 },
  { id: 'staffq', kind: 'simple', name: 'Staff Quarters', sub: 'Mess staff', x: 770, y: 1533, w: 35, h: 42, rot: -20, floors: 1, wall: 'plaster', roof: 'white', confidence: 'med', sched: 28 },
  { id: 'canteen', kind: 'canteen', name: 'Chota Canteen', sub: 'Student Service Area · Doctor · ATM · Xerox', x: 907, y: 897, w: 52, h: 46, rot: 0, confidence: 'high', sched: 15 },
  { id: 'temple', kind: 'temple', name: 'Temple & Yoga Centre', sub: 'Shree Ganpati Temple', x: 725, y: 317, w: 46, h: 34, rot: 22, confidence: 'med', sched: 30 },
  { id: 'guest1', kind: 'simple', name: 'Guest House', x: 752, y: 698, w: 56, h: 34, rot: 35, floors: 2, roof: 'white', confidence: 'high', sched: 7 },
  { id: 'guest2', kind: 'simple', name: 'Guest House', x: 734, y: 624, w: 20, h: 50, rot: -40, floors: 2, roof: 'white', confidence: 'high', noLabel: true },
  { id: 'director', kind: 'bungalow', name: "Director's Bungalow", x: 862, y: 815, w: 92, h: 56, rot: 12, confidence: 'med', sched: 6 },
  { id: 'laundry', kind: 'simple', name: 'Laundromat', x: 1062, y: 1290, w: 18, h: 13, rot: 0, floors: 1, wall: 'plaster', roof: 'white', confidence: 'low', sched: 27 },
  { id: 'substation', kind: 'simple', name: 'Electric Sub-station & DG', x: 1125, y: 1320, w: 22, h: 26, rot: 0, floors: 1, wall: 'plaster', roof: 'white', confidence: 'low', sched: 29 },
  { id: 'cafe', kind: 'kiosk', name: 'Café kiosk', x: 487, y: 1302, w: 14, h: 11, rot: 0, confidence: 'low' },
];

export const OAT = { name: 'Open Air Theatre', sub: '300 seats', x: 614, y: 1296, r: 23, facing: 135, confidence: 'high' };
export const PERGOLA = { x: 398, y: 1325, w: 34, h: 34 };   // shaded court between the seminar halls

export const SURFACES = [
  { kind: 'lawn', name: 'Football Ground', pts: [[300, 830], [655, 830], [668, 958], [300, 960]], label: true },
  { kind: 'cricket', name: 'Cricket Ground', ellipse: [705, 505, 98, 138], label: true },
  { kind: 'scrub', pts: [[160, 1460], [300, 1440], [470, 1470], [580, 1560], [700, 1640], [760, 1720], [760, 1880], [330, 1790], [160, 1760]] },
  { kind: 'paver', name: 'Academic Plaza', pts: [[470, 1238], [700, 1232], [708, 1330], [560, 1352], [478, 1320]], label: true },
  { kind: 'brickpave', pts: [[820, 1135], [1068, 1135], [1068, 1330], [820, 1330]] },   // Shishya Gramah red-paver streets
  { kind: 'lawn', pts: [[919, 1194], [931, 1194], [931, 1272], [919, 1272]] },          // central lawn strip of the Shishya Gramah street
  { kind: 'paver', pts: [[162, 1156], [448, 1160], [448, 1226], [162, 1222]] },        // main parking
  { kind: 'brickpave', pts: [[880, 1450], [1050, 1445], [1050, 1700], [880, 1705]] },   // south hostel quads
  { kind: 'lawn', name: 'Idea Park lawn', pts: [[600, 1515], [690, 1520], [700, 1600], [610, 1600]], label: true },
  { kind: 'lawn', pts: [[815, 835], [925, 850], [915, 880], [810, 862]] },              // bungalow garden
];

export const COURTS = [
  { kind: 'basketball', name: 'Basketball Court', x: 523, y: 609, w: 59, h: 50, rot: -5 },
  { kind: 'tennis', name: 'Tennis Courts', x: 484, y: 712, w: 52, h: 130, rot: 0 },
  { kind: 'tennis', name: '', x: 540, y: 712, w: 52, h: 130, rot: 0 },
  { kind: 'badminton', name: 'Badminton Court (open)', x: 920, y: 1570, w: 60, h: 28, rot: 0 },
  // In the brown patch between Parijat and Palaash (Ayan, 01-11); bare-earth patch on the satellite at ~(1000-1067, 1633-1697).
  { kind: 'volleyball', name: 'Volleyball Court', x: 1033, y: 1666, w: 62, h: 32, rot: 0 },
];

export const PATHS = [
  { w: 5, pts: [[600, 1165], [585, 1232]] },
  { w: 4, pts: [[300, 1226], [330, 1258], [352, 1285]] },
  { w: 4, pts: [[655, 1330], [690, 1395], [700, 1420]] },
  { w: 3.5, pts: [[700, 1420], [790, 1430], [818, 1440]] },
  { w: 3.5, pts: [[760, 1495], [820, 1478], [880, 1470]] },
  { w: 3.5, pts: [[740, 1505], [775, 1555]] },
  { w: 3, pts: [[787, 1281], [801, 1287]] },
  { w: 4, pts: [[778, 1381], [860, 1381], [951, 1385]] },      // road Amaltas -> Silver Oak, between Chinar and Gulmohar
  { w: 3, pts: [[1050, 1530], [1051, 1582], [1060, 1610], [1050, 1645]] },   // gap between Palaash and Ashoka: path from behind Palaash to the volleyball court
  { w: 4, pts: [[1081, 1348], [1112, 1420], [1118, 1620], [1080, 1715]] },
  { w: 3.5, pts: [[905, 925], [906, 989]] },
  { w: 3, pts: [[565, 640], [620, 580], [660, 560]] },
  { w: 3, pts: [[560, 806], [520, 780], [520, 655]] },
  { w: 3, pts: [[680, 380], [700, 340]] },
];

// Campus boundary wall. Gate opening sits on the edge [145,780]-[140,700].
export const BOUNDARY = [[350, 240], [700, 240], [1000, 560], [1110, 900], [1160, 1300], [1178, 1750], [1190, 1965],
  [780, 1905], [330, 1790], [150, 1770], [145, 780], [140, 700], [350, 690]];
export const GATE = { a: [145, 780], b: [140, 700], at: 0.6, width: 9 };
export const SPAWN = { x: 182, y: 742, facing: 100 };

export const PROPS = [
  { kind: 'micaSign', x: 168, y: 720, rot: 100 },
  { kind: 'directionSign', x: 190, y: 800, rot: 90 },
  { kind: 'questionWall', x: 650, y: 1590, rot: 0 },
  { kind: 'benches', x: 590, y: 1250 },
  { kind: 'goal', x: 310, y: 895, rot: 90 },
  { kind: 'goal', x: 658, y: 895, rot: -90 },
  // Shishya Gramah street: bent-arm street lights either side of the lawn strip, areca palms in pots
  ...[1200, 1232, 1264].flatMap(y => [{ kind: 'streetlight', x: 915, y, rot: 90 }, { kind: 'streetlight', x: 935, y, rot: -90 }]),
  ...[[925, 1190], [925, 1276], [908, 1215], [942, 1250], [908, 1258], [942, 1205], [1000, 1325], [1040, 1325]].map(([x, y]) => ({ kind: 'palm', x, y })),
];

// Houses outside the schedule (probably private/staff plots beyond the campus wall): plain geometry, no labels.
export const OTHER_HOUSES = [[728, 1778, 42, 22], [570, 1915, 36, 28], [738, 1922, 40, 22], [520, 1975, 36, 20], [842, 2015, 32, 22], [722, 2008, 30, 20]];

// From the schedule but position unknown — listed in the HUD notes, not placed.
export const UNPLACED = [];
