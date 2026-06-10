# Codex 执行计划：T-D 云版 支付充值 + 自助注册增强

> 共享纪律见 `codex-任务总览-权限付费双形态.md` §2。基线 `main`，分支 `feat/cloud-billing`。
> 设计依据：`国产化支付方案.md`、`权限与付费改造计划.md`（云版 = 注册→体验→充值）。

## 0. 背景
云版（`FLOWOPS_EDITION=cloud`）权益来源 = **在线订阅 + 资源点充值**。支付骨架（支付宝/微信，payment-p0）**已在 main 且已按 `EDITION=cloud` 门控挂载**。本任务把**支付 → 权益**打通，并增强公网自助注册。

## 1. 任务
- **T1 资源点充值入账**：支付成功（`settlePaidOrder` / 主动查单）后，给该 org 的 `Entitlement.creditsBalance` **加额度**（或升级 tier）。`SubscriptionEntitlementSource` 从 stub 改为读真实订阅/充值记录。**幂等**（参考 payment-p0 的原子条件更新，别重复入账）。
- **T2 套餐购买 → 订阅**：`createOrder` 关联 `planCode` → 支付成功 → 写订阅 + 对应 Entitlement(tier/seats/features)。
- **T3 notify 免鉴权确认**：cloud 下 `POST /api/v1/payment/notify/*` 必须**真免鉴权**（支付方回调无 auth）——补一条集成测试断言 notify 不被 401/全局 auth 拦截（收敛冒烟发现全局 auth 会 401 遮蔽，须确认白名单实际生效）。
- **T4 自助注册增强**（cloud）：手机号 + 短信验证码；图形/滑块**验证码防刷**；邮箱验证已有，复用。注册即建默认空间 + Owner（接 T-A 4+1）。
- **T5 测试**：充值入账幂等、套餐→权益、notify 免鉴权、注册防刷。`jest payment entitlement`。

## 2. 红线
- ❌ 仅 `EDITION=cloud` 启用；private 不加载（已门控）。
- **幂等扣款/入账**，重复回调不重复加额度。
- 密钥只从 env；notify 验签失败不入账不 ack 成功。
- 不 pnpm add（短信/验证码若需 SDK，先评估，能用 HTTP 就 HTTP）；核心文件登记 `FORK-CHANGES.md`（分类 `Commercial-payment`）。

## 3. 验收
tsc 0 / jest 全绿 / fork-gate / UI build / 一句话验收（沙箱：注册→免费体验→充值→额度到账）。等评审，不自合 main。
