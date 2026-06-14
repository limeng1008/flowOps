# FlowOps 商业化闭环补全(双形态)· Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**按 T1→T3 顺序,每任务过门禁再提交;任何门禁失败或拿不准停下报告,禁止猜改支付/授权核心。**
>
> ## 背景
>
> FlowOps 商业模式为**双形态**(2026-06-14 拍板):① 私有化买断(self 轨 + license)② cloud 在线付费 SaaS(扫码付费 + 套餐/额度计费)。代码健康审计(`docs/health-audit/report.md`)发现 cloud 付费闭环**断裂**:
>
> -   支付成功 → `services/payment/index.ts:189` 调 `BillingService.setOrganizationSubscription()` 写 `BillingSubscription`(status=active,planId=订单 planCode)。
> -   **但** `services/entitlement/index.ts:297` 的 `SubscriptionEntitlementSource.resolve()` **恒返回 `templateSnapshot(scopeId, 'free', 'subscription')`**——不读 BillingSubscription。
> -   结果:**用户付了钱,额度/套餐不升级**。这是 cloud 形态的核心功能缺口。
>
> 本计划打通 payment→entitlement,并理清双轨语义债。**不碰自建 IAM(已完成)、不碰 IdentityManager.ts(FlowiseAI 商业授权,禁改)。**

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根对应 worktree;**Node 20**;PostgreSQL(self 轨/cloud 轨都用)。
-   从 **`main`** 切分支 **`codex/billing-closure`**。不 push、不碰 main,做完留人工 review。
-   commit 结尾 `Co-Authored-By: Codex <noreply@openai.com>`。

### 0.2 ⚠️ 铁律

1. **不改 `IdentityManager.ts`**(FlowiseAI 商业授权文件)、**不碰 `iam/**` 自建 IAM\*\*(已完成,本计划无关)。
2. **不破坏 self 私有化轨**:`LocalEntitlementSource`/`LicenseEntitlementSource` 的现有行为零回归(private 部署不受影响)——改动集中在 cloud 轨的 `SubscriptionEntitlementSource`。
3. 钱相关:**分(整数)为单位**,幂等,订单/订阅状态机**只进不退**(沿用既有商业化铁律);密钥只读 env。
4. 新增实体列 = **4 库 migration**(postgres/mysql/mariadb/sqlite),时间戳从 `1779000000000` 起递增;日期列 `type: Date`(守护测试 `sqliteDateColumns.test.ts`)。
5. 不 `pnpm add`(手改 package.json + `pnpm install`,本计划应零新依赖)。

### 0.3 现状接口(已勘察,照此动手)

-   `EntitlementSource` 接口(`entitlement/index.ts:39`):`resolve(scopeId): Promise<EntitlementSnapshot>`。
-   `EntitlementTier = 'free' | 'pro' | 'team' | 'enterprise'`(`:10`);`ENTITLEMENT_TEMPLATES[tier]`(`:129`)各 tier 的 seats/credits/features/concurrency 模板;`templateSnapshot(scopeId, tier, source)`(`:252`)。
-   `licenseToEntitlement(scopeId, license)`(`:283` 后)= **现成范式**:从 license 的 tier + payload(creditsTotal/seats/features)产出 snapshot,可类比派生 subscription 版。
-   `createEntitlementSource()`(`:303`):`edition===cloud ? SubscriptionEntitlementSource : LocalEntitlementSource`。
-   `BillingSubscription`:`organizationId` / `planId` / `status`(active 等)。`BillingPlan`:`code`(唯一)/ `quotas`(JSON 文本)/ `monthlyPriceCents`——**当前无 entitlement tier 字段**。
-   payment 结算:`payment/index.ts:189` 幂等更新订单 paid 后 `setOrganizationSubscription({organizationId, planId: order.planCode})`。

---

## T1 · 打通 cloud 付费 → entitlement 闭环(核心)

**目标**:cloud 轨下,org 有 active `BillingSubscription` 时,`SubscriptionEntitlementSource.resolve()` 返回该套餐对应的真实 tier/quotas/credits;无 active 订阅才回 free。

### 1.1 BillingPlan → EntitlementTier 映射

二选一(**在报告里给人工选,或你按推荐做并报告**):

-   **方案 A(推荐,正规)**:`BillingPlan` 加列 `entitlementTier varchar`(值 ∈ EntitlementTier);4 库 migration(`1779000000000`);更新建表种子/已有 plan 行回填(`local_dev_pro`→enterprise 等,以现有 plan code 实测为准)。
-   **方案 B(轻量)**:`entitlement/index.ts` 内加 `PLAN_CODE_TO_TIER` 常量映射(planCode→tier),无 migration。运营新增套餐需改代码。

> 默认走 **A**(套餐是可运营数据,tier 应随 plan 走);若 plan 表改动牵连过大,停下报告再定。

### 1.2 SubscriptionEntitlementSource 派生实现

`SubscriptionEntitlementSource.resolve(scopeId)` 改为:

