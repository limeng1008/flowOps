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
