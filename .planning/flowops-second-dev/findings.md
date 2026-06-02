# FlowOps 二开发现

## Repository Inventory

-   Monorepo 使用 `pnpm` workspace，范围是 `packages/*`。
-   根脚本通过 Turbo 编排：`pnpm dev` 并行跑各包 dev，`pnpm build` 跑全量构建，`pnpm --filter flowise-ui build` 可单独构建前端。
-   Node/Pnpm 约束：Node `^20`，pnpm `^10.26.0`。
-   主要包职责初判：
    -   `packages/ui`：React/Vite 前端，登录页、欢迎页、菜单、主题、画布、节点配置 UI 都在这里。
    -   `packages/server`：主后端服务、API、数据库实体/迁移、队列/执行入口、认证和配置。
    -   `packages/components`：节点生态和运行组件，二开自定义节点的核心入口。
    -   `packages/agentflow`：Agent Flow 能力包，有 examples。
    -   `packages/observe`：观测能力包，有 examples。
    -   `packages/api-documentation`：API 文档包。
-   仓库已有 Docker 与 worker 部署目录：`docker/`、`docker/worker/`。
-   当前工作区已有大量换皮改动；二开研究阶段只新增 `.planning/flowops-second-dev/*`，不回滚或覆盖既有改动。
-   `packages/ui` 技术栈：React 18、Vite 5、MUI、Redux、React Router 6.3、ReactFlow、i18next、GSAP。适合做品牌、导航、页面、交互、画布 UI、节点配置表单层二开。
-   `packages/server` 技术栈：TypeScript、Express、TypeORM、oclif CLI、Passport/JWT/SSO、BullMQ、OpenTelemetry、Stripe、Redis/PG/MySQL/SQLite 等。适合做 API、权限、数据库、执行队列、部署运行层二开。
-   `packages/components` 技术栈：TypeScript + Gulp build，大量 LangChain/LangGraph/LLM/vectorstore/tool/documentloader 节点。适合做自定义节点、模型接入、工具接入、RAG 组件二开。
-   前端源码按 `api/hooks/layout/menu-items/routes/store/themes/ui-component/views/utils` 分层；现有换皮主要已经触达 `layout/routes/themes/views/i18n/assets`。
-   后端源码按 `routes/controllers/services/database/entities/migrations/middlewares/queue/enterprise/utils` 分层，路由、控制器、服务分离较清楚。
-   节点目录集中在 `packages/components/nodes`，按能力域分类：`chatmodels`、`llms`、`embeddings`、`documentloaders`、`vectorstores`、`tools`、`agents`、`agentflow` 等。

## Runtime Architecture

-   后端入口是 `packages/server/src/index.ts` 的 `App`：
    1. `initDatabase()` 初始化 TypeORM DataSource 并执行 migrations。
    2. 初始化 `IdentityManager`、`NodesPool`、`AbortControllerPool`、加密 key、auth secrets、rate limiter、cache、telemetry、SSE。
    3. Queue 模式下初始化 BullMQ queues 和 Redis 事件订阅。
    4. 初始化 webhook listener registry 和 ScheduleBeat。
    5. `config()` 配置 JSON/body、trust proxy、CORS、cookie、iframe header、request logger、sanitize middleware、JWT/API key 鉴权。
    6. 所有 API 统一挂到 `/api/v1`，最后 serve `flowise-ui/build` 静态文件并 fallback 到 React app。
-   后端 API 注册中心是 `packages/server/src/routes/index.ts`。新增业务 API 的常规路径是：`routes/<feature>` -> `controllers/<feature>` -> `services/<feature>`，再在 routes index 挂载。
-   前端 API client 是 `packages/ui/src/api/client.js`，baseURL 为 `${VITE_API_BASE_URL || window.location.origin}/api/v1`，带 `x-request-from: internal` 和 cookie；401 时尝试 refresh token。
-   前端路由入口是 `packages/ui/src/routes/index.jsx`，通过 `useRoutes([MainRoutes, AuthRoutes, LandingRoutes, CanvasRoutes, ChatbotRoutes, ExecutionRoutes])` 注册。
-   主应用路由在 `MainRoutes.jsx`，大部分页面由 `RequireAuth` 包裹。权限字符串如 `agentflows:view`、`tools:view`、`executions:view`。
-   `RequireAuth` 会根据平台类型（open source/cloud/enterprise）、permissions、features/display 决定访问；所以加新菜单/新页面时要同步考虑权限。
-   数据库支持 sqlite/mysql/mariadb/postgres，实体集中在 `packages/server/src/database/entities/index.ts`，迁移需要分别覆盖多个数据库目录。
-   节点加载由 `packages/server/src/NodesPool.ts` 完成：扫描 `flowise-components/dist/nodes` 的 `.js` 文件，读取 `module.exports = { nodeClass }`，实例化后按 `name` 注册。凭证扫描 `dist/credentials/*.credential.js`。
-   可通过 `DISABLED_NODES` 环境变量禁用节点；社区节点受 `SHOW_COMMUNITY_NODES` 控制。