1. 查 `BillingSubscription` where organizationId=scopeId 且 status=active(取最新)。
2. 无 → `templateSnapshot(scopeId, 'free', 'subscription')`(保持现状,免费版)。
3. 有 → 查对应 `BillingPlan` → 取 `entitlementTier`(方案 A)或映射(方案 B);用 `templateSnapshot(scopeId, tier, 'subscription')` 为基,**若 plan.quotas 有更具体额度则覆盖对应字段**(类比 `licenseToEntitlement` 用 payload 覆盖 template 的写法,保持一致风格)。
4. 订阅过期/取消(status≠active)按 free 处理。

**注意**:`resolve` 要拿 DataSource/Repository——照 entitlement service 现有取 repo 的方式(`getRunningExpressApp().AppDataSource` 或 service 注入,**按本文件现有范式**,别新造)。

### 1.3 测试

-   单测(照 `entitlement/index.test.ts` 范式,mock 数据源):org 有 active subscription(plan=pro/team/enterprise)→ resolve 返回对应 tier 且非 free;无订阅 → free;过期订阅 → free。
-   集成:支付成功路径(payment 结算 → setOrganizationSubscription)后,同一 org 的 entitlement resolve tier 升级(可在 service 层 mock 验证,不依赖真实支付网关)。

**T1 DoD**:tsc 0、jest 全过;**真机(cloud 轨)**:`FLOWOPS_EDITION=cloud` 起服,造一条 active BillingSubscription(plan=pro)→ `GET /billing/me` 的 entitlement overview tier=pro(非 free);删订阅 → 回 free。完整支付宝/微信沙箱扫码链路标「待沙箱凭证人工验」(无凭证不阻塞)。**self/private 轨回归**:不设 cloud,LocalEntitlementSource 行为与改前一致。

---

## T2 · 双轨语义理清(文档 + 我方侧收敛,不碰禁改文件)

报告指出 `FLOWOPS_LOCAL_COMMERCIAL` 是**双入口**:`IdentityManager.ts:87/112`(平台授权 enterprise)+ `entitlement/index.ts`(套餐 tier enterprise)。

-   **`IdentityManager.ts` 禁改**(商业授权文件)——它那个入口保持原样。
-   我方 entitlement 侧已有 `isLocalCommercialEnabled()` helper(`:198`)——确认 entitlement 内对该 env 的解析**全部走这一个 helper**(若有散读,收敛到 helper)。
-   产出 `docs/commercialization-model.md`:画清「平台授权(IdentityManager/IAM)」vs「套餐额度(entitlement)」的边界,说明 `FLOWOPS_LOCAL_COMMERCIAL` 为何同时影响两者、各自语义、双形态下每个 env/edition 组合的预期行为(private+local_commercial / cloud+subscription / self 轨 等)。
-   **self 轨 feature 语义一致**:报告指 `FlowOpsIdentity.getFeaturesByPlan()`(全 true)与 `getSelfEnterpriseFeatures()`(`feat:sso-config`=false)不一致。核对两者消费点,统一 `feat:sso-config`(self 无 SSO 应一致为 false 或文档说明为何不同);改动需过 IAM self 测试,拿不准停下报告。

**T2 DoD**:`commercialization-model.md` 提交;entitlement 内 env 解析单一入口;tsc/jest 过;双轨真机不回归。

---

## T3 · storage 维度接 entitlement(可选,人工确认后做)

报告:`quotaUsage.ts:217/223` 的 storage 额度仍读旧 subscription/cache quota,未接 entitlement(flows/users/predictions 已接)。

-   若产品确认 storage 是商业化计量维度:在 entitlement 模型加 storage dimension + 在 `quotaUsage` 接入(照 flows/predictions 已接的范式)。
-   否则:文档标注「storage 继续由旧 quota 管,非 entitlement 维度」,不动代码。

**T3 DoD**(若做):tsc/jest 过;storage 超限走 entitlement 路径;双轨不回归。

---

## 验收门禁(每任务通用)

1. `cd packages/server && npx tsc --noEmit` 0 错;`npx jest` 全过(尤其 entitlement/billing/payment 套件)。
2. 4 库 migration 齐全(若 T1 走方案 A);全新库 + 已有库启动均不崩(hasColumn/IF NOT EXISTS 守卫)。
3. **cloud 轨真机**:active 订阅 → /billing/me tier 升级;无订阅 → free。
4. **self/private 轨真机**:LocalEntitlementSource 零回归。
5. `bash scripts/fork-divergence.sh` 通过(若动 ledger 记账文件)。

## 边界(别越界)

-   不碰 `IdentityManager.ts`、`iam/**`、上游核心、自建 IAM 双轨开关。
-   不删旧 `BillingService`(报告标 🔴,/billing/me 仍用它做 legacy 视图)——只让 entitlement 从订阅派生,旧 billing 作为历史/兼容视图保留。
-   支付网关真实收款(营业执照/商户号/公网回调/ICP)不在本计划——只打通「订阅状态 → entitlement」这段内部闭环。
-   拿不准(尤其 plan→tier 映射方案、resolve 取 repo 方式、self 轨 feature 语义)停下报告。
