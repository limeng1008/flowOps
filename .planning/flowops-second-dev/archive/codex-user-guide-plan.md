# FlowOps 功能使用说明文档（宣传页链接级）· Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。
> **这份文档会挂在产品宣传页的链接上，是门面，质量按"对外发布"标准做。**
> 目标：产出一份**中文、宣传级**的《FlowOps 功能使用说明》，把项目功能**逐项演示展现**，每个功能都有「是什么 / 解决什么 / 怎么用 / 截图 + 标注」。

---

## 0. 须知

### 0.1 环境 / 分支 / 产物

-   仓库根 `/Volumes/project/Flowise`。在分支 **`feat/user-guide`** 上工作，做完留人工 review，**不要 push、不碰 main**。
-   产物：
    -   `docs/guide/FlowOps-使用说明.md`（主文档，单文件，带目录 TOC）
    -   `docs/guide/images/`（截图目录，先放占位说明，图由人工后补）
    -   `docs/guide/README.md`（一句话说明 + 指向主文档 + 截图清单怎么补）
-   纯新增文件，不改 `packages/**` 任何代码，不改既有上游文件。

### 0.2 ⚠️ 准确性铁律（最重要）

**只写 FlowOps 真实存在的功能；所有节点名/凭证名/选项/模板名，一律打开源码文件按里面的 `label`/`name`/`options` 照抄，禁止凭印象或套用上游 Flowise 通用描述。** 拿不准就停下报告，别编。
真实功能与**取名出处**见 §3，先逐个读完再写。

### 0.3 受众与语气

-   受众：中国企业的**业务/非技术用户 + IT/开发者**。以中文为主、用词专业但好懂。
-   语气：产品功能展示 + 上手指引（不是干巴巴 API 手册）。每个能力先讲**价值/解决的痛点**，再讲**怎么用**。

---

## 1. 截图与标注约定（Codex 先把占位和标注文案写好，图由人工补）

-   每个需要图的地方，按下面格式插入（Codex 写占位 + 预写标注文案；人工后续把 png 放进 `images/`）：

```markdown
![功能名-场景](images/02-marketplace-use-template.png)

> 🏷 **图注**：① 左侧「应用市场」入口　 ② 选中「转人工客服智能体」卡片　 ③ 点「使用模板」进入画布
```

-   图片命名：`NN-area-action.png`（两位序号 + 区域 + 动作），如 `03-credential-zhipu.png`、`07-pptx-theme.png`。
-   文末附 **「截图拍摄清单」表**（见 §4 要求），列出每个文件名、拍哪个页面/操作、标注要点 —— 人工照着拍。
-   不要插入不存在的图链接到 README 之外的随机路径；所有图统一在 `docs/guide/images/`。

---

## 2. 文档结构（大纲，按"价值分组"而非菜单罗列）

主文档 `FlowOps-使用说明.md` 按此结构：

1. **FlowOps 是什么 · 为什么选它**（开篇价值主张：私有化部署 / 国产大模型 / 全中文 / 数据合规 / 信创友好 / 开箱即用行业模板）
2. **5 分钟上手**（登录 → 用一个模板 → 配置凭证 → 运行看到结果）
3. **核心能力**（每个能力一节，含截图+标注）：
    1. 国产大模型 & 向量模型全家桶
    2. 可视化搭建智能体（对话流 / 智能体流画布、节点、运行）
    3. 企业知识库问答（文档库 → 向量化/Upsert → 智能体引用）
    4. 一键导出办公文档（Word / Excel / PPT，PPT 带主题与图表）
    5. 国产生态连接（转接人工坐席 企微/飞书、客服查询 订单/物流/售后）
    6. 开箱即用行业模板（逐个简述）
    7. 全中文界面（默认中文、语言切换）
4. **典型场景示例**（把能力串成业务流程：智能客服、营销内容、汇报材料）
5. **私有化部署**（指向 `deploy/README.md`，摘要快速开始 + 合规/信创要点）
6. **常见问题 FAQ**

每节写法模板：**【能力简介一句话】→【它解决什么痛点】→【操作步骤 1·2·3】→【截图 + 图注】**。

---

## 3. FlowOps 功能权威清单（逐个读源码取真实名字再写）

> 下列为 FlowOps 相对上游 Flowise 的二开能力。**节点 label / 凭证 name / options 去对应文件读**。