## Extension Points

初步判断：

-   UI 二开：`packages/ui/src/routes`、`views`、`layout`、`menu-items`、`themes`、`i18n`。
-   API 二开：`packages/server/src/routes` + `controllers` + `services`。
-   数据二开：`packages/server/src/database/entities` + `migrations`。
-   节点二开：`packages/components/nodes/<category>/<NodeName>`。
-   部署二开：根 `Dockerfile`、`docker/`、`packages/server/.env.example`、`packages/ui/.env.example`。
-   权限二开：前端 `RequireAuth`/菜单 permission 字符串 + 后端 enterprise RBAC/IdentityManager feature checks。

### Custom Node Pattern

-   自定义节点主要加在 `packages/components/nodes/<category>/<NodeName>/<NodeName>.ts`。
-   节点类实现 `INode`，关键字段：
    -   `label`：前端显示名称。
    -   `name`：节点唯一标识，后端 `NodesPool` 以它作为 map key。
    -   `version`、`type`、`icon`、`category`、`description`。
    -   `inputs`：前端配置表单 schema，支持 `string/number/boolean/json/code/options/asyncOptions/datagrid/tabs` 等。
    -   `credential`：声明可关联的 credential。
    -   `baseClasses`：用于画布连接类型和兼容性判断。
    -   `loadMethods`：异步选项加载，比如从数据库/外部 API 拉列表。
    -   `init()`：初始化成 LangChain/Tool/Model 等可执行实例。
    -   `run()`：Agentflow 类节点可直接执行逻辑并返回结果。
-   构建链路：`tsc` 编译到 `dist`，gulp 复制 `nodes/**/*.{jpg,png,svg}` 到 `dist/nodes`；后端只扫描 `flowise-components/dist/nodes`。
-   凭证扩展主要加在 `packages/components/credentials/*.credential.ts`，构建后由 `NodesPool.initializeCredentials()` 扫描 `dist/credentials/*.credential.js`。
-   `CustomTool` 已提供数据库驱动的动态工具能力：从 `Tool` 表加载 schema/func，包装成 `DynamicStructuredTool`；如果只是轻业务动作，可以先走“Tool 配置化”，复杂稳定能力再沉淀为代码节点。

## Risk Map

### Low Risk / Fast Iteration

-   品牌与皮肤：logo、favicon、manifest、title、主题色、欢迎页、登录页、基础 i18n。
-   前端菜单重命名和排序：主要在 `packages/ui/src/menu-items`，但要注意 permission 保持一致。
-   新增纯前端信息页：`views` + `routes` + `menu-items`。
-   隐藏不需要的节点：优先用 `DISABLED_NODES`，少直接删除节点源码。
-   模型列表调整：优先研究 `MODEL_LIST_CONFIG_JSON`，少直接写死模型列表。

### Medium Risk / Needs Small Design

-   新增后端业务 API：需要同步 `routes/controllers/services`、前端 `api/*.js` 和权限策略。
-   新增数据库表：必须同时覆盖 sqlite/mysql/mariadb/postgres migrations，否则部署环境会分裂。
-   新增自定义节点：要考虑 category、baseClasses、credentials、icon、构建后扫描、前端连接兼容性。
-   改画布/节点配置 UI：`ReactFlow`、变量引用、动态 output anchors、asyncOptions 容易牵一发动全身，建议小步改。
-   改登录/鉴权流程：涉及 cookie、refresh token、SSO、license/platform 类型，回归面较大。

### High Risk / Avoid Until Necessary

