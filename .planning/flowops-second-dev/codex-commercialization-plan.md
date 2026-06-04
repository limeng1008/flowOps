# FlowOps 商业化补全（支付 / 工单 / VI）· Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**过门禁再提交；任何门禁失败停下报告，不要猜改核心。**
> 背景：计费模块（billing center v1，三维度 token/bot/seat + 配额拦截）与公开官网（publicSite）**已完成**，见分支 `codex/billing-v1`。本计划补齐剩余三块商业化能力：
>
> -   **T1 · 支付沙箱对接骨架** —— 给已有 billing 的「超额 402 → 升级套餐」补上真实下单/支付/回调闭环（支付宝 + 微信，沙箱环境跑通；真实收款等营业执照+商户号填配置即上线）。
> -   **T2 · 自建轻量工单系统** —— 平台自己的客服工单（提交 → 列表 → 状态流转 → 回复），数据进自己库，和现有账号体系打通。
> -   **T3 · 占位 VI 方案** —— 用代码生成一套临时品牌视觉（SVG 字标 logo / favicon / VI 变量 / 统一应用），让产品「看起来统一」，专业设计后续直接替换。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`；**Node 20**（`nvm use 20`，系统默认是 22，后端必须 20.20.2）。
-   从 **`codex/billing-v1`** 切出新分支 **`codex/commercialization-v1`** 工作（T1 支付依赖 billing 的实体/服务，必须基于该分支）。**不要 push、不碰 main**，做完留人工 review。
-   包管理 **pnpm**（仓库要求 `pnpm@10.26.0`）；后端在 `packages/server`，前端在 `packages/ui`。
-   T1/T2 各自一个 commit；T3 可拆 1–2 个 commit。每个 commit 结尾加：
    `Co-Authored-By: Codex <noreply@openai.com>`

### 0.2 ✅ 参考范式（先读，照抄结构 —— 别凭印象）

**后端「新增一个业务模块」的完整范式 = 已完成的 billing 模块**，照它的分层照抄：

-   实体：`packages/server/src/database/entities/BillingPlan.ts` / `BillingSubscription.ts` / `BillingUsage.ts`（TypeORM `@Entity`，看它的列类型/默认值/索引写法）。
-   实体注册：`packages/server/src/database/entities/index.ts`（新实体要在这里 export 进 `entities` 数组）。
-   **4 库 migration**：`packages/server/src/database/migrations/{postgres,mysql,mariadb,sqlite}/1777000000000-AddBillingEntities.ts` + 各自 `index.ts`。**四个数据库都要写，少一个上线就崩。** 时间戳用**比现有更大的未来值**（billing 用了 `1777000000000`，你用 `1777100000000`、`1777200000000` 递增，避免和 billing migration 撞序）。
-   service：`packages/server/src/services/billing/index.ts`（业务逻辑集中在 service；看它怎么拿 `appServer.AppDataSource.getRepository(...)`、怎么抛 `InternalFlowiseError(StatusCodes.XXX, code)`）。
-   service 测试：`packages/server/src/services/billing/index.test.ts`（**这是你测试的范式**，看它怎么 mock 数据源、怎么断言）。
-   controller：`packages/server/src/controllers/billing/index.ts`；route：`packages/server/src/routes/billing/index.ts` + 在 `packages/server/src/routes/index.ts` 挂载。
-   前端页面范式：`packages/ui/src/views/billing/index.jsx` + api 层 `packages/ui/src/api/billing.js` + 菜单 `packages/ui/src/menu-items/dashboard.js` + 路由 `packages/ui/src/routes/MainRoutes.jsx`。
-   前端 i18n：`packages/ui/src/i18n/locales/{en,zh}.json`（billing commit 往里加了 `pages.billing.*` 一类键，照此分组）。

**支付要接的「升级出口」**：billing service 暴露了 `BILLING_ERROR_CODES`、`DEFAULT_FREE_PLAN`、`BillingService`（默认导出，含 `assertTokenAllowance/assertBotAllowance/assertSeatAllowance/recordTokenUsage`）。配额超限时后端抛 `402 PAYMENT_REQUIRED`，前端 `views/billing/index.jsx` 有套餐展示。**T1 的任务就是给「选套餐 → 付款 → 激活订阅」补上中间这段。**

**VI 已有基础（T3 是补齐体系化，不是从零）**：

-   主题变量层 `packages/ui/src/themes/_flowops-vars`（之前换皮抽离的覆盖层，主色 AI 紫 `#7C3AED`）。
-   现有 logo 引用：先 `grep -rn "logo" packages/ui/src/ui-component packages/ui/src/layout packages/ui/src/assets` 摸清当前 logo 是怎么渲染的（登录页/侧边栏/欢迎页都有），**在现有基础上统一，别另起炉灶**。

