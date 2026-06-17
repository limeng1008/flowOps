# FlowOps IAM 接缝账本

P4 终态更新日期: 2026-06-17

分支: `codex/p4-enterprise-removal`

结论: active IAM bridge = 0。

## 当前状态

-   `packages/server/src/enterprise/**` 已删除。
-   `packages/server/src/IdentityManager.ts` 已删除。
-   `App.identityManager` 已翻转为 `IFlowOpsIdentity`。
-   `FLOWOPS_IAM` 双轨开关已收束;`iam/provider.ts` 只保留恒定 `self` 的兼容导出。
-   `iam/**` 顶层入口只 re-export 或调用 `iam/self/**` 自有实现。
-   self 路径不允许 lazy `require('../enterprise')`,不允许 `as unknown as` 身份槽擦除,不允许 undefined 兜底。

## 已退役接缝

| 原接缝                                                             | P4 终态                                                                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `iam/security.ts` -> commercial hash/validation                    | `iam/self/security.ts`                                                       |
| `iam/middleware.ts` -> commercial RBAC middleware                  | `iam/self/middleware.ts`                                                     |
| `iam/query.ts` -> commercial workspace guards                      | `iam/self/workspace/query.ts`                                                |
| `iam/entities.ts` -> commercial entity constructors/types          | `iam/self/entities/**` 与自有 `LoggedInUser`                                 |
| `iam/boot.ts` -> commercial passport/auth secrets                  | `iam/self/auth/passport.ts`, `iam/self/middleware.ts`, `iam/self/secrets.ts` |
| `iam/routes.ts` -> commercial route bundle                         | `iam/self/auth/routes.ts`, `iam/self/admin/routes.ts`                        |
| `iam/sso.ts` -> commercial SSO providers                           | 自有空 provider 白名单                                                       |
| `iam/services.ts` -> commercial workspace services                 | `FlowOpsWorkspaceService`, `FlowOpsWorkspaceUserService`                     |
| `iam/identity.ts` -> legacy identity slot bridge                   | `FlowOpsIdentity` implements `IFlowOpsIdentity`                              |
| four database migration `index.ts` files -> deleted IAM migrations | FlowOps + base migrations only                                               |

## 仍保留的历史工具

`scripts/migrate-enterprise-to-flowops-iam.js` 仍是旧库到 `flowops_` 表的一次性数据迁移工具。
它不是运行时 IAM 接缝,也不重新引入已删除源码。

## 回归门禁

源码 removed-source 守卫:

```bash
test ! -d packages/server/src/enterprise
test ! -f packages/server/src/IdentityManager.ts
rg -n "src/enterprise|/enterprise/|\\.\\./enterprise|IdentityManager|getIdentityManager|FLOWOPS_IAM|loadEnterprise|getEnterprise" packages/server/src
```

编译与测试:

```bash
cd packages/server && npx tsc --noEmit --pretty false
cd packages/server && npx jest
```

出货产物守卫:

```bash
scripts/build-ship.sh
```

`scripts/verify-ship-dist.sh` 会检查:

-   dist 中没有 `enterprise` 目录产物。
-   dist 中没有 `IdentityManager.*`。
-   dist JS 不引用已删除 IAM 源码路径。
-   四库 migration 入口不注册已删除 IAM migration 类。
