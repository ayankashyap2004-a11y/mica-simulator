# MICA Simulator

A third-person 3D slice-of-life sim set on the campus of MICA, The School of Ideas, in Shela, Ahmedabad. It runs in the browser with Three.js. This is a work in progress.

**Play:** open the GitHub Pages link for this repo, wait for the campus to load, then click to start.

## Controls
| Key | Action |
|---|---|
| WASD | walk |
| Shift | run |
| Space | jump |
| Drag | look around |
| Wheel | zoom |
| V | overhead view |
| M | lay the satellite image over the ground |
| T | time of day |
| L | labels |
| O | ambient occlusion |
| Esc | skip the intro |

## How the campus was built
- **Footprints:** detected from Esri World Imagery and checked against Google satellite (`research/roofs.py`, `research/overlay_*.jpg`).
- **Floors, heights and uses:** taken from the architect's building schedule published on mica.ac.in (`research/Barrier-free-Build-by-Architect.pdf`).
- **Building identities:** corrected on campus by a current student. Details are in [`CAMPUS_LAYOUT.md`](CAMPUS_LAYOUT.md).
- **Architecture details:** referenced from public campus tour videos.

## Run locally
```bash
py -3 -m http.server 8767
```
Then open http://localhost:8767.