### 0.3 ⚠️ 头号陷阱：加依赖**不要用 `pnpm add`**

`pnpm add` 会连带把 `@types/node` 升级，导致上游文件 tsc 报错（踩过多次）。**正确做法**：

1. **手动**编辑对应 package 的 `package.json` `dependencies`，按字母序加入依赖。
2. 跑 **`pnpm install`**（reconcile，不是 `pnpm add`）。
3. 验证 `npx tsc --noEmit` **必须 0 错**；若冒出 `@types/node`/`.at()` 相关错误 → 停下报告，别硬改上游文件。

> T1 支付**尽量零新依赖**：支付宝/微信的签名（RSA2 / HMAC-SHA256 / AES-256-GCM）用 Node 内置 `crypto` 即可；HTTP 用已在 server 依赖里的 `axios`。**不引 `alipay-sdk` / `wechatpay-node-v3`**（它们体积大、依赖杂、易触发上面陷阱）。手写签名既可控又无新依赖。拿不准停下报告。

### 0.4 ⚠️ 铁律

-   新增为主，**不改 billing 核心逻辑、不改既有节点/路由语义**；只在 `routes/index.ts`、`entities/index.ts`、`menu-items/dashboard.js`、`MainRoutes.jsx` 等**挂载点**追加。
-   后端新增实体 = **必写 4 库 migration**（postgres/mysql/mariadb/sqlite），少一个不许提交。
-   所有新增用户可见英文文案 **必须走 i18n**（en + zh 同时加），项目硬约束是中文界面 100% 覆盖。
-   注释里**别出现 `*/`**（会提前闭合块注释，踩过）；husky 会跑 prettier+eslint，提交前自查。
-   钱相关一律**分（整数）为单位**存储/计算，禁止用浮点存金额。
-   涉及密钥（商户私钥/APIv3 密钥/回调验签）**只读环境变量**，禁止硬编码、禁止写进前端、禁止进 git。
-   支付**回调验签失败一律拒绝**并记录；订单状态机只进不退（pending→paid/failed/closed，不可逆向）。

---

## 1. T1 · 支付沙箱对接骨架

**目标**：用户在 billing 页选套餐 → 生成订单 → 拉起支付宝/微信扫码 → 用户支付 → 平台收异步回调 → 验签 → 激活/续费 `BillingSubscription`。**沙箱环境完整跑通**；切真实只需换环境变量（商户号/密钥/网关地址）。

### 1.1 数据实体

新增 `packages/server/src/database/entities/PaymentOrder.ts`（照 BillingSubscription 写法）：

| 列                      | 类型                  | 说明                                                      |
| ----------------------- | --------------------- | --------------------------------------------------------- |
| `id`                    | uuid PK               |                                                           |
| `orderNo`               | varchar 唯一索引      | 平台订单号（你生成，给第三方的 `out_trade_no`）           |
| `organizationId`        | varchar 索引          | 下单组织（和 billing 同口径）                             |
| `planCode`              | varchar               | 购买的套餐 code（关联 BillingPlan）                       |
| `provider`              | varchar               | `alipay` / `wechat`                                       |
| `amountCents`           | int                   | 金额（**分**）                                            |
| `currency`              | varchar default `CNY` |                                                           |
| `status`                | varchar               | `pending`/`paid`/`failed`/`closed`，默认 `pending`        |
| `thirdPartyTxnId`       | varchar nullable      | 第三方交易号（支付宝 `trade_no` / 微信 `transaction_id`） |
| `paidAt`                | timestamp nullable    |                                                           |
| `createdAt`/`updatedAt` | timestamp             |                                                           |

-   在 `entities/index.ts` 注册。
-   4 库 migration（时间戳 `1777100000000`）：建 `payment_order` 表 + `orderNo` 唯一索引 + `organizationId` 普通索引。

### 1.2 支付 Provider 抽象（核心，零新依赖）

新增目录 `packages/server/src/services/payment/`：

