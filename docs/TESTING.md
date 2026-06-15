# FlowOps 测试文档

本文档说明本项目的测试分层、常用命令、提交前门禁和新增测试规范。适用于 Flowise 上游代码以及 FlowOps fork 自有的权限、权益、计量、License、支付、国产模型/向量库和中文 UI 改造。

## 1. 测试目标

测试的目标不是追求单一覆盖率数字，而是保证以下行为可回归：

-   核心工作流、节点、模型适配、导入导出和调度逻辑稳定。
-   权限、租户隔离、资源点计量、License 和支付链路不能被 UI 隐藏或配置差异绕过。
-   UI 页面、i18n 文案、主题与 FlowOps 商业化入口在 cloud/private 两种形态下行为一致。
-   fork 相对 `upstream/main` 的既有文件改动可登记、可审计、可重放。

## 2. 环境要求

项目使用 pnpm workspace 和 Turbo 编排。

```bash
source ~/.nvm/nvm.sh
nvm use 20
node --version        # 期望 v20.20.2，见 .nvmrc
pnpm --version        # 期望 ^10.26.0
pnpm install
```

注意：

-   不要用 `pnpm add` 直接改依赖。FlowOps 改造中如需新增依赖，手动改对应 `package.json`，再执行 `pnpm install`，避免连带升级 `@types/node` 破坏 TypeScript 编译。
-   动到既有核心文件时，必须登记到 `FORK-CHANGES.md`，新增文件不进入白名单，但会被 `scripts/fork-divergence.sh` 统计。

## 3. 测试分层

### 3.1 根仓库

根仓库只负责编排，不直接放业务测试。

```bash
pnpm test            # turbo run test
pnpm test:coverage   # turbo run test:coverage
pnpm build           # turbo run build
pnpm lint            # eslint "**/*.{js,jsx,ts,tsx,json,md}"
```

根门禁适合在大范围改动、合并前或 CI 中执行。日常开发优先跑受影响包的定向测试。

### 3.2 Server: `packages/server`

服务端测试使用 Jest + ts-jest，配置在 `packages/server/jest.config.js`：

-   `testEnvironment: node`
-   测试根目录：`src`
-   匹配：`*.test.ts` / `*.test.tsx`
-   TypeORM 通过 `packages/server/__mocks__/typeorm.ts` 做共享 mock

常用命令：

```bash
cd packages/server
npx tsc --noEmit
npx jest --runInBand
npx jest services/entitlement --runInBand
npx jest rbac PermissionCheck --runInBand
npx jest services/payment services/billing --runInBand
```

适合覆盖：

-   RBAC、`PermissionCheck`、租户隔离、IAM 自建认证。
-   Billing、Entitlement、资源点扣减、用量限制。
-   License 验签、到期只读宽限、激活/导入。
-   Payment 下单、回调验签、对账任务。
-   Chatflow、schedule、MCP、webhook、security utils。

服务端还有 Cypress E2E：

```bash
cd packages/server
pnpm e2e
pnpm cypress:run
pnpm cypress:open
```

现有 E2E 用例位于 `packages/server/cypress/e2e`，当前主要覆盖 API key 和 variables。

### 3.3 UI: `packages/ui`

UI 测试使用 Jest + babel-jest，配置在 `packages/ui/jest.config.js`：

-   `testEnvironment: node`
-   测试根目录：`src`
-   匹配：`src/**/*.test.js`
-   `@/` 映射到 `src/`
-   CSS、图片、SVG 通过 `src/__mocks__/styleMock.js` mock

常用命令：

```bash
cd packages/ui
npx jest --runInBand
npx jest billingCenter accountSubscription --runInBand
npx jest i18n --runInBand
pnpm build
```

适合覆盖：

-   i18n key 是否 en/zh 锁步。
-   纯函数 helper、页面分支、入口显隐规则。
-   FlowOps cloud/private 页面差异，例如 private 不能出现在线充值入口。
-   账号页、计费中心、License 入口、支持工单等商业化 UI。

UI 改动还必须执行：

```bash
pnpm --filter flowise-ui build
```

涉及页面视觉、路由或入口显隐时，还要本地打开页面做人工或浏览器脚本验收。重点页面包括 `/billing`、`/account`、`/license`、`/support-tickets`、登录页和主工作台。

### 3.4 Components: `packages/components`

Components 测试使用 Jest + ts-jest，配置在 `packages/components/jest.config.js`：

