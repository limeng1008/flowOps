# FlowOps 工作流数据处理增强（借鉴 Dify）· Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**过门禁再提交；任何门禁失败停下报告，不要猜改核心。**
> 背景：对标 Dify 后发现 FlowOps 的 AgentflowV2 缺三类「工作流数据处理」节点，导致复杂编排难搭。本任务**纯新增** 3 个 AgentflowV2 节点（加法化、零风险、不改核心）：
>
> -   **T1 · 参数提取器（Parameter Extractor）** —— 从自然语言提取结构化字段（喂工具/HTTP/表单）。对标 Dify `parameter-extractor`。
> -   **T2 · 列表操作器（List Operator）** —— 对数组做过滤/排序/切片/取字段。对标 Dify `list-operator`。
> -   **T3 · 模板转换（Template Transform）** —— 用模板把变量拼成文本。对标 Dify `template-transform`。
>
> ⚠️ FlowOps 已有 `ConditionAgent`（≈Dify 问题分类器）、`CustomFunction`、`HTTP`、`Tool`，**别重复造**。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`；**Node 20**（`nvm use 20`，系统默认 22）。组件包 `packages/components`。
-   从 **`main`** 切分支 **`codex/dify-workflow-nodes`** 工作。**不要 push、不碰 main**，做完留人工 review。
-   **无新依赖**（用 Node 内置 + components 已有的；模板渲染先 `grep -rn "handlebars\|mustache" packages/components/package.json` 看有没有现成引擎，有就用、没有就用纯 JS `{{ var }}` 正则替换，**不要 `pnpm add`**）。

### 0.2 ✅ 参考范式（先读，照抄结构 —— 别凭印象）

-   **LLM 型 agentflow 节点范式（T1 照它）**：`packages/components/nodes/agentflow/ConditionAgent/ConditionAgent.ts`。看它的 `class XXX_Agentflow implements INode`、`label/name/version/type/category: 'Agent Flows'/baseClasses/color`、`inputs`（`Model` 用 `type: 'asyncOptions'` + `loadMethod`；`Instructions`/`Input` 用 `type: 'string'`；数组用 `type: 'array'` + `array: [...]`）、`async run()`。
-   **结构化输出复用（T1 核心）**：`packages/components/nodes/agentflow/LLM/LLM.ts` 里的 `llmStructuredOutput` 输入定义 + `configureStructuredOutput(llmNodeInstance, _llmStructuredOutput)` 调用（约 line 183 / 455）。**T1 的参数 schema 要转成这套结构化输出格式，复用同一条 LLM 出 JSON 的链路，别自己手写 prompt 硬解析。**
-   **纯 JS 处理节点范式（T2/T3 照它）**：`packages/components/nodes/agentflow/CustomFunction/CustomFunction.ts`。看它 `Input Variables`(array) + 处理 + 输出的写法、怎么从 `nodeData.inputs` 取值、怎么返回结果对象。
-   **节点最终形态以这三个实际文件为准**（baseClasses / 返回结构 / flow state 更新方式）；拿不准停下报告。
-   **图标**：agentflow 节点图标走前端 type→ 图标映射，**先看 ConditionAgent/CustomFunction 有没有独立 svg**：有就照加一个简洁 svg，没有就沿用它们的方式（别另起一套）。

### 0.3 ⚠️ 铁律

-   **只新增** `nodes/agentflow/<Dir>/*`，**不改核心、不改既有节点**。
-   节点 `label`/`description` 用**英文**（如 `'Parameter Extractor'`），中文翻译走前端字典 `packages/ui/src/i18n/nodeI18n.js`（`nodeLabelMap` + `nodeDescriptionMap` 各加一条），**与现有上游节点一致**，别在 TS 里写中文 label。
-   注释里**别出现 `*/`**（会提前闭合块注释，踩过）；husky 跑 prettier+eslint。
-   容错优先：输入不是预期类型（非数组/非 JSON）时**给清晰提示、不抛崩**；LLM 提取失败时按配置兜底（返回 null + 标记），不要让整条 flow 挂掉。
-   **新增节点 = 必须 `pnpm --filter flowise-components build` 进 dist + 重启后端才能在画布看到**（踩过的坑：源码提交但没 build dist，节点不显示）。报告里写明这一步。

---

## 1. T1 · 参数提取器（Parameter Extractor）

**目录** `packages/components/nodes/agentflow/ParameterExtractor/`，文件 `ParameterExtractor.ts` + `ParameterExtractor.test.ts`（+ 按 0.2 决定是否加 svg）。

-   `label: 'Parameter Extractor'`、`name: 'parameterExtractorAgentflow'`、`type: 'ParameterExtractor'`、`category: 'Agent Flows'`、`version: 1.0`、自选 color。
-   **inputs**：
    -   `Model`（`asyncOptions`，照 ConditionAgent 的 `conditionAgentModel`，同 loadMethod 拉模型列表）。
    -   `Input`（`string`，要提取的文本，默认可引用 `{{ question }}`）。
    -   `Parameters`（`type: 'array'`，每项：`Name`(string) / `Type`(options: `string`/`number`/`boolean`/`array`) / `Description`(string，告诉 LLM 这个字段是什么) / `Required`(boolean)）。
    -   `Instructions`（`string`，optional，额外提取指引）。
    -   （可选）`Enable Memory` —— 有余力再加，先把无记忆版做扎实。
-   **run 逻辑**：
    1. 把 `Parameters` 数组转成结构化输出 schema（对齐 LLM.ts `llmStructuredOutput` 的格式：name/type/description/required）。
    2. 复用 `configureStructuredOutput` 让所选 Model 以 JSON schema 输出。
    3. 调 LLM，拿到结构化对象 → 作为本节点输出（写进 flow state，下游可 `{{ parameterExtractor.<name> }}` 引用 —— 具体引用方式以 ConditionAgent/LLM 输出写法为准）。
    4. 缺 `Required` 字段或解析失败 → 该字段置 `null` 并在输出里标记 `_extractionError`，**不抛**。
-   **outputs**：单输出（结构化对象）。
-   **测试**：`jest.mock` 掉 LLM（或注入假 model 实例），喂结构化返回 → 断言提取出正确字段/类型；缺 required → 兜底为 null + 标记；非法 LLM 返回 → 不抛、给提示。

## 2. T2 · 列表操作器（List Operator）

**目录** `packages/components/nodes/agentflow/ListOperator/`，文件 `ListOperator.ts` + `ListOperator.test.ts`。

-   `label: 'List Operator'`、`name: 'listOperatorAgentflow'`、`type: 'ListOperator'`、`category: 'Agent Flows'`、`version: 1.0`。
-   **inputs**：
    -   `Input Array`（`string`，接受 JSON 数组字符串或上游数组引用）。
    -   `Operation`（options：`filter` / `sort` / `slice` / `extractField` / `limit`）。
    -   按 `Operation` 用 `show` 显隐各自参数：
        -   filter：`Filter Field`(string) + `Operator`(options: equals/notEquals/contains/gt/lt) + `Value`(string)
        -   sort：`Sort Field`(string) + `Order`(options: asc/desc)
        -   slice：`Start`(number) + `End`(number)
        -   extractField：`Field`(string)（取每个元素的某字段，得到值数组）
        -   limit：`Count`(number)
-   **run 逻辑**：解析 `Input Array`（JSON.parse 容错；已是数组直接用）→ 按 Operation 处理 → 输出数组。**非数组 → 返回空数组 + 提示**，不抛。
-   **测试**：5 个 operation 各一条正确性用例 + 非数组容错 + 空数组。

## 3. T3 · 模板转换（Template Transform）

**目录** `packages/components/nodes/agentflow/TemplateTransform/`，文件 `TemplateTransform.ts` + `TemplateTransform.test.ts`。

-   `label: 'Template Transform'`、`name: 'templateTransformAgentflow'`、`type: 'TemplateTransform'`、`category: 'Agent Flows'`、`version: 1.0`。
-   **inputs**：
    -   `Template`（`type: 'code'` 或 `'string'`，rows 多行，支持 `{{ varName }}` 占位）。
    -   `Variables`（`type: 'array'`，每项 `Name`(string) + `Value`(string)）。
-   **run 逻辑**：用现有模板引擎（见 0.1，handlebars 有就用）或纯 JS：把 `{{ name }}` 替换为对应 Value，未匹配的占位留空或保留（择一，注释说明）。输出渲染后字符串。**模板/变量为空 → 返回空串 + 提示**。
-   **测试**：基本渲染、多变量、缺变量兜底、特殊字符不破坏。

## 4. i18n（前端中文字典，必做）

在 `packages/ui/src/i18n/nodeI18n.js`：

-   `nodeLabelMap` 加：`'Parameter Extractor': '参数提取器'`、`'List Operator': '列表操作器'`、`'Template Transform': '模板转换'`，以及各 input 的 label（如 `'Parameters': '参数'`、`'Operation': '操作'`、`'Template': '模板'` 等，**已存在的别重复加**，会被 husky/eslint 的重复键门禁拦）。
-   `nodeDescriptionMap` 加三个节点 description 的中英映射。
-   若 `nodeI18n.js` 有配套测试（`grep -rn "nodeLabelMap" packages/ui/src/i18n/*.test.js`），跑通。

## 5. 验收（DoD）

-   `cd packages/components && npx tsc --noEmit` = **0 错**。
-   `npx jest ParameterExtractor ListOperator TemplateTransform` 全过。
-   `pnpm --filter flowise-components build` 通过（3 个节点 + 可能的 svg 进 `dist/`）。
-   `cd packages/ui && pnpm build` 过（i18n 字典改动不破坏前端）。
-   报告里写「待人工真机验证」：`pnpm --filter flowise-components build` + 重启后端后，三个节点出现在画布 **Agent Flows** 分类，能拖入、连线、运行。
-   三个节点各一个 commit（或合并一个），message 形如 `feat(components): 新增「参数提取器/列表操作器/模板转换」AgentflowV2 节点（借鉴 Dify）`，结尾 `Co-Authored-By: Codex <noreply@openai.com>`。

## 6. 范围边界（别越界）

-   **只做这 3 个数据处理节点**；触发器(webhook/定时)、标注回复、混合检索/父子分块 RAG 是**更大的独立任务，本次不碰**。
-   不改核心执行链路、不改既有节点、不加新依赖。
-   拿不准（尤其结构化输出复用、flow state 输出引用方式、模板引擎选型）**停下报告**，不要猜改核心。
