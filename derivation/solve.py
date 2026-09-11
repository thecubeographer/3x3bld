"""Find the parity alg, build a dynamic OP tracer, verify on random scrambles,
then emit verified JSON tables for the website."""
import json, random
from cube import (MOVES, N, SOLVED, apply, do, corner_of, edge_of,
                  letter_at_c, letter_at_e, LET, Y_SHORT, T_PERM, facelets)
import op

corner_setups = dict(op.corner_setups)
edge_setups = dict(op.edge_setups)
if 'O' not in edge_setups:
    for k, v in op.search(op.E_POOL, op.E_FIX, op.ETGT, letter_at_e, 4).items():
        edge_setups.setdefault(k, v)

# ------------------------------------------------------------- parity alg
PLLS = {
 'Ra': "R U' R' U' R U R D R' U' R D' R' U2 R'",
 'Rb': "R2 F R U R U' R' F' R U2 R' U2 R",
 'Ja': "R' U L' U2 R U' R' U2 R L",
 'Jb': "R U R' F' R U R' U' R' F R2 U' R'",
 'T':  "R U R' U' R' F R2 U' R' U' R U R' F'",
 'F':  "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
 'Y':  "F R U' R' U' R U R' F' R U R' U' R' F R F'",
}
best = None
for name, a in PLLS.items():
    for pre in ('', 'U', "U'", 'U2'):
        for post in ('', 'U', "U'", 'U2'):
            alg = ' '.join(x for x in (pre, a, post) if x)
            st = do(SOLVED[:], alg)
            ok = (st[edge_of['A']] == edge_of['D'] and st[edge_of['D']] == edge_of['A']
                  and st[corner_of['B']] == corner_of['C']
                  and st[corner_of['C']] == corner_of['B'])
            if ok and sum(1 for i in range(N) if st[i] != i) == 10:
                if best is None or len(alg.split()) < len(best[1].split()):
                    best = (name, alg)
PARITY = best[1]
print("parity alg:", best)

# --------------------------------------------- precompute the swap perms
def perm_of(alg):
    st = do(SOLVED[:], alg)
    p = [0] * N
    for pos, sticker in enumerate(st):
        p[sticker] = pos
    return p

def conj(setup, core):
    return ' '.join(x for x in (setup, core, op.inv_alg(setup)) if x)

CORNER_ALG = {L: conj(s, Y_SHORT) for L, s in corner_setups.items()}
EDGE_ALG = {L: conj(s, T_PERM) for L, s in edge_setups.items()}
CORNER_PERM = {L: perm_of(a) for L, a in CORNER_ALG.items()}
EDGE_PERM = {L: perm_of(a) for L, a in EDGE_ALG.items()}
PARITY_PERM = perm_of(PARITY)

# sanity: every corner conjugate must swap exactly the buffer corner with the
# target corner and the UB/UL edges, nothing else.
for L, a in CORNER_ALG.items():
    st = do(SOLVED[:], a)
    moved = {i for i in range(N) if st[i] != i}
    assert st[corner_of['A']] == corner_of[L], L
    assert len(moved) == 10, (L, len(moved))
    assert st[edge_of['A']] == edge_of['D'], L
for L, a in EDGE_ALG.items():
    st = do(SOLVED[:], a)
    moved = {i for i in range(N) if st[i] != i}
    assert st[edge_of['B']] == edge_of[L], L
    assert len(moved) == 10, (L, len(moved))
    assert st[corner_of['B']] == corner_of['C'], L
print("all", len(CORNER_ALG), "corner and", len(EDGE_ALG), "edge conjugates verified pure")

# --------------------------------------------------------------- tracer
def piece_group(home):
    g = {}
    for L in LET:
        p = facelets[home[L]][0]
        g.setdefault(p, []).append(L)
    return {L: g[facelets[home[L]][0]] for L in LET}

C_PIECE = piece_group(corner_of)
E_PIECE = piece_group(edge_of)
C_BUF = C_PIECE['A']
E_BUF = E_PIECE['B']

def trace(state, home, letter_at, perms, buf_piece, buf_letter):
    """dynamic Old Pochmann trace; returns (targets, resulting state)"""
    st = state[:]
    targets = []
    for _ in range(60):
        t = letter_at[st[home[buf_letter]]]
        if t in buf_piece:                       # buffer piece is home
            t = None
            for L in LET:
                if L in buf_piece:
                    continue
                if st[home[L]] != home[L]:
                    t = L
                    break
            if t is None:
                break
        targets.append(t)
        st = apply(st, perms[t])
    return targets, st

def solve(state):
    ct, st = trace(state, corner_of, letter_at_c, CORNER_PERM, C_BUF, 'A')
    par = len(ct) % 2 == 1
    if par:
        st = apply(st, PARITY_PERM)
    et, st = trace(st, edge_of, letter_at_e, EDGE_PERM, E_BUF, 'B')
    return ct, et, par, st

def random_scramble(n=25, faces='UDLRFB'):
    opp = {'U': 'D', 'D': 'U', 'L': 'R', 'R': 'L', 'F': 'B', 'B': 'F'}
    out = []
    while len(out) < n:
        f = random.choice(faces)
        if out and out[-1][0] == f: continue
        if len(out) > 1 and out[-1][0] == opp[f] and out[-2][0] == f: continue
        out.append(f + random.choice(['', "'", '2']))
    return ' '.join(out)

random.seed(11)
bad = mismatch = 0
for i in range(1000):
    sc = random_scramble()
    start = do(SOLVED[:], sc)
    ct, et, par, st = solve(start)
    if st != SOLVED:
        bad += 1
        if bad <= 2: print("FAIL", sc, ct, et, par)
    # edge memo traced straight off the scramble must match execution order
    et2, _ = trace(start, edge_of, letter_at_e, EDGE_PERM, E_BUF, 'B')
    if et2 != et:
        mismatch += 1
print(f"3x3: {1000-bad}/1000 fully solved; edge-memo-from-scramble mismatches: {mismatch}")

bad2 = 0
for i in range(500):
    sc = random_scramble(11, 'URF')
    st = do(SOLVED[:], sc)
    ct, st = trace(st, corner_of, letter_at_c, CORNER_PERM, C_BUF, 'A')
    if not all(st[corner_of[L]] == corner_of[L] for L in LET):
        bad2 += 1
print(f"2x2: {500-bad2}/500 corner-only solves complete")

out = {
    "cornerAlg": Y_SHORT, "edgeAlg": T_PERM, "parityAlg": PARITY,
    "cornerSetups": {L: corner_setups.get(L) for L in LET},
    "edgeSetups": {L: edge_setups.get(L) for L in LET},
}
open('op_tables.json', 'w').write(json.dumps(out, indent=1))
print("wrote op_tables.json;  edge O =", edge_setups.get('O'))
