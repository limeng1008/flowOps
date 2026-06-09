# Codex 执行计划：国产化支付 P0 —— 在线收款收敛到生产级

> 目标读者：Codex。这是**执行计划**，按任务逐项实现并自测、过门禁后提交。
> 配套设计方案见同目录 `国产化支付方案.md`（P0 = 其中"在线收款"那条线）。

---

## 0. 背景

`codex/commercialization-v1` 分支已有**真实沙箱级**支付骨架（不是 mock）：

-   `services/payment/`：`PaymentProvider` 接口 + `AlipayProvider`(当面付 `alipay.trade.precreate`, RSA2) + `WechatProvider`(微信 v3 `transactions/native`) + `PaymentService`(createOrder / handleNotification / getOrderStatus) + `utils.ts`(签名/验签) + `types.ts`。
-   `controllers/payment/` + `routes/payment/`：`POST /order`、`GET /order/:orderNo`、`POST /notify/alipay`、`POST /notify/wechat`。
-   实体 `PaymentOrder`(状态 PENDING/PAID/FAILED/CLOSED) + `BillingPlan/Subscription/Usage`。

P0 不重写底座，**只把它收敛到能上生产**：补齐回调可靠性、幂等并发、主动查单、订单超时、安全与留痕、购买 UI 闭环、测试与门禁。

---

## 1. 分支与 worktree 纪律（强制，先读）

-   **必须在独立 git worktree 工作**，禁止在共享主 checkout `/Volumes/project/Flowise` 上提交或切分支（此前多次造成 stash/冲突）。
    -   建议：`git worktree add /Users/Zhuanz/.config/superpowers/worktrees/Flowise/codex-payment-p0 -b feat/payment-p0 codex/commercialization-v1`
-   **分支基点是 `codex/commercialization-v1`**（支付骨架在那里，**不在 main**），不要从 main 切。
-   完成后**不要自行合入 main、不要动主 checkout**；交付 `feat/payment-p0` 分支，由维护者评审合并。
-   提交信息结尾加：`Co-Authored-By: Codex <noreply@openai.com>`
-   每次提交前必须跑通 §8 门禁（此前出现过 Codex 未跑门禁直接提交导致 lint 失败）。

---

## 2. P0 范围

**做**：支付宝当面付 + 微信 Native 扫码，沙箱 → 可生产；回调可靠（raw body/验签/幂等/并发）；主动查单补偿；订单超时关闭；对账定时任务；安全（免鉴权白名单/重放/留痕）；配置校验与 env 文档；购买 UI 闭环（扫码 → 轮询 → 开通）；测试。

**不做（留 P1+）**：银联 / 数字人民币 / 对公转账；发票；退款（REFUNDED）；离线 License；"发证/收款"与产品端解耦。这些**不要**在本计划里实现。

---

## 3. 任务拆解

### T1 原始请求体（raw body）中间件 —— 验签前提【最高优先】

-   问题：`verifyAndParseNotification` 依赖 `(req as any).rawBody`，但全局 body-parser 会消费原始体，导致拿不到**精确字节**→ 验签失败（支付宝按表单串验签、微信按原始 JSON 验签，任何重序列化都会破坏签名）。
-   改法：在 `packages/server/src/index.ts` 的 body-parser 配置处，给 `/api/v1/payment/notify/*` 接入 `express.raw({ type: '*/*' })`，或在现有 `express.json/urlencoded` 的 `verify` 回调里把 `req.rawBody = buf` 缓存（**仅对 notify 路径**生效，避免全站缓存大 body 影响内存）。务必放在全局 JSON parser **之前**对 notify 生效。
-   登记：`packages/server/src/index.ts` 属核心文件改动，写入 `FORK-CHANGES.md`（分类如 `Server-payment` 或现有合适分类）。
-   验收：单测用真实签名构造 body，notify 能取到逐字节一致的 rawBody 并验签通过。

