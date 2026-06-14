# Codex 执行计划：T-C 私有版签名 License

> 共享纪律见 `codex-任务总览-权限付费双形态.md` §2。基线 `main`，分支 `feat/license`。
> 设计依据：`国产化支付方案.md` §4、`权限与付费改造计划.md`（私有版权益来源）。

## 0. 背景
私有版（`FLOWOPS_EDITION=private`）当前用 `FLOWOPS_LOCAL_COMMERCIAL=true` 的**无校验"君子协议"**激活。本任务升级成**签名 License**，作为 `LocalEntitlementSource` 的真实权益来源。

## 1. License 设计
- **算法**：Ed25519 签名文件（JWT 风格或自定义）。**公钥内置产品**；**私钥只在发证后台**（本任务不实现签发后台，只实现验签 + 导入 + 接权益）。
- **载荷**：`{ customer, edition, modules[], seats, concurrency, issuedAt, expireAt, machineFingerprint[], licenseId }`。

## 2. 任务
- **T1 `LicenseService`**：`verify(licenseFile)`（公钥验签 + 解析载荷 + 校验到期/指纹）；`getActiveLicense()`。
- **T2 机器指纹**：采集主板 UUID / CPU / 网卡 MAC / 部署 ID，组合哈希；校验时比对白名单（支持多节点）。
- **T3 接权益**：`LocalEntitlementSource.resolve()` 改为：有有效 License → 按 License 映射 Entitlement（tier/seats/features/expireAt）；无 → 免费版。保留 `FLOWOPS_LOCAL_COMMERCIAL` 作为开发/兜底开关。
- **T4 到期宽限**：到期后**只读降级 + 宽限期**（默认 15 天），**绝不硬断**（政企口碑）。
- **T5 导入 UI**：「授权管理」页上传/粘贴 License、显示状态（客户/到期/席位/模块）、过期提示。
- **T6 测试**：验签成功/失败、过期、指纹不符、宽限期、tier 映射。生成一对测试密钥（测试私钥仅测试用，不入库）。

## 3. 红线
- ❌ **私钥绝不进产品/代码库/客户机**；产品端只验签。
- 防破解**务实**（防君子，护城河在合同/法务/审计），不过度工程。
- 核心文件改动登记 `FORK-CHANGES.md`（分类 `Local-commercial`）；不 pnpm add（Ed25519 用 node 内置 `crypto`）。

## 4. 验收
tsc 0 / jest 全绿 / fork-gate / UI build / 一句话验收（导入→激活→到期宽限 跑通）。等评审，不自合 main。
