# BLD Trainer

**What this is.** A local practice site for solving a Rubik's cube blindfolded with the Old Pochmann
method: one piece at a time, corners first with a shortened Y perm, then edges with a T perm. It holds
a 576-word letter-pair image dictionary, a memo/execution split timer, scramble generators for 3x3 and
2x2, four drills, and a notepad that turns typed letters into images automatically.

**Who it is for.** Joseph, learning 3x3 blindfolded. Nobody else needs to be told anything to use it.

**What to do with it next.** Start the server and open it:

```bash
node "/Users/josephmiser/Documents/CLAUDE CODE/BLD TRAINER/.preview-server.js" "/Users/josephmiser/Documents/CLAUDE CODE/BLD TRAINER" 4815
```

Then go to <http://localhost:4815>. It is also registered as `bld-trainer` on port 4815 in
`CLAUDE CODE/.claude/launch.json`, and as a tile in the HUB dashboard on :4444.

---

## The method the site teaches

| | Corners | Edges |
|---|---|---|
| Buffer sticker | **A**, the U sticker of the up-back-left corner | **B**, the U sticker of the up-right edge |
| Swap slot | **P**, the R sticker of the down-front-right corner | **D**, the U sticker of the up-left edge |
| Algorithm | `R U' R' U' R U R' F' R U R' U' R' F R` (short Y perm) | `R U R' U' R' F R2 U' R' U' R U R' F'` (T perm) |
| Setup moves use | R, F, D only | L, D and the wide l, d only |

Parity: if the number of corner targets is odd, run
`R U' R' U' R U R D R' U' R D' R' U2 R' U'` once, after corners and before edges.

Lettering is Speffz, white on top and green in front, cube never reoriented mid-solve.

## Why the tables here can be trusted

The setup move tables were not copied from a tutorial. They were derived by search over cube geometry
under two constraints that make the method actually cancel out:

- corner setups must leave the buffer corner and the UB/UL edge pair untouched, so every corner
  algorithm disturbs the same two edges and an even count cancels;
- edge setups must leave the buffer edge and the UFR/UBR corner pair untouched, for the same reason on
  the other side.

Then the whole pipeline was tested end to end: scramble a cube, trace the memo, execute the generated
setup + algorithm + undo sequences, check the cube is solved. 2000 random 3x3 scrambles and 1000 random
2x2 scrambles, zero failures. That test runs in the browser too, see `assets/js/cube.js`.

## Files

```
index.html                 six screens: Solve, Letters, Pairs, Targets, Notes, Ref
assets/css/app.css         dark surface, the six cube face colours carry the meaning
assets/js/data-letters.js  the 576 letter-pair images and the scheme behind them
assets/js/cube.js          sticker simulator, scramble generator, Old Pochmann tracer, verified tables
assets/js/app.js           all the UI, timer, drills, storage
.preview-server.js         no-cache static server
```

## The letter-pair scheme

The word starts with the first letter and the second letter is the next sound you hear, so DG is DoG
and VP is ViPer. When the second letter is a vowel the word simply starts with both, BO is BOot. Where
no clean single word exists, mostly J, Q and X, the word is a two-word image whose initials are the
pair, BJ is Blue Jay. No word is used twice.

Click any word on the Letters screen to change it. Edits live in this browser's localStorage under the `bld.` keys,
and **Export** writes all 576 out to a file, so back them up if they matter.

## Things worth knowing

- The timer only listens on the Solve screen. Space starts memo, space splits to exec, space stops. S opens the solution, N reshuffles.
- Every Speffz letter is tinted by the face it lives on (U white, L orange, F green, R red, B blue, D yellow), and so is every turn in a scramble or algorithm. The colour is the information.
- Session history, custom words, drill history and notepad lines are all in localStorage. Clearing site
  data for localhost wipes them. Export the letters first.
- 2x2 uses the same corner buffer and the same algorithm. It has no edges and therefore no parity,
  which makes it the right place to practise corners blind before adding edges.
