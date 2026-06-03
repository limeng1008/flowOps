# FlowOps 全局中文化（UI i18n 收口）· Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**分批执行，每批一个 commit，过门禁再做下一批；任何门禁失败停下报告。不要改节点/凭证/后端逻辑，只动 UI 文案。**
> 目标：把 `packages/ui` 里**所有用户可见英文**收进 i18n，中文（zh）100% 覆盖。面向非开发者用户，界面不能露英文。

---

## 0. 现状（已验证）

-   i18n 已搭好：`react-i18next`，默认语言 **zh**（`packages/ui/src/i18n/index.js` 的 `DEFAULT_LANGUAGE='zh'`），有 zh/en 切换。
-   词条：`packages/ui/src/i18n/locales/en.json` 与 `zh.json`，各 ~889 行、结构对齐。**en 是结构事实源**：先在 en.json 加键，再在 zh.json 加同路径中文。
-   顶层命名空间：`menu / profile / auth / landing / common / permissions / canvas / pages`。
-   覆盖率：**154/287 个 .jsx 已用 i18n**，缺口约 130 个（`ui-component` 66、`views` 30、`layout` 13）。其中不少是**纯视觉组件无文案**（见 §4 跳过名单）。

## 1. 范式（照抄已覆盖组件）

参考 `views/credentials/CredentialInputHandler.jsx`：

```jsx
import { useTranslation } from 'react-i18next'
// ...
const MyComp = () => {
    const { t } = useTranslation()
    // 之前：<Button>Save</Button>  title='Delete'  placeholder='Search'
    // 之后：
    return <Button>{t('common.save')}</Button> // title={t('common.delete')} placeholder={t('common.search')}
}
```

-   函数组件：组件顶部 `const { t } = useTranslation()`。
-   类组件（少数）：用 `withTranslation()` HOC 或抽成函数封装；拿不准就停下报告，别硬改。
-   带插值：`t('pages.xxx.greeting', { name })`，词条写 `"greeting": "你好 {{name}}"`。
-   带 count/复数：用 i18next 的 `_one/_other` 或直接插值，保持 en/zh 一致。

## 2. 词条命名规则

-   **共享词**（保存/取消/删除/确认/搜索/新建/编辑/关闭/导出/导入/上一步/下一步/是/否/加载中…）一律复用或补到 **`common.*`**，不要每个组件各造一个。
-   **页面/功能专属**放 `pages.<feature>.*`，feature 用驼峰对应目录，如 `pages.credentials.*`、`pages.variables.*`、`pages.apiKeys.*`、`pages.documentStores.*`、`pages.assistants.*`、`pages.tools.*`、`pages.chatflows.*`、`pages.agentflows.*`、`pages.evaluations.*`。
-   画布相关延用现有 `canvas.*`。
-   键名用语义英文小驼峰：`pages.credentials.sharedCredential`、`common.confirmDelete`。
-   **en.json 与 zh.json 必须同路径同时新增**；en 填英文原文，zh 填中文。

## 3. 翻译哪些（只动用户可见文案）

要翻：按钮文字、标题/小标题、占位符 placeholder、表格列头、空状态文案、菜单项、对话框标题与正文、确认/提示/报错文案、Tooltip 文本、tab 名、表单 label。

**不要翻/不要动**：

-   组件 `name`/节点类型/`baseClasses`/枚举 value/路由 path/CSS 类名/`data-*`/事件名。
-   代码、变量名、URL、API 字段名、占位用的英文 key。
-   控制台 `console.*`、纯 aria-label（可选，优先可见文案；aria 不强求）。
-   第三方库内部默认文案（如 MUI DataGrid 的内置英文）——除非已通过 props 暴露。

## 4. 跳过名单（纯视觉/无文案，别改）

`*Edge.jsx`（AgentFlowEdge/ButtonEdge…）、`ConnectionLine.jsx`、`views/evaluations/Chart*.jsx`、纯图标/SVG 包装组件、`index.js`(非组件)。打开看：若全文无用户可见英文字符串，**跳过并在报告里列出**。

## 5. 分批顺序（高频优先，每批 ~10-15 文件、一个 commit）

1. **B1 登录/认证**：`views/auth/*`（login/expired/rateLimited/ssoSuccess/confirm-email-change）—— 用户第一眼。
2. **B2 设置区实体列表**：`views/credentials`、`views/variables`、`views/apikey`、`views/document-stores`(主列表)、`views/assistants`、`views/tools` 里未覆盖的页与对话框。
3. **B3 layout**：`layout/` 未覆盖的 13 个（侧栏/头部/菜单残留）。
4. **B4 ui-component 对话框/卡片/表格**：`ui-component/dialog`、`ui-component/cards`、`ui-component/table`、`ui-component/button` 未覆盖项。
5. **B5 其余 ui-component 与 views 长尾**：datasets/evaluations(非图表)/workspace/schedule/webhooklistener/chatbot 等。
6. **B6 复扫**：对 §3 范围内已覆盖组件做一次"漏网英文"巡检。

## 6. 每批工作流（必须照做）

1. 改这批文件：引 `useTranslation`、把可见英文换成 `t('…')`。
2. en.json 加键（英文原文）→ zh.json 加同路径中文。
3. **登记**：把本批新改的既有 `.jsx` 路径补进 `FORK-CHANGES.md` 的「Modified File Ledger」表，分类填 `UI-i18n-hardening`（该分类已存在）。
4. **门禁**（全过才提交）：
    - `cd packages/ui && npx jest canvasDialogsI18n`（若给关键键加了断言更好）
    - `pnpm --filter flowise-ui build`（必须成功，JSX 不能破）
    - `bash scripts/fork-divergence.sh`（在仓库根，必须 `passed`；没登记会红）
5. `git commit`：`i18n(ui): 中文化 <批次/区域>`，结尾 `Co-Authored-By: Codex <noreply@openai.com>`。下一批。

## 7. 边界 / 防坑

-   **只改 `packages/ui` 文案**，不碰 `packages/components`、`packages/server`、节点逻辑、路由。
-   不改 `i18n/index.js` 的语言配置（已是 zh）。
-   en/zh 两个文件必须同步加键，**漏一边会让 fallback 露英文或控制台告警**。
-   husky 会跑 prettier+eslint；JSON 别有重复键（no-dupe-keys 会拦），新键放对命名空间内、注意逗号。
-   一次别贪多：一批跑挂了不好定位。每批构建通过再继续。

## 8. 验收（DoD）

-   §5 范围内组件的用户可见英文全部走 `t()`；zh.json 同步齐全。
-   `pnpm --filter flowise-ui build` 绿；`canvasDialogsI18n` 测试绿；`scripts/fork-divergence.sh` `passed`（新改文件已登记）。
-   每批独立 commit、全在一个 i18n 分支（如 `feat/full-i18n`），未并 main（留人工 review）。
-   报告：列出已中文化的文件、跳过的纯视觉文件、以及任何拿不准没动的（如类组件、第三方内置文案）。
