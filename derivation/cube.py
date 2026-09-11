"""Geometry-derived 3x3 sticker simulator + Old Pochmann table generator.

Purpose: derive (not guess) the exact effect of the OP algs and every legal
setup move sequence, so the training site ships verified data.
"""
import itertools, json
from collections import deque

AX = {'U': (0, 1, 0), 'D': (0, -1, 0), 'R': (1, 0, 0),
      'L': (-1, 0, 0), 'F': (0, 0, 1), 'B': (0, 0, -1)}

def dot(a, b): return sum(x * y for x, y in zip(a, b))
def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def rot_cw(v, a):
    """rotate v by -90deg about axis a (clockwise seen from +a)"""
    d = dot(a, v)
    c = cross(a, v)
    return (a[0]*d - c[0], a[1]*d - c[1], a[2]*d - c[2])

# ---- build the 54 facelets -------------------------------------------------
facelets = []          # list of (pos, normal)
for x in (-1, 0, 1):
    for y in (-1, 0, 1):
        for z in (-1, 0, 1):
            p = (x, y, z)
            if p == (0, 0, 0):
                continue
            for name, a in AX.items():
                if dot(p, a) == 1:
                    facelets.append((p, a))
IDX = {f: i for i, f in enumerate(facelets)}
N = len(facelets)
assert N == 54, N

def move_perm(face, times=1):
    """position permutation p: new_state[p[i]] = old_state[i]"""
    a = AX[face]
    perm = list(range(N))
    for i, (p, n) in enumerate(facelets):
        if dot(p, a) == 1:
            np_, nn = p, n
            for _ in range(times):
                np_, nn = rot_cw(np_, a), rot_cw(nn, a)
            perm[i] = IDX[(np_, nn)]
    return perm

MOVES = {}
for f in AX:
    for suf, t in (('', 1), ("2", 2), ("'", 3)):
        MOVES[f + suf] = move_perm(f, t)

def apply(state, perm):
    out = [0] * N
    for i, s in enumerate(state):
        out[perm[i]] = s
    return out

def do(state, alg):
    for m in alg.split():
        state = apply(state, MOVES[m])
    return state

SOLVED = list(range(N))
def inv(alg):
    f = {'': "'", "'": '', '2': '2'}
    return ' '.join(m[0] + f[m[1:]] for m in reversed(alg.split()))

# ---- Speffz lettering ------------------------------------------------------
VIEW = {  # face: (up, right)
    'U': ((0, 0, -1), (1, 0, 0)),
    'L': ((0, 1, 0), (0, 0, 1)),
    'F': ((0, 1, 0), (1, 0, 0)),
    'R': ((0, 1, 0), (0, 0, -1)),
    'B': ((0, 1, 0), (-1, 0, 0)),
    'D': ((0, 0, 1), (1, 0, 0)),
}
FACE_ORDER = ['U', 'L', 'F', 'R', 'B', 'D']
LET = "ABCDEFGHIJKLMNOPQRSTUVWX"

corner_of = {}   # letter -> facelet index
edge_of = {}
letter_at_c = {}  # facelet index -> letter
letter_at_e = {}
for fi, face in enumerate(FACE_ORDER):
    a = AX[face]
    up, right = VIEW[face]
    def add(v):  # v = offset in face plane
        p = tuple(a[k] + v[k] for k in range(3))
        return IDX[(p, a)]
    neg = lambda v: tuple(-c for c in v)
    # corners clockwise from top-left
    corners = [
        tuple(up[k] - right[k] for k in range(3)),
        tuple(up[k] + right[k] for k in range(3)),
        tuple(-up[k] + right[k] for k in range(3)),
        tuple(-up[k] - right[k] for k in range(3)),
    ]
    edges = [up, right, neg(up), neg(right)]
    for j in range(4):
        L = LET[fi * 4 + j]
        ci, ei = add(corners[j]), add(edges[j])
        corner_of[L] = ci; letter_at_c[ci] = L
        edge_of[L] = ei;  letter_at_e[ei] = L

def name_of(i):
    p, n = facelets[i]
    fn = {v: k for k, v in AX.items()}
    faces = [fn[a] for a in AX.values() if dot(p, a) == 1]
    faces.sort(key=lambda f: (f != fn[n], f))
    return ''.join(faces)

# ---- the two algorithms ----------------------------------------------------
Y_SHORT = "R U' R' U' R U R' F' R U R' U' R' F R"
T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'"
PARITY_CANDIDATES = {
    "T-perm": T_PERM,
    "Ra": "R U' R' U' R U R D R' U' R D' R' U2 R'",
}

def effect(alg):
    st = do(SOLVED[:], alg)
    ch = [(i, st[i]) for i in range(N) if st[i] != i]
    return st, ch

def describe(alg, label):
    st, ch = effect(alg)
    print(f"\n=== {label}: {alg}")
    print(f"    {len(ch)} stickers move")
    for i, s in ch:
        kind = 'C' if i in letter_at_c else ('E' if i in letter_at_e else 'ctr')
        li = letter_at_c.get(i) or letter_at_e.get(i) or '-'
        ls = letter_at_c.get(s) or letter_at_e.get(s) or '-'
        print(f"    {kind} pos {name_of(i):4s}[{li}] <- {name_of(s):4s}[{ls}]")
    return st

if __name__ == '__main__':
    describe(Y_SHORT, "short Y (corners)")
    describe(T_PERM, "T perm (edges)")
