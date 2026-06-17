# FlowOps 离线授权签发手册

本文档面向产品方/交付方，用于离线生成 FlowOps 私有版 `.lic` 授权文件。签发工具位于仓库根目录 `tools/flowops-license/`，只服务卖证端，不随产品运行时发布。

## 1. 生成生产密钥对

在离线、安全的签发机器上生成 Ed25519 密钥对：

```bash
node tools/flowops-license/generate-keypair.js \
  --public-key /secure/flowops-license-public.pem \
  --private-key /secure/flowops-license-private.pem
```

规则：

-   私钥 `/secure/flowops-license-private.pem` 只保存在产品方离线签发环境，绝不提交仓库，绝不打进产品包。
-   公钥 `/secure/flowops-license-public.pem` 用于产品验签，可通过 `FLOWOPS_LICENSE_PUBLIC_KEY` 注入客户部署环境。
-   `services/license/index.ts` 内置默认公钥只是占位/测试 fallback；生产上线必须使用产品方生成的生产公钥覆盖，或经评审后替换默认公钥。

## 2. 配置产品侧公钥

推荐在客户部署环境注入公钥：

```bash
export FLOWOPS_LICENSE_PUBLIC_KEY="$(cat /secure/flowops-license-public.pem)"
```

也可以在出货构建中替换默认公钥，但必须确保只包含公钥，不包含私钥。`LicenseService.getPublicKey()` 已优先读取 `FLOWOPS_LICENSE_PUBLIC_KEY`。

## 3. 签发客户授权

`mint-license.js` 输出三段式 `.lic`：

```text
base64url(header).base64url(payload).base64url(signature)
```

header 固定为：

```json
{ "alg": "EdDSA", "typ": "FLOWOPS-LICENSE" }
```

payload 与 `FlowOpsLicensePayload` 对齐，核心字段包括 `customer`、`tier`、`model`、`seats`、`concurrency`、`issuedAt`、`expireAt`、`machineFingerprint`、`modules`、`licenseId`。

### 订阅授权示例

```bash
node tools/flowops-license/mint-license.js \
  --private-key /secure/flowops-license-private.pem \
  --customer "Acme Manufacturing" \
  --tier team \
  --model subscription \
  --seats 20 \
  --concurrency 10 \
  --issued-at 2026-06-17T00:00:00.000Z \
  --expire-at 2027-06-17T00:00:00.000Z \
  --machine-fingerprint "客户机器指纹" \
  --module feat:datasets \
  --module feat:evaluations \
  --module feat:evaluators \
  --module feat:logs \
  --module feat:users \
  --module feat:workspaces \
  --module feat:roles \
  --license-id lic_acme_20260617 \
  --output /secure/licenses/acme-20260617.lic
```

订阅授权过期后会进入宽限只读；宽限结束后只保留登录、授权状态查询和导入新授权的恢复路径。

### 永久买断授权示例

```bash
node tools/flowops-license/mint-license.js \
  --private-key /secure/flowops-license-private.pem \
  --customer "Acme Manufacturing" \
  --tier enterprise \
  --model perpetual \
  --seats -1 \
  --concurrency -1 \
  --issued-at 2026-06-17T00:00:00.000Z \
  --expire-at 2027-06-17T00:00:00.000Z \
  --machine-fingerprint "客户机器指纹" \
  --modules feat:datasets,feat:evaluations,feat:evaluators,feat:logs,feat:users,feat:workspaces,feat:roles,feat:files \
  --output /secure/licenses/acme-perpetual.lic
```

`model=perpetual` 的 `expireAt` 表示维护/升级有效期，不触发运行时降级；客户仍可继续使用已购版本。

### 私钥来自环境变量

如果签发平台用密钥托管系统注入私钥 PEM，可使用：

```bash
export FLOWOPS_LICENSE_PRIVATE_KEY="$(cat /secure/flowops-license-private.pem)"

node tools/flowops-license/mint-license.js \
  --private-key-env FLOWOPS_LICENSE_PRIVATE_KEY \
  --customer "Acme Manufacturing" \
  --tier pro \
  --model subscription \
  --seats 5 \
  --concurrency 3 \
  --expire-at 2027-06-17T00:00:00.000Z \
  --machine-fingerprint "*" \
  --module feat:datasets \
  --module feat:evaluations \
  --module feat:evaluators \
  --module feat:logs \
  --output /secure/licenses/acme-pro.lic
```

`--machine-fingerprint "*"` 表示不绑定机器。正式客户授权建议绑定客户机器指纹。

## 4. 获取客户机器指纹

客户可在授权页面复制本机指纹，或通过 API 查询：

```bash
curl -s http://FLOWOPS_HOST/api/v1/license/fingerprint
```

将返回的 `fingerprint` 用作 `--machine-fingerprint` 参数。多机器授权可重复传入：

```bash
--machine-fingerprint fp-node-a --machine-fingerprint fp-node-b
```

## 5. 客户导入授权

客户可在 UI 的 License 页面粘贴/上传 `.lic`，也可调用 API：

```bash
curl -X POST http://FLOWOPS_HOST/api/v1/license/import \
  -H 'Content-Type: application/json' \
  --cookie '登录后的 cookie' \
  -d '{"license":"粘贴 .lic 三段式文本"}'
```

导入成功后，服务端会立即刷新 App 级 license cache。若旧授权已过期，L4 中间件仍会放行登录、`/api/v1/license/**` 和 settings，确保客户能导入新证自救。

## 6. 续费、扩容与换绑

-   续费：用新的 `expireAt` 重新签发 `.lic`，客户导入后即恢复 active。
-   扩座：调整 `seats` 并重新签发 `.lic`。
-   升级版本：调整 `tier` 和 `modules` 并重新签发 `.lic`。
-   机器换绑：使用新机器指纹重新签发 `.lic`；旧机器指纹不匹配时会返回 `FINGERPRINT_MISMATCH`。

## 7. 出货边界

`tools/flowops-license/` 是卖证端离线工具，不属于产品运行时。`scripts/verify-ship-dist.sh` 会检查 `packages/server/dist` 中不存在该工具目录或运行时引用。
