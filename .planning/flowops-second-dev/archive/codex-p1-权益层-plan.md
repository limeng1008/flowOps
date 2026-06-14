# Codex 执行计划：T-B / P1 权益层（Entitlement + 资源点）

> 读 `codex-任务总览-权限付费双形态.md` 第 2 节（共享纪律）后再执行。
> 分支：`git worktree add .../codex-entitlement -b feat/entitlement release/flowops-commercialization-v1`

## 0. 目标
建一个**与"来源"解耦**的统一权益层：套餐/席位/资源点/功能开关/到期。**两形态共用**（云=在线订阅、私有=License）。资源点**复用现有 `quotaUsage` 埋点**，不另造并行计量。

## 1. 现状（已勘明）
- 计量埋点：`packages/server/src/utils/quotaUsage.ts`、`utils/buildChatflow.ts`、`services/predictions/index.ts`（已有调用计量点）。
- 平台/许可：`IdentityManager.ts`（已有 `FLOWOPS_LOCAL_COMMERCIAL` + `Platform` + `isLicenseValid()`）。
- ⚠️ 旧在线 billing 已被 `localCommercial` 重构移除——**本任务不恢复旧 billing 实体**，建新的轻量权益层。
- 数据层：`database/entities/` + 4 库迁移目录（sqlite/mysql/mariadb/postgres，需同步加迁移）。

## 2. 任务拆解

### T-B1 Entitlement 模型
- 新增实体/接口 `Entitlement`：`{ scopeId(org/workspace), tier, seats, creditsTotal, creditsBalance, features[], concurrency, expireAt, source }`。
- 4 库迁移（与现有迁移风格一致）。
- 验收：可读写；tsc + jest 通过。

### T-B2 EDITION 开关
- `FLOWOPS_EDITION = cloud | private`（默认 private）决定权益来源与行为；写入 `deploy/.env.example` + 文档。
- 验收：开关切换走不同 source（见 T-B3）。

### T-B3 双来源接口 `EntitlementSource`
- `interface EntitlementSource { resolve(scopeId): Promise<Entitlement> }`。
- `LocalEntitlementSource`（private）：先把 `FLOWOPS_LOCAL_COMMERCIAL` → 映射到某 tier（完整签名 License 留 **T-C**）。
- `SubscriptionEntitlementSource`（cloud）：先 stub 返回"免费版"（在线充值留 **T-D**）。
- 工厂按 `FLOWOPS_EDITION` 选 source。
- 验收：两种 EDITION 各解析出正确 Entitlement。

### T-B4 资源点计量（复用埋点）
- 在 `quotaUsage`/`buildChatflow` 计量点：按"模型 → 资源点成本表"扣 `creditsBalance`；余额不足 → 拦截并返回**清晰中文错误**（"资源点不足，请充值/升级"）。
- 成本表做成配置（参考 `权限与付费改造计划.md` 附录 D）。
- **幂等/准确**：一次调用只扣一次，失败不扣或回滚。
- 验收：单测——正常扣点、不足拦截、不重复扣。

### T-B5 功能开关中间件
- `featureGate(feature)`：读 `Entitlement.features[]`，未授权返回清晰错误（"该功能需专业版"）。
- 验收：未授权功能被拦截；授权放行。

### T-B6 套餐定义（seed）
- 免费/专业/团队/企业 4 档 Entitlement 模板（席位/资源点/features，参考附录 A、C）。
- 验收：注册/激活后获得对应档位权益。

### T-B7 i18n + 门禁 + 测试
- en/zh 同步（套餐名、资源点、各拦截文案）。
- 门禁：`tsc` / `npx jest payment billing entitlement quota`（按实际命名）/ `fork-divergence` / UI build（若动 UI）。

## 3. 不要碰 / 红线
- ❌ 不恢复旧 billing 实体/服务；建新轻量权益层。
- ❌ 资源点扣减必须幂等准确（参考 payment-p0 里 `settlePaidOrder` 的原子更新思路）。
- 核心文件改动登记 `FORK-CHANGES.md`（分类 `Entitlement`）。

## 4. 交付
- 分支 `feat/entitlement`，提交按 T-B1…T-B7 拆分，Codex trailer。
- 末尾一句话验收说明（双来源解析 + 扣点/拦截证据），等维护者评审，不自合 main。
