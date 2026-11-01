# MICA campus map: reference notes (v0.2, 1 Nov 2026)

**Run it:** `py -3 -m http.server 8767 --directory mica-sim`, then open http://localhost:8767.

**Key controls:**
- **M:** overlays the real satellite image so you can check the layout.
- **O:** toggles ambient occlusion.
- **T:** cycles the time of day.
- **V:** switches to an overhead view.

## Sources, in priority order
1. **Architect's building schedule**: Aakruti Architects, 21-11-2025, linked from mica.ac.in. A copy is at `research/Barrier-free-Build-by-Architect.pdf`. It gives every building's name, number of floors, floor area, height and use.
2. **Building outlines**: detected automatically from the satellite image (`research/roofs.py`) and checked against Google satellite. Floor areas match the schedule; for example, the Dining Hall's detected roof is 502 m², against 1,022 m² over G+1 in the schedule.
3. **Hostel identities**: Google Maps pins (Soak, Fortress Ashoka, Palaash, Hostel Parijat, House of Champa, Chandni Villa, TheAmaltas).
4. **Architecture**: two campus tour videos.
   - Exposed red brick with projecting concrete floor bands.
   - Windows with concrete surrounds, chajja sunshades and louvres.
   - Courtyard hostels with brick piers, open corridors and solid concrete railings.
   - Cantilevered concrete stairs with red hostel name boards.
   - Black rooftop water tanks and orange-painted tree trunks.

## What each building is
| Building | Floors / height (schedule) | Confidence |
|---|---|---|
| Main Academic Block (auditorium, CR 1–4, reception) | G+1, 7 m; auditorium volume raised | high |
| Seminar Halls 1&2, 3&4, 5&6, 7&8: four octagons around a pergola court | G+1, 8 m | medium (which hall is which octagon is a guess) |
| New Academic Block (square block by the plaza) | G+1 | medium |
| Digicom (courtyard block south of the seminar halls) | G+1 | medium |
| KEIC | G+1 | high |
| Champa, Chandni, Amaltas (grey-roof courtyards) | G+1 | high |
| Chinar (north) and Gulmohar (south): grey courtyards facing each other across the Amaltas → Silver Oak road | G+1 | high (Ayan, 1 Nov) |
| Silver Oak (octagon-court block) | G+1 | high |
| Kachnar (north), Palaash (middle, octagon court), Parijat (south, pyramid skylight): all three ring the open badminton court, whose open side faces the Mess | G+1 | high (Ayan, 1 Nov; Parijat and Kachnar swapped after his check) |
| Ashoka (long block, balconies, lift core) | G+4, 15 m | high |
| **Shishya Gramah**: the SOAC (School of Applied Communication / CCC) hostels, 6 prefab hutment clusters between Silver Oak and Chota Canteen, plus the Healing Circle hut | ground, 3.5 m | high; confirmed by Ayan's photos (the WhatsApp images in this folder) |
| Mess: ground and 1st floor are dining; the 2nd floor has table tennis and carrom (Students' Community Centre) plus open roof-terrace seating | G+1 + 2nd floor | high (Ayan, 1 Nov) |
| Staff Quarters (mess staff) | ground | medium |
| Chota Canteen (Student Service Area) | ground | high |
| Temple & Yoga Centre (red-roof hut by the canal) | ground | medium |
| Guest House, Director's Bungalow | G+1 / ground | high / medium |

## Cross-check, 1 Nov
- **Google Earth (April 2026 imagery):** confirms the south cluster.
  - Mastipur Palaash sits beside Ashoka's south end.
  - The teal court lies between Kachnar and Parijat, and Parijat is the pyramid quad.
  - The bare patch south-east of Palaash is the volleyball court.
  - The real gap between Palaash and Ashoka is about 3.75 m. In the game it's widened to about 5.5 m so the walk is easy.
- **Google Maps satellite:** the Shishya Gramah rows and the Healing Circle strip match. Its user-added "Hostel Parijat" pin sits on the Chinar/Gulmohar compound; Ayan's on-campus identification takes priority.
- **mica.ac.in Life@MICA:**
  - Chhota is the 24-hour canteen, with a yearly-painted art wall and rope swings.
  - MICafe is a second hangout; the kiosk near the seminar halls now carries that name.
  - There's graffiti on the hostel walls.
  - A green badminton court sits inside a hostel courtyard.
  - The seminar halls are tiered horseshoe classrooms inside.
- **/watch videos:**
  - *Chotta vlog:* Chhota is a plaza with LED-wrapped trees on round brick planters, string lights, swings, blue charpoys, red stools and the Pac-Man "LEVEL UP" art wall. All of this is now modelled.
  - *Registration-day video:*
    - The MICA board stands **outside** the gate, roadside on the left (moved there).
    - The security cabin is brick with a water tank (changed).
    - Chhota Canteen is a stall row under a tiled roof (rebuilt).
    - The parking lot has steel car shades (added).
  - *Amaltas hostel tour:* matches the courtyard model (concrete corridors, cantilevered stairs, kite murals, laundry).
  - *Sports-day video:* football, basketball and the volleyball court by the hostels all match.

- **Chhota realigned (Ayan, 1 Nov):**
  - The tiled stall row now sits on the two terracotta roofs at about (920–950, 960–1020), rotated 90° to face **west**.
  - The plaza is the bare clearing in front of it, at about (880–923, 955–1022).
  - The road from the Main Academic Block now runs into the plaza's west edge.
  - The grey building to the north is the **Student Service Area** (doctor, ATM, xerox; about 89 m², matching the schedule).

## Still open
- **Satellite cross-check (1 Nov):** `research/overlay_core.jpg` and `research/overlay_north.jpg` draw every footprint over the satellite image. All of them sit on real roofs.
- **Gym and volleyball court** (placed from Ayan's directions, 1 Nov):
  - **Gym (Fitness Centre):** a ground-floor unit of the Mess building facing Palaash across the badminton court. It has its own entrance and doesn't connect to the mess inside.
  - **Volleyball court:** in the brown bare-earth patch between Parijat and Palaash, at about (1000–1067, 1633–1697) on the satellite. A path runs from behind Palaash through the gap between Palaash and Ashoka.
- **Which seminar-hall octagon is which number.**
- **Exact boundary wall line in the south-west.** The houses south of it are probably not MICA's; the schedule lists only one staff-quarters block.
