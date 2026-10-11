# Complex Analysis Graph

复变函数中文交互图解库。根目录的 [专题目录](./index.html) 是统一入口；下载完整专题目录后可离线打开其中的 `index.html`。幂级数专题还需要同目录的 KaTeX 字体文件。

## 专题

| 分类 | 专题 | 入口 |
| --- | --- | --- |
| 复数与几何 | 模、辐角、乘法、倒数与域着色 | [打开](./topics/modulus-argument-domain-coloring/index.html) |
| 幂级数 | 八个函数的幂级数展开与收敛半径 | [打开](./topics/complex-power-series/index.html) |

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
    └── complex-power-series/
        ├── index.html                 # 八个函数的交互教学页
        ├── README.md                  # 文件说明与来源边界
        ├── preview.png                # 整页预览
        ├── preview-mobile.png         # 手机整页预览
        ├── lecture.pdf                # 配套讲义
        ├── katex-fonts/               # 离线公式字体
        └── source/                    # 可编辑源码、TeX、数据与核验
```

1. 在 `topics/` 下创建简短、稳定、全小写的目录。
2. 主网页命名为 `index.html`；附属图片、数据和源码保存在该目录，以相对路径引用。页面不得依赖在线资源。
3. 同步更新根 `index.html` 的卡片与上面的专题表。
4. 在专题页和 README 中区分用户原图、精确计算、近似值与教学示意；附上来源与核验方式。

首个专题依据用户提供的 1600 × 911 图片制作。原图的 `1/z ≈ 0.42 − 0.33i` 是粗略估算；对 `z = 1.5 + 1.2i` 独立计算得到 `1/z = (50 − 40i)/123 ≈ 0.40650 − 0.32520i`。

幂级数专题由用户提供的现成 HTML 与同目录配套文件收录。页面自述的教材题目照片与参考答案原件没有随本次文件提供；来源和可核验范围见[专题说明](./topics/complex-power-series/README.md)。
