# FlowOps 二开研究进度

## 2026-05-31

-   创建二开研究计划，目标是形成架构地图、二开入口、风险图和路线图。
-   完成第一轮仓库盘点：确认 pnpm + Turbo monorepo，核心二开包为 `ui/server/components`。
-   完成第二轮包级盘点：记录前端、后端、组件包的技术栈、目录分层和初步二开入口。
-   完成运行主线分析：确认后端 `App` 初始化顺序、统一 `/api/v1` 路由、前端路由/API client、节点池扫描方式。
-   完成节点扩展模式分析：记录 `INode` 字段、`init/run/loadMethods`、凭证扩展和构建扫描链路。
-   完成测试/环境/部署盘点：记录 env、Docker、Jest/Cypress 覆盖点。
-   完成风险图和 1-3 天、1 周、2-4 周二开路线图。

## 2026-06-01

-   修复变量页面“使用说明”入口按钮和弹窗的硬编码英文，补充中英文 i18n 文案与覆盖测试。
-   修复凭证列表“最后更新/创建时间”的日期格式，中文模式下显示为 `YYYY年M月D日 HH:mm:ss`。
-   修复市场模板页“用例”筛选与列表 usecase 标签，中文模式下展示中文分类名，筛选值仍保留原始模板分类。
-   开始调研 PPT 智能体方案：确认市场模板 JSON 是最快落地点，当前仓库已有 PPTX 读取能力但尚无 PPTX 文件生成依赖。
-   新增 `PPT Deck Agent` AgentflowV2 市场模板第一版，可通过表单输入主题、受众、页数、风格和资料，输出结构化 PPT 方案；补充中文市场名称、描述和“演示文稿”用例翻译。
-   完成 PPT 智能体模板与市场 i18n 单测、server/UI 构建验证；浏览器会话因未登录跳到 `/unauthorized`，未做可视页面截图。
-   修复助手模块子页面 i18n：自定义助手列表/创建弹窗、OpenAI 助手列表/创建编辑弹窗、向量库弹窗、自定义助手配置预览页补齐中文文案，并新增助手 i18n 覆盖测试。

## 2026-06-02

-   清理已搁置的「智能客服」方向：删除其记忆与残留（`doc/`、`MockOrderQuery/` 空壳目录），`MEMORY.md`/`product-direction.md` 去客服化，`task_plan.md` 决策行改为 FlowOps 定位。
-   完成「国内用户困扰」调研（WebSearch/WebFetch 不可用，落地在本 fork 代码盘点 + 领域认知）：产出 `china-pain-points.md`，13 条困扰 + 竞品现实（Dify/FastGPT/Coze）+ 6 个机会桶。
-   产出面向中国用户二开详细计划 `china-2kai-plan.md`：锁定「业务/运营 + 开发者」「私有化为主」，4 桶按依赖分阶段（0 地基 → 1 国产模型/embedding →（2 中文 RAG ∥ 3a IM 出站）→ 3b IM 入站 → 4 私有化/合规）。
-   产出可持续升级 / 上游合并策略 `upstream-merge-strategy.md`：实测 divergence（116 改 / 31 新增），定位 i18n 内联污染 92 个 view/组件为头号债；给出 git 拓扑、T1/T2/T3 法则、各层加法化、i18n codemod + FORK-CHANGES 账本 + CI 护栏、升级 runbook。
-   落地 fork git 拓扑：建私有库 `limeng1008/flowOps`，`origin` 指它、`upstream` 指 FlowiseAI（只 fetch、禁推）；二开改动按层提交为 3 个 commit（components / ui / planning）叠在上游基线 `bc22bf8b` 之上，推送成功，`main` 跟踪 `origin/main`。
-   过程修复：`nodeI18n.js` 3 处重复键（被 husky/eslint 门禁拦截），删除冗余重复项。

### Codex 执行计划 T1–T6 落地（接入层国产化 + fork 可维护性）

-   工作分支 `feat/cn-localization`（不碰 main，逐任务 commit + tsc/jest 门禁）；T1–T3 本人实现，T4–T6 由 Codex 执行。
-   T1：`models.json` 还原为上游 pristine（0 diff），我方模型条目迁入 `models.flowops.json`，`modelLoader` 加载期按 provider 合并。
-   T2：新增国产 chat 节点 Kimi(月之暗面)/豆包(火山方舟)/通义千问(DashScope 兼容)/MiniMax，复用 `openAICompatible` + `ChatZhipuAI` 范式（OpenAI 兼容端点 + credential + live 拉模型 + 兜底 + 测试）。
-   T3：新增中文 embedding 节点 智谱/通义/硅基流动（共享 `openAICompatibleEmbedding`）；本地 TEI/Xinference/Ollama 沿用现成 `OpenAIEmbeddingCustom`。
-   T4：FlowOps 主题色抽离为 `_flowops-vars.module.scss` 覆盖层，缩小对上游 `_themes-vars` 的内联改动。
-   T5：新增 `FORK-CHANGES.md` 改动账本 + `scripts/fork-divergence.sh` 门禁（相对 upstream/main：174 改全部登记 / 83 新增，check passed）。
-   T6：i18n 重放 codemod + 残留英文审计补齐；并把节点描述与输入 tooltip 翻译解耦（`translateNodeTooltip`）。
-   Polish：国产节点中文化（label/description）+ lobe-icons 官方品牌图标（MIT）替换占位图（name/type 不变，DISABLED_NODES/models.flowops key 安全）。
-   Review 拦截：剔除 Codex 误造的假 provider `EmbeddingDeepseek`（DeepSeek 无 embedding 接口）；早前「隐藏 Base Path」伪需求 + 混入的零散 i18n 已回退。组件 tsc 0 / jest 42、UI i18n 测试、divergence 门禁全绿。

### Phase 2 行业模板市场（启动）

-   新增首个行业模板「营销文案生成智能体」（AgentflowV2，form→LLM 范式：表单 → chatZhipuAI → 结构化输出）+ 结构校验测试，已合并入 main。
-   **真机验证通过**：用智谱 `glm-4-flash` 实跑，产出结构化中文营销文案（主题 + 多条 标题/正文/CTA + 话题标签 + AB 建议）——端到端打通（智谱端点/鉴权/请求/结构化输出全对）。
-   **踩坑修复**：AgentflowV2 表单变量必须 `{{ $form.字段 }}`，裸 `{{ 字段 }}` 静默传空 → LLM 输出空壳；修正营销文案 + PPT Deck Agent（同 bug），测试加 `$form` 守卫。教训：模板结构测试绿 ≠ 运行对，新模板须真机跑一次。
-   产出《Codex Phase 2 行业模板执行计划》`codex-phase2-templates-plan.md`：4 个 form→LLM 模板（报告 / 会议纪要 / 招聘 JD / 客户邮件），把 `$form` 铁律 + 测试守卫写死；RAG 知识库问答与合同审阅留作单独任务。

## 2026-06-04

-   商业化补全 T3 占位 VI 启动：从 `codex/billing-v1` 切出 `codex/commercialization-v1`，只执行品牌视觉统一，不碰 T1 支付 / T2 工单。
-   新增 FlowOps 占位 VI：SVG 字标、方形 mark、favicon/PWA 图标、主题品牌 token、全局中文优先字体栈和 `BrandLogo` 统一入口。
-   新增 `docs/brand/FlowOps-VI.md`，记录色彩、字体、logo 用法、露出点清单和正式 VI 替换步骤。
