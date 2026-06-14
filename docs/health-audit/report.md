# FlowOps Phase 1 代码健康审计报告

审计日期：2026-06-14
审计分支：`codex/code-health`
审计 worktree：`/Users/Zhuanz/.config/superpowers/worktrees/Flowise/codex-code-health`
范围基线：`upstream/main...HEAD`
执行约束：仅只读审计；本报告是唯一产物；未进入任何清理动作。

## 0. 结论摘要

1. 二开 footprint 很大：`git diff --stat upstream/main...HEAD` 统计到 730 个差异文件，其中新增 398、修改 332、删除 0。`scripts/fork-divergence.sh` 能界定范围，但当前 ledger 校验失败：332 个修改文件中仅 280 个登记，且存在 16 个登记但当前不再相对上游修改的路径。
2. Entitlement 与自建 IAM 不是简单重复实现。IAM self/enterprise 主要管身份、权限、路由 feature gate；entitlement 管套餐、资源额度、credits、账单中心。但 `FLOWOPS_LOCAL_COMMERCIAL` 同时影响 `IdentityManager` 和 `LocalEntitlementSource`，self 轨又固定返回 enterprise/license valid，导致“平台/授权”和“套餐/额度”的语义边界需要明确。
3. 最大待议风险在 cloud 付费闭环：支付成功会更新旧 `BillingSubscription`，但 `SubscriptionEntitlementSource` 当前恒返回 free。也就是说 cloud 付费激活与 entitlement 额度之间还没有打通。
4. `DISABLED_NODES` 的 47 个上游节点属于配置隐藏策略，节点本体和 IAM P4 接缝桥均应列为 🔴勿动。
5. 本报告把明显只可删注释、注释掉的调试行标为 🟢；涉及职责边界、运行时行为、支付/授权/IAM 的全部标为 🟡或🔴，等待人工逐项勾选。

风险等级说明：🟢可删表示人工确认后可进入后续清理批次；🟡待议表示需要产品/架构裁定或补测试后再动；🔴勿动表示当前不应清理，最多补文档或补保护性测试。

## 1. 范围地图

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| footprint 边界 | `scripts/fork-divergence.sh:26`、`scripts/fork-divergence.sh:27` | 二开新增 | 🔴勿动 | 后续所有清理只在 `upstream/main...HEAD` 的新增/修改文件内做；上游原生代码只读。 | 脚本用 `git diff --diff-filter=M/A upstream/main...HEAD` 划分修改和新增文件。 |
| ledger 不一致 | `scripts/fork-divergence.sh:33`、`FORK-CHANGES.md:29` | 二开新增 | 🟡待议 | Phase 2 前先单独补齐或收敛 ledger，不与代码清理混做。 | 本次运行脚本：修改 332、新增 398、登记修改 280；脚本因未登记修改文件非零退出。 |
| 新增文件规模 | `.planning/flowops-second-dev/codex-code-health-audit-plan.md:44` | 二开新增 | 🔴勿动 | 以本报告和 diff 统计作为 Phase 2+ 边界，不扩大到上游目录。 | 计划要求先跑 divergence 并列出新增/修改文件数。 |
| DISABLED_NODES 边界 | `.planning/flowops-second-dev/disabled-nodes.md:11`、`packages/server/src/NodesPool.ts:37`、`packages/server/src/services/agentflowv2-generator/index.ts:85` | 二开配置接入，上游节点本体 | 🔴勿动 | 保持“配置隐藏 47 个节点”策略，不删除节点本体。 | 文档明确 47 个弃用节点由 `DISABLED_NODES` 隐藏，NodesPool 和 agentflowv2-generator 只读取 env。 |
| IAM P4 接缝边界 | `packages/server/src/iam/identity.ts:42`、`packages/server/src/iam/entities.ts:69`、`docs/iam-seam-ledger.md:24` | 二开 IAM 接缝桥 | 🔴勿动 | 排除在类型逃逸清理之外；只在 IAM P4 专项里处理。 | 计划明确排除 iam/ 的 14 处 P4 桥；ledger 文档将 `as unknown as` 搜索列为接缝追踪项。 |

