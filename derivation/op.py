"""Derive + verify the full Old Pochmann table, then emit JSON for the site."""
import json, random, itertools
from collections import deque
from cube import (MOVES, AX, IDX, facelets, N, SOLVED, apply, do, inv,
                  corner_of, edge_of, letter_at_c, letter_at_e, LET,
                  Y_SHORT, T_PERM, name_of, describe, dot)

# wide / slice moves as composed permutations ------------------------------
def compose(*algs):
    st = SOLVED[:]
    for a in algs:
        st = do(st, a)
    # turn a state into a position-permutation
    perm = [0] * N
    for pos, sticker in enumerate(st):
        perm[pos] = pos  # placeholder
    p = [0] * N
    for pos, sticker in enumerate(st):
        p[sticker] = pos
    return p

EXTRA = {
    'M': "R L' x'", 'M2': "R2 L2 x2", "M'": "R' L x",
    'E': "U D' y'", 'E2': "U2 D2 y2", "E'": "U' D y",
    'S': "F' B z", 'S2': "F2 B2 z2", "S'": "F B' z'",
}
# rotations
def rot_perm(axis, times):
    a = AX[axis]
    from cube import rot_cw
    perm = list(range(N))
    for i, (p, n) in enumerate(facelets):
        np_, nn = p, n
        for _ in range(times):
            np_, nn = rot_cw(np_, a), rot_cw(nn, a)
        perm[i] = IDX[(np_, nn)]
    return perm

for base, ax in (('x', 'R'), ('y', 'U'), ('z', 'F')):
    for suf, t in (('', 1), ('2', 2), ("'", 3)):
        MOVES[base + suf] = rot_perm(ax, t)

for name, expr in EXTRA.items():
    MOVES[name] = compose(expr)
# wide moves
for name, expr in {
    'r': "R M'", 'r2': "R2 M2", "r'": "R' M",
    'l': "L M", 'l2': "L2 M2", "l'": "L' M'",
    'u': "U E'", 'u2': "U2 E2", "u'": "U' E",
    'd': "D E", 'd2': "D2 E2", "d'": "D' E'",
    'f': "F S", 'f2': "F2 S2", "f'": "F' S'",
    'b': "B S'", 'b2': "B2 S2", "b'": "B' S",
}.items():
    MOVES[name] = compose(expr)

INV = {'': "'", "'": '', '2': '2'}
def inv_alg(alg):
    return ' '.join(m[0] + INV[m[1:]] for m in reversed(alg.split())) if alg else ''

# ---------------------------------------------------------------- algorithms
JB = "R U R' F' R U R' U' R' F R2 U' R'"
JA = "R' U L' U2 R U' R' U2 R L"
PARITY = "L U2 L' U2 L F' L' U' L U L F L2 U"

def eff(alg):
    st = do(SOLVED[:], alg)
    out = []
    for i in range(N):
        if st[i] != i:
            k = 'C' if i in letter_at_c else ('E' if i in letter_at_e else 'x')
            out.append((k, letter_at_c.get(i) or letter_at_e.get(i) or name_of(i),
                        letter_at_c.get(st[i]) or letter_at_e.get(st[i]) or name_of(st[i])))
    return out

print("Jb :", eff(JB))
print("Ja :", eff(JA))
print("par:", eff(PARITY))

# --------------------------------------------------------------- setup search
CBUF, CTGT = corner_of['A'], corner_of['P']
EBUF, ETGT = edge_of['B'], edge_of['D']

# stickers that a corner setup must leave untouched: buffer corner (A,E,R) and
# the edges the short-Y disturbs (UB=A, UL=D)
C_FIX = [corner_of[c] for c in 'AER'] + [edge_of[c] for c in 'AD']
# stickers an edge setup must leave untouched: buffer edge (B,M) and the two
# corners the T-perm disturbs (UFR = C/J/M, UBR = B/N/Q)
E_FIX = [edge_of[c] for c in 'BM'] + [corner_of[c] for c in 'CJMBNQ']

C_POOL = [m + s for m in 'RFD' for s in ('', "'", '2')]
E_POOL = [m + s for m in ('L', 'D', 'l', 'd') for s in ('', "'", '2')]

def search(pool, fixed, tgt_pos, letter_map, maxdepth=3):
    """shortest setup per target letter"""
    found = {}
    start = tuple(SOLVED)
    seen = {start: ''}
    q = deque([(start, '')])
    while q:
        st, alg = q.popleft()
        d = len(alg.split()) if alg else 0
        # record
        if all(st[f] == f for f in fixed):
            here = st[tgt_pos]
            L = letter_map.get(here)
            if L and L not in found:
                found[L] = alg
        if d >= maxdepth:
            continue
        for m in pool:
            if alg and alg.split()[-1][0] == m[0]:
                continue
            ns = tuple(apply(list(st), MOVES[m]))
            na = (alg + ' ' + m).strip()
            if ns in seen:
                continue
            seen[ns] = na
            q.append((ns, na))
    return found

corner_setups = search(C_POOL, C_FIX, CTGT, letter_at_c, 3)
edge_setups = search(E_POOL, E_FIX, ETGT, letter_at_e, 3)
print("\ncorner setups", len(corner_setups), corner_setups)
print("\nedge setups", len(edge_setups), edge_setups)
missing_c = [c for c in LET if c not in corner_setups]
missing_e = [c for c in LET if c not in edge_setups]
print("missing corners:", missing_c, " missing edges:", missing_e)