-   `types.ts`：定义
    ```
    interface CreateOrderInput { orderNo; amountCents; subject; planCode; orgId }
    interface CreateOrderResult { provider; qrCodeUrl?; payUrl?; rawResponse }
    interface PaymentNotification { orderNo; thirdPartyTxnId; amountCents; success; raw }
    interface PaymentProvider {
      createOrder(input): Promise<CreateOrderResult>
      verifyAndParseNotification(headers, rawBody): Promise<PaymentNotification>  // 验签+解析回调
    }
    ```
-   `alipay.provider.ts`：
    -   `createOrder`：用 **`alipay.trade.precreate`**（扫码支付，返回二维码链接）。手写 RSA2 签名（`crypto.createSign('RSA-SHA256')`，私钥从 env）。网关沙箱 `https://openapi.sandbox.dl.alipaydev.com/gateway.do`。
    -   `verifyAndParseNotification`：对支付宝异步通知做 RSA2 **验签**（`crypto.createVerify`，用支付宝公钥），校验 `trade_status === 'TRADE_SUCCESS'` 且金额一致。
-   `wechat.provider.ts`：
    -   `createOrder`：微信支付 **v3 Native 下单**（`POST /v3/pay/transactions/native`，返回 `code_url` 二维码）。请求签名用商户私钥 `crypto.createSign('RSA-SHA256')`，按 v3 规范拼 `Authorization: WECHATPAY2-SHA256-RSA2048 ...`。
    -   `verifyAndParseNotification`：v3 回调用 **APIv3 密钥 AES-256-GCM 解密**（`crypto.createDecipheriv('aes-256-gcm', ...)`）+ 平台证书验签；校验 `trade_state === 'SUCCESS'` 且金额一致。
-   `index.ts`（PaymentService 门面）：
    -   `getProvider(provider)` 工厂。
    -   `createOrder(planCode, provider, orgId)`：查 BillingPlan 拿价格 → 生成 `orderNo` → 落 PaymentOrder(pending) → 调 provider.createOrder → 回二维码。
    -   `handleNotification(provider, headers, rawBody)`：provider 验签解析 → 幂等（同 orderNo 已 paid 直接返回成功，参考 billing `recordTokenUsage` 的 dedupe 思路）→ 金额校验 → 置 PaymentOrder=paid → **调 billing 激活订阅**（写/续 `BillingSubscription`，让 `assertXxxAllowance` 立刻放行）→ 返回第三方要求的 ACK 格式（支付宝回 `success`、微信回 `{code:'SUCCESS'}`）。
    -   `getOrderStatus(orderNo, orgId)`：前端轮询用。

> **环境变量**（全部 `process.env`，写进 `deploy/.env.example` 但留空+注释）：
> `ALIPAY_APP_ID`/`ALIPAY_PRIVATE_KEY`/`ALIPAY_PUBLIC_KEY`/`ALIPAY_GATEWAY`、
> `WECHAT_MCH_ID`/`WECHAT_APP_ID`/`WECHAT_PRIVATE_KEY`/`WECHAT_SERIAL_NO`/`WECHAT_APIV3_KEY`/`WECHAT_PLATFORM_CERT`、
> 通用 `PAYMENT_NOTIFY_BASE_URL`（回调公网地址）。**任一 provider 的 env 缺失时，该 provider 的 createOrder 抛清晰中文错误「未配置支付宝/微信支付，请在环境变量中填入商户信息」，不要崩整个服务。**

### 1.3 controller + route

-   `controllers/payment/index.ts`：`createOrder`、`alipayNotify`、`wechatNotify`、`getOrderStatus`。
-   `routes/payment/index.ts` + 挂到 `routes/index.ts`：
    -   `POST /api/v1/payment/order`（登录态，建订单）
    -   `POST /api/v1/payment/notify/alipay`（**公开**、无鉴权，第三方回调）
    -   `POST /api/v1/payment/notify/wechat`（**公开**、无鉴权）—— 注意微信回调需要**原始 body** 验签，确认这两条路由拿到的是 raw body（必要时单独加 `express.raw` 或在 verify 前保留 rawBody）。
    -   `GET /api/v1/payment/order/:orderNo`（登录态，查状态）
-   回调路由要在鉴权中间件**之前/白名单**放行（参考现有公开路由如 `/api/v1/prediction` 的公开处理或 webhook 路由的写法，去 `routes/index.ts` 找）。

### 1.4 前端

