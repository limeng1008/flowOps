# FlowOps 自建 IAM · P0 解耦收口 · Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**过门禁再提交;任何门禁失败停下报告,不要猜改核心。**
>
> ## 背景(为什么做)
>
> `packages/server/src/enterprise/` + `packages/server/src/IdentityManager.ts` 是 **FlowiseAI 商业授权**(禁止复制/分发/售卖),其余代码是 Apache 2.0。FlowOps 决定**真自建**用户/角色/工作区体系(干净替换商业授权部分,产品才能合法售卖)。
>
> 总路线四期:**P0 解耦收口(本计划)** → P1 自有 IAM 最小实现 → P2 工作区+RBAC 完整 → P3 出货化(构建剥离 enterprise)。
>
> **P0 只做一件事:把 Apache 核心里 ~58 个文件对 enterprise 的散装 import,全部收口到一个我们自有的 `src/iam/` 接口层(内部暂时转发回 enterprise,行为零变化)。** 这样 P1 替换实现时只动 `iam/` 一个目录。P0 是纯机械重构,不写任何新功能。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`;**Node 20**(`nvm use 20`,系统默认 22)。
-   从 **`main`** 切分支 **`codex/iam-p0-decouple`**。**不要 push、不碰 main**,做完留人工 review。(若由主计划 `codex-flowops-iam-selfbuild-plan.md` 驱动执行,分支以主计划为准:`codex/iam-selfbuild`。)
-   数据库现为 **PostgreSQL 16**(本机 brew,库/用户/密码均 `flowise`);`.env` 已配好,启动验证用它。

### 0.2 ⚠️ 铁律

-   **不改 `src/enterprise/` 内任何文件**,不改 `IdentityManager.ts` 内容(只动谁 import 它)。**口径裁定:`IdentityManager.ts` 与 `enterprise/` 同属商业授权边界文件——它内部的 `from './enterprise/...'` import 属预期存在,P0 保持原样不动,收口 grep 将其排除(见 §3),P3 出货时随 enterprise 一并剥离。**
-   **`src/iam/` 内 P0 只做 re-export / 薄转发**,禁止把 enterprise 的实现代码复制进来(import 转发 ≠ 复制;P1 才写自有实现)。
-   **不动 UI**(`packages/ui` 零改动)。
-   **行为零变化**:P0 完成后系统功能、API、权限行为必须与改前完全一致。
-   实体日期列若新增,必须 `type: Date`,禁止字符串 `'datetime'`/`'timestamp'`(守护测试 `sqliteDateColumns.test.ts` 会拦)。
-   注释里别出现 `*/`;husky 跑 prettier+eslint。

---

## 1. 现状依赖清单(已勘察,按此动手)

Apache 核心(`src/` 除 `enterprise/` 外)对 enterprise 的依赖,按符号分类:

| 类别              | 符号                                                                                                  | 引用量                                                       | 来源                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| RBAC 中间件       | `checkPermission` / `checkAnyPermission`                                                              | 32 处(几乎所有 routes)                                       | `enterprise/rbac/PermissionCheck`                                   |
| 实体/类型         | `Workspace` `Organization` `Role` `User` `OrganizationUser` `WorkspaceShared` `LoggedInUser`          | ~40 处                                                       | `enterprise/database/entities/*`、`enterprise/Interface.Enterprise` |
| 查询 helper       | `getWorkspaceSearchOptions`                                                                           | 11 处                                                        | `enterprise/utils/ControllerServiceUtils`                           |
| 启动三件套        | `initAuthSecrets` / `initializeJwtCookieMiddleware` / `verifyToken`(+`verifyTokenForBullMQDashboard`) | `index.ts`、queue                                            | `enterprise/middleware/passport`、`enterprise/utils/authSecrets`    |
| 身份门面          | `IdentityManager`(getPlatformType / isLicenseValid / getFeaturesByPlan / initializeSSO 等)            | `index.ts`、`routes/index.ts`、queue、schedule、commands     | `src/IdentityManager.ts`                                            |
| 企业路由          | account/audit/auth/login-method/organization\*/role/user/workspace\* 共 10 个 router                  | `routes/index.ts`                                            | `enterprise/routes/*`                                               |
| 零星服务          | `WorkspaceService`、audit 记录等                                                                      | 少量 services                                                | `enterprise/services/*`                                             |
| 历史 migration 类 | `AddAuthTables…` 等 ~10 类 ×4 库                                                                      | `database/migrations/{4库}/index.ts` + `AddApiKeyPermission` | `enterprise/database/migrations/*`                                  |