## 2. 死代码

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| Entitlement feature gate 未接生产路由 | `packages/server/src/services/entitlement/featureGate.ts:26`、`packages/server/src/services/entitlement/featureGate.test.ts:7` | 二开新增 | 🟡待议 | 若产品决定由 entitlement 控功能权限，则接入路由；若继续由 IAM `checkFeatureByPlan` 管 feature gate，则后续可删文件和测试。 | `rg featureGate` 仅发现实现和测试，未发现生产 route/controller import。 |
| `SubscriptionEntitlementSource` stub | `packages/server/src/services/entitlement/index.ts:297` | 二开新增 | 🟡待议 | 不删除；先决定 cloud entitlement 应从 `BillingSubscription/BillingPlan` 派生，还是把旧 billing 降级为历史视图。 | 计划中该 source 本来就是 cloud 免费版占位，支付 P0 已落地后它成为闭环缺口。 |
| settings 顶部 TODO 注释 | `packages/server/src/services/settings/index.ts:1`、`packages/server/src/services/settings/index.ts:7` | 二开修改既有文件 | 🟢可删 | 人工确认后可删注释，不动 `getSettings`。 | 文件已经实现 `getSettings` 并返回平台/edition；TODO 已过期。 |
| self feature helper 不是死代码 | `packages/server/src/iam/self/features.ts:16`、`packages/server/src/iam/self/auth/service.ts:396` | 二开新增 | 🔴勿动 | 不按死代码处理，转入“语义分叉”待议项。 | `getSelfEnterpriseFeatures()` 被 self auth service 返回 logged-in user features 使用。 |
| billing admin API 前端未显式使用 | `packages/ui/src/api/billing.js:3`、`packages/server/src/controllers/billing/index.ts:25` | 二开新增 | 🟡待议 | 不删 API；先确认是否作为运营后台/外部调用保留。 | UI 当前账单页只用 `/billing/me` 和 payment API，但后端 admin plans/orgs/subscriptions 路由存在。 |

## 3. 冗余 / 重复实现

### 3.1 Entitlement vs IAM 职责结论

| 轨道 | IAM 活跃度 | Entitlement 活跃度 | 结论 |
| --- | --- | --- | --- |
| self 私有化轨 | `iam/provider.ts:20` 根据 `FLOWOPS_IAM=self` 或缺 enterprise dist 走 self；`iam/self/identity.ts:33` 固定 enterprise、`iam/self/identity.ts:37` 固定 license valid；`routes/index.ts:156` self 下绕过部分 feature gate。 | `entitlement/index.ts:267` private 走 `LocalEntitlementSource`，先 license 后 `FLOWOPS_LOCAL_COMMERCIAL`，否则 free；`quotaUsage.ts:59` 仍按 orgId 调 entitlement 限额。 | 两者都活跃但职责不同。IAM 管身份/RBAC/功能门，entitlement 管资源/套餐。重叠点是“enterprise/授权/feature”的展示语义。 |
| enterprise 兼容轨 | `IdentityManager.ts:112` 的 `FLOWOPS_LOCAL_COMMERCIAL` 会直接把实例设为 enterprise；`IdentityManager.ts:276` enterprise 返回所有企业 feature。 | `LocalEntitlementSource` 同样用 `FLOWOPS_LOCAL_COMMERCIAL` 把 tier 映射到 enterprise。 | 同一个 env 同时驱动平台授权和套餐权益，属于重复语义入口，需要文档或集中封装。 |
| cloud 轨 | `IdentityManager` cloud 侧原本通过 Stripe feature；路由 `/payment` 仅 `FLOWOPS_EDITION=cloud` 挂载。 | `SubscriptionEntitlementSource` 目前恒 free；支付成功只写旧 billing subscription。 | cloud 付费链路和 entitlement 未闭环，不能删旧 billing，也不能把 entitlement 视为已完成订阅源。 |

