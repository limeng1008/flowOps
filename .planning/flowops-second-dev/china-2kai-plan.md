# FlowOps 面向中国用户二开 · 详细计划

> 输入调研：`china-pain-points.md`。日期 2026-06-02。

## 范围锁定（来自用户拍板）

-   **目标用户**：业务/运营 + 开发者/集成商（不以政企采购为先导）。
    -   对开发者：国产模型/API 齐全、可扩展、私有化部署文档。
    -   对业务：中文化、行业模板开箱即用、国内 IM 落地。
-   **交付形态**：**私有化部署为主**（输出可私有化镜像/离线包，按项目或 license 收费）。
-   **取桶**：① 国产模型/embedding 全家桶 · ② 国内生态连接器 · ③ 中文化收口+行业模板 · ④ 中文 RAG · ⑤ 部署/合规/信创。

### 本阶段明确 OUT（私有化为主下不阻塞）

-   微信/支付宝支付、ICP 备案、自建多租户 SaaS（私有化无此需求）。
-   等保测评、完整信创认证（转嫁客户主体；我们只提供适配路径 + 材料模板）。
-   大模型备案由客户作为部署主体完成；我们提供模型清单/算法说明模板。

## 最高纪律（贯穿全程）

只做加法不改核心：flow 引擎 / NodesPool / prediction 主流程 / 核心 DB schema **只读不改**。
新能力形态：**新增节点(INode) · 新增 credential · 独立服务/路由 · 新页面 · i18n 包一层 · marketplace JSON 模板 · env/配置开关**。
维护一份「fork 改动清单」，所有接入点最小化、集中、可追踪，保证能持续 merge 上游。

## 关键技术杠杆（已就位）

-   `packages/components/src/model-providers/openAICompatible.ts`：通用 OpenAI 兼容字段构造器（我们为智谱建的）。**绝大多数国产模型已提供 OpenAI 兼容端点**，新模型节点 = 薄封装 + 改 baseURL + credential + models.json 条目，复制 `ChatZhipuAI` 即可。
-   `model-providers/zhipu.ts`：asyncOptions 拉活模型列表的范式。
-   `modelLoader.ts`：已改为读本地 models.json（自建 provider 才能进下拉）。
-   marketplace `agentflowsv2/*.json`：已验证是最低风险的「智能体交付」方式（参考 PPT Deck Agent）。
-   i18n「包一层」locales 范式 + 覆盖测试范式（已有多个 \*I18n.test.js）。

---

## 阶段划分（按依赖排序，私有化为主）

### 阶段 0 · 地基：装得上、跑得通、看得懂（前置，最高优先）

没有这层，后面在国内一台内网机器上根本演示不了。

-   国内化构建/部署：Dockerfile/compose 改用国内镜像源（npm/pnpm registry、apt、基础镜像）；产出**离线安装包**与一键私有化 compose（内置 PG+Redis）。
-   默认不出境：默认 embedding/向量/模型端点不指向海外；确认无 phone-home（telemetry 可关、models.json 本地——已做）。
-   i18n 收口：建「翻译覆盖率」清单，补全节点 label/description、错误信息、canvas 术语。
-   验证：纯内网环境 `pnpm build` + docker 起服务 + 打开 /welcome /signin /canvas。

### 阶段 1 · 接入层国产化：模型 + embedding 全家桶（开发者价值最高，table-stakes）

复用 `openAICompatible.ts` + `ChatZhipuAI` 范式，逐个加薄节点：

-   Chat 模型（多数 OpenAI 兼容，快）：Kimi/月之暗面(Moonshot)、豆包/火山方舟(Doubao)、混元(腾讯)、百川、MiniMax、讯飞星火、阶跃(StepFun)、零一(Yi)、通义千问(DashScope 兼容模式)、SiliconFlow(聚合)。
-   修复核实：既有 `ChatBaiduWenxin`/`ChatAlibabaTongyi` 鉴权是否仍可用（百度/阿里改过鉴权）。
-   中文 embedding：通用「OpenAI 兼容 embedding」节点 + 预设（bge/bge-m3/m3e 经 TEI/Xinference/Ollama 本地部署；Qwen/智谱/SiliconFlow 托管）。私有化场景以**本地推理端点**为一等公民（Ollama 已有，补 vLLM/TEI/Xinference 兼容）。
-   统一「国产模型中心」体验：credential、models.json 条目、图标、asyncOptions 拉活列表。
-   每个节点配 Jest 单测（沿用 `ChatZhipuAI.test.ts` 模式）。

