# Codex 任务总览：权限 + 付费 双形态改造

> 总目标：一套代码两形态——**云 SaaS（注册→体验→充值）** + **私有部署（License）**；扣子式简化权限 + 统一权益层付费。
> 设计依据：同目录 `权限与付费改造计划.md`（含 4+1 角色、5 张关系表）。

---

## 1. 全部 Codex 任务（按依赖排序）

| 任务 | 内容 | 依赖 | 形态 | 建议分支 | 状态 |
| --- | --- | --- | --- | --- | --- |
| **T-A** P0 权限简化 | 4+1 预置角色 + 隐藏颗粒权限/组织层 UI | 无 | 共用 | `feat/perm-simplify` | ✅ 就绪（详见 `codex-p0-权限简化-plan.md`）|
| **T-B** P1 权益层 | Entitlement + 资源点计量 + 双来源接口 + EDITION 开关 | 无（可与 A 并行）| 共用 | `feat/entitlement` | ✅ 就绪（详见 `codex-p1-权益层-plan.md`）|
| **T-C** P2 私有 License | 签名 License 作私有版权益来源（升级君子协议）| T-B | private | `feat/license` | ⏳ 待 B 落地后细化 |
| **T-D** P2 云 支付+注册 | 恢复 `feat/payment-p0` 作云模块 + 注册增强(手机/防刷) | T-B | cloud | `feat/cloud-billing` | ⏳ 待 B |
| **T-E** P2 套餐/资源点 UI | 套餐页 + 资源点余额/用量看板 + 升级引导 | T-B | 共用 | `feat/billing-ui` | ⏳ 待 B |
| **T-F** P3 合规 | ICP/经营许可、生成式AI备案+安评、企业商户号 | — | cloud | （**非代码，运营侧办理**）| 并行进行 |

**执行顺序**：先 **T-A / T-B**（地基、共用、与合规无关，可并行）→ 再 **T-C/D/E**（依赖 B）→ T-F 你那边并行办。

---

## 2. 每个 Codex 任务都必须遵守（共享纪律 —— 派单时连同此节一起给 Codex）

1. **独立 worktree**，禁止在共享主 checkout `/Volumes/project/Flowise` 上提交/切分支：
   `git worktree add /Users/Zhuanz/.config/superpowers/worktrees/Flowise/<name> -b <branch> <base>`
   - **base 分支**：当前主线 `release/flowops-commercialization-v1`（含 localCommercial 方向）；如维护者指定 main 则以维护者为准。
2. **Node 20**：`source ~/.nvm/nvm.sh && nvm use 20`。
3. **提交前过门禁全绿**：
   - `cd packages/server && npx tsc --noEmit`
   - `npx jest <相关>`（按任务）
   - `bash scripts/fork-divergence.sh`（核心文件改动须登记 `FORK-CHANGES.md`）
   - 动了 UI：`pnpm --filter flowise-ui build`
4. **不要 `pnpm add`**（会升 `@types/node` 破坏 tsc）；按需手改 `package.json` + `pnpm install`。
5. 提交信息结尾：`Co-Authored-By: Codex <noreply@openai.com>`。
6. **不自合 main、不碰主 checkout**；交付分支等维护者评审。
7. 🔒 **安全红线**：权限"简化"只在 UI/预置层；底层 `PermissionCheck` 校验必须照常生效——**隐藏 ≠ 绕过**。

---

## 3. T-C / T-D / T-E 范围（待 T-B 的 Entitlement API 落地后细化为完整计划）

- **T-C 私有 License**：`LicenseEntitlementSource` 实现——Ed25519 公钥验签的 License 文件（载荷 tier/seats/features/expireAt/机器指纹），导入 UI + 离线校验 + 到期宽限；替换 `FLOWOPS_LOCAL_COMMERCIAL` 君子协议。
- **T-D 云 支付+注册**：从 `feat/payment-p0`（已验收）恢复支付宝/微信充值，作为 **`EDITION=cloud` 专属模块**（private 不加载）；资源点充值入账 → Entitlement；注册增强：手机号+短信验证、图形/滑块验证码防刷。
- **T-E 套餐/资源点 UI**：套餐对比页、资源点余额与用量看板、不足时升级/充值引导、到期宽限提示；en/zh i18n。

---

## 4. 派单方式
对每个就绪任务，把"该任务的 plan 文件路径 + 本文件第 2 节(共享纪律)"一起贴给 Codex 即可。建议先派 **T-A**。
