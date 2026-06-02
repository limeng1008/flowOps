# FlowOps 中国本地化 · Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**逐任务执行，每个任务一个 commit，过验证门禁后再做下一个；任何门禁失败或无法确认的外部信息（如模型端点），停下并报告，不要猜着改核心。**

---

## 0. 须知（必读，每个任务都适用）

### 0.1 仓库与环境

-   仓库根：`/Volumes/project/Flowise`（pnpm + Turbo monorepo）。
-   **Node 必须 20**：每个 shell 先 `nvm use 20`（系统默认是 22，会让 sqlite3/faiss-node 等原生模块炸）。
-   包：`packages/ui`(前端) `packages/server`(后端) `packages/components`(节点生态)。
-   远端：`origin`=私有库（push 目标），`upstream`=FlowiseAI（只 fetch）。
-   **在新分支工作**：`git switch -c feat/cn-localization main`。**不要 push、不要碰 main**，做完留给人工 review。

### 0.2 最高纪律：只做加法，不改核心

**严禁修改**以下（改了会让上游升级合并地狱化）：

-   节点加载 `packages/server/src/NodesPool.ts`
-   执行链路 `buildChatflow`/`buildAgentflow`/prediction/queue worker/SSE
-   核心 DB entities/migrations 的既有字段语义
-   `IdentityManager`、RBAC、license/features
-   任何既有官方节点的源码（要改行为就新增节点，不要原地改）

**允许且优先**：新增文件/目录（节点、credential、provider helper、locale、脚本、文档）。必须改的既有文件（如 `modelLoader.ts`、`models.json` 的替代、主题、i18n）要**最小化并登记进 `FORK-CHANGES.md`**（见 T5）。

### 0.3 参考范式（照抄结构，别另起炉灶）

已有一个完整的国产模型节点可作模板——**先通读这 5 个文件**：

-   节点：`packages/components/nodes/chatmodels/ChatZhipuAI/ChatZhipuAI.ts`
-   节点测试：`packages/components/nodes/chatmodels/ChatZhipuAI/ChatZhipuAI.test.ts`
-   图标：`packages/components/nodes/chatmodels/ChatZhipuAI/zhipu.svg`
-   通用 OpenAI 兼容字段构造器：`packages/components/src/model-providers/openAICompatible.ts`
-   拉活模型列表范式：`packages/components/src/model-providers/zhipu.ts`
-   凭证：`packages/components/credentials/ZhipuAIApi.credential.ts`

设计依据见 `.planning/flowops-second-dev/`：`china-2kai-plan.md`、`upstream-merge-strategy.md`。

### 0.4 验证命令（每个任务结束必须跑）

-   组件类型检查：`cd packages/components && npx tsc --noEmit`（必须 0 error）
-   组件单测：`cd packages/components && npx jest <相关测试名>`（全过）
-   前端构建（涉及 UI 时）：`pnpm --filter flowise-ui build`
-   前端 i18n 测试（涉及 i18n 时）：`pnpm --filter flowise-ui test`

### 0.5 提交规范

-   每个任务一个 commit；commit 前会触发 husky（prettier + eslint --fix）。
-   **eslint 会因重复对象 key、lint error 而拒绝提交**——locale/对象字面量不要写重复 key。
-   commit message 末尾加：`Co-Authored-By: Codex <noreply@openai.com>`

### 0.6 外部信息须核实

下文给出的**模型端点 / base URL / 模型名是 2026-06 的最佳已知值，但各厂商常变**。每个 provider 编码前，**先查该厂商官方"OpenAI 兼容接口"文档确认** base URL、鉴权头、模型名；对不上就以官方为准并在 commit 里注明。无法确认的（下表标 ⚠️）优先做能确认的，存疑的停下报告。

---

## 1. 任务总览（按依赖顺序）

