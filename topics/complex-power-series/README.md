# 八个复变函数的幂级数与收敛半径

打开 [交互页面](./index.html)；需要打印或系统复习时打开[讲义 PDF](./lecture.pdf)。本专题由用户提供的 `complex-power-series.html` 与同目录配套文件收录。仓库入口页补充了返回目录、讲义入口与窄屏布局；[原 HTML 副本](./source/original.html)保留原始字节内容。KaTeX 字体保存在本专题目录，可离线显示公式。

## 内容和操作

页面比较八个函数在 `z=0` 的幂级数及收敛半径。可切换函数、部分和阶数、探测点、视图范围与误差/函数/部分和模式；下方有各题推导和数值核验说明。

## 文件

- `index.html`：原交互 HTML，离线使用。
- `katex-fonts/`：20 个本地 WOFF2 字体。
- `preview.png`、`preview-mobile.png`：按仓库入口页重新生成的桌面与手机整页预览；原预览保存在 `source/preview-original.png`。
- `lecture.pdf`：用户文件夹中提供的讲义。
- `source/`：原 HTML、页面模板、交互脚本、讲义 TeX、数值数据与核验脚本。`python3 source/build.py` 可从本专题内置资源重建 `index.html`，无需联网。

内置的 KaTeX 0.16.11 脚本、样式和字体附带其 [许可证](./source/vendor/KATEX-LICENSE.txt)。浏览器检查可在本专题目录执行 `npm install --no-save --prefix source playwright-core`，随后执行 `node source/browser-qa.cjs`；非 macOS 环境可用 `CHROME_PATH` 指定 Chrome/Chromium。

## 来源边界

页面自述对应钟玉泉《复变函数论》习题四第 12 题，并提到一张题目照片和一份参考答案；本次提供的文件夹中没有那张照片或参考答案原件。因此这里将题号与对照关系保留为**原页面的来源说明**，没有独立核对教材原题。浏览器与页面自检见 `source/verification.json`；SymPy 前 14 项的独立符号核对结果见 `source/symbolic-verification.txt`。

仓库仅收录本专题所需的文件；外置盘的 AppleDouble `._*` 元数据文件和 LaTeX 编译日志未收录。
