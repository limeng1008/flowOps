# FlowOps 节点使用手册(中文 · 原创 · 基于代码)· Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**文档任务,纯文字+截图位,不改任何代码。**
>
> 背景:FlowOps 已有《docs/guide/FlowOps-使用说明.md》(475 行,含整体流程/场景/FAQ/19 张截图清单),但缺**逐节点的中文使用说明**。本计划补一份详细的中文节点手册,面向**非技术用户**(业务/运营)。

---

## 0. ⚠️ 版权铁律(最重要,违反 = 法律风险 + 自毁清洁室努力)

1. **绝对禁止引用、翻译、改写 `docs.flowiseai.com` 或任何 Flowise 官方文档/网站/README 的文字。** 整篇翻译官网 = 制作衍生作品 = 版权侵权;FlowOps 是要**售卖**的产品(私有化 + cloud),文档里混入翻译的官网内容会埋侵权点,且违背项目一路坚守的清洁室原则。
2. **合法素材只有两个**:
    - ① **节点源码**:每个节点的 `label` / `description` / `inputs`(name/type/options/默认值)——这些是**软件功能事实**,不受版权保护。位置 `packages/components/nodes/<类>/<节点>/*.ts`。
    - ② **已有中文翻译** `packages/ui/src/i18n/nodeI18n.js`(908 条,`nodeLabelMap` + `nodeDescriptionMap` + input label,之前 verbatim 从源码翻译的)。
3. **文字必须原创**:基于"这个节点做什么、有哪些参数、怎么配、和谁搭配"组织成自己的中文表达。可以陈述功能事实,**不得照搬任何外部文档的句子结构/教程措辞/示例文案**。
4. 拿不准某段算不算抄官网 → 不写,停下报告。

---

## 1. 环境 / 分支

-   仓库根对应 worktree;从 **`main`** 切分支 **`codex/user-guide-nodes`**。不 push、不碰 main。
-   纯文档:**不改任何 `.ts/.js/.jsx` 代码**(`git diff` 只应有 docs/ 下的 .md)。
-   commit 结尾 `Co-Authored-By: Codex <noreply@openai.com>`。

## 2. 产出物

新建 **`docs/guide/节点手册.md`**(节点详解独立成文,避免主手册过长);在主手册《FlowOps-使用说明.md》的「核心能力」处加一句指引链接到节点手册(不重复内容)。

## 3. 覆盖范围(聚焦,别贪全 421 个节点)

逐节点写中文说明。**只写下面两组**(上游通用节点有官方英文文档,不在本次范围,避免重复 + 控制工作量):

### 3.1 FlowOps 二开新增节点(必写,这是用户在别处找不到的)

-   **国产大模型(chatmodels)**:ChatZhipuAI(智谱)、ChatQwen(通义千问)、ChatDoubao(豆包)、ChatMoonshot(Kimi)、ChatMinimax、Deepseek。
-   **国产向量/嵌入(embeddings)**:EmbeddingZhipu、EmbeddingQwen、EmbeddingSiliconflow(硅基流动)。
-   **国产云向量库(vectorstores)**:BaiduVectorDB(百度)、DashVector(阿里)、TencentCloudVectorDB(腾讯)、VikingDB(火山)。
-   **数据处理(agentflow,借鉴 Dify)**:ParameterExtractor(参数提取器)、ListOperator(列表操作器)、TemplateTransform(模板转换)。
-   **导出(agentflow)**:DocumentExport(文档导出)、SpreadsheetExport(表格导出)、PptxExport(PPT 导出)。
-   **内容安全(moderation)**:ContentSafetyModeration(内容安全审核)。
-   **触发器**(非节点,是 Start 节点能力):定时触发(schedule)+ Webhook 触发——按现有手册已有的触发器章节补充节点级说明。

### 3.2 高频核心节点(必写,用户最常用)

-   **AgentFlow V2 骨架**:Start、Agent、LLM、Condition / ConditionAgent、Tool、Loop / Iteration、DirectReply、HumanInput。
-   **知识库 RAG 链路**:Document Store(文档库)上传/分块/Upsert、Retriever、向量库基础用法。
-   **工具 Tools**:常用工具节点(HTTP、自定义工具等)。

> 其余上游通用节点(各种 LLM/embedding/vectorstore/loader 等)**本次不逐个写**;可在手册开头说明"通用节点参考画布内每个节点的中文说明气泡"。

## 4. 每个节点的写法模板(统一)

```md
### 节点中文名(英文 name)

**做什么**:一句话功能(基于 description,原创表达)。

**什么时候用**:典型场景 1-2 个。

**关键参数**:

| 参数(中文)                           | 说明         | 必填  |
| ------------------------------------ | ------------ | ----- |
| …(取自 inputs 的 label/type/options) | 原创中文解释 | 是/否 |

**怎么配**:3-5 步操作(基于实际 UI 流程,原创)。

**搭配谁用**:常见上下游节点。

![节点名 截图](images/node-<英文name>.png) <!-- 截图位,留空待补 -->
```

## 5. 截图位 + 清单

-   每个节点末尾留一个截图占位 `![...](images/node-<name>.png)`(图先不放,人工/后续用 preview 工具补)。
-   在节点手册末尾加「节点截图清单」表(文件名 / 拍哪个节点配置面板 / 标注要点),格式照《FlowOps-使用说明.md》末尾现有的 19 张清单。

## 6. 验收(DoD)

-   `docs/guide/节点手册.md` 产出;3.1 全部二开节点 + 3.2 核心节点逐个覆盖,每个按 §4 模板。
-   **版权自检**:`grep -ri "flowiseai.com\|docs.flowise" docs/guide/节点手册.md` = 0;无任何照搬外部文档的痕迹(文字原创,基于代码+nodeI18n)。
-   截图位齐全(每节点一个 `images/node-*.png` 占位)+ 末尾截图清单。
-   `git diff` 只含 docs/ 下 .md(零代码改动)。
-   markdown 通顺、术语与 nodeI18n.js 中文一致(同一节点中英文名对得上)。
-   一个 commit:`docs(guide): 中文节点使用手册(二开+核心节点,基于代码原创,预留截图位)`。

## 7. 边界

-   不碰代码、不碰官网文档、不写全 421 节点、不放真实截图(只留位)。
-   术语对齐 `nodeI18n.js`(别自造与 UI 不一致的中文名)。
-   拿不准节点功能 → 读该节点源码的 `description`/`inputs` 确认,仍不确定就标「待人工确认」,不臆造。