| #   | 任务                                   | 产出                                                            | 依赖  | 验收                                                   |
| --- | -------------------------------------- | --------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| T1  | models.flowops.json 机制               | 我方模型条目从 `models.json` 迁到独立文件，加载期合并           | —     | tsc 0 错；modelLoader 测试过；chatZhipuAI 仍出现在下拉 |
| T2  | 国产 chat 模型节点（批量）             | Kimi/豆包/通义/MiniMax(+扩展) 节点                              | T1    | 每节点 tsc 0 错 + jest 过                              |
| T3  | 中文 embedding 节点                    | 智谱/通义/SiliconFlow + 本地 兼容 embedding                     | T1    | tsc + jest 过                                          |
| T4  | 主题 override 降级                     | FlowOps 主题抽到独立 scss，缩小对上游 `_themes-vars` 的内联改动 | —     | `pnpm --filter flowise-ui build` 过；主题视觉不变      |
| T5  | FORK-CHANGES.md 账本 + divergence 脚本 | 改动账本 + 一个比对脚本                                         | T1–T4 | 脚本可跑，列出所有"修改(非新增)"文件                   |
| T6  | i18n 硬化（codemod + 审计）            | 重放 codemod + 补齐残留英文页                                   | —     | i18n 测试过；codemod 幂等；UI 构建过                   |

> 体量较大，建议 T1→T2→T3→T4→T5→T6 顺序推进，**每任务独立 commit、独立验证**。T4/T6 与 T1–T3 无耦合，可调换。

---

## 2. 任务详述

### T1 · models.flowops.json 加载期合并机制

**目的**：现在我方的 `chatZhipuAI` 模型条目是直接追加进上游 `packages/components/models.json`（T3 内联改，升级易冲突）。改成：上游 `models.json` 保持原样（pristine），我方条目放独立文件，加载时合并。

**步骤**：

1. 新建 `packages/components/models.flowops.json`，结构同 `models.json`（顶层 `chat`/`llm`/`embedding` 三个数组）。把现存于 `models.json` 里的 `chatZhipuAI` 那段**移动**到这里。
2. 还原 `packages/components/models.json`：删掉我方追加的 `chatZhipuAI` 段，使其与 `upstream/main` 一致（可 `git show upstream/main:packages/components/models.json` 对照）。
3. 改 `packages/components/src/modelLoader.ts`：在读取 `models.json` 后，若同目录存在 `models.flowops.json`，按 category 合并（同名 provider 以 flowops 覆盖，新 provider 追加）。保持现有"本地优先、URL 兜底"逻辑不变。
4. 更新/新增 `modelLoader.test.ts`：断言 flowops 文件里的 provider 能出现在对应 `getModels(...)` 结果中。

**验收**：`cd packages/components && npx tsc --noEmit` 0 错；`npx jest modelLoader` 过；`getModels(MODEL_TYPE.CHAT,'chatZhipuAI')` 仍返回模型。
**commit**：`refactor(components): 模型列表改为 models.json + models.flowops.json 加载期合并（降低上游冲突）`

---

### T2 · 国产 chat 模型节点（批量）

**对每个 provider**，照 `ChatZhipuAI` 范式新增（全是新文件，零改核心）：

1. `packages/components/nodes/chatmodels/Chat<Name>/Chat<Name>.ts`——复制 ChatZhipuAI.ts，改 `label`(中文)/`name`/`type`/`icon`/`credentialNames`，`init()` 里 `providerBaseURL` 换成该厂端点，复用 `buildOpenAICompatibleChatFields`。
2. 图标 `packages/components/nodes/chatmodels/Chat<Name>/<name>.svg`（无官方矢量就放一个简洁占位 svg）。
3. 凭证 `packages/components/credentials/<Name>Api.credential.ts`（照 `ZhipuAIApi.credential.ts`）。
4. `models.flowops.json` 的 `chat` 数组加该 provider 的 `name` + 常用模型列表（作为 asyncOptions 兜底）。
5. 若该厂支持 `/models` 拉活列表，可仿 `zhipu.ts` 加一个 `model-providers/<name>.ts`；否则 `listModels` 直接返回 `getModels(...)` 兜底即可。
6. 测试 `Chat<Name>.test.ts`（照 `ChatZhipuAI.test.ts`：节点元信息、兜底模型、传参给 ChatOpenAI）。

**首批（用户指定，先做）**：Kimi、豆包、通义、MiniMax。
**扩展批（再做）**：混元、百川、讯飞星火、阶跃、零一、SiliconFlow。

**Provider 参数表（2026-06 最佳已知，编码前务必核实官方"OpenAI 兼容"文档）**：

