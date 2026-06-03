# FlowOps Phase 2 · 行业模板市场 · Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**逐模板执行，每个模板一个 commit，过门禁再做下一个。**
> 目标：批量产出"开箱即用"的中文 AgentflowV2 行业模板，全部走已实战验证的「表单 → 国产 LLM → 结构化输出」范式。

---

## 0. 须知

### 0.1 环境与位置

-   仓库根 `/Volumes/project/Flowise`；**Node 20**（`nvm use 20`）。
-   市场模板目录：`packages/server/marketplaces/agentflowsv2/*.json`（**运行时直接从源码目录读，无需 build**）。
-   模板测试目录：`packages/server/src/services/marketplaces/*.test.ts`。
-   **在分支 `feat/cn-templates` 上工作**（`git switch feat/cn-templates`，没有就 `git switch -c feat/cn-templates main`）。**不要 push、不碰 main**，做完留人工 review。

### 0.2 ⚠️ 头号铁律：表单变量必须用 `$form.*`

AgentflowV2 的表单输入（Start 节点 `startInputType: "formInput"`）在 LLM 消息里**必须**这样引用：

```
<span class="variable" data-type="mention" data-id="$form.字段名" data-label="$form.字段名">{{ $form.字段名 }}</span>
```

**裸 `{{ 字段名 }}`（data-id="字段名"）会静默传空** → LLM 收不到表单值 → 输出空壳（实测踩过：营销文案曾输出 `campaignTheme:"需要提供具体的产品/服务信息", variants:[]`）。

-   `data-id` / `data-label` / `{{ }}` 三处都要带 `$form.` 前缀。
-   上游参考：`Human In The Loop.json`、`Deep Research With Subagents.json` 用的就是 `{{ $form.query }}`。

### 0.3 ⚠️ 第二铁律：结构测试绿 ≠ 运行对

-   每个模板必须配结构测试（见 0.5），且**测试里要带 `$form` 守卫**（能自动拦住裸变量错误）。
-   自动门禁过之后，**人工**还需在画布导入该模板、填表单真跑一次确认有真实输出（用免费的 `glm-4-flash`）。Codex 跑完把"待人工真机验证"列在报告里。

### 0.4 范式（照抄，别另起）

**唯一参考范式**（已实战验证）：`packages/server/marketplaces/agentflowsv2/营销文案生成智能体.json`
结构 = 3 节点 + 1 边：

1. `startAgentflow_0`（formInput：formTitle / formDescription / formInputTypes）
2. `llmAgentflow_0`（`llmModel: "chatZhipuAI"` + `llmModelConfig` + `llmMessages`[system+user, user 里用 `$form.*` mention] + `llmStructuredOutput`）
3. `stickyNoteAgentflow_0`（中文使用说明）
   边：start → llm。

**做法 = 复制 `营销文案生成智能体.json`，只改这些**，其余（节点 id、position、inputParams 这些 schema 数组、llmModelConfig 结构、edge）**原样保留**：

-   文件名（中文，即模板显示名）
-   `description`、`usecases`
-   start 节点 `inputs`: `formTitle` / `formDescription` / `formInputTypes`（表单字段）
-   llm 节点 `data.label`、`inputs.llmMessages`（system + user，user 用 `$form.*` 引用表单字段）、`inputs.llmStructuredOutput`（输出 schema）
-   sticky note `inputs.note`
-   模型保持 `chatZhipuAI` / `llmModelConfig.modelName: "glm-4.5"`（用户测试时可在画布换 `glm-4-flash` 免费）

### 0.5 测试范式（照抄）

参考 `packages/server/src/services/marketplaces/marketingCopyAgentTemplate.test.ts`。每个模板的测试**必须包含**：

-   校验 description/usecases/节点名/边数/表单字段名/llmModel=chatZhipuAI/结构化输出 key。
-   **`$form` 守卫（关键）**：
    ```ts
    expect(userContent).toContain('$form.')
    const mentioned = [...userContent.matchAll(/data-id="([^"]+)"/g)].map((m: any) => m[1].replace(/^\$form\./, ''))
    for (const v of mentioned) expect(formVars).toContain(v) // 每个 mention 去掉 $form. 后必须是已声明的表单字段
    ```

### 0.6 提交 & 门禁

-   每个模板：`cd packages/server && npx jest <模板测试名>` 必须过。
-   一个模板一个 commit：`feat(marketplace): 新增「<模板名>」AgentflowV2 中文模板`，结尾 `Co-Authored-By: Codex <noreply@openai.com>`。
-   husky 会跑 prettier+eslint；JSON 必须合法、无重复 key。

