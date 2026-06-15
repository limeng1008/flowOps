# Codex 执行计划：竞品借鉴 Wave 1（用量看板 · 触发器收口 · 模板审核）

> 共享纪律见 `codex-任务总览-权限付费双形态.md` §2（独立 worktree、Node 20 `nvm use 20`、提交前 tsc/jest/fork-gate/UI build、不 `pnpm add`、Codex trailer、不自合 main）。
> 基线：`main`。分支见各任务。核心文件改动登记 `FORK-CHANGES.md`。
> 数据库迁移：四库同步（sqlite/mysql/mariadb/postgres），新时间戳 > `1778000200000`（如 `1778100000000+`），风格对齐 `1772000000000-AddScheduleEntities`。

---

## 0. 背景与范围

把 Coze / n8n / Dify 的优点落地到 FlowOps 的**第一波**。选这三项的原因：要么踩在已有底子上（低风险高回报），要么是国内市场最能打的差异化。

本波三项：
- **A. 用量看板**（对标 Dify 用量可观测）—— 引擎已就位，本波只补"看得见"的增量。
- **B. 触发器收口 + 错误兜底**（对标 n8n）—— 本波**核心净新增**。
- **C. 内部模板库 + 提交审核**（对标 Coze 模板生态）—— 审核/发布基础设施净新增。

### 0.1 与现有计划的关系（避免重复造）

勘察发现多项能力已有计划或已落地，本计划**只做增量**，不重写既有方向：

| 本波项 | 已有计划 / 已落地代码 | 本计划的增量 |
| --- | --- | --- |
| A 用量/配额 | `codex-3b-计量统一-plan.md`（计量统一到权益层）、`codex-p1-权益层-plan.md`（Entitlement 已落地，迁移 `1777300000001-AddEntitlementEntity`）、`codex-te-套餐资源点ui-plan.md`（套餐/资源点 UI） | 仅补 **Dify 式用量可观测看板**（按 bot/模型/趋势拆分 + 导出）+ **超额拦截回归测试证据** |
| B 触发器 + 错误兜底 | schedule 已落地（`ScheduleRecord`/`ScheduleTriggerLog`/`ScheduleExecutor`）、webhook-listener 已落地；**无统一抽象计划，无错误处理计划** | **全部净新增**：触发器统一抽象、激活状态机、错误兜底（retry/continue-on-fail/error-workflow + 告警） |
| C 模板库 + 审核 | `codex-phase2-templates-plan.md`（**只产内容模板**，不含审核/发布） | **审核/发布基础设施净新增**：状态机、可见性、审核端点、UI |

> ⚠️ **架构红线（来自 `codex-3b-计量统一`）**：配额/限额检查统一走 **Entitlement**，`BillingService` 已 deprecated 退为数据源。**本波 A 不得新增 `BillingService` 计量埋点**，一切走 `quotaUsage.ts` 现有入口。

### 0.2 已勘明的现状（file:line）

- **计量闸门已接线**：`packages/server/src/utils/quotaUsage.ts` 的 `checkUsageLimit`(:52)/`checkPredictions`(:162) 已"权益层优先、旧 billing 兜底"；`buildChatflow.ts` 执行前调 check、执行后 `updatePredictionsUsage`(:94 定义，buildChatflow.ts:1113 调用)；`ScheduleExecutor.ts` 同样调 check。→ A 的引擎+拦截**已就位**。
- **触发器底子**：`ScheduleRecord` 实体含 `enabled:boolean`、`lastRunAt`、`nextRunAt`、`cronExpression`、`triggerType`；`ScheduleTriggerLog` 已有；`ScheduleExecutor.ts`(248 行)；`services/schedule/index.ts`(464 行)；webhook 入站 `controllers/webhook-listener/`。→ 单类型成熟，**缺统一抽象与错误兜底**。
- **错误处理缺失**：`buildAgentflow.ts` 无 `retry`/`continueOnError`/`onError`/`errorWorkflow`（grep 无真实命中）。→ 节点级容错与全局兜底**净新增**。
- **模板底子**：`CustomTemplate` 实体含 `id/name/flowData/description/badge/framework/usecases/type/workspaceId`，**无 `status`/`visibility`/`submittedBy`/`reviewedBy`**。→ 审核/发布字段净新增。
- **计费前端**：`packages/ui/src/views/billing/index.jsx`(513 行) + `billingCenter.js` + `api/billing.js` 已有，可作 A 看板的承载页。

---

## A. 用量可观测看板（对标 Dify）· 难度 🟢 低

**分支** `feat/usage-dashboard`。**定位**：引擎已就位，本节只做"看得见 + 可证拦截"。

