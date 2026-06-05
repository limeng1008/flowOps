# FlowOps 商业化 V1 Smoke 证据台账

日期：2026-06-05
Release 分支：`release/flowops-commercialization-v1`
自动门禁基线 commit：`00ab2d94`
Checklist：`docs/runbooks/FlowOps-go-live-smoke-checklist.md`

## 1. 当前结论

本台账用于补齐 P0#4“关键功能缺少真实环境联调记录”。

截至 2026-06-05，本地构建、结构测试、mock 集成测试已通过；真实浏览器 E2E、真实国产云向量库、支付沙箱扫码和公网回调仍需人工凭证/环境后执行。

上线口径：

-   封闭内测：允许 S08/S09 因凭证或支付资质缺失标记为 `BLOCKED`，但 S01-S07 必须在测试环境真实执行并记录证据。
-   正式公网商业化：S01-S09 必须全部 `PASS`。

## 2. 自动门禁记录

| Case ID                   | 日期       | 执行人 | 环境                            | Commit     | 结果 | 证据                                                                                                                                                                                        |
| ------------------------- | ---------- | ------ | ------------------------------- | ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G01 Node/pnpm 版本        | 2026-06-05 | Codex  | 本地 `/Volumes/project/Flowise` | `51797576` | PASS | `node -v && pnpm -v` 输出 Node `v20.20.2`，pnpm `10.26.0`                                                                                                                                   |
| G02 商业化后端测试        | 2026-06-05 | Codex  | 本地                            | `51797576` | PASS | `cd packages/server && npx jest src/services/billing/index.test.ts src/services/payment/index.test.ts src/services/support-tickets/index.test.ts --runInBand`，20/20 通过                   |
| G03 市场模板测试          | 2026-06-05 | Codex  | 本地                            | `51797576` | PASS | `cd packages/server && npx jest src/services/marketplaces --runInBand`，13/13 通过                                                                                                          |
| G04 导出/国产云向量库测试 | 2026-06-05 | Codex  | 本地                            | `51797576` | PASS | `cd packages/components && npx jest DocumentExport SpreadsheetExport PptxExport TencentCloudVectorDB DashVector BaiduVectorDB VikingDB cloudVectorStore httpClient --runInBand`，44/44 通过 |
| G05 Server 类型检查       | 2026-06-05 | Codex  | 本地                            | `51797576` | PASS | `cd packages/server && npx tsc --noEmit` 通过                                                                                                                                               |
| G06 Components 构建       | 2026-06-05 | Codex  | 本地                            | `51797576` | PASS | `pnpm --filter flowise-components build` 通过                                                                                                                                               |
| G07 Server 构建           | 2026-06-05 | Codex  | 本地                            | `51797576` | PASS | `pnpm --filter flowise build` 通过                                                                                                                                                          |
| G08 UI 构建               | 2026-06-05 | Codex  | 本地                            | `00ab2d94` | PASS | `pnpm --filter flowise-ui build` 通过，仍有 Vite dynamic/static import 与大 chunk 警告                                                                                                      |
| G09 UI i18n               | 2026-06-05 | Codex  | 本地                            | `00ab2d94` | PASS | `cd packages/ui && npx jest i18n --runInBand`，1513/1513 通过                                                                                                                               |
| G10 Fork divergence       | 2026-06-05 | Codex  | 本地                            | `00ab2d94` | PASS | `bash scripts/fork-divergence.sh` 通过                                                                                                                                                      |

## 3. P0 Smoke 执行台账

