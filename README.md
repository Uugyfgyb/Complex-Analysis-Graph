# Complex Analysis Graph

复变函数中文交互图解库。根目录的 [专题目录](./index.html) 是统一入口；下载完整专题目录后可离线打开其中的 `index.html`。幂级数专题还需要同目录的 KaTeX 字体文件。

## 专题

| 分类 | 专题 | 入口 |
| --- | --- | --- |
| 复数与几何 | 模、辐角、乘法、倒数与域着色 | [打开](./topics/modulus-argument-domain-coloring/index.html) |
| 幂级数 | 八个函数的幂级数展开与收敛半径 | [打开](./topics/complex-power-series/index.html) |
| 留数与辐角原理 | 数圈 · 牵绳 · 合围：幅角原理、儒歇定理与用留数计算实积分 | [打开](./topics/argument-rouche-residue/index.html) |

## 仓库结构与新增规则

```text
Complex-Analysis-Graph/
├── index.html                         # 全部专题的目录入口
├── README.md                          # 专题索引与维护规则
└── topics/
    ├── modulus-argument-domain-coloring/
    │   ├── index.html                 # 可独立离线打开的交互教学页
    │   ├── README.md                  # 公式、来源和范围
    │   ├── preview.png                # 桌面整页预览
    │   └── source/                    # 用户原图与核验脚本
    ├── complex-power-series/
    │   ├── index.html                 # 八个函数的交互教学页
    │   ├── README.md                  # 文件说明与来源边界
    │   ├── preview.png                # 整页预览
    │   ├── preview-mobile.png         # 手机整页预览
    │   ├── lecture.pdf                # 配套讲义
    │   ├── katex-fonts/               # 离线公式字体
    │   └── source/                    # 可编辑源码、TeX、数据与核验
    └── argument-rouche-residue/
        ├── index.html                 # 水墨风格自学页（单文件，公式字体内嵌，不联网）
        ├── README.md                  # 内容、注释体系、精确结论与近似值的区分、核对
        ├── preview.png                # 桌面整页预览
        ├── preview-mobile.png         # 手机整页预览
        ├── numerical-verification.json # 数值核对记录
        ├── verification.json          # 浏览器验收记录
        ├── package.json               # 构建与验证依赖（Node 或 Deno）
        └── source/                    # 模板、样式、脚本、构建与核验脚本
```

1. 在 `topics/` 下创建简短、稳定、全小写的目录。
2. 主网页命名为 `index.html`；附属图片、数据和源码保存在该目录，以相对路径引用。页面不得依赖在线资源。
3. 同步更新根 `index.html` 的卡片与上面的专题表。
4. 在专题页和 README 中区分用户原图、精确计算、近似值与教学示意；附上来源与核验方式。

首个专题依据用户提供的 1600 × 911 图片制作。原图的 `1/z ≈ 0.42 − 0.33i` 是粗略估算；对 `z = 1.5 + 1.2i` 独立计算得到 `1/z = (50 − 40i)/123 ≈ 0.40650 − 0.32520i`。

幂级数专题由用户提供的现成 HTML 与同目录配套文件收录。页面自述的教材题目照片与参考答案原件没有随本次文件提供；来源和可核验范围见[专题说明](./topics/complex-power-series/README.md)。

“数圈 · 牵绳 · 合围”专题没有用户原图，按留数、幅角原理、儒歇定理、用留数计算实积分（四型）的顺序讲，水墨风格，单文件、不联网。定理和各例题的闭式结果是精确结论；四个互动图上的读数是浏览器现算的近似值（辛普森积分、Aberth 求根、幅角增量累加）；遛狗比喻、小罗盘、w 平面的径向压缩和墨色深浅是教学示意。凡用到数学分析的步骤都配了红字朱批（46 条），术语可点开看注释（总表 29 条）。图中的函数只限有理函数和多项式，围道只限圆和半圆。数值核对 140 项、浏览器验收 71 项的记录见[专题说明](./topics/argument-rouche-residue/README.md)。
