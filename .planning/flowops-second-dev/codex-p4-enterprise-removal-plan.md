# FlowOps P4:物理移除 FlowiseAI enterprise,完全自有 IAM · Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**大工程,必须分阶段、每阶段过门禁再继续;任一阶段 self 轨跑不通就停下报告,禁止一把梭删除。**

## 背景

FlowOps = Flowise 二开,要**售卖**(私有化 + cloud)。`packages/server/src/enterprise/**`(111 个 .ts)+ `packages/server/src/IdentityManager.ts` 是 **FlowiseAI 的商业授权代码(禁售卖/分发)**。项目已自建 IAM(`FLOWOPS_IAM=self`,`packages/server/src/iam/self/**`:flowops\_ 六表 + JWT + RBAC + 工作区隔离),并有出货脚本 `scripts/build-ship.sh` 在 **build 时**物理删除 enterprise dist —— 即**卖出去的产物本就不含 enterprise**。

**P4 = 把这件事在源码层做实**:源码里彻底删掉 FlowiseAI enterprise,运行时只走自建 IAM。动机不只是"干净":self 接缝 `iam/` 目前还有 5 处运行时 `require('../enterprise/...')`,这些桥是本项目反复出 bug 的根源(本周的 `WorkspaceShared` 500、member 鉴权等都是它);根除后既消 bug 又消版权隐患。

## 0. ⚠️ 版权红线(最重要,定义了"复用"的边界)

用户要求:"能复用的、能改造成自己 enterprise 逻辑的代码不删,剩下的删"。**正确理解 = clean-room**:

-   **绝不保留、不"重构后留下"FlowiseAI enterprise 的源码**。把它改改留下来 = 衍生作品 = 仍是禁售卖的授权代码,等于自毁项目一路的清洁室努力。
-   **"复用"= 功能复用,不是代码复用**:某个 enterprise 功能 self 还需要(如密码校验、加密哈希、工作区作用域、RBAC 校验)→ **用我们自己的 clean-room 实现**(self 已有的就用,没有的新写一份**自己的**),然后把 FlowiseAI 的那份删掉。
-   **终态:仓库源码里 `enterprise/` 与 `IdentityManager.ts` 完全不存在,`grep -rn "enterprise" packages/server/src | grep -v iam/self` ≈ 0**(除注释/历史说明)。
-   判断某段"算不算照搬 FlowiseAI" 拿不准 → 重写一份自己的,别 copy。

## 1. 环境 / 分支 / 纪律

-   仓库根;**Node 20**;从 **`main`** 切分支 **`codex/p4-enterprise-removal`**;不 push main,做完留人工 review。
-   **分阶段提交**(每个 Phase 一个或多个 commit),不要一个巨型 commit。commit 结尾 `Co-Authored-By: Codex <noreply@openai.com>`。
-   **铁律**:任何阶段结束都要保证 `FLOWOPS_IAM=self` 全新空库能起服、能注册首管、能登录、能建 chatflow;`npx tsc --noEmit` + `npx jest` 全过。跑不通就停,别继续删。
-   参考:`docs/iam-seam-ledger.md`(接缝桥账本)、`scripts/build-ship.sh` / `verify-ship-dist.sh`(已实现的 dist 层删除逻辑,可作"该删什么"的清单依据)。

## 2. 现状:self 接缝对 enterprise 的 5 处运行时耦合(P4 要逐个切断)

| 接缝文件            | 依赖的 enterprise                                                                                                                                                                       | self 该用什么替代                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `iam/security.ts`   | `utils/encryption.util`(getHash)、`utils/validation.util`(validatePasswordOrThrow)                                                                                                      | self 自己的哈希/密码校验工具(clean-room 新写)                                |
| `iam/middleware.ts` | `rbac/PermissionCheck`                                                                                                                                                                  | self 自己的 RBAC 校验(self/rbac 已有权限集,补一个自有 check)                 |
| `iam/query.ts`      | `utils/ControllerServiceUtils`(工作区作用域/活动工作区)                                                                                                                                 | self 自己的工作区作用域工具(部分已在 `iam/self/workspace/query.ts`)          |
| `iam/entities.ts`   | enterprise 实体(Org/Role/User/Workspace/WorkspaceUser 已映射 flowops\_;`WorkspaceShared/WorkspaceUsers/LoginMethod/LoginSession/LoginActivity/OrganizationUser` 在 self 为 `undefined`) | 还需要的实体 → 用 flowops\_ 实体;不需要的(共享/SSO 相关)→ 连同消费方一并去掉 |
| `iam/identity.ts`   | `../IdentityManager`(App 身份槽位)                                                                                                                                                      | self 的 `FlowOpsIdentity` 翻转为 `App.identityManager`(P4 核心动作)          |