-   `testEnvironment: node`
-   测试根目录：`nodes`、`src`
-   匹配：`*.test.ts`、`*.spec.ts`、`__tests__`
-   对 ESM-only 或测试无关依赖使用 `__mocks__` stub

常用命令：

```bash
cd packages/components
npx tsc --noEmit
npx jest --runInBand
npx jest ChatQwen EmbeddingQwen VikingDB --runInBand
pnpm build
```

适合覆盖：

-   模型 provider、国产模型、embedding、vector store。
-   agentflow 节点、文档导出、PPT/Excel 导出。
-   HTTP 安全、header 校验、Python code validator、工具函数。

新增节点时至少覆盖：

-   必填参数校验。
-   正常调用输入到输出的映射。
-   错误响应或异常分支。
-   不真实访问外部云服务，外部 SDK 或 HTTP client 在边界 mock。

### 3.5 Agentflow 和 Observe 包

`packages/agentflow` 与 `packages/observe` 有各自的 `TESTS.md`，并使用 Jest projects 区分 Node 与 jsdom：

-   `.test.ts` 使用 Node 环境，适合纯逻辑、API client、store、数据转换。
-   `.test.tsx` 使用自定义 jsdom 环境，适合 React hook、component 和 DOM 交互。
-   覆盖率阈值主要为 80%，部分 Tier 3 UI 有显式例外。

常用命令：

```bash
pnpm --filter @flowiseai/agentflow test
pnpm --filter @flowiseai/agentflow test:coverage
pnpm --filter @flowiseai/observe test
pnpm --filter @flowiseai/observe test:coverage
```

## 4. 提交前门禁

按改动范围选择最小但充分的门禁。大范围或安全相关改动建议跑完整组合。

### 4.1 通用门禁

```bash
pnpm lint
bash scripts/fork-divergence.sh
```

### 4.2 服务端改动

```bash
cd packages/server
npx tsc --noEmit
npx jest <相关测试名> --runInBand
```

权限、权益、计量、License、支付等安全相关改动，必须包含被拦截场景的测试证据，例如：

-   越权访问被 `PermissionCheck` 拦截。
-   超资源点或超配额被 402/业务错误拦截。
-   License 过期进入只读宽限，而不是硬断。
-   支付回调签名错误被拒绝。

### 4.3 UI 改动

```bash
cd packages/ui
npx jest <相关测试名> --runInBand
pnpm build
```

或从根目录执行：

```bash
pnpm --filter flowise-ui build
```

UI 涉及 i18n 时，必须同时更新 `packages/ui/src/i18n/locales/en.json` 和 `packages/ui/src/i18n/locales/zh.json`，并补充或更新对应 i18n 测试。

### 4.4 Components 改动

```bash
cd packages/components
npx tsc --noEmit
npx jest <相关节点或工具名> --runInBand
pnpm build
```

### 4.5 全量门禁

适用于合并前、升级上游后或跨包改动：

```bash
pnpm test
pnpm build
bash scripts/fork-divergence.sh
```

如果涉及 UI，额外保留页面验收记录；如果涉及数据库 migration，至少在 SQLite 或目标数据库上验证迁移加载。

## 5. 新增测试规范

### 5.1 测试命名

测试文件与被测文件尽量同目录或同功能目录：

```text
src/services/entitlement/index.ts
src/services/entitlement/index.test.ts

src/views/billing/billingCenter.js
src/views/billing/billingCenter.test.js
```

测试名称描述行为，而不是描述实现：

```typescript
it('blocks credit consumption when the balance is insufficient', async () => {
    // ...
})
```

不要写 `it('works')`、`it('test')` 这类无法定位行为的名称。

### 5.2 断言行为，不断言内部细节

优先断言外部可观察结果：

-   函数返回值。
-   抛出的错误码和错误消息。
-   数据库写入或未写入。
-   API 响应结构。
-   UI 上是否显示按钮、提示、状态。

避免断言私有 helper 被调用了几次，除非 helper 是外部依赖或边界 mock。

### 5.3 Arrange-Act-Assert

每个测试按三段组织：

```typescript
// Arrange
const service = createService()

// Act
const result = await service.resolveEntitlement('org-1')

// Assert
expect(result.tier).toBe('enterprise')
```

一个 `it` 只验证一个概念。多个 `expect` 可以存在，但应共同证明同一个行为。

### 5.4 Mock 边界，不 mock 内部

推荐 mock：

-   HTTP client、SDK、支付网关、云向量库。
-   数据库 repository。
-   浏览器 API、localStorage、clipboard。
-   时间、随机数、环境变量。