### A1. 用量聚合只读 API（后端）
- 现状：`getCurrentUsage`(quotaUsage.ts:24) 给单一总量；`BillingUsage` 实体已带 `chatflowId`/`source`/`period` 维度但未聚合暴露。
- 要做：新增只读端点 `GET /api/v1/usage/overview?period=YYYY-MM`，返回：
  - 总量 + 配额 + 剩余（复用 Entitlement `getCurrentUsage`）。
  - 按 **bot（chatflowId）** 维度 Top-N token 消耗。
  - 按 **时间趋势**（日粒度，当期）。
- 文件：`packages/server/src/routes/usage/`（新）+ `controllers/usage/` + `services/usage/`（聚合 `BillingUsage` + Entitlement）。**只读，不碰计量写入**。
- 验收：返回结构有单测；空数据返回零值不报错。

### A2. 看板前端（对标 Dify usage 页）
- 文件：`packages/ui/src/views/billing/` 内新增 `usageDashboard.jsx`，挂到 billing 路由 tab。
- 内容：配额进度条（tokens/bots/seats）、按 bot 排行、趋势折线、**CSV 导出**。
- 验收：preview 真机截图；i18n 中英覆盖（对齐 `codex-full-i18n` 风格）。

### A3. 超额拦截回归测试（补 `计量统一` 红线证据）
- 现状：拦截已接线但缺"被拦截"的显式测试证据。
- 要做：在 `quotaUsage` / prediction 路径补 jest：配额耗尽时 `checkUsageLimit`/`checkPredictions` **抛出可读中文错误**且 prediction 不执行。
- 验收：`jest quotaUsage entitlement` 含超额用例全绿。

> A 项工作量约 **3–5 人日**，无数据模型改动。

---

## B. 触发器收口 + 错误兜底（对标 n8n）· 难度 🟡🔴 中→中偏上

**分支** `feat/trigger-resilience`。**本波核心**。拆两阶段：B1–B2 收口（中），B3–B5 错误兜底（中偏上）。

### B1. 触发器统一抽象（收口）
- 现状：schedule 与 webhook 各走各的，无统一"触发器"概念。
- 要做：定义 `TriggerKind = 'schedule' | 'webhook'`（预留 `'event'`），抽象统一接口 `{ id, kind, targetId(chatflow), enabled, lastFiredAt, lastStatus }`。
  - 不重写 `ScheduleRecord`/webhook，**适配层归一**：`services/triggers/index.ts`（新）聚合两源，对外统一列表/启停。
- 文件：`packages/server/src/services/triggers/`（新，聚合层）；复用 `ScheduleRecord.enabled` 作激活位，webhook 侧补 `enabled` 等价位（若缺则加列，四库迁移）。
- 验收：`GET /api/v1/triggers` 同时列出两类；`PATCH /api/v1/triggers/:id { enabled }` 对两类都生效。

### B2. 触发器执行日志统一 + 激活状态机
- 现状：`ScheduleTriggerLog` 仅 schedule。
- 要做：
  - webhook 触发也落 `TriggerLog`（统一表或并表视图：`{ triggerId, kind, firedAt, status: success|failed|skipped, error?, executionId? }`）。
  - 激活状态机：`enabled` 切换为单一真源；停用即不再触发且 UI 标灰；去重（同一 cron tick / 同一 webhook 幂等键不重复触发）。
- 文件：`database/entities/TriggerLog.ts`（新或扩展 `ScheduleTriggerLog`）+ 四库迁移；`webhook-listener` 写日志。
- 验收：启停后日志/行为一致；重复触发被去重（单测）。

### B3. 节点级容错：retry / continue-on-fail
- 现状：`buildAgentflow.ts` 无节点级容错，单节点报错即整流程挂。
- 要做：在 AgentflowV2 节点通用配置加两项（参考 n8n）：
  - `retryOnFail`: `{ maxRetries, waitBetweenMs }` —— 执行器对该节点失败重试。
  - `continueOnFail`: 失败不中断，错误写入该节点输出（`_error` 通道），下游可分支。
- 文件：`packages/server/src/utils/buildAgentflow.ts`（执行器主循环加重试/容错包裹）；节点 schema 加配置项；UI 节点设置面板加两个开关（`packages/ui` 节点配置组件）。
- 风险：执行器是热路径，**改动需保证不破坏现有流**——加配置默认关闭（行为不变），开了才走新逻辑。
- 验收：单测覆盖"重试 N 次后成功"、"continueOnFail 下游拿到 `_error`"、"默认关闭时行为与改前一致"。

### B4. 全局 error workflow + 告警
- 现状：流程失败无统一兜底/通知。
- 要做：
  - workspace 级配置"错误处理流"：任意流程未捕获失败时，触发指定的 error chatflow（传入 `{ flowId, executionId, error }`）。
  - 告警通道：先做 **webhook 告警**（POST 到用户配置 URL），为后续飞书/企微机器人留接口（与 Wave 2 渠道发布对齐）。
- 文件：workspace 配置加字段（迁移）；`buildChatflow.ts`/`buildAgentflow.ts` catch 分支统一兜底入口；`services/triggers` 或新 `services/error-handling`。
- 验收：故意制造失败 → error workflow 被触发 + 告警 webhook 收到载荷（单测 + 一次真机）。

