# FlowOps P5:接通 License 闸 —— 自建授权 enforcement · Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**分阶段、每阶段过门禁再继续;任一阶段把"无授权也能跑的开发态"搞崩就停下报告。**

## 背景

FlowOps = Flowise 二开,要**售卖**。已有一整套**自建**离线授权基础设施(clean-room,非 Flowise 的),但**全部建好却没接闸**,现在运行时是"无限座位、永久有效、不验授权":

-   `packages/server/src/services/license/index.ts` —— `LicenseService`:EdDSA 签名验签、payload(customer/edition/modules/seats/concurrency/expireAt/machineFingerprint/tier/...)、机器指纹(`collectMachineFingerprint`)、**时间梯度已算好**(`buildTimeAwareResult`:active → grace(`readOnly:true`)→ expired)、`.lic` 导入/读取。**核心逻辑可靠,复用,别重写。**
-   `packages/server/src/controllers/license/index.ts` + `routes/license`(已挂 `/api/v1/license`):导入/查授权/查指纹。
-   `packages/server/src/services/entitlement/index.ts` + `entitlement`/`entitlement_usage` 表:授权 → 权益/积分映射。
-   **未接闸的点**:`iam/self/identity.ts::isLicenseValid()` 恒 `true`;`iam/self/admin/service.ts::getCurrentUsage()` limit 全 `-1`;注册/邀请不查座位;`getFeaturesByPlan()` 全开;`checkFeatureByPlan()` 在 self 直接 `next()`;`readOnly` 无人强制;指纹不匹配验出来了但没拦。

## 0. 授权策略(产品方已拍板,enforcement 必须照此实现)

1. **卡 4 个维度**:① 座位数上限 ② 版本功能(tier:free/pro/team/enterprise)③ 到期时间 ④ 机器绑定(指纹)。
2. **双模型(两种 SKU)**:**永久买断**(perpetual,不按到期硬卡)+ **订阅**(subscription,到期续费)。`.lic` 要能区分。
3. **超限/过期 = 宽限期内降级**:进宽限期 → 全局**只读**(可看/可跑/可登录,禁写)+ 警告;宽限结束 → 硬阻断(仅留登录+导入授权做恢复)。`LicenseService` 已输出 `readOnly`/`status`,照用。

## 1. 关键设计(待 Codex 落地)

### 1.1 无授权时的默认态 = free 社区版(不能 brick 全新安装/开发态)

-   `status==='missing'`(从没导入过 `.lic`)→ **降到 `free` 版**(有限座位 + 核心功能),**正常可跑**,不是硬阻断 —— 否则一装就废、本地开发也起不来。导入 `.lic` 即升级到授权 tier/座位。
-   `EDITION=cloud` → **整套 .lic enforcement 关闭**(云形态走订阅/Stripe,不走离线授权;`routes/index.ts` 已按 `EDITION=cloud` 区分支付端点)。`.lic` enforcement 只在私有/离线版(默认)生效。
-   free 版具体限额(座位数、开放哪些功能)见 §5 待确认项,先用占位常量、集中可配。

### 1.2 启动态 + 缓存(`isLicenseValid` 等同步读)

-   `App.initialize()` 里(DB 迁移后、身份初始化附近)`await LicenseService.getActiveLicense()` → 存 `App.licenseState`。**定时刷新**(如每小时,因为 grace/expired 随时间推移会变,即使不重新导入)+ 导入授权后由 controller 立即刷新缓存。
-   `FlowOpsIdentity.isLicenseValid()` 改为**读缓存**(`status ∈ {active, grace}` → true;`expired/invalid` → false;`missing` → free 版视为 valid),不再恒 true、不在同步函数里做异步/读盘。

### 1.3 双模型字段

-   `FlowOpsLicensePayload` + `normalizePayload` 增 `model?: 'perpetual' | 'subscription'`(缺省按 `subscription` 兼容旧证,或强制要求 —— Codex 二选一并说明)。
-   `buildTimeAwareResult`:`model==='perpetual'` → 恒 `active`(跳过 expireAt 梯度;`expireAt` 仅作"维护/升级有效期"信息展示,不降级);否则走现有 active→grace→expired 梯度。

### 1.4 四维 enforcement 落点

-   **版本功能(tier)**:tier(或 payload.modules 显式列表)→ 开放的 `feat:*` 集合。`getFeaturesByPlan()`/`getSelfEnterpriseFeatures()` 按**授权 tier** 返回(不再全开),UI 菜单据此显隐;`checkFeatureByPlan(feature)` 服务端**真校验**(不在授权集 → 403)。优先复用 `services/entitlement` 的 tier→ 权益映射,缺则补。
-   **座位**:邀请/注册新用户/加成员(`iam/self/auth/service.ts` 邀请注册、`iam/self/admin` org-user PUT)→ 统计当前座位(= 组织内去重用户数)≥ 授权 seats → 拦截 + 明确报错(如 402「座位已满,需扩容授权」);已有用户不受影响。`getCurrentUsage()`/`getAdditionalSeatsQuantity()` 上报**真实 limit**(非 -1)。
-   **到期 + 宽限降级**:全局 **license enforcement 中间件**(挂在写操作路由前):`active` 放行;`grace`(readOnly)→ 拦截所有写(POST/PUT/DELETE/PATCH,**放行** GET / 登录 / `/api/v1/license` 导入)+ 明确提示「授权宽限期,只读,请续费」;`expired/invalid` → 仅放行 登录(owner/admin)+ `/api/v1/license` 导入 + 授权状态查询,其余全拦,给恢复路径。`perpetual` 永不因时间进入 grace/expired。
-   **机器绑定**:`verify()` 已验指纹(`FINGERPRINT_MISMATCH`)。启动态据此置 `invalid`;enforcement 中间件按 invalid 拦截,提示「授权绑定机器不匹配,请重新申请」。