不推荐 mock：

-   同模块内部纯函数。
-   被测服务的核心业务分支。
-   只为了让覆盖率变高而绕过真实逻辑的 collaborator。

### 5.5 时间和幂等

涉及时间、月度周期、License 到期、支付过期、资源点扣减时：

-   固定 `Date` 或显式传入 `now`。
-   覆盖边界日期，例如月初、月末、宽限期最后一天。
-   幂等扣减必须覆盖重复 idempotency key 不重复扣点。
-   原子条件更新必须覆盖余额不足时不扣成负数。

## 6. FlowOps 安全回归清单

下列改动必须有明确测试或验收证据：

### 6.1 权限和租户

-   UI 隐藏入口不等于授权，底层 `PermissionCheck` 必须照常生效。
-   非管理员、非成员、跨组织/跨 workspace 请求必须被拒绝。
-   自建 IAM 与企业 IAM 的权限枚举保持兼容。

建议命令：

```bash
cd packages/server
npx jest PermissionCheck role.service workspace-user tenantRequestGuards --runInBand
```

### 6.2 权益和资源点

-   cloud/private 双来源解析正确。
-   免费、Pro、Team、Enterprise 权益模板边界正确。
-   超额被拦截，扣点幂等准确。
-   旧 billing 数据保留兼容，标记 deprecated 时不能破坏历史查询。

建议命令：

```bash
cd packages/server
npx jest services/entitlement services/billing quotaUsage --runInBand
```

### 6.3 License

-   产品端只验签，不包含私钥。
-   导入、激活、机器指纹校验、过期宽限都可回归。
-   到期进入只读降级和宽限，不硬断服务。

建议命令：

```bash
cd packages/server
npx jest services/license controllers/license services/entitlement --runInBand
```

### 6.4 支付

-   下单参数校验、订单状态流转、回调 raw body、签名错误拒绝。
-   对账任务不会重复激活或重复入账。
-   支付测试必须使用 fake provider 或 mock 网关，不访问真实支付环境。

建议命令：

```bash
cd packages/server
npx jest services/payment paymentRawBody signatureVerification --runInBand
```

### 6.5 UI 双形态

-   `EDITION=cloud`：允许显示在线充值、升级、支付二维码。
-   `EDITION=private`：绝不显示在线充值，只显示 License 导入或联系销售。
-   en/zh 文案必须同步，不能只改一种语言。

建议命令：

```bash
cd packages/ui
npx jest billingCenter accountSubscription i18n --runInBand
pnpm build
```

## 7. 常见测试问题

### 7.1 Jest 找不到 ESM-only 依赖

优先在对应包的 `jest.config.js` 中通过 `moduleNameMapper` 指向轻量 stub。不要在每个测试里重复写大段 mock，也不要为了测试改产品代码导入路径。

### 7.2 TypeScript 因 Node 类型报错

先确认 Node 版本和 lockfile 是否被依赖变更带偏：

```bash
node --version
git diff pnpm-lock.yaml
pnpm why @types/node
```

不要直接改上游类型或业务代码压错误。依赖变更应回到对应 `package.json` 和 lockfile 处理。

### 7.3 UI build 通过但页面入口错了

Jest 只能证明分支函数和文案存在，不能证明路由和真实页面组合无误。涉及入口显隐、导航、弹窗、二维码、License 导入时，需要启动 UI 并至少看一遍关键页面。

```bash
pnpm --filter flowise-ui dev
```

### 7.4 fork-divergence 失败

如果输出 `Unregistered modified files`：

1. 确认这些既有文件确实需要修改。
2. 在 `FORK-CHANGES.md` 的 `Modified File Ledger` 中登记路径和分类。
3. 重新执行：

```bash
bash scripts/fork-divergence.sh
```

新增文件不需要登记，但会出现在统计中。

## 8. 推荐 PR 测试说明模板

提交或 PR 描述中建议写清楚：

```markdown
## Test Plan

-   [ ] `cd packages/server && npx tsc --noEmit`
-   [ ] `cd packages/server && npx jest <相关测试> --runInBand`
-   [ ] `cd packages/ui && npx jest <相关测试> --runInBand`
-   [ ] `pnpm --filter flowise-ui build`
-   [ ] `bash scripts/fork-divergence.sh`
-   [ ] 手动验收：<页面/接口/安全拦截证据>
```

安全相关改动的手动验收必须写出负向证据，例如“非授权用户请求被 403 拦截”或“余额不足时资源点扣减返回 402 且余额未变”。
