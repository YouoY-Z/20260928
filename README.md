# 个人主页

纯静态站点：没有框架、没有构建步骤，改完 HTML 提交即可上线。
线上地址：GitHub Pages（仓库 Settings → Pages 查看）

## 目录结构

```
index.html      页面内容，全站唯一的数据来源（改内容只需要动它）
styles.css      唯一的外观来源，按编号分节，改配色动第 1 节变量
app.js          页面交互：进度条、返回顶部、导航高亮、栏目淡入
works.js        作品筛选与排序，内容全部来自 index.html
assets/         头像、封面图、字体（不要改名，换图只换文件）
tools/          本地与 CI 共用的自检脚本，不发布
.github/        自动检查与自动发布的配置，不发布
```

## 日常维护

日常更新只改 `index.html` 一个文件。文件开头有一段"维护地图"，
列出了每类内容分别在哪个区块；每个区块上面也有一行注释说明怎么加内容。
下面是最常用的几种操作：

**加一个作品**（最常见）

在 `index.html` 的 `#works-list` 里复制一个 `<li class="work-card">`，然后改：

| 改什么 | 怎么改 |
| --- | --- |
| 标题 / 说明 | `<h3>` 和 `<p>` 里的文字 |
| 封面图 | 图片放进 `assets/`，改 `<img src>`，顺手更新 `alt` |
| 跳转网址 | `<a href>`，外链保留 `target="_blank" rel="noopener noreferrer"` |
| 年份 | 改 `data-year`，卡片右上角的徽标会自动跟着变 |
| 标签 | 改 `data-tags`，多个标签用空格分隔；筛选按钮会自动生成 |

**加一个栏目**（例如新增"证书"）

1. 顶部 `<nav>` 里加一个 `<a href="#certificates">证书</a>`
2. `<main>` 里加一个 `<section class="section" id="certificates">`

导航高亮、阅读进度条、滚动淡入会自动跟上，`app.js` 一行都不用改。

**加一条经历 / 项目 / 技能 / 记录**

复制对应区块里的 `.experience-item`、`.research-item`、`.skills-list` 里的 `<li>`
或 `.teaching-group`、`.publication-group` 即可。

**换头像 / 配色 / 字号**

- 头像：`assets/` 换图，`.hero` 里改 `src` 和 `alt`
- 配色、字号、正文宽度：改 `styles.css` 第 1 节的 CSS 变量，全站一起变

## 两条要守住的约定

1. **作品只写在 HTML 里。** 不要为了"方便"再复制一份到 JavaScript 数据数组，
   两份数据迟早会不一致。要加作品就复制 `<li>`。
2. **外观只写在 `styles.css` 里。** JS 只负责切换类名
   （`.is-visible`、`.is-current`、`.is-ready`），不在 JS 里写样式。

页面在 JavaScript 失效时依然完整可读、链接依然能跳转，
这是刻意的设计（渐进增强），改代码时请保持。

## 本地自检

推送前在本地跑一次，和 CI 里跑的是同一个脚本：

```bash
node tools/check-page.mjs
```

它会检查：必需文件是否齐全、`index.html` 引用的本地文件是否存在、
页内锚点是否有对应的 `id`、每张图片的 `alt` 是否写了。
有问题时逐条修好再提交。

## 自动检查与自动发布

`.github/workflows/pages.yml` 每次推到 `main` 自动执行：

1. **check** —— 跑 `tools/check-page.mjs`，不通过就停在这里，不会发布
2. **deploy** —— 检查通过才把站点文件发布到 GitHub Pages

发布内容是上面显式列出的那几个文件，新增站点文件时要记得在
`pages.yml` 的 `path` 里补一行。也可以在 Actions 页面手动触发。
