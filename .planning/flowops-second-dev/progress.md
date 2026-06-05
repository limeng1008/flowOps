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

### 商业化验收 + 补全计划（2026-06-04）

-   **验收 Codex/limeng 本轮产出**（分支 `codex/billing-v1`）：UI i18n 1539 测试全绿、components 串行全套件 exit 0、内容安全节点 8/8、导出节点 23/23、客服工具 17/17、billing service 7/7、8 个营销/客服模板 JSON 合法。
-   **修复**：内容安全审核节点 + 凭证「源码已提交但漏 build dist」（同国产模型旧坑）→ 补 `pnpm --filter flowise-components build`（含 svg）+ 重启后端（14:09 就绪零报错），节点现可加载。
-   **商业化 5 项现状盘点**：计费模块 ✅（billing v1，三维度 token/bot/seat 配额已挂请求入口，幂等去重+权限+UTC 周期）、官网/文档/帮助中心 ✅（`publicSite/index.jsx` 903 行真内容）、支付集成 ⚠️ 半成品（仅 402 拦截，无真实收款渠道）、客服/工单系统 ❌、品牌 logo/VI ❌。
-   **billing v1 待补点**（验收挑刺）：支付断头路（升级无下单流程）、前端 billing 页未真机验证、还在 `codex/billing-v1` 未并主干、国产模型 token usage 字段格式与 OpenAI 不一致需校准计费口径。
-   产出《商业化补全执行计划》`codex-commercialization-plan.md`（不含已做的计费/官网）：T1 支付宝/微信**沙箱对接骨架**（零新依赖手写 `crypto` 验签，接 billing 升级出口）、T2 **自建轻量工单**（Ticket+TicketMessage，复用账号体系+权限隔离）、T3 **占位 VI**（SVG 字标/favicon/VI 令牌/BrandLogo 收口+替换指引）。钉死铁律：4 库 migration、不 `pnpm add`、钱按分存整数、密钥只读 env、回调验签失败即拒、订单状态机只进不退、i18n en+zh 同步。边界：真实收款仍需营业执照+商户号+公网回调+ICP 备案，Codex 不碰。

### 商业化补全落地（2026-06-04）

-   商业化补全 T3 占位 VI 启动：从 `codex/billing-v1` 切出 `codex/commercialization-v1`，只执行品牌视觉统一，不碰 T1 支付 / T2 工单。
-   新增 FlowOps 占位 VI：SVG 字标、方形 mark、favicon/PWA 图标、主题品牌 token、全局中文优先字体栈和 `BrandLogo` 统一入口。
-   新增 `docs/brand/FlowOps-VI.md`，记录色彩、字体、logo 用法、露出点清单和正式 VI 替换步骤。
-   商业化补全 T1 支付沙箱骨架：新增 `PaymentOrder`、支付宝/微信 provider、支付 service/controller/route、四库 migration（`1777100000000`）和 env 占位；验签失败拒绝并记录，金额按整数分处理。
-   商业化补全 T2 自建轻量工单：新增 `SupportTicket`、工单 service/controller/route、四库 migration（`1777200000000`）、前端工单入口和中英 i18n；普通用户按组织+本人隔离，管理员走 `SUPPORT_ADMIN_EMAILS`/`BILLING_ADMIN_EMAILS` 白名单。

### 国产云向量库节点商业化增强（2026-06-05）

-   在 `codex/china-cloud-vectorstores` 上完成四家国产云向量库节点 P1/P2 增强：中文配置示例、API Key/开通指引、自动建集合说明、embedding 维度预设、Record Manager 去重/重建/cleanup、限流重试/指数退避。
-   新增 4 个应用市场 AgentflowV2 RAG 模板：腾讯云 VectorDB、阿里云 DashVector、百度智能云 VectorDB/Mochow、火山引擎 VikingDB；模板默认 `chatZhipuAI + glm-4.5` 与 `embeddingQwen`。
-   新增 mock HTTP server 集成测试，覆盖资源发现、自动建集合、429 重试、写入、检索和删除；真实云端联调记录落在 `china-cloud-vectorstores-commercialization.md`，因当前无四家云测试凭证，真实云 smoke 待人工凭证到位后执行。

### 上线 readiness 整改启动（2026-06-05）

-   完成统一上线检查报告 `go-live-readiness-audit.md`：结论为当前适合内部演示/POC/封闭内测，但不满足正式生产商业上线；P0 阻断项包括工作树不干净、功能分支未合主线、支付未形成真实收款闭环、缺真实环境联调、合规/运维材料不足。
-   从 `codex/china-cloud-vectorstores` 切出 `codex/go-live-hardening`，按 P0 顺序开始逐项整改；第一项目标是清理并分组提交当前工作树改动，让发布物可复现。
-   P0#1 完成：`codex/go-live-hardening` 已按审计/认证/市场工具/UI 视觉/FORK 账本分组提交并推送，工作树清理为干净状态。
-   P0#2 完成：从 `codex/go-live-hardening` 创建 `release/flowops-commercialization-v1` 作为候选发布源，并在 release 分支重跑商业化后端测试、市场模板测试、导出/国产云向量库测试、server 类型检查、三包构建、UI i18n 与 fork divergence，全部通过；UI build 的大 chunk 警告保留为 P1 性能项。
