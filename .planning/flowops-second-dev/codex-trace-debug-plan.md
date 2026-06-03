# FlowOps 执行 Trace / 调试增强 + 中文化 · Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**分阶段执行，每阶段过门禁再提交；失败停下报告。**
> 目标：直击行业第一痛点"demo 易、生产难/调试黑盒"——把 AgentflowV2 的**执行记录(Executions)视图**中文化，并在**纯前端、只呈现已记录数据**的前提下增强可调试性（失败步骤定位、每步状态/耗时/用量、导出执行详情）。

---

## 0. 须知

### 0.1 环境 / 分支 / 边界

-   仓库根 `/Volumes/project/Flowise`；**Node 20**。在分支 **`feat/trace-debug`** 上工作，**不要 push、不碰 main**，留人工 review。
-   **只动 `packages/ui` 前端**：呈现"执行记录里已经存下来的数据"。**不改后端、不改执行记录的数据结构、不碰核心/节点逻辑**。某项增强若所需数据执行记录里根本没有 → 跳过并在报告里写明，别去改后端补。
-   改到的既有 `.jsx` 都要登记进 `FORK-CHANGES.md`（i18n 相关填 `UI-i18n-hardening`；纯增强如无更合适分类也归 `UI-i18n-hardening` 或新增一个 `UI-trace-debug` 分类——二选一，保持脚本能解析）。

### 0.2 先调研（动手前必做，并在报告里给结论）

读这些文件，搞清现状与"每步执行记录有哪些字段"：

-   `packages/ui/src/views/agentexecutions/`：`ExecutionDetails.jsx`、`NodeExecutionDetails.jsx`、`PublicExecutionDetails.jsx`、`ShareExecutionDialog.jsx`、`index.jsx`
-   看每个节点执行项里能拿到的字段（已知有 `status`；查是否还有 `timeMetadata`(耗时)、`usageMetadata`(token/费用)、错误信息、节点 label/id、input/output）。
-   i18n 现状（已核实）：`ExecutionDetails.jsx`、`PublicExecutionDetails.jsx` **未中文化**；`NodeExecutionDetails.jsx`、`ShareExecutionDialog.jsx`、`index.jsx` 已用 i18n（仍要扫一遍漏网英文）。

### 0.3 i18n 范式与词条

-   `react-i18next` 的 `useTranslation()` + `t('pages.executions.*')`；en.json 先加键、zh.json 同路径加中文（两者必须同步）。共享词复用 `common.*`。
-   参考已覆盖组件写法：`views/credentials/CredentialInputHandler.jsx`。

---

## 1. 阶段 A · 执行记录视图中文化（确定项，先做）

-   把 `ExecutionDetails.jsx`、`PublicExecutionDetails.jsx` 的用户可见英文全部走 `t()`（含 JS 对象属性里的文案：状态标签、列头、按钮、空/加载/错误态、tooltip）。
-   复扫 `NodeExecutionDetails.jsx`、`ShareExecutionDialog.jsx`、`index.jsx` 的漏网英文补齐。
-   en/zh 在 `pages.executions.*` 下新增词条（如 `running/finished/error/stopped` 状态、`copy/export/duration/tokens` 等）。
-   登记改动文件进 `FORK-CHANGES.md`。
-   过门禁 → 单独 commit（`i18n(ui): 中文化执行记录(Trace)视图`）。

## 2. 阶段 B · 调试增强（纯前端、只呈现已有数据；逐项做，能做哪项做哪项）

按"读到的数据可支持"为准，逐项实现；做不了的跳过并报告：

1. **失败步骤定位**：哪个节点 `status` 为 error/失败时，在顶部给一条中文错误提示，**点名是哪个节点**失败，并让该节点在列表/画布里高亮（红）。
2. **每步徽章**：每个节点执行项显示 状态徽章（中文：运行中/成功/失败/已停止）+ 若有 `timeMetadata` 显示耗时 + 若有 `usageMetadata` 显示 token/费用。无对应数据则不显示该徽章。
3. **导出/复制执行详情**：加一个「复制本次执行 JSON」/「导出」按钮，把当前执行的节点输入/输出/状态打包给用户排障或发支持（纯前端拼现有数据）。
4. **中文空/加载/错误态**：执行为空、加载中、拉取失败的占位文案中文化、友好化。

-   每做完 1-2 项过门禁、单独 commit（`feat(ui): 执行 Trace 调试增强 - <项>`）。

## 3. 每阶段门禁（必过）

-   `cd packages/ui && npx jest i18n`（i18n 词条/路由测试全过；如新增关键键可加断言）
-   `pnpm --filter flowise-ui build`（必须成功，JSX 不能破）
-   `bash scripts/fork-divergence.sh`（必须 `passed`；改的既有 .jsx 已登记 FORK-CHANGES）

## 4. 验收（DoD）

-   执行记录相关视图无用户可见英文残留（专有名词除外）；zh/en 同步。
-   失败时能一眼看出"哪个节点挂了"；每步有状态（有数据则带耗时/用量）；能导出/复制执行详情排障。
-   仅前端改动，未碰后端/核心/执行数据结构。
-   UI build 绿、i18n 测试绿、fork-divergence `passed`。
-   全在 `feat/trace-debug`、未并 main；报告列出：已做的增强项、因缺数据跳过的项、改动并登记的文件清单。

## 5. 提交规范

-   分阶段多个 commit，结尾 `Co-Authored-By: Codex <noreply@openai.com>`。
-   husky 跑 prettier+eslint；JSON 无重复键；JSX 改完先本地 build 过再提交。