### 3.2 逐项清单

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| `FLOWOPS_LOCAL_COMMERCIAL` 双入口 | `packages/server/src/IdentityManager.ts:87`、`packages/server/src/IdentityManager.ts:112`、`packages/server/src/services/entitlement/index.ts:198`、`packages/server/src/services/entitlement/index.ts:279` | 二开修改既有 + 二开新增 | 🟡待议 | 保留现状；后续应明确：IAM 只表达部署/身份平台，entitlement 只表达套餐/额度，env 解析可集中到一个 helper。 | 同一 env 同时设置 platform enterprise 和 entitlement enterprise tier。 |
| self 轨企业 feature 语义分叉 | `packages/server/src/iam/self/identity.ts:53`、`packages/server/src/iam/self/features.ts:16` | 二开新增 | 🟡待议 | 补一条 self 轨 feature 矩阵测试或文档，决定 `feat:sso-config` 是否应在所有入口一致为 false。 | `FlowOpsIdentity.getFeaturesByPlan()` 返回所有 flags 为 true，而 `getSelfEnterpriseFeatures()` 将 `feat:sso-config` 置 false。 |
| 旧 billing 与 entitlement 双账本 | `packages/server/src/services/billing/index.ts:137`、`packages/server/src/controllers/billing/index.ts:11`、`packages/server/src/database/entities/Entitlement.ts:3`、`packages/server/src/database/entities/EntitlementUsage.ts:3` | 二开新增/修改 | 🔴勿动 | 暂不删除旧 billing；待 cloud subscription source 打通后再决定迁移或只保留历史视图。 | BillingService 注释为 deprecated，但 controller `/billing/me` 同时返回 legacyBilling 和 entitlementOverview。 |
| 支付成功未推进 entitlement | `packages/server/src/services/payment/index.ts:189`、`packages/server/src/services/entitlement/index.ts:297` | 二开新增 | 🟡待议 | 先出设计：`SubscriptionEntitlementSource` 从 BillingSubscription 读当前计划，或支付直接写 entitlement。 | 付款结算只调用 `BillingService.setOrganizationSubscription()`；cloud entitlement source 恒 free。 |
| 存储额度仍在旧 quota | `packages/server/src/utils/quotaUsage.ts:217`、`packages/server/src/utils/quotaUsage.ts:223` | 二开修改既有文件 | 🟡待议 | 不删；若 storage 是商业化维度，应补 entitlement dimension 或明确继续由旧 quota 管。 | flows/users/predictions 已接 entitlement，storage 仍只读 subscription/cache quotas。 |
| 账单入口在 cloud，license 入口在 private/cloud 均可见 | `packages/ui/src/menu-items/dashboard.js:258`、`packages/ui/src/menu-items/dashboard.js:267`、`packages/ui/src/views/billing/index.jsx:139` | 二开修改/新增 | 🟡待议 | 确认产品导航策略：private 是否也应露出 billing center 的 license/credits 信息，还是只露出 license 页面。 | Billing 菜单 `display: edition:cloud`，但 billing 页面本身支持 private entitlement/license 展示。 |

## 4. 补丁堆叠 / workaround

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| Entitlement/Billing 多轮补丁堆叠 | `FORK-CHANGES.md:20`、`FORK-CHANGES.md:23`、`FORK-CHANGES.md:59`、`FORK-CHANGES.md:68` | 二开修改登记 | 🟡待议 | 先不清理；人工决定统一计量后，再分批收敛 BillingService fallback。 | ledger 同时登记 Billing-center-v1、Local-commercial、Entitlement、quotaUsage；git log 显示 billing/entitlement/quota 多次连续改动。 |
| deprecated billing fallback | `packages/server/src/utils/quotaUsage.ts:66`、`packages/server/src/utils/quotaUsage.ts:174`、`packages/server/src/utils/quotaUsage.ts:203` | 二开修改既有文件 | 🔴勿动 | 保留到 entitlement coverage 完整且 cloud source 打通后再删。 | entitlement 检查非 PAYMENT_REQUIRED 错误会 fallback 到旧 billing 或旧 prediction quota。 |
| export-import temporary fix | `packages/server/src/services/export-import/index.ts:601` | 二开修改既有文件 | 🟡待议 | 转 issue 或补覆盖后重构，不在健康审计阶段动。 | 注释写明 CustomTemplate Tool export data 的临时修复。 |
| Canvas paste temporary fix | `packages/ui/src/views/canvas/index.jsx:539`、`packages/ui/src/views/agentflowsv2/Canvas.jsx:631` | 二开修改既有文件 | 🟡待议 | 留给 Canvas 输入法/粘贴专项；当前不删。 | 两处相同 TODO 标注 temporary fix，用于输入焦点时防止粘贴事件误触发。 |
| IAM 惰性 enterprise bridge | `packages/server/src/iam/identity.ts:40`、`packages/server/src/iam/boot.ts:17`、`packages/server/src/iam/middleware.ts:13` | 二开新增 P4 桥 | 🔴勿动 | 不在本轮处理；只在 IAM P4 物理剥离后移除。 | 注释明确 self 轨不加载 enterprise，桥接为兼容遗留 App.identityManager。 |
| public site asset placeholder | `packages/ui/src/views/publicSite/sections/Enterprise.jsx:15`、`packages/ui/src/views/publicSite/sections/shared.jsx:264` | 二开新增 | 🟡待议 | 等正式截图/架构图资产到位再替换，不作为代码健康清理。 | TODO 明确等待 deployment assets/product screenshot finalized。 |

