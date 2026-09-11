# How the algorithm tables were derived

These four files are the proof behind `../assets/js/cube.js`. Run them with plain python3, no
packages needed. Nothing here is used by the website at runtime; it exists so the tables can be
re-checked or changed later without trusting a forum post.

- `cube.py` builds a 3x3 sticker simulator from cube geometry (each of the 54 stickers is a position
  plus a normal, and a face turn is a 90 degree rotation), then labels every sticker with its Speffz
  letter. Run it alone to print exactly what the short Y perm and the T perm do.
- `op.py` searches for setup moves. Corner setups may only use R, F and D so they leave the buffer
  corner and the UB/UL edge pair untouched. Edge setups may only use L, D and the wide l, d so they
  leave the buffer edge and the UFR/UBR corner pair untouched. Those two rules are what make the side
  effects identical every time, so they cancel over an even number of targets.
- `solve.py` finds the parity algorithm by testing standard perms with every U face adjustment, then
  traces and executes 1000 random scrambles end to end and checks the cube ends solved. It also
  confirms that tracing edges straight off the scramble gives the same letters as tracing them after
  corners and parity have been executed, which is what makes memorising both halves up front valid.
  It writes `op_tables.json`.

Result: 1000 of 1000 3x3 scrambles solved, 500 of 500 2x2, zero edge memo mismatches.

```bash
python3 solve.py
```