> 动手前先自己复核一遍(交叉验证,防勘察遗漏):
> `grep -rn "enterprise" packages/server/src --include="*.ts" -l | grep -v "src/enterprise"`

## 2. 目标结构:`packages/server/src/iam/`

新建目录(我们自有代码,文件头不带任何 FlowiseAI 商业头):

```
src/iam/
  index.ts          # 唯一出口:re-export 下面全部
  middleware.ts     # checkPermission / checkAnyPermission(转发 enterprise/rbac/PermissionCheck)
  entities.ts       # Workspace/Organization/Role/User/OrganizationUser/WorkspaceShared + LoggedInUser 类型(转发)
  query.ts          # getWorkspaceSearchOptions(转发)
  boot.ts           # initAuthSecrets / initializeJwtCookieMiddleware / verifyToken / verifyTokenForBullMQDashboard(转发)
  identity.ts       # re-export IdentityManager(P1 将换成 FlowOpsIdentity 同形实现)
  routes.ts         # re-export 10 个企业 router(routes/index.ts 只从这里拿)
  services.ts       # WorkspaceService、audit 等零星 service 转发
```

**循环依赖规则(裁定,违反必炸 jest)**:`iam/index.ts` 大桶 `export *` 会把 routes/服务全部拉进模块图;而 routes 传递依赖回 `utils/constants.ts` 等低层文件 → CommonJS 环 → 顶层取值时符号 undefined(如 `AzureSSO.LOGIN_URI`)。因此:**低层模块(`utils/**`、`database/entities/index.ts`及其同级)禁止从`../iam` 大桶导入,必须直连对应叶子文件**(`iam/sso`、`iam/entities` 等;叶子文件之间互不 import);大桶仅供高层使用(`index.ts` 主入口、routes/controllers/services、queue、commands、schedule)。若 jest 报「Cannot read properties of undefined」同类错,即为某低层文件走了大桶 → 把它的导入降级为叶子直连。

替换规则(机械执行):

1. 上表每个符号在 `iam/` 对应文件里 `export { X } from '../enterprise/...'`(类型用 `export type`)。
2. 全部非 enterprise 文件里的 `from '.../enterprise/...'` 与 `from '.../IdentityManager'` 改为 `from '../iam'`(相对层级自己算对;**只改 import 路径,不改任何调用代码**)。
3. `database/entities/index.ts` 里 enterprise 实体的并入改走 `iam/entities.ts`。
4. **migrations 例外**:`database/migrations/{postgres,mysql,mariadb,sqlite}/index.ts` 及 `AddApiKeyPermission` 对 enterprise migration 类的引用**本期不动**(历史演进事实,P3 出货构建时用「自建版 migration 集」另行分叉)。门禁 grep 排除 `database/migrations/`。
5. `index.ts`(App 主入口)的 6 处钩子全部改从 `iam` 取。

## 3. 验收(DoD)

-   **收口检查**(在仓库根执行;`IdentityManager.ts` 自身被排除——商业边界文件,内部 enterprise import 属预期):
    ```
    grep -rnE "from '[^']*enterprise|from '[^']*IdentityManager'" packages/server/src --include="*.ts" \
      | grep -v "^packages/server/src/enterprise/" \
      | grep -v "^packages/server/src/iam/" \
      | grep -v "^packages/server/src/IdentityManager.ts" \
      | grep -v "database/migrations/" \
      | grep -v ".test.ts"
    ```
    → **0 行**。
-   `cd packages/server && npx tsc --noEmit` = 0 错。
-   `npx jest` 现有测试**全过**(billing / schedule / httpSecurity / 日期守护等)。
-   后端真机:`pnpm build && pnpm start` 在 PG 上正常启动,`curl http://localhost:3000/api/v1/settings` 返回 `{"PLATFORM_TYPE":"enterprise"}`(行为与改前一致)。
-   `cd packages/ui && pnpm build` 过(UI 零改动,纯确认)。
-   一个 commit:`refactor(server): 收口 enterprise 依赖到自有 iam 接口层(P0,行为零变化)`,结尾 `Co-Authored-By: Codex <noreply@openai.com>`。

## 4. 范围边界(别越界)

-   **P0 不写任何自有实现**——不写新实体、不写新表、不写登录逻辑、不删 enterprise 任何东西。
-   后续期(本期严禁碰):P1 自有 user/workspace/role 实体+4 库 migration+JWT 登录(契约兼容 `ui/src/api/{auth,user,account.api,workspace,role}.js`);P2 工作区切换+自定义角色+审计;P3 tsconfig exclude enterprise + dist 无 enterprise 检查 + 数据迁移工具。
-   拿不准(尤其 index.ts 启动钩子、循环 import)**停下报告**,不要猜改。