## 5. 类型健康

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| IAM P4 类型擦除 | `packages/server/src/iam/entities.ts:69`、`packages/server/src/iam/identity.ts:42`、`packages/server/src/iam/identity.ts:53`、`packages/server/src/iam/middleware.ts:13` | 二开新增 P4 桥 | 🔴勿动 | 按计划排除，不纳入“类型逃逸清理”。 | 注释说明为接缝类型擦除，计划第 5 类明确排除 iam/ 的 14 处 P4 桥。 |
| payment rawBody any | `packages/server/src/controllers/payment/index.ts:49` | 二开新增 | 🟡待议 | 保留；后续可通过 Express Request 类型扩展收紧。 | 支付回调验签需要读取 `req.rawBody`，当前 Express 类型无该字段。 |
| 国产 ChatModel `@ts-ignore` | `packages/components/nodes/chatmodels/ChatDoubao/ChatDoubao.ts:136`、`packages/components/nodes/chatmodels/ChatQwen/ChatQwen.ts:135`、`packages/components/nodes/chatmodels/ChatZhipuAI/ChatZhipuAI.ts:135`、`packages/components/nodes/chatmodels/ChatMinimax/ChatMinimax.ts:135`、`packages/components/nodes/chatmodels/ChatMoonshot/ChatMoonshot.ts:135` | 二开新增 | 🟡待议 | 后续逐节点收紧 loadMethods/options 类型；每个节点需跑对应 jest。 | 新增国产模型节点重复出现 `//@ts-ignore`，属于可收紧的二开类型债。 |
| 国产 Embedding `@ts-ignore` | `packages/components/nodes/embeddings/EmbeddingQwen/EmbeddingQwen.ts:91`、`packages/components/nodes/embeddings/EmbeddingSiliconflow/EmbeddingSiliconflow.ts:91`、`packages/components/nodes/embeddings/EmbeddingZhipu/EmbeddingZhipu.ts:91` | 二开新增 | 🟡待议 | 与 ChatModel 同批处理，先补类型或抽公共 helper。 | 新增 embedding 节点同构类型逃逸。 |
| 云向量库 any | `packages/components/nodes/vectorstores/cloud/CloudVectorStoreUtils.ts:234`、`packages/components/nodes/vectorstores/cloud/CloudVectorStoreUtils.ts:815`、`packages/components/nodes/vectorstores/cloud/createCloudVectorNode.ts:78` | 二开新增 | 🟡待议 | 保留到云向量库接口稳定；后续用 provider adapter 类型替换。 | 当前用 `this as any`、`store as any` 保存 k/filter 和 provider output。 |
| 上游/既有 agentflow 大量 any | `packages/components/nodes/agentflow/Agent/Agent.ts:725`、`packages/components/nodes/agentflow/LLM/LLM.ts:566` | 上游原生或二开修改既有文件 | 🔴勿动 | 不为追求数量下降修改既有上游风格文件。 | 计划要求只清二开新增，避免破坏可持续合并上游。 |