### 1.5 签发工具(卖证那端 · 不随产品发布)

-   现 `DEFAULT_LICENSE_PUBLIC_KEY`(license/index.ts:59)是**内置公钥**;卖证必须有**对应私钥**。
-   产出:① 生成生产 Ed25519 密钥对的脚本;② `mint-license` CLI(离线,吃 customer/tier/model/seats/concurrency/issuedAt/expireAt/machineFingerprint[]/modules[] + **私钥** → 输出签名 `.lic`,格式 `header.payload.sig`,header `{alg:'EdDSA',typ:'FLOWOPS-LICENSE'}`)。
-   ⚠️ **铁律**:私钥**绝不进仓库/产品**(只在卖方手里);把内置默认公钥**换成生产公钥**;工具放独立目录(如 `tools/flowops-license/`),**出货构建剔除**(同 enterprise dist 剔除思路)。

## 2. 分阶段(每阶段过门禁 + 人工评审再继续)

-   **L0 · 盘点(只读)**:梳理 `services/license`、`services/entitlement`、`controllers/license`、`routes` 挂载、`entitlement`/`entitlement_usage` 表、`EDITION` 用法、`checkFeatureByPlan`/`getFeaturesByPlan`/`getCurrentUsage` 现状;确认内置公钥/私钥归属现实。产出 `docs/p5-license-inventory.md`(可复用 vs 待补),**停下评审**。
-   **L1 · 双模型 + 启动态 + isLicenseValid**:加 `model` 字段;`App.licenseState` 启动加载 + 定时刷新 + 导入即刷新;`isLicenseValid()` 读缓存;`EDITION=cloud` 关闭 enforcement;`missing`→free 版。
-   **L2 · 版本功能门禁(tier)**:tier/modules→`feat:*`;`getFeaturesByPlan`/`getSelfEnterpriseFeatures` 按授权返回;`checkFeatureByPlan` 服务端强制。
-   **L3 · 座位 enforcement**:邀请/加成员座位闸;usage/seats 端点上报真实 limit。
-   **L4 · 宽限降级 + 机器绑定闸**:全局 license enforcement 中间件(active/grace-只读/expired-阻断 + perpetual 豁免 + 指纹不匹配拦截 + 恢复路径)。
-   **L5 · 签发工具**:密钥对生成 + `mint-license` CLI + 换生产公钥 + 出货剔除 + `docs/license-issuing.md`。
-   **L6 · 终验**:端到端矩阵(每 tier × 每 model × active/grace/expired × 座位满 × 指纹不匹配)逐项验证;admin 授权状态面(tier、座位 已用/总、到期/剩余宽限天、customer、本机指纹、导入 .lic)。

## 3. 铁律 / 验收(DoD)

-   🔧 **实打实写**:enforcement 是真实 self 代码,不留 undefined 兜底 / no-op stub / 类型擦除;"无授权=free 版"是显式真实行为,"宽限只读""过期阻断"按 `LicenseService` 输出的 `readOnly`/`status` 真拦。
-   **复用优先**:`LicenseService` 验签/指纹/时间梯度逻辑可靠,**复用不重写**;只加 `model` 字段与 enforcement 接线。
-   **不 brick**:任一阶段结束,`FLOWOPS_IAM=self` 全新空库**无 .lic 也能起服(free 版)、能注册首管、能登录、能建 chatflow**;导入有效 .lic 后升级到授权 tier/座位。
-   **私钥安全**:私钥不进仓库/产品;内置公钥换生产公钥;签发工具出货剔除。
-   每阶段 → `cd packages/server && npx tsc --noEmit` + `npx jest`(补 license enforcement 测试:各 status/tier/model/座位/指纹场景)+ self 真机冒烟,过了再下一阶段。
-   绝不连/碰服务器(120.26.44.206);不动 flow 引擎/节点加载/prediction 主流程;分阶段提交,commit 结尾 `Co-Authored-By: Codex <noreply@openai.com>`;不合并 main。

## 4. 边界 / 风险

-   这是**收费命脉**,错了等于漏收或误伤付费客户;务必分阶段、可独立验证;拿不准(尤其 grace 降级的写操作边界、free 版限额)就停下报告。
-   与 P4 关系:P5 全在 self 侧,**建议 P4(删 enterprise)完成后在单轨基座上做**更干净;但不强依赖。
-   cloud 形态(EDITION=cloud)本计划只负责"关闭离线 enforcement",不补云订阅本身。

## 5. 产品方已确认(2026-06-17)

-   **free 版(无 .lic)限额**:**1–2 座位 + 核心功能**(chatflow / agentflow / credential / 工具),**关闭高级**(datasets / evaluations / SSO 等)。具体常量集中可配,L0 评审时可微调。
-   **生产密钥归属**:产品方**生成一对全新 Ed25519**,**私钥离线保管、绝不进仓库/产品**;内置默认公钥(license/index.ts:59)**作废,换成生产公钥**。
-   **永久买断的"到期"语义**:perpetual **带"维护期"** —— 过期仍可用已买版本,但不享后续升级(`expireAt` 作维护期信息展示,不触发降级)。
