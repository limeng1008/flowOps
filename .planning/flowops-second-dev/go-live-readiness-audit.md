# FlowOps 上线 readiness 统一检查报告

日期：2026-06-05
检查分支：`codex/china-cloud-vectorstores`
检查提交：`ba5676be`
上线口径：面向真实客户、真实收费、真实数据、可持续运维的正式生产上线。

## 结论

当前 **不符合正式生产上线要求**。

更准确地说：代码层面的主要构建和关键单测能通过，适合继续做内部演示、POC、封闭内测；但还不适合对外正式商业化上线。核心原因不是“跑不起来”，而是发布状态、真实支付闭环、真实云服务联调、人工 E2E 验收、合规与运维准备还没有闭环。

## 整改记录

### 2026-06-05：P0#1 发布物可复现

-   已从 `codex/china-cloud-vectorstores` 切出 `codex/go-live-hardening`，并把上线前混杂改动拆成可审计提交。
-   已提交并推送 `codex/go-live-hardening`；本地工作树确认干净。
-   本地非发布素材通过 `.git/info/exclude` 排除，不进入 release 构建物。

### 2026-06-05：P0#2 release 候选分支

-   已从干净的 `codex/go-live-hardening` 创建 `release/flowops-commercialization-v1`，用于固定商业化 V1 候选发布源。
-   release 分支基线来源为 `codex/go-live-hardening` 的 `51797576`，包含国产云向量库增强、商业化整理、auth 修复、授权网页抓取工具、UI 视觉/i18n 收尾和 fork ledger 登记。
-   已在 `release/flowops-commercialization-v1` 上重跑关键门禁：
    -   `node -v && pnpm -v`：Node `v20.20.2`，pnpm `10.26.0`
    -   `cd packages/server && npx jest src/services/billing/index.test.ts src/services/payment/index.test.ts src/services/support-tickets/index.test.ts --runInBand`：20/20 通过
    -   `cd packages/server && npx jest src/services/marketplaces --runInBand`：13/13 通过
    -   `cd packages/components && npx jest DocumentExport SpreadsheetExport PptxExport TencentCloudVectorDB DashVector BaiduVectorDB VikingDB cloudVectorStore httpClient --runInBand`：44/44 通过
    -   `cd packages/server && npx tsc --noEmit`：通过
    -   `pnpm --filter flowise-components build`：通过
    -   `pnpm --filter flowise build`：通过
    -   `pnpm --filter flowise-ui build`：通过，仍保留 Vite dynamic/static import 与大 chunk 警告
    -   `cd packages/ui && npx jest i18n --runInBand`：1502/1502 通过
    -   `bash scripts/fork-divergence.sh`：通过

### 2026-06-05：P0#3 支付上线策略

-   已明确商业化 V1 不开放自助支付，正式上线口径为“后台手动开通套餐 + 硬性额度拦截”。
-   用户账号页已展示“当前版本采用后台手动开通套餐，不开放自助购买”，并提示联系运营管理员升级额度或延长有效期。
-   `/billing` 运营后台已展示“V1 计费采用后台手动开通，不开放用户自助支付”，并明确支付宝/微信需完成商户、备案和公网回调验收后再开放。
-   `deploy/.env.example` 已补充支付配置说明：支付 env 仅用于沙箱/公网回调联调，正式收款前必须完成商户资质、ICP 备案、HTTPS 回调、验签和对账验收。
-   新增 UI i18n 守卫，确保本地计费后台不出现 `createOrder`、`getOrderStatus`、`paymentApi`、`扫码`、`购买` 等自助支付入口痕迹。
-   支付服务代码仍保留为沙箱/后续真实支付接入骨架；在真机扫码和公网回调验收前，不计入正式收款闭环。

### 2026-06-05：P0#4 Smoke 证据机制