-   `api/payment.js`：`createOrder`、`getOrderStatus`。
-   `views/billing/index.jsx`（**改造，不新建**）：套餐卡片「升级/购买」按钮 → 弹支付对话框（选支付宝/微信 → 调 createOrder → 用 `qrcode` 渲染二维码或显示 `code_url`）→ 轮询 `getOrderStatus`，paid 后提示成功并刷新当前套餐。
    -   二维码渲染：若需 `qrcode` 依赖，按 0.3 手动加；或后端直接返回可 `<img>` 的二维码（支付宝 precreate 返回的是 qr 内容串，需前端渲染成码）。**优先后端返回 data-url 省前端依赖**——评估后择一，报告里说明选择。
-   i18n：`pages.billing.pay.*`（选择支付方式/扫码支付/支付成功/支付失败/订单已关闭…）en+zh。

### 1.5 测试（`services/payment/index.test.ts`，照 billing 测试范式）

-   `crypto` 真实跑、`axios` mock：
    -   createOrder：落库 pending + 调 provider + 返回二维码字段。
    -   支付宝验签：构造**正确签名**的通知 → paid + 激活订阅；**错误签名** → 拒绝、订单不变。
    -   微信回调：构造可解密的密文 → paid；篡改金额 → 拒绝。
    -   幂等：同一 orderNo 通知两次，订阅只激活一次。
    -   env 缺失：createOrder 抛中文「未配置」错误。

### 1.6 DoD

-   `cd packages/server && npx tsc --noEmit` = 0
-   `npx jest services/payment` 全过
-   4 库 migration 齐全、`entities/index.ts` 已注册
-   `deploy/.env.example` 补齐支付 env（留空+中文注释）
-   报告里写「待人工真机验证」：用支付宝沙箱钱包扫码完成一笔，确认订单转 paid + 订阅激活 + billing 页配额放开。

---

## 2. T2 · 自建轻量工单系统

**目标**：登录用户能提交工单、看自己工单列表与进度、追加留言；管理员能看全部、改状态、回复。数据进自己库，复用现有账号/组织体系。

### 2.1 数据实体

-   `Ticket.ts`：`id`、`organizationId`(索引)、`createdBy`(用户 id)、`title`、`category`（`billing`/`technical`/`product`/`other`）、`priority`（`low`/`normal`/`high`/`urgent`，默认 normal）、`status`（`open`/`pending`/`resolved`/`closed`，默认 open）、`createdAt`、`updatedAt`、`lastRepliedAt`。
-   `TicketMessage.ts`：`id`、`ticketId`(索引)、`authorId`、`authorRole`（`user`/`staff`）、`content`(text)、`createdAt`。
-   `entities/index.ts` 注册；4 库 migration（时间戳 `1777200000000`）。

### 2.2 service / controller / route（照 billing 分层）

-   `services/tickets/index.ts`：`createTicket`、`listTickets(scope)`（普通用户=自己的；管理员=全部，用 billing 那套 `assertBillingAdmin` 同款的角色判断或现有 RBAC，去 `enterprise/services/account.service.ts` 看现有角色判断范式）、`getTicket`、`addMessage`、`updateStatus`。状态流转校验（`closed` 不能再改回 open 等）。
-   `services/tickets/index.test.ts`：建单/列表权限隔离（A 看不到 B 的单）/加留言更新 `lastRepliedAt`/状态流转非法被拒/管理员可见全部。
-   `controllers/tickets/index.ts` + `routes/tickets/index.ts` 挂载：
    -   `POST /api/v1/tickets`、`GET /api/v1/tickets`、`GET /api/v1/tickets/:id`、`POST /api/v1/tickets/:id/messages`、`PATCH /api/v1/tickets/:id/status`（最后一个限管理员）。

### 2.3 前端

-   `api/tickets.js`。
-   `views/tickets/index.jsx`：工单列表（状态/优先级彩色 chip，照现有 `views/billing` 或 agentexecutions 的表格/chip 风格）+「提交工单」对话框。
-   `views/tickets/TicketDetail.jsx`（或抽屉）：对话式消息流 + 回复框 + 管理员状态下拉。
-   菜单：`menu-items/dashboard.js` 加「工单/客服支持」入口（用 `contact_support.svg`，仓库已有 `packages/ui/src/assets/images/contact_support.svg`）；路由 `MainRoutes.jsx`。
-   i18n：`pages.tickets.*`（标题/状态/优先级/分类/提交/回复/空状态…）en+zh，状态与优先级枚举都要中文映射。

### 2.4 DoD