### T2 回调幂等 + 并发安全 —— 事务 + 行锁/原子更新

-   问题：`handleNotification` 的"读订单 → 判 status→save PAID→ 激活订阅"非原子。支付方会**重复/并发**重发回调，两次并发可在 `status===PAID` 判定之间都通过 → **重复激活订阅**。
-   改法：用 `AppDataSource.transaction`，对订单行加悲观写锁（TypeORM `setLock('pessimistic_write')` / `SELECT ... FOR UPDATE`）；或用条件原子更新 `UPDATE payment_order SET status='paid'... WHERE orderNo=? AND status='pending'`，据 affected rows 决定是否激活订阅；**订阅激活与订单落 PAID 在同一事务**。已 PAID → 直接 ack，不重复激活。
-   抽公共方法 `settlePaidOrder(order, notification, manager)` 供 T3 复用。
-   验收：单测并发两次相同成功回调，订阅只激活一次、订单只结算一次。

### T3 主动查单（active query）补偿

-   问题：回调可能丢；`getOrderStatus` 只读本地 DB，PENDING 永不前进 → 用户付了钱不开通。
-   改法：
    -   `PaymentProvider` 接口新增 `queryOrder(orderNo): Promise<PaymentNotification>`；
    -   Alipay 实现 `alipay.trade.query`，Wechat 实现 `GET /v3/pay/transactions/out-trade-no/{out_trade_no}`；
    -   `getOrderStatus` 在订单为 PENDING 时触发一次主动查单，若支付方显示已支付 → 走 T2 的 `settlePaidOrder` 同一原子逻辑结算。
-   验收：模拟"无回调但支付方已支付"，`getOrderStatus` 自动结算为 PAID 并激活订阅；幂等。

### T4 订单超时与关闭

-   问题：PENDING 订单永不过期；`CLOSED` 状态无人设置；用户无法干净重试。
-   改法：`PaymentOrder` 增 `expireAt`（下单时 = now + `PAYMENT_ORDER_TTL_MINUTES`，默认 15）；超时 PENDING → 置 `CLOSED`，并尽量调用支付方关单（`alipay.trade.close` / 微信关单）；关单幂等。需 sqlite 迁移（见 `database/migrations/sqlite`，与现有迁移风格一致）。
-   验收：过期订单被置 CLOSED；重复关单不报错。

### T5 对账/补偿定时任务（ReconciliationJob）

-   问题：缺兜底扫描。
-   改法：复用 Flowise 现有 `ScheduleBeat`/node-cron（见 `index.ts` 初始化日志 `ScheduleBeat`）。新增周期任务：扫描近 N 小时 PENDING 订单 → 主动查单（T3）→ 结算或按 T4 关闭。非队列模式单实例即可（注意现有 ScheduleBeat 在非队列模式的告警语义）。若改了任务注册点（核心文件）→ 登记 ledger。
-   验收：任务可注册、可手动触发、对 PENDING 订单批量生效。

### T6 回调端点安全 & ack 语义

-   改法：
    -   确认 `/api/v1/payment/notify/*` 在 Flowise 鉴权白名单（`whitelistURLs` 或等价机制）内——支付方回调**无用户态**，必须免登录、免 CSRF；
    -   **验签失败 → 绝不激活、绝不返回成功 ack**（让支付方按其策略重试或转人工）；
    -   微信 v3：校验 `Wechatpay-Timestamp/Nonce/Serial/Signature` 头 + **5 分钟重放窗口** + 平台证书（`WECHAT_PLATFORM_CERT`，注意证书轮换）；回调体用 `APIv3Key` AES-256-GCM 解密。
    -   ack 格式：支付宝返回纯文本 `success`；微信返回 `{code:'SUCCESS', message:'OK'}`（现有 `ack()` 已区分，确认 controller 对应 `.send` vs `.json` 正确）。
-   验收：未登录可达 notify；伪造/篡改签名不激活且不 ack 成功；重放被拒。