**A. 国产大模型（chat）** —— `packages/components/nodes/chatmodels/` 下 FlowOps 新增的：智谱 ChatZhipuAI、Kimi ChatMoonshot、豆包 ChatDoubao、通义千问 ChatQwen、MiniMax ChatMinimax。各自的展示名/默认模型/对应凭证，去各 `*.ts` 与 `packages/components/credentials/` 读。

**B. 国产向量模型（embedding）** —— `packages/components/nodes/embeddings/`：智谱 / 通义 / SiliconFlow 三个，名字去源码读。

**C. 导出节点** —— `packages/components/nodes/agentflow/`：

-   `DocumentExport`（文档导出，docx/md/txt，Markdown 与结构化 JSON → 带格式 Word）
-   `SpreadsheetExport`（表格导出，JSON 表格 → xlsx，容错代码块/外层包装）
-   `PptxExport`（PPT 导出）—— **重点**：节点有「主题」下拉（4 套）与多种 layout（cover/section/bullets/twoColumn/chart/closing）+ 原生图表。主题名与 layout 去 `PptxExport.ts` 的 `THEMES` 与 `inputs` 读。

**D. 国产生态连接器** —— `packages/components/nodes/tools/`：

-   `HumanHandoff`（转接人工坐席（企业微信/飞书））+ 凭证 `credentials/IMBotWebhook.credential.ts`：转人工时把**双方完整对话历史**推到企微/飞书群机器人。
-   `CustomerServiceQuery`（客服查询（订单/物流/售后））+ 凭证 `CustomerServiceApiAuth.credential.ts`：示例数据模式（免后端演示）/ 调用 API 模式。
    名字、平台选项、模式去源码读。

**E. 行业模板（7 个）** —— `packages/server/marketplaces/agentflowsv2/` 下中文名 .json：营销文案生成、报告生成、会议纪要整理、招聘 JD 生成、客户邮件起草、Excel 表格生成、转人工客服。逐个打开看 `description` 与节点构成，写它能干什么、怎么用（用模板 → 配模型凭证 → 填表单/对话 → 出结果/下载）。

**F. 全中文界面** —— 默认语言中文（`packages/ui/src/i18n/index.js` 的 `DEFAULT_LANGUAGE='zh'`），右上角可切换中/英。

**G. 私有化部署 / 合规 / 信创** —— `deploy/README.md`：Docker 一键部署、关遥测、本地存储、信创(麒麟/统信/Kingbase)、离线 airgap。文档里做摘要并链接过去。

**H. 已精简弃用节点** —— FlowOps 默认隐藏了 47 个上游已弃用/被国产节点替代的节点（见 `deploy/.env.example` 的 `DISABLED_NODES`），界面更清爽。可在"为什么选它"里一句话带过。

---

## 4. 截图拍摄清单（Codex 在文末生成此表，人工照拍）

文末附一张表，列每张图：`文件名 | 拍哪个页面/操作 | 标注要点`。至少覆盖：登录/欢迎页、左侧导航总览、应用市场用模板、加国产模型凭证、画布与节点配置、知识库 Upsert、运行对话、导出文件下载链接、PPT 主题选择、转人工节点配置、客服查询节点、语言切换。每张都在正文对应位置已有 `![]()` 占位 + 图注。

## 5. 质量与验收（DoD）

-   覆盖 §3 全部 A–H 能力，每个能力名字与源码一致（**已逐个读文件核对**）。
-   结构=§2，开篇有价值主张、每节有"痛点 → 步骤 → 截图位+图注"，结尾有 FAQ。
-   主文档带可点击 TOC；所有图片用 `images/` 相对路径；占位图链接命名规范统一。
-   文末有完整「截图拍摄清单」表。
-   Markdown 渲染正常（标题层级、表格、代码块、图片语法无误）；无错别字、无英文残留段落（除专有名词）。
-   适合直接挂宣传页链接：语言对外、无内部黑话/TODO。
-   全部在 `feat/user-guide` 分支、未并 main；报告里列出"还需人工补的截图清单条数"。

## 6. 提交规范

-   一个 commit：`docs(guide): FlowOps 功能使用说明（宣传页级，含截图占位与标注）`，结尾 `Co-Authored-By: Codex <noreply@openai.com>`。
-   husky 会跑 prettier（.md 会被格式化），注意表格与图片语法。
