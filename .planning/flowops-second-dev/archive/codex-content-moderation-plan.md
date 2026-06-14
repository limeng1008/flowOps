# FlowOps 内容安全审核节点 · Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**过门禁再提交；任何门禁失败停下报告，不要猜改核心。**
> 目标：新增「内容安全审核」节点（可靠性护栏第一块）——给 LLM 流程的输入/输出做合规审核，命中敏感内容可拦截/脱敏/记录。中国企业上线生成式 AI 的合规强制项。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`；**Node 20**（`nvm use 20`）。
-   在分支 **`feat/content-moderation`** 上工作。**不要 push、不碰 main**，做完留人工 review。
-   **无新依赖**（axios / crypto / zod 都已在 components 里），别用 `pnpm add`。

### 0.2 ✅ 参考范式（先读，照抄结构）

-   **审核节点基类与接口**：`packages/components/nodes/moderation/Moderation.ts`（抽象类 `Moderation`，核心方法 `checkForViolations(input: string): Promise<string>` —— 返回净化后的文本，或在违规时 `throw` 配置的提示语）。
-   **节点 + Runner + svg 的写法**：`packages/components/nodes/moderation/SimplePromptModeration/`（`SimplePromptModeration.ts` 节点 + `SimplePromptModerationRunner.ts` 运行器 + `moderation.svg`）。**照它的 baseClasses / category / init 返回 runner 的结构来写**（去文件里读，别凭印象）。
-   **多模式 + 凭证 + mock + jest 的写法**：参考 FlowOps 已有连接器 `packages/components/nodes/tools/CustomerServiceQuery/`（示例/HTTP 双模式 + 可选凭证 + axios mock 测试）与 `HumanHandoff/`。

### 0.3 ⚠️ 铁律

-   只新增 `nodes/moderation/<Dir>/*` + 新增 1 个 credential 文件。**不改核心、不改既有节点。**
-   节点的 baseClasses/接口**以 `Moderation.ts` 与 `SimplePromptModeration.ts` 实际为准**；拿不准停下报告。
-   注释别出现 `*/`（会提前闭合块注释）。

---

## 1. T1 · 内容安全审核节点

-   目录 `packages/components/nodes/moderation/ContentSafetyModeration/`，文件：
    -   `ContentSafetyModeration.ts`（节点，`implements INode`，`category: 'Moderation'`，`baseClasses` 含 `'Moderation'`——以 SimplePromptModeration 实际为准；`init()` 返回 Runner 实例）
    -   `ContentSafetyModerationRunner.ts`（`extends Moderation`，实现 `checkForViolations`）
    -   `contentsafety.svg`（盾牌类图标）
    -   `ContentSafetyModeration.test.ts`
-   label：`内容安全审核`；name：`contentSafetyModeration`（最终以不与现有冲突为准）。
-   **凭证**（可选）：新增 `packages/components/credentials/ContentSafetyApi.credential.ts`，name `contentSafetyApi`，一个 password 字段（HTTP 模式调外部审核接口时的 `Authorization` 头值）。仅 HTTP 模式需要，节点 `credential` 设 `optional: true`。

### inputs（节点配置）

-   `moderationMode`（options）：
    -   `local` 本地词库/正则（离线，信创友好，**默认**）
    -   `http` 调用内容安全接口（填你自己的/阿里云·腾讯天御·网易易盾经内网代理的审核接口）
    -   `mock` 示例数据（免后端演示）
-   `sensitiveWords`（string, rows:4, `show: { moderationMode: 'local' }`, optional）：敏感词，逗号或换行分隔
-   `customRegex`（string, optional, `show: local`）：自定义正则（可选）
-   `apiUrl`（string, `show: { moderationMode: 'http' }`, optional）：审核接口地址（POST 文本）
-   `onViolation`（options）：命中后动作 —— `block` 拦截（默认）/ `mask` 脱敏替换 / `passLog` 放行仅记录
-   `moderationErrorMessage`（string, optional, default：`您的内容包含敏感信息，已被拦截。`）：拦截时返回/抛出的中文提示

### Runner.checkForViolations(input) 逻辑

1. 按 `moderationMode` 检测是否命中、命中了哪些词/片段：
    - `local`：把 `sensitiveWords` 切成词表，对 input 做包含匹配；若有 `customRegex` 再跑正则。收集命中项。
    - `http`：`axios.post(apiUrl, { text: input }, { headers: 鉴权 })`；按返回判断风险（约定：响应含 `{ risk: true|'high'|... }` 或 `{ label: 'block' }` 视为命中；解析要宽松容错，拿不准当未命中并在内容里说明）。网络异常**安全失败**（默认放行 + 不抛，避免审核挂了把整个流程堵死；可在注释说明此权衡）。
    - `mock`：内置一小撮示例敏感词（如 `测试敏感词`、`违禁`）演示命中。
2. 按 `onViolation`：
    - 未命中 → 返回原 `input`。
    - `block` → `throw new Error(moderationErrorMessage)`（与现有 moderation 一致，由链路兜住）。
    - `mask` → 把命中词替换为 `***`，返回净化后的文本。
    - `passLog` → 返回原 `input`（仅放行；命中信息可 console.warn 记录）。

> 说明：Flowise Chatflow 的「输入审核(Input Moderation)」槽接受 `baseClasses` 含 `Moderation` 的节点——本节点即可直接挂进去（用户的「AI 客服」chatflow 正好有这个槽）。

## 2. 测试（`ContentSafetyModeration.test.ts`）

-   直接构造 Runner（或经 node.init 拿 runner），覆盖：
    -   local 命中 + `block` → `checkForViolations` 抛出含提示语的错误
    -   local 命中 + `mask` → 返回把命中词替换为 `***` 的文本
    -   local 未命中 → 原样返回
    -   `customRegex` 命中
    -   mock 模式命中内置词
    -   http 模式：`jest.mock('axios')`，返回风险 → 命中按 onViolation 处理；网络异常 → 安全放行不抛
    -   节点形态：category `Moderation`、baseClasses 含 `Moderation`、凭证 optional

## 3.（可选 T2）AgentflowV2 内联审核节点

若有余力：在 `nodes/agentflow/` 加一个 `run()` 式「内容安全审核」节点，用于 AgentflowV2 流程里对上游文本做审核后再往下传（复用 Runner 逻辑）。**先把 T1 做完过门禁，再评估 T2，别一起塞。**

## 4. 验收（DoD）

-   `cd packages/components && npx tsc --noEmit` = 0
-   `npx jest ContentSafetyModeration` 全过
-   `pnpm --filter flowise-components build` 过（节点 + svg 进 dist；凭证进 dist）
-   节点出现在 Moderation 分类、可挂 Chatflow 输入审核槽（报告里写"待人工真机验证"）
-   全在 `feat/content-moderation`、未并 main、单独 commit（`feat(components): 新增「内容安全审核」节点（本地词库/HTTP接口/示例，拦截/脱敏/记录）`，结尾 `Co-Authored-By: Codex <noreply@openai.com>`）