### 阶段 2 · 中文 RAG 增强 + 行业模板市场（业务价值）

-   把中文 embedding 接进 DocumentStore/向量库默认链路（配置/默认值层，不改核心）。
-   中文分块：中文标点/句段感知的 splitter（新增节点或配置项）。
-   中文文档解析：扫描件 OCR、版式 PDF、表格抽取（评估新增 loader 或对接 Unstructured/国产解析）。
-   行业模板市场：用 marketplace agentflowsv2 JSON 出 3–5 个开箱即用中文模板（企业知识问答 / 合同审阅 / 报告生成等通用场景，避开已搁置的「客服垂直」定位）。
-   模板市场中文分类（延续已做的 usecase i18n）。

### 阶段 3 · 国内生态连接器（差异化核心，最重，需单独细化设计）

-   出站工具节点（Agent 调用，**无需公网回调，最快见效，先做**）：企业微信/钉钉/飞书 发消息、发卡片、建日程、读通讯录；飞书/语雀/腾讯文档 loader。
-   入站触发器（需公网回调，后做）：webhook 接企业微信/钉钉/飞书回调 → 触发 flow。复用 Flowise 现有 webhook/trigger 机制，以新增 trigger 节点 + 独立路由方式，不改核心 prediction。
-   鉴权适配：各平台加签验签、token 刷新——独立服务/credential。
-   登录（可选后置）：企业微信/钉钉/飞书扫码 SSO（passport 策略扩展，新增 auth provider）。

### 阶段 4 · 私有化/合规交付打包

-   中文私有化部署文档、离线包、内网升级流程。
-   信创适配路径（非认证）：评估国产 DB（达梦/人大金仓，TypeORM 兼容性）、国产 OS（麒麟/统信）、ARM/国产芯片镜像。
-   大模型备案材料模板（客户主体备案，提供模型清单/算法说明模板）。
-   数据不出境核查清单（关 telemetry、确认无 phone-home、依赖本地化）。

---

## 排期建议（粗粒度，人日级，标依赖）

| 阶段 | 内容                                | 粗估 | 依赖 |
| ---- | ----------------------------------- | ---- | ---- |
| 0    | 地基（国内化构建/离线包/i18n 收口） | 中   | 无   |
| 1    | 国产模型 + 中文 embedding 全家桶    | 中   | 0    |
| 2    | 中文 RAG + 行业模板市场             | 中   | 1    |
| 3a   | 国内 IM 出站工具节点                | 中   | 1    |
| 3b   | 国内 IM 入站触发器 + SSO            | 大   | 3a   |
| 4    | 私有化/合规打包                     | 中   | 0,1  |

推荐落地顺序：**0 → 1 →（2 与 3a 并行）→ 3b → 4**。阶段 3 单独开一份设计文档再细化。

## 风险

-   上游升级冲突：靠 fork 边界 + 改动清单 + 定期 merge 缓解。
-   各 IM 平台 API/加签规则变动：连接器需版本化 + 回归测试。
-   国产 DB 兼容性：TypeORM 对达梦/金仓支持不确定，需 POC 验证再承诺。
-   本地推理性能：私有化下 embedding/模型吞吐受客户硬件限制，模板需标注资源要求。
-   既有国产节点(文心/通义)可能已失效：先验证再决定修复或重写。

## 下一步

1. 阶段 0 + 阶段 1 可立即开工（杠杆已就位）。
2. 阶段 1 先做一个「国产模型节点批量范式」：把 `ChatZhipuAI` 抽象成可快速复制的模板，首批落 3–4 个（建议 Kimi、豆包、通义、MiniMax）。
3. 阶段 3 另起设计文档。
