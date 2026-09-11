# BLD Trainer

**What this is.** A course and practice tool for solving a Rubik's cube blindfolded with Old
Pochmann: one piece at a time, corners first with a shortened Y perm, then edges with a T perm.

**Live:** <https://thecubeographer.github.io/3x3bld/>
**Local:** <http://localhost:4815> (launchd agent `com.joseph.bldtrainer`, restarts itself)

**Where to start.** Open it and answer the four placement questions. The course decides which of the
eight steps you begin on and unlocks the rest as you earn them.

---

## The eight steps

| # | Step | Gate |
|---|------|------|
| 1 | The lettering | name 12 lit stickers on the 3D cube |
| 2 | The corner algorithm | self marked once you can run it |
| 3 | Corner setups | recall 15 setups |
| 4 | 2x2 blindfolded | 3 solved in a row, a DNF resets to zero |
| 5 | Letter pairs | 40 images recalled |
| 6 | Edges and parity | self marked |
| 7 | 3x3 with the notes open | 3 solved in a row |
| 8 | Full 3x3, timed | 3 solved in a row |

Every solve ends with "did it come out solved", and that answer is what moves the gate. There is no
way to advance by attempting.

## The method

| | Corners | Edges |
|---|---|---|
| Buffer | **A**, U sticker of the up back left corner | **B**, U sticker of the up right edge |
| Swap slot | **P**, R sticker of the down front right corner | **D**, U sticker of the up left edge |
| Algorithm | `R U' R' U' R U R' F' R U R' U' R' F R` | `R U R' U' R' F R2 U' R' U' R U R' F'` |
| Setups use | R, F, D only | L, D and the wide l, d only |

Parity, when the corner target count is odd, after corners and before edges:
`R U' R' U' R U R D R' U' R D' R' U2 R' U'`

## Why the tables can be trusted

The setup tables were derived by search over cube geometry, not copied from a forum. Corner setups
must leave the buffer corner and the UB/UL edge pair untouched; edge setups must leave the buffer
edge and the UFR/UBR corner pair untouched. Under those two rules every algorithm disturbs the same
pieces every time, so an even count cancels. The whole pipeline was then run end to end on 2000
random 3x3 scrambles and 1000 2x2 scrambles with zero failures. See `derivation/`.

## Files

```
index.html                 five screens: Learn, Solve, Letters, Pairs, Notes
assets/js/cube.js          sticker simulator, scrambles, Old Pochmann tracer, verified tables
assets/js/cube3d.js        the live CSS 3D cube used in every lesson
assets/js/path.js          the course: quiz, steps, gates, celebration
assets/js/data-letters.js  576 letter pair images
assets/js/app.js           timer, drills, notes, storage
assets/video/              Blender renders: cube-loop and cube-cel, webm with alpha plus mp4
derivation/                the python that produced and proved the tables
```

## Things worth knowing

- Every Speffz letter is tinted by the face it lives on (U white, L orange, F green, R red, B blue,
  D yellow), and so is every turn in a scramble or algorithm. The colour is the information.
- Progress, custom words, session history and notes all live in this browser's localStorage under
  `bld.`. Export your letter pairs before clearing site data.
- Blender source for the clips is not checked in. Re-render by opening Blender and rebuilding the
  scene; the render settings that matter are Standard view transform and linear base colours.