-   已新增 `docs/runbooks/FlowOps-go-live-smoke-checklist.md`，覆盖登录权限、Agent 创建运行、应用市场模板、文档/表格/PPT 导出、计费手动开通与 402 拦截、工单、国产模型 token 计量、四家国产云向量库真实实例、支付沙箱回调。
-   已新增 `.planning/flowops-second-dev/go-live-smoke-evidence.md`，作为本次 release 的 smoke 证据台账，固定记录日期、执行人、环境、账号/组织、commit、结果、截图/日志/订单号/云资源 ID 和备注。
-   已把本次自动门禁登记为 PASS：商业化后端测试、市场模板测试、导出/国产云向量库 mock 测试、server 类型检查、三包构建、UI i18n、fork divergence。
-   真实浏览器 E2E、真实国产云向量库 upsert/search/delete、支付沙箱扫码和公网回调仍需人工凭证/环境后执行；当前台账中均标为 `BLOCKED`，不能作为正式公网商业化 PASS。

## 已通过的技术门禁

本次检查实际执行过以下命令：

| 项目                   | 命令                                                                                                                                                                            | 结果                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 环境版本               | `node -v && pnpm -v`                                                                                                                                                            | Node `v20.20.2`，pnpm `10.26.0` |
| Components 构建        | `pnpm --filter flowise-components build`                                                                                                                                        | 通过                            |
| Server 类型检查        | `cd packages/server && npx tsc --noEmit`                                                                                                                                        | 通过                            |
| Server 构建            | `pnpm --filter flowise build`                                                                                                                                                   | 通过                            |
| UI 构建                | `pnpm --filter flowise-ui build`                                                                                                                                                | 通过，但有 chunk 过大警告       |
| 商业化后端测试         | `cd packages/server && npx jest src/services/billing/index.test.ts src/services/payment/index.test.ts src/services/support-tickets/index.test.ts --runInBand`                   | 20/20 通过                      |
| 市场模板测试           | `cd packages/server && npx jest src/services/marketplaces --runInBand`                                                                                                          | 13/13 通过                      |
| 导出与国产云向量库测试 | `cd packages/components && npx jest DocumentExport SpreadsheetExport PptxExport TencentCloudVectorDB DashVector BaiduVectorDB VikingDB cloudVectorStore httpClient --runInBand` | 44/44 通过                      |
| UI i18n 测试           | `cd packages/ui && npx jest i18n --runInBand`                                                                                                                                   | 1502/1502 通过                  |
| Fork divergence        | `bash scripts/fork-divergence.sh`                                                                                                                                               | 通过                            |

## 当前满足的上线基础

-   构建链路基本可用：server、ui、components 均能 build。
-   计费中台 V1 已有后端服务与测试：套餐、订阅、token/bot/seat 配额、402 拦截、后台白名单权限。
-   支付服务已有支付宝/微信沙箱骨架：下单、回调验签、金额校验、订单幂等、支付后激活订阅，单测覆盖。
-   工单服务已有后端与前端入口，权限隔离单测通过。
-   官网/文档/帮助中心已有站内实现与使用说明文档。
-   国产模型、导出节点、国产云向量库节点、应用市场模板已有较多结构测试与构建验证。
-   部署文档已有基础私有化路径，包含 Docker Compose、密钥生成、备份说明、离线镜像说明。
-   四库 migration 齐：billing、payment、support tickets 在 postgres/mysql/mariadb/sqlite 下均有 migration 文件。

## P0 阻断项：不解决不能正式上线

### 1. 当前工作树不干净，发布物不可复现

`git status --short --branch` 显示当前分支仍有 34 项未提交/未跟踪改动，包含 UI logo、主题、i18n、auth、marketplace/tool 等文件。

影响：

-   无法确认最终上线代码到底包含哪些改动。
-   无法基于 commit/tag 做可回滚发布。
-   未跟踪文件不会进入构建镜像或远端仓库，容易出现“本地有、线上没有”。

要求：

-   发布前必须清理工作树。
-   要么提交这些改动，要么明确丢弃/移出。
-   基于干净 commit 打 release tag。

### 2. 当前不在稳定发布分支

当前分支是 `codex/china-cloud-vectorstores`，不是 `main` 或 release 分支。当前 HEAD 为 `ba5676be`，`origin/main` 为 `2799e526`。

影响：

-   国产云向量库增强尚未合入主发布线。
-   不能直接把功能分支当生产发布源。

要求：

-   合并到 `main` 或创建 `release/*` 分支。
-   在 release 分支上重跑完整构建、关键测试和 smoke。

