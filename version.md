# version.md

## 本次结构调整概览

本版本把 `english2` 从“每个 HTML 页面自带样式和脚本”的维护方式，整理为接近 `english1` 的公共结构：年份页只保留内容 markup，公共样式和公共交互集中维护。

## 主要变更

1. **保留并沿用 `english1` 的公共结构思路**
   - `year.css`：年份页公共样式入口。
   - `year.js`：年份页公共交互入口。
   - `transition.js`：页面切换动效入口。
   - 每个年份 HTML 页面只负责承载当年内容、题卡、证据链和跳转锚点。

2. **整理 `english2` 的内联 CSS**
   - 已从 `english2/2010.html`—`english2/2026.html` 移除页面内 `<style>` 块。
   - 英语二所需的兼容样式集中到 `english2/year.css`。
   - 英语二差异样式继续通过 `body.exam-two-page` 进行作用域控制，避免污染英语一页面。

3. **整理 `english2` 的内联 JS**
   - 已从 `english2/2010.html`—`english2/2026.html` 移除页面内 `<script>` 逻辑。
   - 所有英语二年份页现在统一引用：
     - `transition.js`
     - `year.js`
     - 词库与弹窗相关公共数据脚本
   - `english2/year.js` 现在统一处理：题卡点击、题号跳转、原文证据高亮、题干关键词联动、Text 导航激活。

4. **统一 `english2` 的 key 命名**
   - 原短 key：`t1-q21`、`t2-q26`、`t4-q40`。
   - 新长 key：`y2010-t1-q21`、`y2026-t2-q26`、`y2026-t4-q40`。
   - 同步更新范围包括：`id`、`data-key`、`data-target`、`data-map`、`data-maps` 等题目联动字段。
   - 这样后续做全局题库、跨年份索引、搜索、统计时，不会出现不同年份 key 冲突。

5. **删除页面内的修补噪音**
   - 页面内不再保留 `repair-v1` 样式补丁块。
   - 原来补丁承担的必要兼容样式已经整理进 `english2/year.css` 的共享兼容层。

## 后续维护约定

- 新增年份页时，优先复制现有年份页的 HTML 内容结构，不要重新写内联 CSS 或内联 JS。
- 英语一页面继续走 `english1/year.css`、`english1/year.js`。
- 英语二页面继续走 `english2/year.css`、`english2/year.js`，并保留 `<body class="... exam-two-page">`。
- 新增题目 key 必须使用 `yYYYY-tN-qNN` 格式，例如：`y2027-t1-q21`。
- 新增证据映射建议沿用同一前缀，例如：`y2027-t1-q21-m1` 或 `y2027-t1-q21--main-evidence`。
- 不建议在单个年份 HTML 中加入 `<style>` 或无 `src` 的 `<script>`；确有公共需求时，优先修改对应的 `year.css` / `year.js`。

## 给下次接手模型的快速判断

当前推荐维护入口：

```text
当前版本/
  english1/
    year.css
    year.js
    transition.js
    2010.html ... 2026.html
  english2/
    year.css
    year.js
    transition.js
    2010.html ... 2026.html
```

`english1` 仍是结构参考版本；`english2` 已经完成第一轮去内联化和 key 年份化。后续如果要继续统一两个版本，可以进一步抽出真正的 `common/year.css` 与 `common/year.js`，但当前版本为了降低风险，仍保留英语一、英语二各自的公共入口。