-   大改 `IdentityManager`、RBAC、license/features：容易影响 cloud/enterprise/open-source 三套逻辑。
-   改 `NodesPool` 扫描机制：影响所有节点加载和凭证加载。
-   改核心执行链路：`buildChatflow`、`buildAgentflow`、prediction/internal-prediction、queue worker、SSE streamer。
-   改已有数据库字段含义：需要兼容历史 flowData、chat messages、executions、templates。
-   直接删除官方节点/接口：升级合并会很痛，优先通过 env、菜单隐藏、feature flag 或 wrapper 方式隔离。

### Verification Strategy

-   UI 换皮/页面：`pnpm --filter flowise-ui build` + 浏览器打开关键页面。
-   前端工具函数/i18n：`pnpm --filter flowise-ui test <target>` 或相关 Jest。
-   后端 API/service：`pnpm --filter flowise test <test-file>`，必要时加 supertest。
-   节点能力：`pnpm --filter flowise-components test <node-test>` + `pnpm --filter flowise-components build`。
-   全链路发布前：`pnpm build:docker` 或至少 `pnpm build`，再跑关键手工路径。
-   数据库改动：在 sqlite 和目标生产数据库（建议 postgres）各跑一次 migration。

## Roadmap Notes

### 1-3 Days: 完成第一层换皮收口

-   固化品牌资产清单：logo、favicon、manifest、标题、欢迎页、登录页、颜色 token。
-   建立换皮改动清单，避免散落在几十个文件里无人知道。
-   把不符合 FlowOps 定位的文案统一成“AI Agent 工作流管理平台”。
-   确认 dev/prod 两种路径都能打开 `/welcome`、`/signin` 和主控制台。

### 1 Week: 做“可二开的骨架”

-   出一份内部二开规范：新增页面、API、DB entity、node 的目录和命名规则。
-   确定优先二开的产品面：菜单结构、默认首页、Agentflow 入口、工具/知识库入口。
-   做一个最小自定义节点 POC：例如“内部 HTTP 工具节点”或“企业知识检索节点”，验证 `components -> server NodesPool -> ui node list -> canvas` 的完整链路。
-   做一个最小业务 API POC：例如 `/api/v1/flowops/health` 或平台配置读取，验证 routes/controllers/services/frontend api 的完整链路。
-   选定生产数据库策略：开发 sqlite 可以，生产建议 postgres，并确认 migration 流程。

### 2-4 Weeks: 进入功能型二开

-   节点能力：沉淀企业内部工具节点、知识库节点、模型代理节点、审计/回调节点。
-   管理能力：定制首页 dashboard、执行记录筛选、模板市场分组、组织/工作区默认配置。
-   权限能力：梳理角色权限矩阵，不急着改 RBAC 核心，先用已有 permission/display 机制。
-   部署能力：定制 Docker 镜像、env 模板、健康检查、日志/指标、queue worker 拆分。
-   升级能力：维护 fork 改动边界，优先 wrapper/配置/新增模块，少改官方核心文件。

### Recommended Next Investigation

1. 先选一个“最小自定义节点”做 POC。
2. 同时整理当前换皮改动成清单，标注哪些是长期 fork 改动。
3. 再设计第一批真正产品功能：例如企业知识库 Agent、内部系统 Tool、执行监控面板。

## PPT Agent Discovery

-   市场模板由 `packages/server/src/services/marketplaces/index.ts` 直接读取 `packages/server/marketplaces/chatflows`、`tools`、`agentflowsv2` 下的 JSON 文件并展示；新增一个 AgentflowV2 JSON 模板是最低风险的智能体交付方式。
-   AgentflowV2 模板可定义 `description`、`usecases`、`nodes`、`edges`，导入后成为可编辑工作流，适合作为“PPT 方案生成智能体”的第一版。
-   当前仓库已有 PPT/PPTX 读取能力：`MicrosoftPowerpoint` document loader、Google Drive/S3/File loader 都能读取 PowerPoint；但没有发现 `pptxgenjs`、`officegen` 等 PPTX 生成依赖。
-   现有 marketplace tools 中有 `Print or Export Text Document`，可导出 pdf/epub/zip/docx，但不支持 pptx。
-   如果目标是“真正下载 .pptx”，需要新增一个生成工具/节点/API，并引入 PPTX 生成库；如果目标是快速给用户可用的智能体，应优先用 AgentflowV2 模板输出结构化 slide deck 内容。