### 0.7 边界（不要做）

-   只新增 `marketplaces/agentflowsv2/*.json` + 对应测试。**不改核心、不改组件节点、不碰 UI**。
-   **不要造不存在的模型/provider**（教训：DeepSeek 没有 embedding 接口，曾误造被删）。模型一律用已存在的 `chatZhipuAI`。
-   长文本输入字段（会议原始记录等）用 `type: "string"` 表单项（单行但可粘贴），这是表单限制、可接受。

---

## 1. 本批要做的模板（4 个，form→LLM 范式）

> 每个给定：文件名 / usecases / 表单字段(camelCase name + 中文 label + type) / 系统提示词意图 / 结构化输出 key。提示词具体措辞 Codex 自拟，但**风格中文、专业、合规（不用「最/第一/国家级」等绝对化词）**。

### T1 报告生成智能体.json

-   usecases: `["Agent", "办公"]`
-   表单：`reportType`(报告类型) / `topic`(主题) / `audience`(汇报对象) / `keyPoints`(关键要点) / `period`(时间范围) string；`wordCount`(目标字数) number
-   系统提示词意图：资深职场报告撰写专家，擅长周报/月报/项目汇报/调研报告，结构清晰、重点突出、数据导向。
-   结构化输出：`title`(string) / `summary`(string) / `sections`(jsonArray: {heading, content, bullets[]}) / `nextSteps`(stringArray)

### T2 会议纪要整理智能体.json

-   usecases: `["Agent", "办公"]`
-   表单：`meetingTopic`(会议主题) / `attendees`(参会人) / `rawNotes`(原始记录/速记) / `meetingDate`(会议日期) string
-   系统提示词意图：专业会议纪要助手，从零散记录中提炼结论、决议、待办，不臆造未提及的信息。
-   结构化输出：`summary`(string) / `decisions`(stringArray) / `actionItems`(jsonArray: {task, owner, dueDate}) / `openIssues`(stringArray)

### T3 招聘 JD 生成智能体.json

-   usecases: `["Agent", "人力资源"]`
-   表单：`jobTitle`(岗位名称) / `department`(部门) / `responsibilities`(核心职责) / `requirements`(任职要求) / `level`(职级/经验) / `location`(工作地点) string
-   系统提示词意图：资深 HR，撰写有吸引力且合规的中文招聘 JD，避免就业歧视性表述。
-   结构化输出：`jobTitle`(string) / `summary`(string) / `responsibilities`(stringArray) / `requirements`(stringArray) / `niceToHave`(stringArray) / `benefits`(stringArray)

### T4 客户邮件起草智能体.json

-   usecases: `["Agent", "营销"]`
-   表单：`scenario`(邮件场景) / `recipient`(收件对象) / `keyPoints`(核心要点) / `tone`(语气) string；`variantCount`(草稿数量) number
-   系统提示词意图：专业商务邮件助手，按场景与语气起草中文商务邮件，礼貌、清晰、有明确下一步。
-   结构化输出：`variants`(jsonArray: {subject, body, signoff}) / `tips`(stringArray)

---

## 2. 每个模板的步骤

1. `cp 营销文案生成智能体.json <新文件名>.json`，按 0.4 + 第 1 节规格改 description/usecases/表单/提示词/输出/便签/label。
2. **user 消息里所有表单变量引用用 `$form.字段`**（0.2），且每个 `data-id="$form.X"` 的 X 必须出现在 `formInputTypes` 的某个 `name`。
3. 写测试（照 0.5，含 `$form` 守卫）。
4. `cd packages/server && npx jest <模板测试名>` → 过。
5. `node -e "JSON.parse(require('fs').readFileSync('<路径>','utf8'))"` 确认 JSON 合法。
6. commit（0.6）。
7. 下一个模板。

## 3. 验收（DoD）

-   4 个模板 + 4 个测试，全部 jest 过、JSON 合法。
-   每个模板：表单变量全 `$form.*`、mention 的 data-id 与表单字段一一对应、模型为 `chatZhipuAI`。
-   各自独立 commit，全在 `feat/cn-templates`，未 push、未并 main。
-   报告里列出"待人工真机验证"清单（每个模板在画布导入 + glm-4-flash 跑一次）。

## 4. 不在本批（单独任务）

-   **企业知识库问答（RAG）**：不是 form→LLM 范式，要用 `Simple RAG.json` 骨架（含向量库 + Retriever + 国产 embedding 节点），结构完全不同——**不要套本范式**，留作单独设计任务。
-   **合同审阅**：可选；同 form→LLM 范式但合同正文是长文本，效果待评估。
