# Codex 执行计划：T-E 套餐 / 资源点 UI（扣子式）

> 共享纪律见 `codex-任务总览-权限付费双形态.md` §2。基线 `main`，分支 `feat/billing-ui`。
> 设计依据：`权限与付费改造计划.md` 附录 A（套餐）、D（资源点）、E（来源）。

## 0. 背景
给双形态做统一的「套餐 + 资源点」前端：套餐对比页、资源点余额/用量看板、升级/充值引导。读 T-B 的 `Entitlement` / `EntitlementUsage`，按 `EDITION` 区分入口。

## 1. 任务
- **T1 套餐对比页**：免费/专业/团队/企业 4 档（席位/资源点/功能/私有部署），从 Entitlement tier 模板渲染；当前档高亮。
- **T2 资源点看板**：余额 + 本月用量（读 `EntitlementUsage`）+ 按行为分类（模型调用/检索/导出…，对应附录 D）；进度条 + 不足预警。
- **T3 升级/充值引导**：
  - `EDITION=cloud` → 「充值/升级」按钮走支付（接 T-D）；
  - `EDITION=private` → 显示「联系销售 / 导入 License」（接 T-C），不显示在线充值。
- **T4 到期/宽限提示**：License/订阅到期前提示，宽限期 banner。
- **T5 i18n**：en/zh 同步所有新文案。

## 2. 红线
- **按 `EDITION` 区分入口**：private 绝不露在线充值；cloud 才有。
- 复用现有 `views/billing` / `views/account` 结构与组件，别另起一套。
- 不 pnpm add（二维码用 T-D 已引入的 `qrcode.react`）；UI build 必须过；i18n en/zh 锁步。

## 3. 验收
UI build 通过 / i18n 测试 / 两种 EDITION 各看一遍页面（cloud 有充值、private 显示 License 入口）/ 一句话验收。等评审，不自合 main。