| label(中文)            | node name       | credential       | base URL（OpenAI 兼容）                                     | 示例模型                                                        | 备注                                                                        |
| ---------------------- | --------------- | ---------------- | ----------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Kimi (月之暗面)        | chatMoonshot    | moonshotApi      | `https://api.moonshot.cn/v1`                                | moonshot-v1-8k/32k/128k、kimi-latest                            | 标准兼容                                                                    |
| 豆包 (火山方舟)        | chatDoubao      | volcengineArkApi | `https://ark.cn-beijing.volces.com/api/v3`                  | doubao-pro-32k 等                                               | ⚠️ 可能要求用 endpoint id（ep-xxx）当模型名——`customModelName` 字段已可承接 |
| 通义千问 (Qwen)        | chatQwen        | dashScopeApi     | `https://dashscope.aliyuncs.com/compatible-mode/v1`         | qwen-max、qwen-plus、qwen-turbo、qwen2.5-72b-instruct           | 已有旧节点 `ChatAlibabaTongyi`，**不要改它**，新增独立 OpenAI 兼容节点      |
| MiniMax                | chatMinimax     | minimaxApi       | ⚠️`https://api.minimaxi.com/v1`（待核实，历史上需 GroupId） | abab6.5s-chat、MiniMax-Text-01                                  | ⚠️ 兼容性先核实                                                             |
| 混元 (腾讯)            | chatHunyuan     | hunyuanApi       | `https://api.hunyuan.cloud.tencent.com/v1`                  | hunyuan-pro/standard/turbo                                      |                                                                             |
| 百川 (Baichuan)        | chatBaichuan    | baichuanApi      | `https://api.baichuan-ai.com/v1`                            | Baichuan4、Baichuan3-Turbo                                      |                                                                             |
| 讯飞星火 (Spark)       | chatSpark       | sparkApi         | ⚠️`https://spark-api-open.xf-yun.com/v1`                    | 4.0Ultra、generalv3.5、spark-x1                                 | ⚠️ 核实                                                                     |
| 阶跃星辰 (StepFun)     | chatStepfun     | stepfunApi       | `https://api.stepfun.com/v1`                                | step-1-8k、step-2-16k                                           |                                                                             |
| 零一万物 (Yi)          | chatYi          | lingyiApi        | ⚠️`https://api.lingyiwanwu.com/v1`                          | yi-large、yi-medium                                             | ⚠️API 可能已调整，核实                                                      |
| 硅基流动 (SiliconFlow) | chatSiliconflow | siliconflowApi   | `https://api.siliconflow.cn/v1`                             | deepseek-ai/DeepSeek-V3、Qwen/Qwen2.5-72B-Instruct、THUDM/glm-4 | 聚合站，模型名带厂商前缀                                                    |

> DeepSeek 已有官方节点 `Deepseek`，不重复做。

**验收（每个节点）**：`cd packages/components && npx tsc --noEmit` 0 错；`npx jest Chat<Name>` 过。
**commit**：每个 provider 一个，如 `feat(components): 新增 Kimi(月之暗面) 聊天模型节点`

---

### T3 · 中文 embedding 节点

**先调研**：`packages/components/nodes/embeddings/OpenAIEmbeddingCustom`（及 `ChatOpenAICustom`）是否已支持自定义 base URL 指向国产/本地兼容端点。

-   若已支持：补 1 份"中文/本地 embedding 接入"说明 + 在 `models.flowops.json` 的 `embedding` 加常用模型预设即可，不重复造节点。
-   仍建议为**面向非技术用户**的主力国产 embedding 加专用节点（更好的中文 label/凭证/下拉）。

**做法**：仿 chat 侧，新增 `model-providers/openAICompatibleEmbedding.ts`（构造 OpenAIEmbeddings 字段 + base URL），再加节点：
| label | node name | credential | base URL | 模型 |
|---|---|---|---|---|
| 智谱 Embedding | embeddingZhipu | zhipuAIApi（复用） | `https://open.bigmodel.cn/api/paas/v4` | embedding-3 |
| 通义 Embedding | embeddingQwen | dashScopeApi（复用） | `https://dashscope.aliyuncs.com/compatible-mode/v1` | text-embedding-v3 |
| 硅基流动 Embedding | embeddingSiliconflow | siliconflowApi（复用） | `https://api.siliconflow.cn/v1` | BAAI/bge-large-zh-v1.5、BAAI/bge-m3 |
| 本地 Embedding (TEI/Xinference/Ollama) | embeddingLocalOpenAICompat | 可选/无 | 用户填 | 用户填（如 bge-m3） |

**验收**：`npx tsc --noEmit` 0 错 + 相关 jest 过。
**commit**：`feat(components): 新增中文/本地 OpenAI 兼容 embedding 节点`

---

### T4 · 主题 override 降级