## 6. TODO/FIXME/HACK 清单

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| settings 过期 TODO | `packages/server/src/services/settings/index.ts:1` | 二开修改既有文件 | 🟢可删 | 删除注释即可，勿改逻辑。 | `getSettings` 已实现并被 UI config 使用。 |
| evaluator config TODO | `packages/ui/src/views/evaluators/evaluatorConstant.js:1` | 二开修改既有文件 | 🟡待议 | 转为 issue；等 evaluator 配置抽象专项处理。 | TODO 指向配置文件迁移，非无用注释。 |
| FollowUpPrompts 保存缺陷 | `packages/ui/src/ui-component/extended/FollowUpPrompts.jsx:367` | 二开修改既有文件 | 🟡待议 | 转 bug/测试，不在清理阶段删除。 | 注释描述“不改 prompt 不会保存”的真实行为缺口。 |
| export-import 临时修复 | `packages/server/src/services/export-import/index.ts:601` | 二开修改既有文件 | 🟡待议 | 转 issue 或补测试后重构。 | 注释明确是 temporary fix。 |
| Canvas paste TODO | `packages/ui/src/views/canvas/index.jsx:539`、`packages/ui/src/views/agentflowsv2/Canvas.jsx:631` | 二开修改既有文件 | 🟡待议 | 归入 Canvas 输入专项，不直接删。 | 两处同构，可能是实际 UX bug 的防御。 |
| public site 资产 TODO | `packages/ui/src/views/publicSite/sections/Enterprise.jsx:15`、`packages/ui/src/views/publicSite/sections/shared.jsx:264` | 二开新增 | 🟡待议 | 等正式资产替换后删除。 | TODO 指向真实待办：架构截图/产品截图。 |
| DISABLED_NODES 配置 TODO 不适用 | `.planning/flowops-second-dev/disabled-nodes.md:45` | 二开规划文档 | 🔴勿动 | 不把规划文档内说明当作代码 TODO 清理。 | 该文档是配置策略说明，非代码残留。 |

## 7. 测试健康

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| 真 skip 测试均在上游 cypress | `packages/server/cypress/e2e/2-variables/variables.cy.js:15`、`:27`、`:34`、`:46` | 上游原生 | 🔴勿动 | 不处理；避免把上游 e2e 历史债纳入二开清理。 | `git diff --name-status upstream/main...HEAD -- packages/server/cypress/e2e/2-variables/variables.cy.js` 无输出。 |
| entitlement 单测覆盖基础源 | `packages/server/src/services/entitlement/index.test.ts:25`、`:40`、`:42` | 二开新增 | 🔴勿动 | 保留；后续补 cloud subscription 派生测试。 | 当前覆盖 `FLOWOPS_LOCAL_COMMERCIAL`、`createEntitlementSource`、cloud source 实例，但 cloud source 仍是 free stub。 |
| entitlement feature gate 只有单测无生产接入 | `packages/server/src/services/entitlement/featureGate.test.ts:9`、`packages/server/src/services/entitlement/featureGate.ts:26` | 二开新增 | 🟡待议 | 人工决定接入或删除；决定前不改测试。 | 测试存在，但生产 import 未发现。 |
| IAM self 测试较完整 | `packages/server/src/iam/self/auth/selfAuthService.test.ts:64`、`packages/server/src/iam/self/rbac/permissions.test.ts:101` | 二开新增 | 🔴勿动 | 保留；后续增加 IAM self 与 entitlement tier 的集成矩阵。 | self auth、admin、rbac、identity、migration 等测试存在。 |
| 商业化闭环测试缺口 | `packages/server/src/services/payment/index.ts:189`、`packages/server/src/controllers/billing/index.ts:11`、`packages/server/src/services/entitlement/index.ts:297` | 二开新增 | 🟡待议 | 补“支付成功后 /billing/me entitlement tier 改变”的集成测试，再改实现。 | 付款写旧 billing，账单 overview 合并旧 billing 和 entitlement，但 subscription entitlement 恒 free。 |
| 依赖/死代码工具不可用 | `.planning/flowops-second-dev/codex-code-health-audit-plan.md:45`、`:55` | 审计工具链 | 🟡待议 | 本次不安装新包；后续可在独立工具任务引入 depcheck/ts-prune。 | `npx --no-install ts-prune` 和 `npx --no-install depcheck` 均因本地未安装而退出。 |

