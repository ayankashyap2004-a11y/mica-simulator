# MICA map v0.2: where I stopped (31 Oct 2026)

## Ayan's asks
- Fix positions and shapes, add missing places, and cross-check everything against MICA's own sources.
- Make the architecture **near-realistic**, so buildings look different from each other.

## Key source found
`Barrier-free-Build-by-Architect.pdf` (Aakruti Architects, 21-11-2025, linked from mica.ac.in) is the official schedule of all 31 buildings, with floors, floor area and height.
- Almost everything is **G+1 (7 m)**; v0.1 wrongly used 3 floors.
- Seminar halls are 8 m.
- Ashoka is **G+4 (15 m)**.
- Prefab clusters, gym, service area, temple, staff quarters and the security office are single storey (3.5 m).
- Hostels: Champa, Chandni, Amaltas, Gulmohar and Chinar are 464 m² each. Kachnar is 743 m². Silver Oak, Palaash and Parijat are 1,022 m² each. Ashoka is 2,322 m². There are also 6 prefab clusters totalling 1,485 m².
- Other buildings: MAB 3,251 m² (faculty offices, auditorium, CR 1-4); New Academic Block 650; Digicom 1,022 (studio and radio station); KEIC 790; OAT 186 (300 seats); Director's Bungalow 400; Guest House 360; SH1&2 408, SH3&4 334, SH5&6 408, SH7&8 334; Dining Hall 1,022 (550 seats); Student Community Centre 460 (on a 2nd floor); Gym 130; Student Service Area 139 (canteen, doctor, ATM, xerox); Laundromat 28; Staff Quarters 93; Substation 93; Temple & Yoga 139; Security 28.
- Facilities: Idea Park, cricket, football, 2 tennis courts, basketball, **volleyball**, badminton.

## Corrections worked out (Esri z19 px; see roofs.json from roofs.py)
- **The v0.1 hand trace of the core is about 50 px (~14 m) too far south for y 1250–1500.** Use the detected blobs instead:
  - KEIC #10 (743,1274) 78x74
  - Square #7 (528,1278) 51x72
  - Courtyard building #2 (519,1397) 77x81
  - Seminar-hall octagons #6 (381,1295) and #5 (439,1350), forming a 3-octagon pinwheel
  - MAB #14 (606,1087) 159x138 rot -28.5
  - Dining hall #0 (795,1606) 89x108 rot -18.4 (502 m²/floor matches 1,022)
  - Guest house #16/#17
- **Green-roof sheds = the 6 prefab hostel clusters, not a sports complex.** Their area sums to about 1,500 m², matching 1,485.
- **Hostels, from Google pins and satellite:**
  - Silver Oak = octagon-court building (998,1396), Google pin "Soak"
  - Ashoka = tall long east block
  - Palaash = quad (922,1510) linked to the octagon quad (1010,1572)
  - Parijat = grey two-court compound (820-900, 1319-1448)
  - Amaltas = grey (720-787, 1362-1402), rotated ~25°
  - Champa = grey (602-677, 1410-1475), court (629-662, 1433-1462)
  - Chandni = grey (685-756, 1440-1487)
- Temple & Yoga = red-roof hut (700-750, 295-340) by the canal. It is also the tour video's "ritual building".
- Student Service Area / Chota Canteen = grey block (875-940, 865-930).
- Still unresolved:
  - Digicom vs New Academic Block (#7 vs #2)
  - Gulmohar, Chinar, Kachnar (maybe the north half of the Parijat compound, or the pyramid-skylight quad at (922,1657))
  - Where the community centre sits
  - Volleyball court
  - Most of the small "staff quarters" in the south are probably not MICA's (the schedule lists only one 93 m² block)

## Next steps
1. Rewrite `js/layout.js` from roofs.json and the corrections above, with true heights from the schedule.
2. Gather architecture references per building (tour-video frames, more YouTube or Instagram footage), then build per-type generators: cantilevered concrete stairs, corridor balconies with railings, glass fronts at KEIC, theatre-octagon seminar halls, prefab panel walls with green roofs, Ashoka's balconies and lift core, the dining hall's big-span roof, PBR textures.
3. Ask Ayan to confirm Digicom, Gulmohar, Chinar and Kachnar.