### 3. 支付还不是正式收款闭环

代码层有支付宝/微信支付服务，但当前状态仍偏“沙箱骨架”：

-   `deploy/.env.example` 中 `PAYMENT_NOTIFY_BASE_URL`、支付宝、微信支付商户密钥全部为空。
-   计划文档仍明确写着真实收款需要营业执照、商户号、公网 HTTPS 回调、ICP 备案。
-   UI 搜索未发现新的支付宝/微信下单/二维码支付入口；账户页仍有较多 Stripe payment method 旧逻辑痕迹。
-   未见支付宝沙箱钱包/微信支付沙箱的真机扫码验收记录。

影响：

-   用户无法完整自助购买/续费。
-   即使后端接口存在，也不能证明真实回调链路在公网可用。

要求：

-   明确生产支付方案：支付宝、微信，或暂时“后台手动开通”。
-   若要正式收款：完成商户开户、生产密钥、HTTPS 回调、验签真机验证、订单对账、退款/异常订单处理策略。
-   前端补齐购买入口或明确隐藏自助购买。

### 4. 关键功能缺少真实环境联调记录

当前通过了大量 mock/结构测试，但以下还缺真实环境 smoke：

-   国产云向量库：腾讯云 VectorDB、阿里云 DashVector、百度 VectorDB/Mochow、火山 VikingDB 未用真实实例 upsert/search/delete。
-   支付：未记录真实沙箱扫码付款到订单 paid 再到订阅激活。
-   工单：未记录普通用户提单、管理员回复、普通用户查看回复的浏览器验收。
-   应用市场模板：部分模板只有结构测试，缺少导入画布后用真实模型跑通的记录。
-   国产模型 token usage：历史进度里仍标注“国产模型 token usage 字段格式与 OpenAI 不一致需校准计费口径”。

影响：

-   单测通过不等于客户链路可用。
-   计费可能少记、漏记或误拦截。

要求：

-   建立上线 smoke checklist。
-   每个关键商业链路保留日期、账号、环境、截图/日志、结论。

### 5. 法务与合规材料不足

当前没有看到完整的正式上线合规包：

-   ICP 备案/公网域名准备未闭环。
-   隐私政策、用户协议、服务条款、退款政策未形成正式版本。
-   支付宝/微信商户资质未闭环。
-   模型供应商数据处理说明、客户数据出域说明、日志留存策略未闭环。

影响：

-   对外 SaaS 或公网商业化风险较高。
-   企业私有化交付时也缺少客户安全审查材料。

要求：

-   至少补齐隐私政策、用户协议、退款/售后政策、数据处理说明、部署安全说明。
-   公网商业化前完成 ICP 与支付商户资质。

### 6. 运维与生产安全准备不足

部署文档已有基础说明，但正式上线还缺：

-   生产域名 + HTTPS + 反向代理配置。
-   数据库备份恢复演练记录。
-   日志保留、告警、错误追踪、支付回调审计日志策略。
-   灰度/回滚流程。
-   migration 在真实数据库上的 dry-run 记录。
-   生产环境密钥轮换和权限管理流程。
-   文件上传容量、恶意文件、存储清理策略。

影响：

-   出问题时难以定位、回滚、恢复。
-   支付和计费类问题没有足够审计证据。

要求：

-   写生产 runbook。
-   至少做一次从备份恢复到可登录的演练。
-   支付回调、计费拦截、工单消息要有可检索日志。

## P1 高优先级风险：上线前强烈建议解决

### 1. UI 构建有明显性能警告

`pnpm --filter flowise-ui build` 通过，但 Vite 报告多个大 chunk，最大 chunk 约 `6,042.79 kB`，gzip 后约 `1,957.33 kB`。

影响：

-   首屏和弱网体验差。
-   私有化内网环境也可能加载慢。

建议：

-   做 manualChunks / 动态 import 拆包。
-   至少对首屏、登录页、画布页做真实浏览器性能检查。

### 2. E2E 测试体系不足

仓库里 Cypress 用例存在“login 未启用所以禁用”的 TODO。当前本次检查没有跑完整 E2E。

影响：

-   无法证明登录、建流、运行、计费拦截、支付、工单、模板导入等端到端流程稳定。