### B5. 执行重跑（整流程，轻量）
- 现状：`observe` 包有 trace（`codex-trace-debug-plan.md` 相关），无重跑。
- 要做：从某次 execution **整流程重跑**（用原始 input 重新执行）。**不做断点续跑**（需中间态快照，留 Wave 3）。
- 文件：`observe`/executions 视图加"重跑"按钮 → 调 prediction 入口。
- 验收：重跑生成新 execution；UI 可见。

> B 项工作量约 **2.5–4 人周**（B1–B2 约 1 周，B3–B5 约 2–3 周，执行器改动需充分回归）。**先 B1–B2 交付，再 B3–B5。**

---

## C. 内部模板库 + 提交审核（对标 Coze）· 难度 🟢🟡 低→中

**分支** `feat/template-review`。建在 `CustomTemplate` 已有 CRUD + workspace 隔离之上。

### C1. 实体扩展
- 现状：`CustomTemplate` 无审核字段。
- 要做：加列（四库迁移）：
  - `status`: `'draft' | 'pending' | 'approved' | 'rejected'`（默认 `draft`）。
  - `visibility`: `'private' | 'workspace' | 'org'`（默认 `private`）。
  - `submittedBy` / `reviewedBy`（userId，nullable）、`reviewedAt`、`reviewNote`（nullable text）。
- 文件：`database/entities/CustomTemplate.ts` + 四库迁移。
- 验收：旧数据迁移后 `status='approved'`/`visibility='private'`（不破坏存量）。

### C2. 状态机 + 审核端点
- 要做：
  - `POST /templates/:id/submit`（draft→pending，作者）。
  - `POST /templates/:id/review { action: approve|reject, note }`（pending→approved/rejected，需 RBAC 权限 `templates:review`，挂 `iam/middleware` 的 `checkPermission`）。
  - 列表按 `visibility` + workspace/org 过滤：成员只见 approved + 自己的 draft。
- 文件：`services/marketplaces`/`custom-template` 服务 + 路由；权限点接 `packages/server/src/iam`。
- 验收：状态流转单测；越权审核被 403（单测）。

### C3. UI
- 要做：模板列表加状态徽章、"提交审核"按钮；管理员"待审核"队列（批准/驳回 + 备注）。
- 文件：`packages/ui/src/views/` 模板相关视图 + `api`。
- 验收：preview 真机走通 提交→审核→可见；i18n 中英覆盖。

> C 项工作量约 **1–1.5 人周**。可与 B 并行（不同模块、不同 worktree）。

---

## D. 里程碑与排期

| 里程碑 | 内容 | 估时 | 依赖 |
| --- | --- | --- | --- |
| M1 | A 全部（看板 + 拦截测试） | 3–5 人日 | 无（引擎已就位） |
| M2 | B1–B2 触发器收口 + 统一日志 | ~1 人周 | 无 |
| M3 | C 模板审核（可与 M2 并行） | 1–1.5 人周 | 无 |
| M4 | B3–B5 错误兜底 + 重跑 | 2–3 人周 | M2（统一日志） |

**关键路径**：M2 → M4（错误兜底依赖触发/执行日志统一）。M1、M3 可并行插入。
**总估**：约 **5–7 人周**（单人）；A/C 先行可两周内见可演示成果。

---

## E. 全局红线 / 测试矩阵

- **执行器热路径（B3/B4）**：新配置默认关闭，开启才走新逻辑；必须有"默认关闭=行为不变"的回归测试。
- **配额绕过（A3）**：必须有"超额被拦截"测试证据（沿用 `计量统一` 红线）。
- **不复活 BillingService 计量**：A 一切走 `quotaUsage.ts`/Entitlement。
- **四库迁移**：B1/B2/B4/C1 凡加列均四库同步；存量数据回填默认值不破坏。
- **RBAC**：C2 审核动作挂 `iam` 权限点，不走 `enterprise/**` 直引（遵守 IAM 收口纪律，见 `docs/iam-seam-ledger.md`）。
- **门禁**：每任务提交前 `tsc --noEmit` 0 / `jest` 全绿 / fork-gate / `pnpm build`（server）/ UI build；前端项真机 preview 截图；Codex trailer；不自合 main，留人工 review。
- **登记**：核心文件改动写 `FORK-CHANGES.md`（分类：`Trigger` / `Usage` / `Template`）。

---

## F. 明确不在本波（留后续）

- 多渠道发布（飞书/企微/钉钉）→ Wave 2（B4 告警已留 webhook 接口对接）。
- 断点续跑（需中间态快照）→ Wave 3。
- 表达式编辑器、终端用户长期记忆、评测闭环 → Wave 3。
- 模型统一管控、RAG 检索调试、简易模式 → Wave 2。