-   `npx tsc --noEmit` = 0；`npx jest services/tickets` 全过；4 库 migration 齐全。
-   前端列表/详情/提交/回复可渲染（报告写「待人工真机验证」：A 用户提单、管理员回复并置 resolved、A 看到回复与新状态）。

---

## 3. T3 · 占位 VI 方案

**目标**：用代码产出一套**临时但统一**的品牌视觉，覆盖产品所有露出点。专业设计师出图后，改几个变量/换几个文件即可整体替换。**不是原创设计，是体系化 + 占位。**

### 3.1 先勘察（务必先做）

`grep -rn "logo\|Logo\|favicon" packages/ui/src packages/ui/public` + 读 `themes/_flowops-vars`，**摸清现在 logo 在哪些地方、怎么引的**（登录页、侧边栏、欢迎页/官网、可能还有导出文件页眉）。在现状上统一，列一份「露出点清单」放报告。

### 3.2 产出物

-   **SVG 字标 logo**：`packages/ui/src/assets/images/flowops-logo.svg`（横版：紫色 `#7C3AED` 图形 + "FlowOps" 字标）+ `flowops-logo-mark.svg`（纯图形方版，用于 favicon/折叠侧边栏/头像位）。纯代码 SVG，简洁几何即可（如一个流程节点/箭头意象），**不要套用任何第三方品牌图形**。
-   **favicon**：替换 `packages/ui/public/favicon.ico`/相关 png（至少 32/180/512），由 mark 派生；同步 `index.html` 的 `<link icon>` 与 PWA manifest（若有）。
-   **VI 令牌**：在 `themes/_flowops-vars` 补一组品牌 token（主色 `#7C3AED` 已有、加 hover/active 衍生色、辅助色、成功/警告/危险、圆角、字体栈优先中文 `PingFang SC/Microsoft YaHei` 兜底），集中一处便于替换。
-   **统一应用**：把上面清单里的所有 logo 露出点换成新 SVG 组件（建一个 `ui-component/extended/BrandLogo.jsx` 统一引用，避免散落硬编码路径）；官网 `views/publicSite` 顶栏/页脚、登录页、侧边栏、导出文件页眉（若 DocumentExport/PptxExport 有品牌位）都用同一套。
-   **VI 速查文档**：`docs/brand/FlowOps-VI.md`——主色/辅色/中性色色值表、logo 用法与留白、字体、按钮/链接示例、**「如何整体替换为正式 VI」的步骤**（改哪个变量、换哪几个 SVG）。

### 3.3 DoD

-   前端 `pnpm --filter flowise-ui build` 过；页面无 broken 图片。
-   露出点清单里每一处都用了统一 BrandLogo（报告附改前/改后清单）。
-   `docs/brand/FlowOps-VI.md` 完整、含替换指引。

---

## 4. 总验收 & 提交

-   全程在 `codex/commercialization-v1`，**不并 main、不 push**。
-   三块各自 commit：
    -   `feat(payment): 支付宝/微信沙箱对接骨架（下单/扫码/回调验签/激活订阅）`
    -   `feat(tickets): 自建轻量工单系统（提交/列表/状态流转/回复）`
    -   `feat(brand): 占位 VI（SVG 字标/favicon/VI 令牌/统一应用 + VI 速查）`
    -   结尾均 `Co-Authored-By: Codex <noreply@openai.com>`
-   全局门禁：`packages/server` 与 `packages/ui` 各自 `npx tsc --noEmit = 0`；相关 `jest` 全过；`pnpm --filter flowise-components build`（若动了 components）/`flowise-ui build` 过。
-   在 `FORK-CHANGES.md` 登记新增的实体/路由/前端页面/依赖（若有），并在 `.planning/flowops-second-dev/progress.md` 记一行里程碑。
-   报告**逐项列「待人工真机验证」清单**（沙箱支付、工单全链路、VI 露出点），并明确标注 T1 真实收款仍需：营业执照 + 支付宝/微信商户号 + 公网回调地址 + ICP 备案。

## 5. 范围边界（别越界）

-   **不做**真实商户开户、不填任何真实密钥（只跑沙箱/留 env 占位）。
-   **不动** billing 已有的计量/配额核心逻辑（只在「支付成功」处调用其订阅激活）。
-   **不接**第三方工单系统、不引重型支付 SDK。
-   VI **不做**原创吉祥物/复杂插画，只做可被正式设计替换的占位体系。
-   一次一块、过门禁再下一块；任何拿不准（尤其回调 raw body、验签、migration）**停下报告**，不要猜改核心。
