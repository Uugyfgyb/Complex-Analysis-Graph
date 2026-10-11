#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""complex-power-series 讲义三张图的数据生成脚本。

八个函数是钟玉泉《复变函数论》习题四第 12 题：
  (1) 1/(1+z^3)      (2) 1/(1+z^2)^2   (3) cos z^2       (4) sh z
  (5) ch z           (6) e^(z^2) sin z^2                 (7) e^(z/(z-1))   (8) sin(1/(1-z))
系数一律用闭式或递推（路线 A）算，不依赖任何数值积分，
以便与讲义第 4 节的 Cauchy 积分路线 (B) 相互独立。

输出： coeff-decay.dat      n, log10|a_n|  (八列, floor -16)
       radius-estimate.dat n, |a_n|^(1/n) 与 |a_n/a_{n+1}| (仅 (1)(2)(7)(8))
       err-vs-rho.dat      rho, log10 max_theta |f - T_20| (四列, (1)(2)(7)(8))
       coeff-table.json    前若干系数(精确有理数), 供讲义排版核对
"""
from fractions import Fraction as Fr
from math import factorial, sin, cos, pi, log10
import json, os, cmath

NMAX = 48
HERE = os.path.dirname(os.path.abspath(__file__))

def exact_coeffs(fid, nmax=NMAX):
    """路线 A：闭式 / 递推，返回精确有理系数；fid=8 时另返回 cos1 的系数表。"""
    a = [Fr(0)] * (nmax + 1)
    if fid == 1:
        for k in range(nmax // 3 + 1):
            a[3 * k] = Fr((-1) ** k)
    elif fid == 2:
        for k in range(nmax // 2 + 1):
            a[2 * k] = Fr((-1) ** k * (k + 1))
    elif fid == 3:
        for k in range(nmax // 4 + 1):
            a[4 * k] = Fr((-1) ** k, factorial(2 * k))
    elif fid == 4:
        for k in range((nmax - 1) // 2 + 1):
            a[2 * k + 1] = Fr(1, factorial(2 * k + 1))
    elif fid == 5:
        for k in range(nmax // 2 + 1):
            a[2 * k] = Fr(1, factorial(2 * k))
    elif fid == 6:
        for k in range(nmax // 2 + 1):
            a[2 * k] = Fr(int(round((2 ** (k / 2.0)) * sin(k * pi / 4) * 10 ** 9)), 10 ** 9) / factorial(k)
    elif fid == 7:
        a[0] = Fr(1); a[1] = Fr(-1)
        for n in range(1, nmax):
            a[n + 1] = ((2 * n - 1) * a[n] - (n - 1) * a[n - 1]) / (n + 1)
    elif fid == 8:
        w = [Fr(0)] + [Fr(1)] * nmax      # w = z/(1-z) = z + z^2 + ... (截断)
        def mul(p, q):
            r = [Fr(0)] * (nmax + 1)
            for i in range(nmax + 1):
                if p[i]:
                    for j in range(nmax + 1 - i):
                        if q[j]:
                            r[i + j] += p[i] * q[j]
            return r
        pk = [Fr(1)] + [Fr(0)] * nmax     # w^{2k}
        qk = list(w)                      # w^{2k+1}
        P = [Fr(0)] * (nmax + 1)          # cos w
        Q = [Fr(0)] * (nmax + 1)          # sin w
        k = 0
        while 2 * k <= nmax:
            sgn = Fr((-1) ** k)
            for n in range(nmax + 1):
                P[n] += sgn * pk[n] / factorial(2 * k)
                Q[n] += sgn * qk[n] / factorial(2 * k + 1)
            pk = mul(qk, w)               # w^{2k+2}
            qk = mul(pk, w)               # w^{2k+3}
            k += 1
        return P, Q
    return a, None

def coeffs(fid, nmax=NMAX):
    a, q = exact_coeffs(fid, nmax)
    if fid == 8:
        return [float(p) * sin(1) + float(qq) * cos(1) for p, qq in zip(a, q)]
    return [float(v) for v in a]

def f_eval(fid, z):
    if fid == 1: return 1 / (1 + z ** 3)
    if fid == 2: return 1 / (1 + z ** 2) ** 2
    if fid == 3: return cmath.cos(z ** 2)
    if fid == 4: return cmath.sinh(z)
    if fid == 5: return cmath.cosh(z)
    if fid == 6: return cmath.exp(z ** 2) * cmath.sin(z ** 2)
    if fid == 7: return cmath.exp(z / (z - 1))
    if fid == 8: return cmath.sin(1 / (1 - z))

def partial(coef, z, N):
    s = 0j
    for n in range(N, -1, -1):
        s = s * z + coef[n]
    return s

allc = {k: coeffs(k) for k in range(1, 9)}

FLOOR = -16.0
with open(os.path.join(HERE, "coeff-decay.dat"), "w") as fh:
    fh.write("# n  log10|a_n| for (1)..(8);  nan = 结构性零系数;  floor = %.0f\n" % FLOOR)
    for n in range(NMAX + 1):
        row = []
        for k in range(1, 9):
            v = abs(allc[k][n])
            # 结构性零系数(如 1/(1+z^3) 的 n 不是 3 的倍数)写成 nan,
            # 让 pgfplots 断开而不产生锯齿竖线
            row.append(max(log10(v), FLOOR) if v > 0 else float("nan"))
        fh.write("%d %s\n" % (n, " ".join(("%.6f" % x) if x == x else "nan" for x in row)))
        continue
        for k in range(1, 9):
            v = abs(allc[k][n])
            row.append(max(log10(v), FLOOR) if v > 0 else FLOOR)
        fh.write("%d %s\n" % (n, " ".join("%.6f" % x for x in row)))

R1 = [1, 2, 7, 8]
# 只导出根值法 |a_n|^{1/n}（四条曲线）。比值法单独在正文里用文字说明：
# 它在 (7)(8) 上因系数变号而剧烈跳动，画出来只会糊成一团。
# 缺失项(结构性零系数)写成 nan，讲义里配 unbounded coords=jump 断线。
with open(os.path.join(HERE, "radius-estimate.dat"), "w") as fh:
    fh.write("# n  |a_n|^{1/n} for (1),(2),(7),(8);  nan = a_n = 0\n")
    for n in range(0, NMAX + 1):
        row = []
        for k in R1:
            v = abs(allc[k][n])
            row.append(("%.6f" % (v ** (1.0 / n))) if (n > 0 and v > 0) else "nan")
        fh.write("%d %s\n" % (n, " ".join(row)))

N_TRUNC = 20
rhos, r = [], 0.2
while r <= 1.5001:
    if abs(r - 1.0) > 1e-9:
        rhos.append(round(r, 4))
    r += 0.025
ths = [2 * pi * i / 2400 for i in range(2400)]
errs = {k: [] for k in R1}
for rho in rhos:
    for k in R1:
        e = max(abs(f_eval(k, rho * cmath.exp(1j * t)) - partial(allc[k], rho * cmath.exp(1j * t), N_TRUNC)) for t in ths)
        errs[k].append(log10(e) if e > 0 else -17.0)
with open(os.path.join(HERE, "err-vs-rho.dat"), "w") as fh:
    fh.write("# rho  log10 max_theta |f - T_20| for (1),(2),(7),(8)\n")
    for i, rho in enumerate(rhos):
        fh.write("%.4f %s\n" % (rho, " ".join("%.6f" % errs[k][i] for k in R1)))

def maxerr(fid, rho, N):
    c = allc[fid]
    return max(abs(f_eval(fid, rho * cmath.exp(1j * t)) - partial(c, rho * cmath.exp(1j * t), N))
               for t in [2 * pi * i / 20000 for i in range(20000)])

print("== 与讲义引用数字核对 (max|f-T_N|) ==")
quoted = {(1, 0.9, 20): 0.4038, (1, 0.9, 40): 0.04418, (1, 1.1, 20): 22.36, (1, 1.1, 40): 165.4,
          (2, 0.9, 20): 8.429, (2, 0.9, 40): 1.655, (2, 1.1, 20): 264.3, (2, 1.1, 40): 4235.0,
          (7, 0.9, 20): 0.03614, (7, 0.9, 40): 0.002082, (7, 1.1, 20): 5.988e4, (7, 1.1, 40): 5.986e4,
          (8, 0.9, 20): 52.48, (8, 0.9, 40): 38.38, (8, 1.1, 20): 292.4, (8, 1.1, 40): 8413.0}
for (fid, rho, N), q in sorted(quoted.items()):
    v = maxerr(fid, rho, N)
    flag = "OK  " if abs(v - q) <= 0.02 * abs(q) + 1e-12 else "DIFF"
    print("  %s (%d) rho=%.1f N=%d: computed=%.6g quoted=%.6g" % (flag, fid, rho, N, v, q))
for fid, rho, N, q in [(3, 1.5, 26, 9.99e-7), (4, 1.5, 26, 4.6e-16), (5, 1.5, 26, 8.9e-16), (6, 1.5, 26, 1.43e-4)]:
    v = maxerr(fid, rho, N)
    flag = "OK  " if abs(v - q) <= 0.05 * abs(q) + 1e-16 else "DIFF"
    print("  %s (%d) rho=%.1f N=%d: computed=%.6g quoted=%.6g" % (flag, fid, rho, N, v, q))

a7 = exact_coeffs(7)[0]
a8p, a8q = exact_coeffs(8)
print("== (7) e^(z/(z-1)) 精确系数 a0..a8 ==")
print("  ", [str(v) for v in a7[:9]])
assert str(a7[4]) == "1/24", "a4 必须是 +1/24"
print("== (8) sin(1/(1-z)): a_n = q_n cos1 + p_n sin1 ==")
for n in range(6):
    print("   a%d = (%s) cos1 + (%s) sin1" % (n, a8q[n], a8p[n]))
assert str(a8q[4]) == "1/2" and str(a8p[4]) == "-35/24"
assert str(a8q[5]) == "1/120" and str(a8p[5]) == "-11/6"
print("== (6) 前 9 个精确系数 ==", [str(v) for v in exact_coeffs(6)[0][:9]])
print("== (1) 前 10 项 ==", [str(v) for v in exact_coeffs(1)[0][:10]])
print("== (2) 前 10 项 ==", [str(v) for v in exact_coeffs(2)[0][:10]])

json.dump({"a7": [str(v) for v in a7[:9]],
           "a8_p": [str(v) for v in a8p[:7]], "a8_q": [str(v) for v in a8q[:7]],
           "a6": [str(v) for v in exact_coeffs(6)[0][:9]],
           "a1": [str(v) for v in exact_coeffs(1)[0][:10]],
           "a2": [str(v) for v in exact_coeffs(2)[0][:10]]},
          open(os.path.join(HERE, "coeff-table.json"), "w"), indent=1)
print("data files written to", HERE)


# ---------- 路线 B：Cauchy 积分 + 圆上梯形法 (=DFT)，独立于闭式 ----------
import numpy as np
M, rB = 512, 0.9
Zb = rB * np.exp(2j * np.pi * np.arange(M) / M)
print()
print("== 路线 A(闭式/递推) vs 路线 B(Cauchy+DFT, M=512, r=0.9), n<=%d ==" % NMAX)
devB = {}
for k in range(1, 9):
    fv = np.array([f_eval(k, z) for z in Zb])
    aB = np.fft.fft(fv)[:NMAX + 1] / M / rB ** np.arange(NMAX + 1)   # 正确方向: (1/M)sum_k f_k e^{-2pi i k n/M}
    aA = np.array(allc[k])
    devB[k] = float(np.max(np.abs(aB - aA)))
    print("   (%d) %-16s max|aB-aA| = %.2e" % (k, "%s" % k, devB[k]))
json.dump({str(k): v for k, v in devB.items()}, open(os.path.join(HERE, "routeB-dev.json"), "w"), indent=1)