> 其余 `require('../enterprise')` 的消费方多是 migration 注册(`database/migrations/*/index.ts` 引 enterprise migration),`build-ship.sh` 已处理,P4 一并转正。

## 3. 方法论:分 6 个 Phase,逐个验证

### Phase A · 全量盘点 + 分类(只读,产出清单,不改代码)

-   遍历 `enterprise/**`,对每个模块判定三类:**(留-功能)self 仍需 → 列出 self 对应实现/缺口**;**(已替代)self 已有自有实现 → 仅需切桥**(如 email 已是 `iam/self/email`);**(弃)self 不需要 → 删**(如 SSO、cloud 计费 enterprise 侧、audit 若 self 不用)。
-   产出 `docs/p4-enterprise-inventory.md`:每个 enterprise 文件/能力 → 分类 + 处置动作 + 谁在消费它。**这是后续 Phase 的依据,先评审。**

### Phase B · 把"仍需但还在桥接 enterprise"的功能,clean-room 落到 self

按 §2 表,逐个为 `security/middleware/query/entities` 写**自有实现**(在 `iam/self/**`),先让接缝在 self 模式指向自有实现、enterprise 仍保留作 enterprise 模式后备。**每补一个,过 tsc/jest + self 真机冒烟,再下一个。**

### Phase C · 切断所有 self 接缝对 enterprise 的 require/import

`iam/security.ts`、`iam/middleware.ts`、`iam/query.ts`、`iam/entities.ts` 改为 self 模式**完全不 require enterprise**(`lazyEnterprise.test.ts` 已守这条,确保不回归)。enterprise 分支可暂留(给 `FLOWOPS_IAM=enterprise`),但 self 路径零 enterprise。

### Phase D · 翻转 App 身份槽位到 self

`iam/identity.ts` + App:`App.identityManager` 槽位类型从 legacy `IdentityManager` 翻为 `IFlowOpsIdentity`,self 模式注入 `FlowOpsIdentity`,移除"擦除桥/兼容垫"。核对所有 `getRunningExpressApp().identityManager.*` 调用点在 self 下走自有实现。

### Phase E · 物理删除 enterprise 源码

确认 self 轨已 100% 自洽后:删 `packages/server/src/enterprise/`、`packages/server/src/IdentityManager.ts`;清理 `database/migrations/*/index.ts` 里对 enterprise migration 的引用(参照 build-ship 已删的那批);删 `FLOWOPS_IAM=enterprise` 分支与 `provider.ts` 的双轨开关(只剩 self);`build-ship.sh`/`verify-ship-dist.sh` 简化为"无 enterprise 可删"或退役。

### Phase F · 终验

`grep -rn "enterprise\|IdentityManager" packages/server/src | grep -vE "iam/self|注释" ` ≈ 0;`tsc`+`jest` 全过;4 库 migration 全新空库起服正常;self 真机:注册首管 → 登录 → 建 chatflow→ 凭证下拉 → 生成智能体流 全通。

## 4. 验收(DoD,整体)

1. 源码零 `enterprise/` 与 `IdentityManager.ts`;self 路径零 `require('../enterprise')`。
2. 不再有 `FLOWOPS_IAM` 双轨开关(只有 self);文档相应更新。
3. `cd packages/server && npx tsc --noEmit` 0 错;`npx jest` 全过(含 `lazyEnterprise`、self iam 套件)。
4. 4 库 migration 全新空库 + 已有库均能起;self 真机端到端冒烟通过(见 Phase F)。
5. `bash scripts/fork-divergence.sh` 通过(若动账本);`docs/iam-selfbuild.md`、`product-direction` 记忆相应更新为"单轨 self"。
6. 全程未 copy/保留 FlowiseAI enterprise 源码(清洁室)。

## 5. 边界 / 风险

-   **这是高风险大重构**;务必分 Phase、每 Phase 可独立验证、可回滚;拿不准就停下报告,绝不一次性删完再调试。
-   不动 flow 引擎 / 节点加载 / prediction 主流程等上游核心。
-   cloud 形态(billing/payment/entitlement)若依赖 enterprise 的部分,在 Phase A 标注;cloud 多租户本身是未完成项,P4 不负责补,但不能因删 enterprise 把 cloud 编译搞崩——必要时 cloud 侧也切到 self 或留 TODO。
-   先做 Phase A 盘点并**停下让人工评审分类**,再进 B~E。