| Case ID        | 名称                                | 日期   | 执行人 | 环境                | 账号/组织                         | Commit | 结果    | 证据                  | 备注                                                     |
| -------------- | ----------------------------------- | ------ | ------ | ------------------- | --------------------------------- | ------ | ------- | --------------------- | -------------------------------------------------------- |
| S01            | 登录与权限                          | 待执行 | 待填写 | 待填写              | 普通用户、组织管理员、计费运营    | 待填写 | BLOCKED | 待截图/日志           | 需要测试环境账号                                         |
| S02            | 创建与运行 Agent 工作流             | 待执行 | 待填写 | 待填写              | 测试组织/工作区                   | 待填写 | BLOCKED | 待截图/执行记录       | 需要可用国产模型凭证                                     |
| S03            | 应用市场模板导入                    | 待执行 | 待填写 | 待填写              | 测试组织/工作区                   | 待填写 | BLOCKED | 待截图/执行记录       | 至少跑营销、报告、Excel、PPT 模板                        |
| S04            | 文档/表格/PPT 导出                  | 待执行 | 待填写 | 待填写              | 测试组织/工作区                   | 待填写 | BLOCKED | 待导出文件            | 需下载并打开文件                                         |
| S05            | 计费手动开通与硬性拦截              | 待执行 | 待填写 | 待填写              | 普通用户 + `BILLING_ADMIN_EMAILS` | 待填写 | BLOCKED | 待截图/API 日志       | 需要测试组织和运营账号                                   |
| S06            | 工单链路                            | 待执行 | 待填写 | 待填写              | 普通用户 + 工单运营               | 待填写 | BLOCKED | 待截图/API 日志       | 需要 `SUPPORT_ADMIN_EMAILS` 或 `BILLING_ADMIN_EMAILS`    |
| S07            | 国产模型 Token 计量                 | 待执行 | 待填写 | 待填写              | 测试组织/工作区                   | 待填写 | BLOCKED | 待服务端日志/账本查询 | 需记录 provider 原始 usage metadata                      |
| S08-Tencent    | 腾讯云 VectorDB 真实实例            | 待执行 | 待填写 | 待填写              | 云账号/测试集合                   | 待填写 | BLOCKED | 待控制台截图/API 日志 | 当前无测试凭证                                           |
| S08-Alibaba    | 阿里云 DashVector 真实实例          | 待执行 | 待填写 | 待填写              | 云账号/测试集合                   | 待填写 | BLOCKED | 待控制台截图/API 日志 | 当前无测试凭证                                           |
| S08-Baidu      | 百度智能云 VectorDB/Mochow 真实实例 | 待执行 | 待填写 | 待填写              | 云账号/测试集合                   | 待填写 | BLOCKED | 待控制台截图/API 日志 | 当前无测试凭证                                           |
| S08-Volcengine | 火山引擎 VikingDB 真实实例          | 待执行 | 待填写 | 待填写              | 云账号/测试集合                   | 待填写 | BLOCKED | 待控制台截图/API 日志 | 当前无测试凭证                                           |
| S09-Alipay     | 支付宝沙箱扫码回调                  | 待执行 | 待填写 | 公网 HTTPS 测试环境 | 沙箱商户/测试组织                 | 待填写 | BLOCKED | 待订单号/回调日志     | 当前商业化 V1 不开放自助支付，且无公网回调和沙箱商户配置 |
| S09-WeChat     | 微信支付 Native 回调                | 待执行 | 待填写 | 公网 HTTPS 测试环境 | 测试商户/测试组织                 | 待填写 | BLOCKED | 待订单号/回调日志     | 当前商业化 V1 不开放自助支付，且无公网回调和商户配置     |

## 4. 证据保存规则

-   截图：建议保存到 `.planning/flowops-second-dev/smoke-evidence/YYYY-MM-DD/<case-id>/*.png`。
-   服务端日志：保存脱敏后的请求 ID、错误码、订单号、云资源 ID，不保存密钥。
-   云厂商控制台截图：保留数据库/集合/索引名称、维度、metric、记录数，遮盖 API Key。
-   支付回调日志：保留订单号、第三方交易号、金额、状态、验签结论，遮盖密钥和证书内容。
-   导出文件：保留样例文件名、下载链接生成日志和本地打开截图；不要提交客户真实数据。

## 5. 下一次人工执行清单

1. 准备测试环境 URL、普通用户、组织管理员、计费运营、工单运营账号。
2. 配置至少一个国产模型供应商 API Key，用于 S02/S03/S07。
3. 准备一组非敏感测试资料，用于模板和导出链路。
4. 准备四家国产云向量库测试实例或至少确定本次交付承诺哪一家。
5. 如准备开放支付，准备公网 HTTPS 回调域名、支付宝沙箱、微信支付测试商户配置。
6. 执行 `docs/runbooks/FlowOps-go-live-smoke-checklist.md`，把结果填回本台账。