### T7 原始回调留痕（审计/对账）

-   改法：新增实体 `PaymentNotificationLog`（`orderNo`、`provider`、`verified`、`rawBody`(text)、`headersDigest`、`createdAt`）或在 `PaymentOrder` 加 `notifyRaw` 列；`handleNotification` 对**每次回调（含验签失败）**落库。
-   验收：每次回调有留痕，可据此排障/对账。

### T8 配置校验与沙箱/生产切换

-   问题：provider 构造时 `requireEnv` 抛错 → 缺配置时下单 500 堆栈。
-   改法：下单前（或启动时）对所选渠道做配置校验，缺失返回**清晰中文错误**（如"支付宝渠道未配置，请设置 ALIPAY_APP_ID 等"）而非 500；把全部 env 写入 `deploy/.env.example` 并注释沙箱 ↔ 生产网关切换（`ALIPAY_GATEWAY`/`WECHAT_GATEWAY`、`PAYMENT_NOTIFY_BASE_URL`）。
-   验收：缺配置报清晰错误；env 文档完整。

### T9 购买流程 UI 闭环（最小可用）

-   改法：`packages/ui/src/views/billing` 调 `createOrder` 拿 `qrCodeUrl` → 渲染二维码（用项目已有二维码依赖，没有则用轻量生成，**勿** `pnpm add` 乱升级，按项目"手改 package.json + install"规则）→ 轮询 `GET /order/:orderNo`（含 T3 主动查单）→ PAID 后刷新订阅/账户状态并提示成功；en/zh i18n 同步新增键。
-   验收：沙箱下完整跑通"扫码 → 支付 → 自动开通"。

### T10 测试

-   扩展 `services/payment/index.test.ts` 并新增 provider/job 测试，覆盖：验签成功/失败、金额不符、**幂等并发**、**主动查单结算**、订单超时关闭、raw body 逐字节、ack 格式、重放拒绝。`axios`/`crypto` 用 mock；不要真连支付方。

---

## 4. 不要碰的东西

-   不要重写 `PaymentProvider` 接口/`PaymentService` 整体结构（在其上扩展）。
-   不要引入新支付渠道（银联/数币/对公）——那是 P1。
-   不要改与支付无关的核心文件；任何核心文件改动都要进 `FORK-CHANGES.md`。
-   不要 `pnpm add`（会升 `@types/node` 破坏 tsc）；按需手改 package.json + `pnpm install`。

---

## 5. 安全 Checklist（提交前自检）

-   [ ] notify 免鉴权白名单且**仅**这些路径；
-   [ ] 验签失败不激活、不 ack 成功；
-   [ ] 金额(分)/订单号/provider 三重校验；
-   [ ] 幂等 + 事务 + 行锁，重复回调不重复发货；
-   [ ] 微信重放窗口 + 平台证书；
-   [ ] 密钥只从 env 读，不入库不入日志（日志脱敏）；
-   [ ] 回调留痕。

---

## 6. 验收门禁（每次提交前必须全绿）

```bash
# 后端类型与测试
cd packages/server && npx tsc --noEmit
npx jest payment billing 2>&1 | tail -5
# fork 纪律（所有被改核心文件须登记 FORK-CHANGES.md）
cd /<your-worktree> && bash scripts/fork-divergence.sh
# 若改了 UI
pnpm --filter flowise-ui build
```

-   tsc 0 错误；jest 全绿；fork-divergence 通过；（动 UI 则）build 通过。
-   Node 必须 20：`source ~/.nvm/nvm.sh && nvm use 20`。

---

## 7. 交付

-   分支 `feat/payment-p0`（基于 `codex/commercialization-v1`），独立 worktree。
-   提交粒度按任务（T1…T10）拆分，信息含 `Co-Authored-By: Codex <noreply@openai.com>`。
-   完成后在分支根写一句话验收说明（沙箱跑通的证据/日志摘要），**等待维护者评审**，不要自行合 main。