**目的**：现在 FlowOps 主题色是直接内联改 `packages/ui/src/assets/scss/_themes-vars.module.scss`（约 26 行 T3）。尽量抽成独立覆盖文件，缩小对上游文件的内联改动面。

**步骤**：

1. 新建 `packages/ui/src/assets/scss/_flowops-vars.module.scss`，集中放 FlowOps 的色板 token。
2. 评估能否让既有引用改为读 `_flowops-vars`，从而把 `_themes-vars.module.scss` 还原到接近上游。
3. 若 scss module 机制导致无法干净覆盖：保留对 `_themes-vars` 的最小内联改动，但把改动集中、加注释标记块，并登记进 FORK-CHANGES.md。

**验收**：`pnpm --filter flowise-ui build` 通过；启动后主题视觉与现状一致（青/蓝玻璃拟态）。
**commit**：`refactor(ui): FlowOps 主题色抽离为 _flowops-vars 覆盖层`

---

### T5 · FORK-CHANGES.md 账本 + divergence 脚本

1. 新建仓库根 `FORK-CHANGES.md`：列出所有**修改(非新增)**的上游文件，每条含「文件 / 类别(T2 接入点 or T3 内联) / 原因 / 升级重放说明」。生成清单用：`git diff --diff-filter=M --name-only upstream/main...HEAD`。
2. 新建脚本 `scripts/fork-divergence.sh`：输出相对 `upstream/main` 的"新增/修改"文件统计，并把"修改集"与 `FORK-CHANGES.md` 登记的白名单比对，**白名单外出现新的修改文件就非零退出**（给 CI 当门禁用）。

**验收**：脚本可跑、输出正确统计；账本覆盖当前所有修改文件。
**commit**：`docs: 新增 fork 改动账本 FORK-CHANGES.md + divergence 比对脚本`

---

### T6 · i18n 硬化（codemod + 审计）

**背景**：UI 的 i18n 是内联 t() 包裹（约 92 个 view/组件，是 upstream 升级的头号冲突源）。**目标用户可能是非开发者，i18n 必须 100% 覆盖、不可裁剪范围**。所以要让全量 i18n 可低成本随上游升级重放。

1. **codemod**（`scripts/i18n-codemod/`，jscodeshift 或 babel）：以 `packages/ui/src/i18n/locales/zh.json`（及 nodeI18n/marketplaceI18n 等）为单一事实源，对给定 jsx 文件自动注入 `import { useTranslation }`、`const { t } = useTranslation()`、并把命中英文文案替换为 `t('key')`。要求**幂等**（已包裹的不重复包）；命中不了的输出报告供人工补。
2. **审计残留英文**：扫描 `packages/ui/src/views`、`ui-component` 里仍硬编码的英文 UI 文案，补进 locale 并包裹，目标真·100% 覆盖。先产出"残留英文清单"再逐个补。
3. 用法写进 `scripts/i18n-codemod/README.md`：上游合并把某 UI 文件改乱时，「取上游版该文件 → 跑 codemod 重新包 t()」即可，不必手解冲突。

**验收**：`pnpm --filter flowise-ui test`（i18n 覆盖测试）全过；codemod 对样例文件幂等；`pnpm --filter flowise-ui build` 过；残留英文清单已处理或留档。
**commit**：`feat(ui): i18n 重放 codemod + 残留英文审计补齐（全量覆盖可随上游升级）`

---

## 3. 完成定义（DoD）

-   所有任务在 `feat/cn-localization` 分支上，每任务独立 commit、各自验证门禁通过。
-   全程**未修改** 0.2 列出的核心文件；新增为主，必要内联改动全部登记进 `FORK-CHANGES.md`。
-   `cd packages/components && npx tsc --noEmit` 全绿；新增节点 jest 全过；`pnpm --filter flowise-ui build` 与 i18n 测试通过。
-   **不 push、不并入 main**，列出改动清单交人工 review。
-   任何 provider 端点无法核实、或任一门禁失败：停下，在报告里写清卡点，不要绕过 husky（`--no-verify`）或猜改核心。

## 4. （给委托者）如何把本计划交给 Codex

-   把 Codex 工作目录设为 `/Volumes/project/Flowise`，让它先读本文件与 0.3 列出的 5 个范式文件。
-   建议**按任务下发**（先只让它做 T1，验完再放 T2…），而不是一次性"全做完"——便于你逐个 review commit。
-   国产模型首批只要 Kimi/豆包/通义/MiniMax；其余 provider 视验证情况再放。