建议：

-   建一个最小 E2E 套件：注册/登录、创建智能体、运行一次、触发计费、管理员开通套餐、工单提交流程。

### 3. 支付回调 raw body 需要真实网关验证

后端 `paymentController` 会从 `req.rawBody`、字符串 body 或 JSON body 拼回 Buffer。真实支付宝/微信回调对原始报文签名非常敏感。

影响：

-   Express body parser 若提前改写 body，线上验签可能失败。

建议：

-   在真实公网回调地址上验证支付宝、微信各一笔。
-   明确 payment notify route 使用 raw body 中间件。

### 4. 前端商业化入口不完整

当前有 `/billing` 后台、账号页计费概览、工单入口，但搜索 UI 代码未看到支付宝/微信支付下单入口。

影响：

-   用户侧商业化仍需要运营手动介入。

建议：

-   如果 V1 定位是“后台手动开通”，前端要明确写“联系管理员开通”，并隐藏自助购买。
-   如果要自助购买，补支付弹窗、二维码、订单轮询、支付成功刷新套餐。

### 5. 文档与产品定位仍有不一致风险

使用说明中仍有大量客服/订单/物流/售后示例。之前产品定位已改为“AI Agent 工作流管理平台”，不是电商客服工具。

影响：

-   对外文案可能把客户带偏。

建议：

-   将客服作为一个行业模板，而不是首页/主文档默认定位。
-   官网首屏和产品说明统一到“AI Agent 工作流管理平台”。

### 6. 仍有上游 Flowise 元信息残留

根 `package.json`、server/ui package 中 `homepage` 仍是 `https://flowiseai.com`，author 仍为上游信息。

影响：

-   不一定影响运行，但会影响品牌、包元信息、法律归属表达。

建议：

-   正式商业发布前统一 package metadata、README、license/notice、about 页。

## P2 中期完善项

-   国产云向量库需要真实云端兼容矩阵：地域、维度、filter 语法、批量上限、限流策略。
-   需要统一安全扫描：依赖漏洞、镜像漏洞、License 扫描。
-   需要多数据库 migration 实跑：postgres/mysql/mariadb/sqlite 至少各跑一次迁移。
-   需要导出文件安全策略：下载链接权限、过期时间、文件清理。
-   需要审计日志：管理员改套餐、手动开通/停用、支付回调、工单状态变更。
-   需要数据保留策略：聊天记录、上传文件、导出文件、工单附件。
-   需要正式 VI 替换占位 VI：logo、favicon、品牌色、产品名、官网视觉。

## 建议上线路线

### 阶段 A：内部演示 / POC

可做，但要明确边界：

-   不接真实收款。
-   使用后台手动开通套餐。
-   国产云向量库只选已真实联调过的一家。
-   用测试数据，避免真实客户敏感数据。

### 阶段 B：封闭内测

必须完成：

-   清理工作树，合入 release 分支。
-   支付选择“手动开通”或“沙箱验证通过但不开放真实收款”。
-   完成至少 5 条 E2E smoke：登录、创建 Agent、运行、计费拦截/开通、工单。
-   部署到一台干净服务器，跑 migration 和备份恢复演练。

### 阶段 C：正式商业上线

必须完成：

-   真实支付商户、ICP 备案、域名 HTTPS、隐私/协议/退款政策。
-   支付宝/微信真实或沙箱完整扫码回调验收，订单和订阅状态可审计。
-   生产监控、日志、告警、备份、回滚流程。
-   UI 性能优化到可接受水平。
-   关键模板和国产云节点真实环境验收记录归档。

## 当前最短行动清单

1. 清理当前 34 项未提交/未跟踪文件，创建干净 release 分支。
2. 决定第一版是否开放真实支付；如果不开放，隐藏自助购买入口并明确“后台手动开通”。
3. 做一份 smoke checklist，并在真实浏览器里跑：登录、创建工作流、运行模型、导入模板、文档导出、计费拦截、运营开通、工单。
4. 选择一家国产云向量库先做真实联调，暂时不要承诺 4 家全部生产可用。
5. 补法律/合规/备案/支付商户材料。
6. 做一次 Docker 干净环境部署、数据库迁移、备份恢复演练。
