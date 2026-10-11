# -*- coding: utf-8 -*-
"""路线 D：sympy 符号展开 vs 路线 A 的精确系数（有理数意义下的恒等检查）"""
import sympy as sp
from fractions import Fraction as Fr
from math import factorial, sin, cos, pi

z = sp.symbols('z'); N = 13
fns = {1: 1/(1+z**3), 2: 1/(1+z**2)**2, 3: sp.cos(z**2), 4: sp.sinh(z), 5: sp.cosh(z),
       6: sp.exp(z**2)*sp.sin(z**2), 7: sp.exp(z/(z-1)), 8: sp.sin(1/(1-z))}

def A(k, nmax=N):
    a = [Fr(0)]*(nmax+1)
    if k == 1:
        for j in range(nmax//3+1): a[3*j] = Fr((-1)**j)
    elif k == 2:
        for j in range(nmax//2+1): a[2*j] = Fr((-1)**j*(j+1))
    elif k == 3:
        for j in range(nmax//4+1): a[4*j] = Fr((-1)**j, factorial(2*j))
    elif k == 4:
        for j in range((nmax-1)//2+1): a[2*j+1] = Fr(1, factorial(2*j+1))
    elif k == 5:
        for j in range(nmax//2+1): a[2*j] = Fr(1, factorial(2*j))
    elif k == 6:
        for j in range(nmax//2+1):
            a[2*j] = Fr(int(round(2**(j/2.0)*sin(j*pi/4))), factorial(j))
    elif k == 7:
        a[0] = Fr(1); a[1] = Fr(-1)
        for n in range(1, nmax): a[n+1] = ((2*n-1)*a[n] - (n-1)*a[n-1])/(n+1)
    return a

worst = {}
for k in range(1, 9):
    ser = sp.expand(sp.series(fns[k], z, 0, N+1).removeO())
    p = sp.Poly(ser, z)
    diffs = []
    for n in range(N+1):
        c = p.coeff_monomial(z**n)
        if k == 8:
            # sympy 给的是 sin(1),cos(1) 的有理线性组合；用路线 A 的 w^m 卷积核对
            continue
        diffs.append(sp.simplify(c - sp.Rational(A(k)[n].numerator, A(k)[n].denominator)))
    worst[k] = "exact-0" if (k != 8 and all(d == 0 for d in diffs)) else "?"
    print("(%d) sympy 前 %d 项与路线 A 的差 =" % (k, N+1), max([abs(d) for d in diffs]) if diffs else "-")

# (8) 单独：用 w^m 卷积的精确有理式 p_n sin1 + q_n cos1
nmax = 13
w = [Fr(0)] + [Fr(1)]*nmax
def mul(p_, q_):
    r = [Fr(0)]*(nmax+1)
    for i in range(nmax+1):
        if p_[i]:
            for j in range(nmax+1-i):
                if q_[j]: r[i+j] += p_[i]*q_[j]
    return r
pk = [Fr(1)] + [Fr(0)]*nmax; qk = list(w)
P = [Fr(0)]*(nmax+1); Q = [Fr(0)]*(nmax+1)
kk = 0
while 2*kk <= nmax:
    sgn = Fr((-1)**kk)
    for n in range(nmax+1):
        P[n] += sgn*pk[n]/factorial(2*kk); Q[n] += sgn*qk[n]/factorial(2*kk+1)
    pk = mul(qk, w); qk = mul(pk, w); kk += 1
ser8 = sp.expand(sp.series(fns[8], z, 0, nmax+1).removeO()); p8 = sp.Poly(ser8, z)
bad = []
for n in range(nmax+1):
    c = sp.expand(p8.coeff_monomial(z**n))
    mine = sp.Rational(P[n].numerator, P[n].denominator)*sp.sin(1) + sp.Rational(Q[n].numerator, Q[n].denominator)*sp.cos(1)
    d = sp.simplify(sp.expand(c - mine))
    if d != 0: bad.append((n, d))
print("(8) sympy 前 %d 项与路线 A(p_n sin1 + q_n cos1) 的差:" % (nmax+1), "全部恒等 0" if not bad else bad)
print("结论: sympy 与路线 A 在有意义下逐项恒等" if all(v == "exact-0" for kk_, v in worst.items() if kk_ != 8) and not bad else "存在不一致")