## 8. 调试残留

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| 注释掉的 EventSource debug | `packages/ui/src/views/chatmessage/ChatMessage.jsx:1136` | 二开修改既有文件 | 🟢可删 | 人工确认后删除注释行。 | `//console.log('EventSource Open')` 为注释掉的调试代码。 |
| 注释掉的 chunk debug | `packages/ui/src/views/docstore/ExpandedChunkDialog.jsx:231` | 二开修改既有文件 | 🟢可删 | 人工确认后删除注释行。 | `//console.log(add)` 为注释掉的调试代码。 |
| API Dialog 中 console.log 是示例代码文本 | `packages/ui/src/views/vectorstore/VectorStoreDialog.jsx:153`、`packages/ui/src/views/docstore/DocStoreAPIDialog.jsx:113` | 二开修改既有文件 | 🔴勿动 | 不按运行时日志删除；若文档示例风格要改，单独处理。 | 出现在 API code dialog 示例片段中，用于展示用户调用方式。 |
| IAM provider bootstrap info | `packages/server/src/iam/provider.ts:14` | 二开新增 | 🟡待议 | 可后续评估是否改 logger；当前保留。 | 发生在 enterprise dist 缺失时，属于启动期诊断。 |
| migration/desktop 脚本 console | `packages/server/scripts/migrate-sqlite-to-pg.js:28`、`packages/server/scripts/migrate-enterprise-to-flowops-iam.js:320`、`desktop/server-bootstrap.js:27` | 二开新增 | 🔴勿动 | CLI/桌面 bootstrap 保留 console。 | 命令行脚本需要 stdout/stderr 反馈，不应机械替换 logger。 |
| 内容安全 runner console.warn | `packages/components/nodes/moderation/ContentSafetyModeration/ContentSafetyModerationRunner.ts:52`、`:144`、`:154` | 二开新增 | 🟡待议 | 后续可改为节点日志/运行日志接口；当前不删。 | warn 描述审核服务异常、未配置、放行策略，属于运行可观测性。 |

## 9. 仓库卫生

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| `.planning/flowops-second-dev` 计划文件多 | `.planning/flowops-second-dev/task_plan.md:1`、`.planning/flowops-second-dev/progress.md:1` | 二开新增 | 🟡待议 | Phase 2 可按“已执行/仍活跃/历史归档”分批整理，不在代码清理混做。 | `rg --files .planning/flowops-second-dev` 统计 36 个文件，计划原预估 33 个。 |
| `.planning` 含图片资产 | `.planning/flowops-second-dev/credentials-dates.png`、`.planning/flowops-second-dev/variables-dialog.png` | 二开新增 | 🟡待议 | 若已进入 docs 或测试快照，可归档；否则保留到对应计划结项。 | 两个 png 位于规划目录，不是运行时代码。 |
| docs 新增 10 个文件 | `docs/iam-contract.md:1`、`docs/iam-selfbuild.md:1`、`docs/任务总账.md:1` | 二开新增 | 🟡待议 | 先保留；后续由人工决定哪些迁入正式产品文档，哪些进 archive。 | `git diff --name-only upstream/main...HEAD -- docs` 统计 10 个。 |
| 临时 Office/PDF 产物 | 仓库根 `find . -name '~$*' -o -iname '*.docx' -o -iname '*.xlsx' -o -iname '*.pptx' -o -iname '*.pdf'` | 当前 worktree | 🔴勿动 | 未发现，无需清理。 | 命令输出为空；主工作区的未提交 docx 不在本隔离 worktree 中。 |
| scripts 新增 9 个文件 | `scripts/fork-divergence.sh:1`、`scripts/iam-clean-search.sh:1`、`scripts/i18n-codemod/index.js:344` | 二开新增 | 🟡待议 | 保留 fork/IAM/i18n 工具；`residual-english-report.md` 可在 i18n 完结后归档。 | `git diff --name-only upstream/main...HEAD -- scripts` 统计 9 个；scripts 是二开维护工具。 |
| deploy template 含商业化 env | `deploy/.env.example:29`、`deploy/.env.example:33`、`deploy/.env.example:34` | 二开新增 | 🔴勿动 | 保留；它是 DISABLED_NODES、FLOWOPS_EDITION、license/payment 配置承载点。 | 私有化部署模板记录 47 个禁用节点和 entitlement/payment env。 |

## 10. 依赖健康

