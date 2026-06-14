# Codex 执行计划：3b 计量统一（billing → 权益层）

> 共享纪律见 `codex-任务总览-权限付费双形态.md` §2（独立 worktree、Node 20、提交前 tsc/jest/fork-gate/UI build、不 pnpm add、Codex trailer、不自合 main）。
> 基线：`main`（收敛后双形态主干）。分支 `feat/metering-unify`。

## 0. 背景
双形态收敛后，`packages/server/src/utils/quotaUsage.ts` **同时存在两套计量**：
- `checkUsageLimit`(5 参) —— 旧 billing 维度限额（flows/predictions/…），被全代码调用方使用；
- 权益层资源点扣减（`EntitlementService` + `consumeCreditsForEntitlement`）。
两者**并存冗余**。本任务把限额检查统一到**权益层**，billing 退为历史/数据源。

## 1. 目标
- 限额/配额检查走 **Entitlement**（tier/seats/features/credits）。
- **保留 `checkUsageLimit` 函数签名**（5 参），只换内部实现 → 不改几十处调用方。
- `BillingService` 标记 deprecated，先保留数据，不删实体（避免破坏 Billing-center-v1）。

## 2. 任务
- **T1 盘点**：列出 `checkUsageLimit` 所有调用方 + 各自检查的维度（`grep -rn checkUsageLimit packages/server/src`）。
- **T2 EntitlementService 暴露限额能力**：`checkLimit(scopeId, dimension, requested)` → 读 Entitlement（seats/features/credits）判断放行/拦截，返回清晰中文错误。
- **T3 改 `checkUsageLimit` 内部**：保留签名，内部委托给 T2；billing 调用降为可选回退（或移除）。
- **T4 `updatePredictionsUsage`**：统一走资源点扣减（已部分接入），移除/收敛 `recordBillingTokenUsage` 的重复计量。
- **T5 测试**：限额放行/拦截、降级回退、不重复计量；`jest quotaUsage entitlement billing`。

## 3. 红线
- ⚠️ **安全攸关**（配额绕过）——改完务必有"超额被拦截"的测试证据。
- **渐进**：保签名、保 billing 数据，先并行后切换，可回退。
- 核心文件改动登记 `FORK-CHANGES.md`（分类 `Entitlement`）。

## 4. 验收
tsc 0 / jest 全绿（含超额拦截）/ fork-gate / 一句话验收说明（统一前后对比）。等评审，不自合 main。
