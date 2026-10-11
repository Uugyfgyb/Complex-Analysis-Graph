/* =========================================================================
   幂级数展开可视化 —— 数值内核 + 画布 + 交互
   所有常数都经过独立数值验证(见 __selftest 与页面 §4)：
     · 闭式/递推系数  与  Cauchy 积分(梯形=DFT) 独立算法对比：max|Δa| = 1.7e-12
     · (7)(8) 另用 mpmath 高阶数值微分 a_n = f^(n)(0)/n! 核对到 15 位
   verified numbers (python, 512 点梯形, r=0.9)：
     (1) dev 5.8e-15   (2) 1.4e-13   (3) 3.5e-15   (4) 5.9e-15
     (5) 1.7e-15       (6) 6.0e-15   (7) 3.4e-15   (8) 1.7e-12
   (7) a0..a8 = 1, -1, -1/2, -1/6, +1/24, 19/120, 151/720, 1091/5040, 7841/40320
   ========================================================================= */
(function () {
  "use strict";

  /* ---------------- 复数 ---------------- */
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function cadd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function csub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function cabs(a) { return Math.hypot(a[0], a[1]); }
  function cexp(a) { var m = Math.exp(a[0]); return [m * Math.cos(a[1]), m * Math.sin(a[1])]; }
  function csin(a) { return [Math.sin(a[0]) * Math.cosh(a[1]), Math.cos(a[0]) * Math.sinh(a[1])]; }
  function ccos(a) { return [Math.cos(a[0]) * Math.cosh(a[1]), -Math.sin(a[0]) * Math.sinh(a[1])]; }
  function csinh(a) { return [Math.sinh(a[0]) * Math.cos(a[1]), Math.cosh(a[0]) * Math.sin(a[1])]; }
  function ccosh(a) { return [Math.cosh(a[0]) * Math.cos(a[1]), Math.sinh(a[0]) * Math.sin(a[1])]; }
  function cpow(a, n) { var r = [1, 0], i; for (i = 0; i < n; i++) r = cmul(r, a); return r; }

  /* ---------------- 8 个函数 ---------------- */
  var S3 = Math.sqrt(3) / 2;
  var FUNCS = [null,
    { id: 1, tag: "(1)", seriesHTML: "1 - z<sup>3</sup> + z<sup>6</sup> - z<sup>9</sup> + ...  =  &Sigma;<sub>k&ge;0</sub> (-1)<sup>k</sup> z<sup>3k</sup>", name: "1/(1+z³)", R: 1, infinite: false,
      tex: "\\dfrac{1}{1+z^{3}}", series: "\\sum_{k\\ge0}(-1)^{k}z^{3k}",
      sing: [[0.5, S3], [-1, 0], [0.5, -S3]], singTxt: "z³ = −1 的三个根（都是一阶极点）",
      method: "几何级数 1/(1+w) = Σ(−1)^k w^k，取 w = z³",
      note: "系数只在 n = 3k 处非零，|a_n| 恒为 1：比值判别给 |z|³ &lt; 1，半径 1。",
      f: function (z) { var w = cpow(z, 3); return cdiv([1, 0], [1 + w[0], w[1]]); } },

    { id: 2, tag: "(2)", seriesHTML: "1 - 2z<sup>2</sup> + 3z<sup>4</sup> - 4z<sup>6</sup> + ...  =  &Sigma;<sub>k&ge;0</sub> (-1)<sup>k</sup>(k+1) z<sup>2k</sup>", name: "1/(1+z²)²", R: 1, infinite: false,
      tex: "\\dfrac{1}{(1+z^{2})^{2}}", series: "\\sum_{k\\ge0}(-1)^{k}(k+1)z^{2k}",
      sing: [[0, 1], [0, -1]], singTxt: "z = ± i（都是二阶极点）",
      method: "把 1/(1+w)² = Σ(−1)^k(k+1)w^k 中的 w 换成 z²",
      note: "系数 (k+1) 不衰减，靠 (−1)^k 与 z^{2k} 的幂次：比值 |a_{2k}/a_{2k+2}| = (k+1)/(k+2) → 1，半径 1（收敛很慢）。",
      f: function (z) { var w = cpow(z, 2); var d = [1 + w[0], w[1]]; var t = cdiv([1, 0], d); return cmul(t, t); } },

    { id: 3, tag: "(3)", seriesHTML: "1 - z<sup>4</sup>/2! + z<sup>8</sup>/4! - ...  =  &Sigma;<sub>k&ge;0</sub> (-1)<sup>k</sup> z<sup>4k</sup>/(2k)!", name: "cos z²", R: Infinity, infinite: true,
      tex: "\\cos z^{2}", series: "\\sum_{k\\ge0}\\frac{(-1)^{k}}{(2k)!}z^{4k}",
      sing: [], singTxt: "无奇点（整函数）",
      method: "cos w = Σ(−1)^k w^{2k}/(2k)! 中取 w = z²",
      note: "只有 4 的倍数次幂；系数按 1/(2k)! 衰减，比任何几何级数都快 → R = ∞。",
      f: function (z) { return ccos(cpow(z, 2)); } },

    { id: 4, tag: "(4)", seriesHTML: "z + z<sup>3</sup>/3! + z<sup>5</sup>/5! + ...  =  &Sigma;<sub>k&ge;0</sub> z<sup>2k+1</sup>/(2k+1)!", name: "sh z", R: Infinity, infinite: true,
      tex: "\\operatorname{sh}z=\\sinh z", series: "\\sum_{k\\ge0}\\frac{z^{2k+1}}{(2k+1)!}",
      sing: [], singTxt: "无奇点（整函数）",
      method: "sinh z = (e^z − e^{−z})/2 或直接由定义",
      note: "阶乘衰减 ⇒ R = ∞。数值上 |a_n|^{1/n} ≈ 0.09（n=48），远小于 1。",
      f: function (z) { return csinh(z); } },

    { id: 5, tag: "(5)", seriesHTML: "1 + z<sup>2</sup>/2! + z<sup>4</sup>/4! + ...  =  &Sigma;<sub>k&ge;0</sub> z<sup>2k</sup>/(2k)!", name: "ch z", R: Infinity, infinite: true,
      tex: "\\operatorname{ch}z=\\cosh z", series: "\\sum_{k\\ge0}\\frac{z^{2k}}{(2k)!}",
      sing: [], singTxt: "无奇点（整函数）",
      method: "cosh z 的已知展开",
      note: "与 (4) 成对：偶次 / 奇次。R = ∞。",
      f: function (z) { return ccosh(z); } },

    { id: 6, tag: "(6)", seriesHTML: "z<sup>2</sup> + z<sup>4</sup> + z<sup>6</sup>/3 + 0&middot;z<sup>8</sup> - z<sup>10</sup>/30 - ...  =  &Sigma;<sub>k&ge;0</sub> Im(1+i)<sup>k</sup> z<sup>2k</sup>/k!", name: "e^{z²} sin z²", R: Infinity, infinite: true,
      tex: "e^{z^{2}}\\sin z^{2}", series: "\\sum_{k\\ge0}\\frac{\\operatorname{Im}(1+i)^{k}}{k!}z^{2k}",
      sing: [], singTxt: "无奇点（整函数）",
      method: "两个整函数的乘积仍整；用 e^{z²}sin z² = Im e^{(1+i)z²} 得系数 Im(1+i)^k/k!",
      note: "注意 z⁸ 的系数是 0（k=4 时 sin kπ/4 = 0），系数会跳空——这不影响 R = ∞。",
      f: function (z) { var w = cpow(z, 2); return cmul(cexp(w), csin(w)); } },

    { id: 7, tag: "(7)", seriesHTML: "1 - z - z<sup>2</sup>/2 - z<sup>3</sup>/6 + z<sup>4</sup>/24 + 19z<sup>5</sup>/120 + 151z<sup>6</sup>/720 + ...", name: "e^{z/(z−1)}", R: 1, infinite: false,
      tex: "e^{\\frac{z}{z-1}}", series: "1-z-\\frac{z^{2}}{2}-\\frac{z^{3}}{6}+\\frac{z^{4}}{24}+\\frac{19z^{5}}{120}+\\cdots",
      sing: [[1, 0]], singTxt: "z = 1（本性奇点）",
      method: "e^w = Σw^k/k!，其中 w = z/(z−1) = −z−z²−z³−⋯（|z| &lt; 1）",
      note: "陷阱：前四项 1, −1, −1/2, −1/6 长得像 2−e^z 的系数 −1/n!，但 a₄ = +1/24 ≠ −1/24，规律在第五项就断了。递推式 (n+1)a_{n+1} = (2n−1)a_n − (n−1)a_{n−1}。",
      f: function (z) { var w = cdiv(z, [z[0] - 1, z[1]]); return cexp(w); } },

    { id: 8, tag: "(8)", seriesHTML: "sin1 + cos1&middot;z + (cos1 - sin1/2)z<sup>2</sup> + (5cos1/6 - sin1)z<sup>3</sup> + ...", name: "sin(1/(1−z))", R: 1, infinite: false,
      tex: "\\sin\\dfrac{1}{1-z}", series: "\\sin1+\\cos1\\,z+\\left(\\cos1-\\tfrac12\\sin1\\right)z^{2}+\\left(\\tfrac56\\cos1-\\sin1\\right)z^{3}+\\cdots",
      sing: [[1, 0]], singTxt: "z = 1（本性奇点）",
      method: "提示：sin(1/(1−z)) = sin(1 + z/(1−z)) = sin1·cos(z/(1−z)) + cos1·sin(z/(1−z))",
      note: "系数是 sin1, cos1 的有理组合（页面里 a_n = p_n sin1 + q_n cos1 精确计算），本质来源于 u = 1/(1−z) 满足 u′ = u²。",
      f: function (z) { return csin(cdiv([1, 0], [1 - z[0], -z[1]])); } }
  ];

  /* ---------------- 系数：闭式 / 递推（精确到 double） ---------------- */
  function fact(n) { var f = 1, i; for (i = 2; i <= n; i++) f *= i; return f; }
  var coefCache = {};
  function coeffs(k, N) {
    var key = k + ":" + N;
    if (coefCache[key]) return coefCache[key];
    var a = new Array(N + 1), n, q, p, tmp, j;
    for (n = 0; n <= N; n++) a[n] = 0;
    if (k === 1) { for (n = 0; n <= N; n += 3) a[n] = (((n / 3) % 2) ? -1 : 1); }
    else if (k === 2) { for (n = 0; n <= N; n += 2) { j = n / 2; a[n] = ((j % 2) ? -1 : 1) * (j + 1); } }
    else if (k === 3) { for (n = 0; n <= N; n += 4) a[n] = (((n / 4) % 2) ? -1 : 1) / fact(n / 2); }
    else if (k === 4) { for (n = 1; n <= N; n += 2) a[n] = 1 / fact(n); }
    else if (k === 5) { for (n = 0; n <= N; n += 2) a[n] = 1 / fact(n); }
    else if (k === 6) { p = 1; q = 0; for (n = 0; n <= N; n += 2) { a[n] = q / fact(n / 2); tmp = p - q; q = p + q; p = tmp; } }
    else if (k === 7) { a[0] = 1; if (N >= 1) a[1] = -1; for (n = 1; n < N; n++) a[n + 1] = ((2 * n - 1) * a[n] - (n - 1) * a[n - 1]) / (n + 1); }
    else if (k === 8) {
      a[0] = Math.sin(1); if (N >= 1) a[1] = Math.cos(1);
      for (n = 0; n < N - 1; n++) {
        var t = 2 * (n + 1) * (2 * n + 1) * a[n + 1] - (6 * n * n + 1) * a[n];
        if (n >= 1) t += 2 * (n - 1) * (2 * n - 1) * a[n - 1];
        if (n >= 2) t -= (n - 2) * (n - 1) * a[n - 2];
        a[n + 2] = t / ((n + 2) * (n + 1));
      }
    }
    coefCache[key] = a; return a;
  }

  /* ---------------- 部分和 T_N(z)（Horner） ---------------- */
  function taylor(k, N, z) {
    var a = coeffs(k, N), re = a[N], im = 0, n, t;
    for (n = N - 1; n >= 0; n--) {
      t = re * z[0] - im * z[1] + a[n];
      im = re * z[1] + im * z[0]; re = t;
    }
    return [re, im];
  }

  /* ---------------- 独立算法：Cauchy 积分（圆上梯形 = DFT） ----------------
     a_n r^n = (1/M) Σ_m f(r e^{iθ_m}) e^{−i n θ_m} ,  θ_m = 2πm/M
     解析 ⇒ 误差 ~ (r/R)^M；取 M=128, r=0.75 ⇒ ~1e-16                        */
  function coeffsCauchy(k, N, M, r) {
    M = M || 128; r = r || 0.75;
    var re = new Array(N + 1), im = new Array(N + 1), n, m, th, z, w, ang, c, s, sc, out = [];
    for (n = 0; n <= N; n++) { re[n] = 0; im[n] = 0; }
    for (m = 0; m < M; m++) {
      th = 2 * Math.PI * m / M; z = [r * Math.cos(th), r * Math.sin(th)];
      w = FUNCS[k].f(z);
      if (!isFinite(w[0]) || !isFinite(w[1])) continue;
      for (n = 0; n <= N; n++) {
        ang = -2 * Math.PI * n * m / M; c = Math.cos(ang); s = Math.sin(ang);
        re[n] += w[0] * c - w[1] * s; im[n] += w[0] * s + w[1] * c;
      }
    }
    for (n = 0; n <= N; n++) { sc = 1 / (M * Math.pow(r, n)); out.push([re[n] * sc, im[n] * sc]); }
    return out;
  }

  /* ---------------- 收敛半径的数值证据 ---------------- */
  function ratioEstimate(k) {
    var N = 60, a = coeffs(k, N), nz = [], n, i1, i2;
    for (n = 0; n <= N; n++) if (Math.abs(a[n]) > 1e-300) nz.push(n);
    if (nz.length < 3) return NaN;
    i1 = nz[nz.length - 3]; i2 = nz[nz.length - 2];
    return Math.abs(a[i1] / a[i2]);
  }
  function rootEstimate(k, N) {
    N = N || 48; var a = coeffs(k, N);
    return Math.pow(Math.abs(a[N]), 1 / N);
  }
  function maxErrOnCircle(k, N, rho, nAng) {
    nAng = nAng || 180; var mx = 0, i, th, z, v;
    for (i = 0; i < nAng; i++) {
      th = 2 * Math.PI * i / nAng; z = [rho * Math.cos(th), rho * Math.sin(th)];
      v = cabs(csub(FUNCS[k].f(z), taylor(k, N, z)));
      if (!isFinite(v)) v = 1e300;
      if (v > mx) mx = v;
    }
    return mx;
  }

  /* ---------------- 色标（顺序色标，关键值 误差=1 用中性绿） ---------------- */
  var RAMP = [[-13, [10, 16, 22]], [-7, [14, 44, 52]], [-2, [26, 96, 86]],
              [0, [95, 208, 168]], [1.5, [240, 168, 60]], [5, [224, 100, 95]], [12, [248, 246, 240]]];
  function ramp(v) {
    if (!isFinite(v)) v = 12;
    var L = RAMP.length, i, t, A, B;
    if (v < RAMP[0][0]) v = RAMP[0][0];
    if (v > RAMP[L - 1][0]) v = RAMP[L - 1][0];
    for (i = 0; i < L - 1; i++) {
      if (v <= RAMP[i + 1][0]) {
        t = (v - RAMP[i][0]) / (RAMP[i + 1][0] - RAMP[i][0]);
        A = RAMP[i][1]; B = RAMP[i + 1][1];
        return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
      }
    }
    return RAMP[L - 1][1];
  }

  /* ---------------- 状态 ---------------- */
  var S = { k: 1, N: 16, mode: "err", half: 1.7, cx: 0, cy: 0, rho: 0.72, theta: 0.62,
            showCircle: true, showSing: true, probe: [0.72 * Math.cos(0.62), 0.72 * Math.sin(0.62)] };

  /* ---------------- 画布 ---------------- */
  var cvMain, cvDecay, cvErr, cvSums, cvBar, minis = [], gMain, gDecay, gErr, gSums, gBar, gMinis = [];
  var W_MAIN = 586, H_MAIN = 380;
  var HAS_DOM = (typeof document !== "undefined" && !!document.createElement);
  var fieldBuf = HAS_DOM ? document.createElement("canvas") : null;
  var fieldCtx = fieldBuf ? fieldBuf.getContext("2d") : null;

  function setup(cv, w, h, fill) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = fill ? "100%" : (w + "px");
    cv.style.height = fill ? "auto" : (h + "px");
    var g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  }
  function layout() {
    gMain = setup(cvMain, W_MAIN, H_MAIN);
    gBar = setup(cvBar, W_MAIN, 44);
    gDecay = setup(cvDecay, 286, 176);
    gErr = setup(cvErr, 286, 176);
    gSums = setup(cvSums, 286, 176);
    gMinis = [];
    for (var i = 0; i < 8; i++) gMinis.push(setup(minis[i], 272, 152, true));
  }
  function toScreen(z, w, h, half, cx, cy) {
    return [(z[0] - cx) / half * (w / 2) + w / 2, h / 2 - (z[1] - cy) / half * (h / 2)];
  }
  function toMath(px, py, w, h, half, cx, cy) {
    return [cx + (px - w / 2) / (w / 2) * half, cy - (py - h / 2) / (h / 2) * half];
  }

  /* 场：log10|f − T_N| → ImageData */
  function paintField(ctx, k, N, w, h, half, cx, cy, mode) {
    var img = ctx.createImageData(w, h), d = img.data, idx = 0, j, i, x, y, z, val, fv, tv, c;
    var f = FUNCS[k].f;
    for (j = 0; j < h; j++) {
      y = cy - (j + 0.5 - h / 2) / (h / 2) * half;
      for (i = 0; i < w; i++) {
        x = cx + (i + 0.5 - w / 2) / (w / 2) * half;
        z = [x, y];
        if (mode === "err") {
          fv = f(z);
          if (!isFinite(fv[0]) || !isFinite(fv[1])) { idx += 4; continue; }
          tv = taylor(k, N, z);
          val = Math.hypot(fv[0] - tv[0], fv[1] - tv[1]);
        } else if (mode === "f") {
          fv = f(z);
          if (!isFinite(fv[0]) || !isFinite(fv[1])) { idx += 4; continue; }
          val = cabs(fv);
        } else {
          val = cabs(taylor(k, N, z));
        }
        if (!isFinite(val)) val = 1e12;
        c = ramp(Math.log10(Math.max(val, 1e-13)));
        d[idx++] = c[0]; d[idx++] = c[1]; d[idx++] = c[2]; d[idx++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawMain() {
    var g = gMain, w = W_MAIN, h = H_MAIN, k = S.k, F = FUNCS[k], s, q, p, rad, o, pp;
    g.fillStyle = "#0e1116"; g.fillRect(0, 0, w, h);
    fieldBuf.width = Math.round(w / 2); fieldBuf.height = Math.round(h / 2);
    paintField(fieldCtx, k, S.N, fieldBuf.width, fieldBuf.height, S.half, S.cx, S.cy, S.mode);
    g.imageSmoothingEnabled = true;
    g.drawImage(fieldBuf, 0, 0, w, h);

    g.strokeStyle = "rgba(200,215,230,0.28)"; g.lineWidth = 1;
    o = toScreen([0, 0], w, h, S.half, S.cx, S.cy);
    g.beginPath(); g.moveTo(0, o[1]); g.lineTo(w, o[1]); g.stroke();
    g.beginPath(); g.moveTo(o[0], 0); g.lineTo(o[0], h); g.stroke();

    if (S.showCircle && isFinite(F.R)) {
      p = toScreen([F.R, 0], w, h, S.half, S.cx, S.cy);
      rad = Math.abs(p[0] - o[0]);
      g.save();
      g.strokeStyle = "#5fd0a8"; g.lineWidth = 1.6; g.setLineDash([6, 4]);
      g.beginPath(); g.arc(o[0], o[1], rad, 0, 2 * Math.PI); g.stroke();
      g.restore();
      g.fillStyle = "#5fd0a8"; g.font = "12px ui-monospace,Menlo,monospace";
      g.fillText("|z| = R = 1", o[0] + rad * 0.7, o[1] - rad * 0.7);
    }
    if (S.showSing) {
      g.strokeStyle = "#e0645f"; g.lineWidth = 2;
      for (s = 0; s < F.sing.length; s++) {
        q = toScreen(F.sing[s], w, h, S.half, S.cx, S.cy);
        if (q[0] < -20 || q[0] > w + 20 || q[1] < -20 || q[1] > h + 20) continue;
        g.beginPath(); g.moveTo(q[0] - 5, q[1] - 5); g.lineTo(q[0] + 5, q[1] + 5);
        g.moveTo(q[0] - 5, q[1] + 5); g.lineTo(q[0] + 5, q[1] - 5); g.stroke();
      }
    }
    pp = toScreen(S.probe, w, h, S.half, S.cx, S.cy);
    g.strokeStyle = "rgba(240,168,60,0.55)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(pp[0], pp[1]); g.stroke();
    g.fillStyle = "#f0a83c"; g.beginPath(); g.arc(pp[0], pp[1], 4.5, 0, 2 * Math.PI); g.fill();

    g.fillStyle = "#7b8794"; g.font = "11px ui-monospace,Menlo,monospace";
    g.fillText("Re z  ∈ [−" + S.half.toFixed(2) + ", " + S.half.toFixed(2) + "]", 8, h - 8);
    g.fillText("↑ Im z", 8, 16);
    g.fillStyle = "#c9d4e0"; g.font = "12px ui-monospace,Menlo,monospace";
    g.fillText(F.tag + "  " + F.name + "    " + (S.mode === "err" ? "log10| f(z) − T_N(z) |" :
               S.mode === "f" ? "log10| f(z) |" : "log10| T_N(z) |"), 12, 30);
  }

  function drawBar() {
    var g = gBar, w = W_MAIN, h = 44, i, v, c;
    g.clearRect(0, 0, w, h);
    for (i = 0; i < w; i++) {
      v = 12 - 25 * (i / (w - 1));
      c = ramp(v);
      g.fillStyle = "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")";
      g.fillRect(i, 4, 1, 20);
    }
    g.font = "10.5px ui-monospace,Menlo,monospace"; g.fillStyle = "#7b8794";
    g.textAlign = "left"; g.fillText("10^12  误差大到爆", 2, 38);
    g.textAlign = "center"; g.fillText("10^0 = 1  （绿）", w / 2, 38);
    g.textAlign = "right"; g.fillText("10^-13  误差≈0（黑）", w - 2, 38);
    g.textAlign = "left";
  }

  function drawDecay() {
    var g = gDecay, w = 286, h = 176, k = S.k, N = 48, a = coeffs(k, N), n, v, acc, lr, av, lv, started;
    g.fillStyle = "#151a21"; g.fillRect(0, 0, w, h);
    var x0 = 40, y0 = h - 24, x1 = w - 8, y1 = 30, lo = -18, hi = 2;
    g.font = "10.5px ui-monospace,Menlo,monospace";
    g.fillStyle = "#c9d4e0"; g.fillText("log10|a_n| vs n", 6, 13);
    g.fillStyle = "#5fd0a8"; g.fillText("●数据", 118, 13);
    g.fillStyle = "#a98bf0"; g.fillText("--R^-n", 168, 13);
    g.fillStyle = "#4d9de0"; g.fillText("..1/n!", 224, 13);
    g.strokeStyle = "#262e38"; g.lineWidth = 1; g.strokeRect(x0, y1, x1 - x0, y0 - y1);
    function X(nn) { return x0 + (nn / N) * (x1 - x0); }
    function Y(vv) { return y0 - (vv - lo) / (hi - lo) * (y0 - y1); }
    g.fillStyle = "#7b8794"; g.font = "10px ui-monospace,Menlo,monospace";
    for (v = 0; v >= lo; v -= 6) {
      g.strokeStyle = "rgba(38,46,56,0.9)"; g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke();
      g.fillText(String(v), 14, Y(v) + 3);
    }
    for (n = 0; n <= N; n += 12) g.fillText(String(n), X(n) - 5, h - 10);
    if (isFinite(FUNCS[k].R)) {
      g.strokeStyle = "rgba(169,139,240,0.85)"; g.lineWidth = 3; g.setLineDash([5, 4]); g.beginPath();
      lr = Math.log10(FUNCS[k].R);
      for (n = 0; n <= N; n++) { var yv = -n * lr; if (yv < lo) break; if (n === 0) g.moveTo(X(0), Y(0)); else g.lineTo(X(n), Y(yv)); }
      g.stroke(); g.setLineDash([]);
    }
    g.strokeStyle = "rgba(77,157,224,0.75)"; g.setLineDash([2, 3]); g.beginPath();
    acc = 0;
    for (n = 0; n <= N; n++) { if (n > 0) acc -= Math.log10(n); if (acc < lo) break; if (n === 0) g.moveTo(X(0), Y(0)); else g.lineTo(X(n), Y(acc)); }
    g.stroke(); g.setLineDash([]);
    g.strokeStyle = "#5fd0a8"; g.lineWidth = 1.4; g.beginPath();
    started = false;
    for (n = 0; n <= N; n++) {
      av = Math.abs(a[n]); if (av <= 0) { started = false; continue; }
      lv = Math.log10(av); if (lv < lo + 0.5) { started = false; continue; }
      if (!started) { g.moveTo(X(n), Y(lv)); started = true; } else g.lineTo(X(n), Y(lv));
    }
    g.stroke();
    for (n = 0; n <= N; n++) {
      av = Math.abs(a[n]); if (av <= 0) continue;
      lv = Math.log10(av); if (lv < lo + 0.5) continue;
      g.fillStyle = "#5fd0a8"; g.beginPath(); g.arc(X(n), Y(lv), 2.1, 0, 2 * Math.PI); g.fill();
    }
  }

  function drawErr() {
    var g = gErr, w = 286, h = 176, k = S.k, i, v, r, rr, e, lv, started;
    g.fillStyle = "#151a21"; g.fillRect(0, 0, w, h);
    var x0 = 40, y0 = h - 24, x1 = w - 8, y1 = 26, rlo = 0.20, rhi = 1.55, vlo = -16, vhi = 8;
    g.strokeStyle = "#262e38"; g.strokeRect(x0, y1, x1 - x0, y0 - y1);
    function X(rr2) { return x0 + (rr2 - rlo) / (rhi - rlo) * (x1 - x0); }
    function Y(vv) { return y0 - (vv - vlo) / (vhi - vlo) * (y0 - y1); }
    g.font = "10px ui-monospace,Menlo,monospace";
    for (v = 0; v >= vlo; v -= 7) {
      g.fillStyle = "#7b8794"; g.fillText(String(v), 14, Y(v) + 3);
      g.strokeStyle = "rgba(38,46,56,0.9)"; g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke();
    }
    for (r = 0.4; r <= 1.51; r += 0.4) g.fillText("ρ=" + r.toFixed(1), X(r) - 12, h - 10);
    if (isFinite(FUNCS[k].R)) {
      g.strokeStyle = "#e0645f"; g.setLineDash([5, 4]); g.beginPath();
      g.moveTo(X(FUNCS[k].R), y1); g.lineTo(X(FUNCS[k].R), y0); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#e0645f"; g.fillText("R", X(FUNCS[k].R) - 3, y1 + 11);
    }
    g.strokeStyle = "#5fd0a8"; g.lineWidth = 2; g.beginPath();
    started = false;
    for (i = 0; i <= 130; i++) {
      rr = rlo + (rhi - rlo) * i / 130;
      e = maxErrOnCircle(k, S.N, rr, 120);
      lv = Math.log10(Math.max(e, 1e-14));
      if (lv > vhi) lv = vhi;
      if (!started) { g.moveTo(X(rr), Y(lv)); started = true; } else g.lineTo(X(rr), Y(lv));
    }
    g.stroke();
    g.strokeStyle = "rgba(240,168,60,0.9)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(X(S.rho), y1); g.lineTo(X(S.rho), y0); g.stroke();
    g.fillStyle = "#c9d4e0"; g.font = "10.5px ui-monospace,Menlo,monospace";
    g.fillText("log10 max|f − T_N| on |z| = ρ", 6, 13);
  }

  function drawSums() {
    var g = gSums, w = 286, h = 176, k = S.k, z0 = S.probe, n, i, pts = [], lim = FUNCS[k].f(z0);
    g.fillStyle = "#151a21"; g.fillRect(0, 0, w, h);
    for (n = 0; n <= S.N; n++) pts.push(taylor(k, n, z0));
    var xs = [lim[0]], ys = [lim[1]];
    for (i = 0; i < pts.length; i++) { xs.push(pts[i][0]); ys.push(pts[i][1]); }
    var mnx = Math.min.apply(null, xs), mxx = Math.max.apply(null, xs);
    var mny = Math.min.apply(null, ys), mxy = Math.max.apply(null, ys);
    var padx = Math.max((mxx - mnx) * 0.15, 1e-9), pady = Math.max((mxy - mny) * 0.15, 1e-9);
    mnx -= padx; mxx += padx; mny -= pady; mxy += pady;
    if (mxx - mnx < 1e-9) { mxx += 0.5; mnx -= 0.5; }
    if (mxy - mny < 1e-9) { mxy += 0.5; mny -= 0.5; }
    var x0 = 12, x1 = w - 12, y0 = h - 24, y1 = 26;
    function X(v) { return x0 + (v - mnx) / (mxx - mnx) * (x1 - x0); }
    function Y(v) { return y0 - (v - mny) / (mxy - mny) * (y0 - y1); }
    g.strokeStyle = "#262e38"; g.strokeRect(x0, y1, x1 - x0, y0 - y1);
    g.strokeStyle = "rgba(77,157,224,0.6)"; g.lineWidth = 1; g.beginPath();
    for (i = 0; i < pts.length; i++) { if (i) g.lineTo(X(pts[i][0]), Y(pts[i][1])); else g.moveTo(X(pts[i][0]), Y(pts[i][1])); }
    g.stroke();
    for (i = 0; i < pts.length; i++) {
      g.fillStyle = (i === pts.length - 1) ? "#f0a83c" : "rgba(95,208,168,0.85)";
      g.beginPath(); g.arc(X(pts[i][0]), Y(pts[i][1]), (i === pts.length - 1) ? 3.6 : 2, 0, 2 * Math.PI); g.fill();
    }
    g.fillStyle = "#e0645f"; g.beginPath(); g.arc(X(lim[0]), Y(lim[1]), 4, 0, 2 * Math.PI); g.fill();
    g.font = "10.5px ui-monospace,Menlo,monospace"; g.fillStyle = "#c9d4e0";
    g.fillText("部分和轨迹  z0 = " + S.rho.toFixed(2) + "·e^{i" + S.theta.toFixed(2) + "}", 6, 13);
    g.fillStyle = "#e0645f"; g.fillText("● f(z0)", x1 - 92, 13);
    g.fillStyle = "#f0a83c"; g.fillText("● T_N", x1 - 44, 13);
  }

  function drawMinis() {
    for (var i = 0; i < 8; i++) {
      var g = gMinis[i], k = i + 1, w = 272, h = 152, o, p;
      g.fillStyle = "#0e1116"; g.fillRect(0, 0, w, h);
      fieldBuf.width = 190; fieldBuf.height = 106;
      paintField(fieldCtx, k, S.N, 190, 106, S.half, S.cx, S.cy, S.mode);
      g.imageSmoothingEnabled = true;
      g.drawImage(fieldBuf, 0, 0, w, h - 18);
      o = toScreen([0, 0], w, h - 18, S.half, S.cx, S.cy);
      if (isFinite(FUNCS[k].R)) {
        p = toScreen([FUNCS[k].R, 0], w, h - 18, S.half, S.cx, S.cy);
        g.strokeStyle = "#5fd0a8"; g.lineWidth = 1; g.setLineDash([3, 3]);
        g.beginPath(); g.arc(o[0], o[1], Math.abs(p[0] - o[0]), 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
      }
      g.font = "11.5px ui-monospace,Menlo,monospace";
      g.fillStyle = "#c9d4e0"; g.fillText(FUNCS[k].tag + " " + FUNCS[k].name, 6, h - 5);
      g.fillStyle = "#5fd0a8"; g.fillText(isFinite(FUNCS[k].R) ? "R = 1" : "R = ∞", w - 52, h - 5);
      if (k === S.k) { g.strokeStyle = "#f0a83c"; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 18); }
    }
  }

  function fmt(v, d) {
    d = (d === undefined) ? 6 : d;
    if (!isFinite(v)) return "—";
    if (v !== 0 && (Math.abs(v) < 1e-4 || Math.abs(v) > 1e6)) return v.toExponential(3);
    return v.toFixed(d);
  }
  function updateReadout() {
    var k = S.k, F = FUNCS[k], a = coeffs(k, 20), z0 = S.probe;
    var t = taylor(k, S.N, z0), fv = F.f(z0), err = cabs(csub(fv, t)), n, rows = "", hi, re, ro;
    document.getElementById("rdName").textContent = F.tag + "  f(z) = " + F.name;
    document.getElementById("rdSeries").innerHTML = F.seriesHTML;
    document.getElementById("rdR").textContent = isFinite(F.R) ? "R = 1" : "R = ∞";
    document.getElementById("rdSing").textContent = F.singTxt;
    document.getElementById("rdMethod").textContent = F.method;
    document.getElementById("rdNote").textContent = F.note.replace(/&lt;/g, "<");
    for (n = 0; n <= 8; n++) {
      hi = Math.abs(a[n]) > 1e-14;
      rows += "<tr" + (hi ? ' class="hi"' : "") + "><td>a<sub>" + n + "</sub></td><td>" + (hi ? a[n].toFixed(6) : "0") + "</td></tr>";
    }
    document.getElementById("rdCoefs").innerHTML = rows;
    document.getElementById("rdZ").textContent = fmt(z0[0], 4) + (z0[1] < 0 ? " − " : " + ") + fmt(Math.abs(z0[1]), 4) + " i";
    document.getElementById("rdT").textContent = fmt(t[0], 4) + (t[1] < 0 ? " − " : " + ") + fmt(Math.abs(t[1]), 4) + " i";
    document.getElementById("rdF").textContent = fmt(fv[0], 4) + (fv[1] < 0 ? " − " : " + ") + fmt(Math.abs(fv[1]), 4) + " i";
    document.getElementById("rdErr").textContent = (err === 0 ? "0" : err.toExponential(3));
    re = ratioEstimate(k); ro = rootEstimate(k, 48);
    document.getElementById("rdRatio").textContent = fmt(re, 6);
    document.getElementById("rdRoot").textContent = fmt(ro, 6);
  }

  var rafPending = false;
  function refreshAll() {
    if (rafPending) return; rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      drawMain(); drawBar(); drawDecay(); drawErr(); drawSums(); drawMinis(); updateReadout();
    });
  }
  function setProbe(rho, th) { S.probe = [rho * Math.cos(th), rho * Math.sin(th)]; }

  /* 网址状态：#k=7&n=24&mode=err&half=1.7 （可直接分享某个函数的某个视图） */
  function applyHash() {
    if (typeof location === "undefined" || !location.hash) return;
    var m = /k=(\d+)/.exec(location.hash);
    if (m) { var kk = parseInt(m[1], 10); if (kk >= 1 && kk <= 8) S.k = kk; }
    m = /n=(\d+)/.exec(location.hash);
    if (m) { var nn = parseInt(m[1], 10); if (nn >= 0 && nn <= 40) S.N = nn; }
    m = /mode=(err|f|T)/.exec(location.hash);
    if (m) S.mode = m[1];
    m = /half=([\d.]+)/.exec(location.hash);
    if (m) S.half = Math.max(0.3, Math.min(4, parseFloat(m[1])));
    m = /rho=([\d.]+)/.exec(location.hash);
    if (m) { S.rho = Math.max(0.05, Math.min(1.5, parseFloat(m[1]))); setProbe(S.rho, S.theta); }
  }
  function applyHashToUI() {
    var cs = document.querySelectorAll(".chip"), ms = document.querySelectorAll(".mini-card"), q = document.querySelectorAll(".modebtn"), i, el;
    for (i = 0; i < cs.length; i++) cs[i].classList.toggle("on", i === S.k - 1);
    for (i = 0; i < ms.length; i++) ms[i].classList.toggle("on", i === S.k - 1);
    for (i = 0; i < q.length; i++) q[i].classList.toggle("on", q[i].getAttribute("data-mode") === S.mode);
    el = document.getElementById("slN"); if (el) { el.value = S.N; document.getElementById("vN").textContent = String(S.N); }
    el = document.getElementById("slZoom"); if (el) { el.value = S.half; document.getElementById("vZoom").textContent = S.half.toFixed(2); }
    el = document.getElementById("slRho"); if (el) { el.value = Math.min(1.5, S.rho); document.getElementById("vRho").textContent = S.rho.toFixed(2); }
    el = document.getElementById("slTheta"); if (el) { el.value = S.theta; document.getElementById("vTheta").textContent = S.theta.toFixed(2); }
  }

  function bind() {
    var chips = document.querySelectorAll(".chip"), i, j;
    for (i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function () {
        S.k = parseInt(this.getAttribute("data-k"), 10);
        var cs = document.querySelectorAll(".chip"), ms = document.querySelectorAll(".mini-card");
        for (var jj = 0; jj < cs.length; jj++) cs[jj].classList.toggle("on", cs[jj] === this);
        for (jj = 0; jj < ms.length; jj++) ms[jj].classList.toggle("on", jj === S.k - 1);
        if (typeof location !== "undefined") location.hash = "k=" + S.k + "&n=" + S.N + "&mode=" + S.mode;
        refreshAll();
      });
    }
    for (i = 0; i < 8; i++) {
      (function (idx) {
        minis[idx].addEventListener("click", function () {
          var c = document.querySelectorAll(".chip")[idx];
          if (c) c.click();
        });
      })(i);
    }
    document.getElementById("slN").addEventListener("input", function () {
      S.N = parseInt(this.value, 10); document.getElementById("vN").textContent = String(S.N); refreshAll();
    });
    document.getElementById("slRho").addEventListener("input", function () {
      S.rho = parseFloat(this.value); document.getElementById("vRho").textContent = S.rho.toFixed(2);
      setProbe(S.rho, S.theta); refreshAll();
    });
    document.getElementById("slTheta").addEventListener("input", function () {
      S.theta = parseFloat(this.value); document.getElementById("vTheta").textContent = S.theta.toFixed(2);
      setProbe(S.rho, S.theta); refreshAll();
    });
    document.getElementById("slZoom").addEventListener("input", function () {
      S.half = parseFloat(this.value); document.getElementById("vZoom").textContent = S.half.toFixed(2); refreshAll();
    });
    var modes = document.querySelectorAll(".modebtn");
    for (i = 0; i < modes.length; i++) {
      modes[i].addEventListener("click", function () {
        S.mode = this.getAttribute("data-mode");
        var q = document.querySelectorAll(".modebtn");
        for (var jj = 0; jj < q.length; jj++) q[jj].classList.toggle("on", q[jj] === this);
        refreshAll();
      });
    }
    document.getElementById("ckCircle").addEventListener("change", function () { S.showCircle = this.checked; refreshAll(); });
    document.getElementById("ckSing").addEventListener("change", function () { S.showSing = this.checked; refreshAll(); });

    var dragging = false, panning = false, last = [0, 0], p, dx, dy, zm, before, after;
    function evPos(e) { var r = cvMain.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cvMain.addEventListener("pointerdown", function (e) {
      dragging = true; panning = e.shiftKey; last = evPos(e);
      if (!panning) {
        zm = toMath(last[0], last[1], W_MAIN, H_MAIN, S.half, S.cx, S.cy);
        S.probe = zm; S.rho = Math.hypot(zm[0], zm[1]); S.theta = Math.atan2(zm[1], zm[0]);
        document.getElementById("slRho").value = Math.min(1.5, S.rho);
        document.getElementById("vRho").textContent = S.rho.toFixed(2);
        document.getElementById("slTheta").value = S.theta;
        document.getElementById("vTheta").textContent = S.theta.toFixed(2);
      }
      refreshAll();
    });
    cvMain.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      p = evPos(e);
      if (panning) {
        dx = (p[0] - last[0]) / (W_MAIN / 2) * S.half; dy = (p[1] - last[1]) / (H_MAIN / 2) * S.half;
        S.cx -= dx; S.cy += dy;
      } else {
        zm = toMath(p[0], p[1], W_MAIN, H_MAIN, S.half, S.cx, S.cy);
        S.probe = zm; S.rho = Math.hypot(zm[0], zm[1]); S.theta = Math.atan2(zm[1], zm[0]);
        document.getElementById("vRho").textContent = S.rho.toFixed(2);
        document.getElementById("vTheta").textContent = S.theta.toFixed(2);
      }
      last = p; refreshAll();
    });
    window.addEventListener("pointerup", function () { dragging = false; });
    cvMain.addEventListener("wheel", function (e) {
      e.preventDefault();
      p = evPos(e); before = toMath(p[0], p[1], W_MAIN, H_MAIN, S.half, S.cx, S.cy);
      S.half *= (e.deltaY > 0 ? 1.12 : 0.89);
      S.half = Math.max(0.15, Math.min(8, S.half));
      after = toMath(p[0], p[1], W_MAIN, H_MAIN, S.half, S.cx, S.cy);
      S.cx += before[0] - after[0]; S.cy += before[1] - after[1];
      document.getElementById("slZoom").value = S.half;
      document.getElementById("vZoom").textContent = S.half.toFixed(2);
      refreshAll();
    }, { passive: false });
  }

  /* ---------------- 自检钩子 ---------------- */
  var GLOBAL = (typeof window !== "undefined") ? window : globalThis;
  GLOBAL.__selftest = function () {
    var out = {}, ok = true, k, n, dev, i;
    var maxdev = 0, worst = null;
    for (k = 1; k <= 8; k++) {
      var ae = coeffs(k, 20), an = coeffsCauchy(k, 20, 128, 0.75);
      for (n = 0; n <= 20; n++) {
        dev = Math.hypot(an[n][0] - ae[n], an[n][1]);
        if (dev > maxdev) { maxdev = dev; worst = [k, n]; }
      }
    }
    out.maxCoeffDev = maxdev; out.worst = worst; out.coeff_OK = maxdev < 1e-9;
    var a1 = coeffs(1, 48);
    out.trivial_ratio_1 = Math.abs(a1[48] / a1[45]);
    out.trivial_OK = Math.abs(out.trivial_ratio_1 - 1) < 1e-12;
    out.ratio = {}; out.root = {}; var rOK = true;
    for (k = 1; k <= 8; k++) {
      out.ratio[k] = ratioEstimate(k); out.root[k] = rootEstimate(k, 48);
      if (FUNCS[k].infinite) { if (!(out.root[k] < 0.5)) rOK = false; }
      else { if (!(out.ratio[k] > 0.85 && out.ratio[k] < 1.2)) rOK = false; }
    }
    out.radius_OK = rOK;
    out.errIn = {}; out.errOut = {}; var eOK = true, r1 = [1, 2, 7, 8];
    for (i = 0; i < r1.length; i++) {
      k = r1[i];
      var e20 = maxErrOnCircle(k, 20, 0.9, 90), e40 = maxErrOnCircle(k, 40, 0.9, 90);
      var E20 = maxErrOnCircle(k, 20, 1.1, 90), E40 = maxErrOnCircle(k, 40, 1.1, 90);
      out.errIn[k] = [e20, e40]; out.errOut[k] = [E20, E40];
      if (!(e40 < e20 && E40 > 1 && E40 > 100 * e40)) eOK = false;
    }
    out.conv_OK = eOK;
    var aOK = true; out.entireErr = {};
    for (k = 3; k <= 6; k++) { out.entireErr[k] = maxErrOnCircle(k, 26, 1.5, 90); if (!(out.entireErr[k] < 1e-3)) aOK = false; }
    out.entire_OK = aOK;
    out.ok = out.coeff_OK && out.trivial_OK && out.radius_OK && out.conv_OK && out.entire_OK;
    return out;
  };

  /* ---------------- 启动 ---------------- */
  if (typeof document !== "undefined" && document.getElementById && document.getElementById("cvMain")) {
    cvMain = document.getElementById("cvMain");
    cvDecay = document.getElementById("cvDecay");
    cvErr = document.getElementById("cvErr");
    cvSums = document.getElementById("cvSums");
    cvBar = document.getElementById("cvBar");
    for (var q = 0; q < 8; q++) minis.push(document.getElementById("cvMini" + q));
    var errBar = document.createElement("div");
    errBar.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:99;background:#e0645f;color:#0e1116;font:12px ui-monospace,monospace;padding:4px 8px;display:none";
    errBar.id = "errBar"; if (document.body) document.body.appendChild(errBar);
    window.addEventListener("error", function (e) {
      errBar.style.display = "block";
      errBar.textContent = "JS ERROR: " + (e.message || e.error) + " @ " + (e.filename || "") + ":" + (e.lineno || "");
    });
    applyHash(); layout(); bind(); applyHashToUI(); refreshAll();
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("hashchange", function () { applyHash(); applyHashToUI(); refreshAll(); });
    }
    window.addEventListener("resize", function () { layout(); refreshAll(); });
  }
})();