| 项 | 文件:行 | 归属 | 风险 | 建议处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| 国产云向量库 SDK | `packages/components/package.json:94`、`packages/components/package.json:119`、`packages/components/nodes/vectorstores/BaiduVectorDB/client.ts:138`、`packages/components/nodes/vectorstores/VikingDB/client.ts:2` | 二开新增 | 🔴勿动 | 保留。 | `@mochow/mochow-sdk-node` 和 `@volcengine/openapi` 分别被 Baidu VectorDB、VikingDB 使用。 |
| 导出节点依赖 | `packages/components/package.json:132`、`:136`、`:178`、`packages/components/nodes/agentflow/DocumentExport/DocumentExport.ts:1`、`packages/components/nodes/agentflow/SpreadsheetExport/SpreadsheetExport.ts:4`、`packages/components/nodes/agentflow/PptxExport/PptxExport.ts:5` | 二开新增 | 🔴勿动 | 保留。 | `docx`、`exceljs`、`pptxgenjs` 均被导出节点直接引用。 |
| UI i18n 依赖 | `packages/ui/package.json:52`、`packages/ui/package.json:61`、`packages/ui/src/i18n/index.js:1`、`packages/ui/src/i18n/index.js:2` | 二开新增 | 🔴勿动 | 保留。 | `i18next`、`react-i18next` 是全量 i18n 运行时。 |
| UI 动画依赖 | `packages/ui/package.json:49`、`packages/ui/src/views/publicSite/index.jsx:8`、`packages/ui/src/views/landing/index.jsx:5`、`packages/ui/src/views/auth/signIn.jsx:9` | 二开新增 | 🔴勿动 | 保留。 | `gsap` 被官网、landing、登录页使用。 |
| 账单二维码依赖 | `packages/ui/package.json:58`、`packages/ui/src/views/billing/index.jsx:28`、`packages/ui/src/views/billing/index.jsx:424` | 二开新增 | 🔴勿动 | 保留。 | `qrcode.react` 用于支付二维码。 |
| depcheck 不可用 | `.planning/flowops-second-dev/codex-code-health-audit-plan.md:55` | 审计工具链 | 🟡待议 | 不安装新依赖；本次用 `rg` 人工核对新增依赖引用。 | `npx --no-install depcheck` 因本地无包退出，符合“禁止 pnpm add”的审计约束。 |
| `@tabler/icons-react` 版本不齐 | `packages/ui/package.json:1`、`packages/agentflow/package.json:1`、`packages/observe/package.json:1` | 上游/工作区既有 | 🟡待议 | 本轮不动；如后续依赖治理，再统一 workspace 版本。 | 快速核查发现 ui 与 agentflow/observe 版本不同，但不属于本次新增依赖直接风险。 |

## 附录 A. Entitlement 7 文件口径

| 文件 | 状态 | 角色 | 处置建议 |
| --- | --- | --- | --- |
| `packages/server/src/services/entitlement/index.ts` | 二开新增 | entitlement 核心 service、source、plan catalog、credit consumption | 🔴保留，优先补 cloud source 设计 |
| `packages/server/src/services/entitlement/index.test.ts` | 二开新增 | 核心 service/source 测试 | 🔴保留，补 cloud subscription 测试 |
| `packages/server/src/services/entitlement/featureGate.ts` | 二开新增 | entitlement 功能门 middleware | 🟡待议，接入或删除二选一 |
| `packages/server/src/services/entitlement/featureGate.test.ts` | 二开新增 | feature gate 单测 | 🟡随实现裁定 |
| `packages/server/src/database/entities/Entitlement.ts` | 二开新增 | entitlement 当前快照表 | 🔴保留 |
| `packages/server/src/database/entities/EntitlementUsage.ts` | 二开新增 | credit 消耗幂等记录 | 🔴保留 |
| `packages/server/src/utils/quotaUsage.ts` | 二开修改既有 | entitlement 与旧 quota/billing 的运行时接入点 | 🔴保留，待迁移闭环后再删 fallback |

## 附录 B. 未执行项

未运行测试/build。原因：Phase 1 是只读审计，目标是产出报告，不做代码行为验证或清理。
未安装 `ts-prune`/`depcheck`。原因：计划禁止 `pnpm add`，`npx --no-install` 本地不可用后改用 `rg` 和人工核对。
