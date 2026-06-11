# FlowOps 自建 IAM(用户/角色/工作区)· 完整 Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**按 T0→T5 顺序执行,每个任务过门禁再提交、再进下一个;任何门禁失败停下报告,不要猜改核心。**
>
> ## 背景(为什么做)
>
> `packages/server/src/enterprise/` + `packages/server/src/IdentityManager.ts` 是 **FlowiseAI 商业授权**(禁止复制/分发/售卖),其余代码 Apache 2.0。FlowOps 要合法售卖企业版,必须**自建一套用户/认证/角色/工作区体系**,最终交付产物完全不含 enterprise 代码。
>
> 产品形态已定:**一客户一套私有化部署** → 单组织、邀请制注册、首个注册用户自动成为 owner、保留工作区(部门隔离)、SSO 本期不做。
>
> 本计划 = 全部开发期工作(T0 解耦 → T5 迁移工具)。最后的「出货化构建剥离 enterprise」是后续独立计划,本计划不碰。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`;**Node 20**(`nvm use 20`,系统默认 22)。
-   从 **`main`** 切**一条**分支 **`codex/iam-selfbuild`**,T0~T5 全在这条分支上,**每个任务至少一个独立 commit**。**不要 push、不碰 main**。
-   数据库 **PostgreSQL 16**(本机 brew;库/用户/密码均 `flowise`),`.env` 已配好。真机验证都用它。
-   commit 结尾加 `Co-Authored-By: Codex <noreply@openai.com>`。

### 0.2 ⚖️ 清洁室铁律(法律红线,违反 = 全部返工)

1. **写自有实现(T1~T5)期间,禁止打开/阅读/复制 `src/enterprise/` 与 `IdentityManager.ts` 的实现代码**。唯一例外:T0 解耦时按符号清单做 re-export(只看导出签名,不看函数体)。
2. 行为契约的合法来源**只有两个**:① `packages/ui/src/`(Apache 2.0,UI 的 api 层/store/页面就是契约定义);② 黑盒 HTTP 行为(起服务、curl 观察请求响应)。
3. 新文件一律**不带任何 FlowiseAI 版权头**;自有实现内**禁止 import 任何 enterprise 路径**(门禁 grep 兜底)。
4. 拿不准某段逻辑"是不是只能看 enterprise 源码才知道" → **停下报告**,人来决策。
5. **类型接缝隔离规则(2026-06-11 事件 #2 后裁定)**:`iam/` 接缝对外暴露的类型必须**由我方显式声明**(明确的参数/返回值标注,或我方自有 interface),**禁止**用 `typeof <enterprise 符号>`、`Parameters<typeof …>`、联合/条件类型等写法把 enterprise 实现文件拖进类型推导——tsc/jest 的诊断会引用并打印 enterprise 源码行(已发生一次)。enterprise 符号只允许出现在赋值/调用点,不参与类型构造。
6. **搜索白名单规则(2026-06-11 事件后裁定)**:代码搜索一律用**目录白名单**(显式指定要搜的目录,如 `rg <pattern> packages/ui/src packages/server/src/iam packages/server/src/routes ...`),**禁止用"全仓搜索 + 排除黑名单"**(exclude glob 写不准就会泄出 enterprise 内容,已发生一次)。若输出意外包含 enterprise 内容:立即停止、不读不用、报告记录。

### 清洁室事件记录(证据链)

| 日期          | 事件                                                                                                                                                                              | 处置                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-11    | T3 勘察阶段,rg exclude glob 不精确,输出泄出 `enterprise/database/migrations/sqlite/` 若干行(schema DDL)。执行者未基于其做任何改动,零提交,主动停止报告。                           | 人工裁定:内容类别=schema 事实(黑盒可得,活库 psql 即可观察);我方 flowops\_ 表设计于 T1 早已提交,无因果路径;**允许继续,无需重置上下文**。根因修正=上方第 5 条搜索白名单规则。T3 完成报告中须注明本事件及"未参考"声明。 |
| 2026-06-11 #2 | T4 实现中,`iam/boot.ts` 类型接缝改为含 FlowOpsIdentity 的联合类型,致 tsc/jest 诊断打印 `enterprise/middleware/passport/index.ts` 两处源码行片段。执行者零使用、零提交、立即停报。 | 人工裁定:暴露为编译器诊断的机械引用(2 行片段),签名级信息本属 T0 已许可范围,无设计决策派生,**允许继续**。根因修正=上方第 6 条类型接缝隔离规则;按「只做类型隔离、不参考泄出内容」修正后继续 T4,完成报告注明本事件。    |

### 0.3 ⚠️ 工程铁律(项目踩坑沉淀)

-   **零新依赖**:认证用已有的 `bcryptjs` / `jsonwebtoken` / `passport`(都在 `packages/server/package.json`),禁止 `pnpm add`。
-   新实体日期列必须 **`type: Date`**(守护测试 `sqliteDateColumns.test.ts` 会拦字符串 `'datetime'`/`'timestamp'`)。
-   新实体**必写 4 库 migration**(postgres/mysql/mariadb/sqlite),时间戳从 **`1778000000000`** 起每任务 +100000,避撞既有。
-   所有新增用户可见文案走 i18n(en+zh 同加);注释里别出现 `*/`;husky 跑 prettier+eslint。
-   **UI 零改动是硬门禁**(契约兼容的意义所在);确需改 UI 一行,先停下报告。

### 0.4 双轨开关(本计划的安全网)

新增 env **`FLOWOPS_IAM`**:`enterprise`(默认,现状行为)| `self`(自建实现)。P0 的 `src/iam/` 收口层升级为 **provider 接缝**:`iam/provider.ts` 按开关选择实现。开发期两轨并存随时对照;出货化阶段(后续计划)再物理剥离 enterprise 轨。

---

## T0 · 解耦收口(前置地基)

**按既有计划 [`codex-flowops-iam-p0-plan.md`](./codex-flowops-iam-p0-plan.md) 执行**(内含 ~58 文件依赖清单、`src/iam/` 目录结构、替换规则、收口 grep 门禁),仅两处以本计划为准:分支用 `codex/iam-selfbuild`;`iam/index.ts` 出口按 0.4 预留 provider 接缝(本任务内 provider 仍只有 enterprise 转发一种实现)。

**DoD**:P0 计划门禁全过(收口 grep=0 / tsc 0 错 / jest 全过 / PG 真机启动 enterprise 行为零变化 / UI build 过)。

## T1 · 自有数据层(表与实体)

新目录 `packages/server/src/iam/self/entities/`,自有表一律 **`flowops_` 前缀**(与 enterprise 表零冲突,可同库并存):

| 实体                   | 表                       | 关键列(均含 id uuid PK + createdDate/updatedDate)                                                                             |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| FlowOpsUser            | flowops_user             | email(唯一索引)/ name / credential(bcrypt hash)/ status(invited·active·disabled)/ tempToken+tokenExpiry(邀请&重置)/ lastLogin |
| FlowOpsOrganization    | flowops_organization     | name / ownerUserId(单组织:全库仅一行,首次注册时创建)                                                                          |
| FlowOpsWorkspace       | flowops_workspace        | name / description / organizationId(默认工作区随组织创建)                                                                     |
| FlowOpsWorkspaceMember | flowops_workspace_member | workspaceId+userId(联合唯一)/ roleId                                                                                          |
| FlowOpsRole            | flowops_role             | name / description / permissions(JSON 文本,permission id 数组)/ isBuiltin                                                     |
| FlowOpsLoginActivity   | flowops_login_activity   | userId / activityCode(成功·失败·登出)/ ip / message                                                                           |

-   内置角色 seed(migration 里种):`owner`(全量 permission)/ `admin` / `member`(权限集见 T3 permission 全集)。
-   4 库 migration 时间戳 `1778000000000`;实体注册进 `database/entities/index.ts`(经 iam 层)。
-   **测试**:实体元数据守护(日期列 type:Date)+ migration 注册齐全断言,照 `sqliteDateColumns.test.ts` 范式。

**DoD**:tsc 0 错;jest 过;PG 真机 `pnpm start` 后 6 张 flowops\_ 表存在且 seed 角色就位(psql 查证写进报告)。

## T2 · 认证闭环(self 轨核心)

**先产契约清单再写代码**:通读 `packages/ui/src/api/{auth,account.api,user}.js` + `store/reducers/authSlice.js` + `views/auth/*`,把全部端点(method/path/请求体/响应体/Cookie 行为)写成 **`docs/iam-contract.md`** 提交(这是清洁室的证据链,也是 review 依据)。已知锚点:`/account/logout`、`/account/forgot-password`、`/account/reset-password`、`/account/verify`、登录在 auth 路径下(以你提取的为准);登录态字段至少含 `user.email/name/assignedWorkspaces`(以 authSlice 实际读取为准)。

实现 `src/iam/self/auth/`(passport-local + jsonwebtoken,**不碰 enterprise 实现**):

-   **注册**:`FLOWOPS_IAM=self` 下,空库首个注册者 → 建组织 + 默认工作区 + 绑 owner;其后注册**必须带有效邀请 token**(无 token 一律 403)。
-   **登录/登出/me(resolve)**:bcrypt 校验 → 签发 JWT(httpOnly cookie,access+refresh 双 token,时长沿用 `.env` 的 `JWT_TOKEN_EXPIRY_IN_MINUTES`/`JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES`);me 返回契约要求的完整 LoggedInUser(含 permissions、features、activeWorkspaceId、assignedWorkspaces)。
-   **邀请**:owner/admin 生成邀请(写 tempToken+过期);SMTP 已配则发邮件、未配**静默跳过并在响应里回邀请链接**(沿用项目既有行为)。
-   **密码重置**:forgot(生成 token)/ reset(校验+改 hash);verify/resend-verification 按契约实现或返回兼容的「未启用」响应(契约清单里写明取舍)。
-   **密钥**:自有 `iam/self/secrets.ts` —— 复用 `~/.flowise` 下密钥文件机制的**功能等价实现**(不存在则生成 32 字节随机并落盘,env 有值则优先),不 import enterprise 的 authSecrets。
-   **中间件**:`verifyToken`(JWT 校验 → 挂 req.user)self 版;未带 token 且不在 `WHITELIST_URLS`(`utils/constants.ts:6`,Apache)→ 401。
-   **测试**:注册(首用户成 owner / 二号无邀请 403 / 邀请流全通)、登录(对错密码)、JWT 过期、重置流,mock 数据源照 `services/billing/index.test.ts` 范式。

**T2 门禁操作规程(2026-06-11 验收实测裁定,违反必假失败)**:

1. **真机门禁前必须 `cd packages/server && pnpm build`**——后端跑 dist 编译产物,src 草稿不 build 等于没改(本次踩坑:旧 dist 把请求全路由进 enterprise 轨,报"You can only have one organization")。
2. **`pnpm build` 是独立门禁,不能用 `tsc --noEmit` 代替**——build 产 .d.ts 时 `Parameters<typeof xxx>` 风格的导出会触发 TS2742(类型不可携带);`iam/boot.ts` 的 `verifyToken`/`verifyTokenForBullMQDashboard` 需改为显式 `(req: Request, res: Response, next: NextFunction)` 参数标注。
3. **curl 受保护端点(me/登出后验证等)必须带 `-H 'x-request-from: internal'`**——App 级守卫(index.ts)只对 internal 标记的请求走 cookie JWT 验证,否则进 API-Key 分支返回 401 'Unauthorized Access'(上游固有行为,enterprise 轨相同)。注册/登录在白名单内不受影响。
4. 门禁可重复执行:跑链路前允许清空 `flowops_user/organization/workspace/workspace_member/login_activity`(**保留 `flowops_role` 种子**),恢复"空库首人"态。
   5.5. **门禁产生的业务对象必须随链路清理**(chatflow 等用可识别名前缀建、链路尾删除)——FK 解耦后数据库不再拦孤儿行,清理纪律代替约束(T3.1 验收时发现一条门禁遗留孤儿 chatflow,已清)。
5. env 用内联形式起服:`FLOWOPS_IAM=self pnpm start`(同一行,确保进程可见)。

**DoD**:`pnpm build` exit 0;tsc/jest 过;真机 `FLOWOPS_IAM=self` 起服:curl 完成 注册 → 登录(拿 cookie)→me(带 internal 头)→ 登出 → 登出后 me=401 全链路(命令和输出写进报告);`FLOWOPS_IAM=enterprise` 回切,行为仍与 T0 一致。

## T3 · RBAC + 工作区(self 轨)

-   **permission 全集**:从 `packages/ui/src/`(菜单 `permission:` 字段、`hasPermission` 调用点)grep 汇总全部 permission id,落 `iam/self/rbac/permissions.ts`(分组常量 + 全集数组);owner=全集,admin/member 取合理子集(报告里列差异表)。
-   **中间件**:`checkPermission` / `checkAnyPermission` self 实现(读 req.user.permissions,签名与 P0 收口层一致,几行的事,别过度设计)。
-   **角色 CRUD**:契约对齐 `ui/src/api/role.js`;内置角色禁删禁改名;自定义角色可勾 permission。
-   **工作区**:契约对齐 `ui/src/api/workspace.js` —— CRUD、成员增删、**切换工作区**(切换后重签 JWT/刷新 me,activeWorkspaceId 与 permissions 随之更新);`getWorkspaceSearchOptions` self 版(按 activeWorkspaceId 过滤,一个纯函数)。
-   **用户管理**:契约对齐 `ui/src/api/user.js`(列表/改名/禁用/重置)。
-   **测试**:permission 判定矩阵(owner/admin/member × 关键端点)、工作区隔离(A 工作区的 chatflow 在 B 看不见——用 chat_flow 实际查询验证)、切换工作区后 me 字段正确。

**DoD**:tsc/jest 过;真机 self 轨:owner 邀请一个 member → member 登录只见其工作区与受限菜单(curl 验证 me.permissions 差异写报告)。

### T3.1 · 补丁:业务表工作区 FK 解耦(验收阻塞裁定,2026-06-11)

**背景**:T3 验收真机链发现——self 轨工作区里创建 chatflow 报 500:`violates foreign key constraint "fk_chat_flow_workspaceId"`。根因:enterprise 的 `LinkWorkspaceId(1729130948686)` migration 在 **PG/MySQL/MariaDB** 上给 12 张 Apache 业务表的 `workspaceId` 加了指向 enterprise `workspace` 表的硬外键;self 轨工作区在 `flowops_workspace`,插入即违约。**SQLite 因引擎不支持后补 FK 从来没有这些约束——松耦合语义已被 SQLite 生产验证,删除约束行为安全**(且全部为 ON DELETE NO ACTION,无级联语义损失)。

**清洁室声明**:以下约束清单来自**活库 `pg_constraint` 黑盒查询**,非阅读 enterprise migration 源码。

**指令**:新增 4 库 migration `1778000200000-DecoupleWorkspaceFkFromBusinessTables`:

-   **PG**:对下列 12 个约束执行 `ALTER TABLE "<表>" DROP CONSTRAINT IF EXISTS "<约束>"`:
    fk_apikey_workspaceId(apikey)/ fk_assistant_workspaceId(assistant)/ fk_chat_flow_workspaceId(chat_flow)/ fk_credential_workspaceId(credential)/ fk_custom_template_workspaceId(custom_template)/ fk_dataset_workspaceId(dataset)/ fk_document_store_workspaceId(document_store)/ fk_evaluation_workspaceId(evaluation)/ fk_evaluator_workspaceId(evaluator)/ fk_execution_workspaceId(execution)/ fk_tool_workspaceId(tool)/ fk_variable_workspaceId(variable)
-   **MySQL/MariaDB**:同 12 表;先查 `information_schema.TABLE_CONSTRAINTS` 存在才 `DROP FOREIGN KEY`(MySQL 无 IF EXISTS;约束名以 information_schema 实查为准,不读 enterprise 源码)。
-   **SQLite**:空 up/down + 注释说明(引擎从未有这些 FK)。
-   **down()**:带存在性守卫地重建约束(仅当 `workspace` 表存在)。
-   **B 组红线**:enterprise 表互相之间的 FK(user/organization/role/workspace_user/login_method/workspace_shared 等)**一个不许动**。
-   P3 出货化的自建版 migration 集不含 enterprise migrations → 全新部署根本不会创建这些 FK,本补丁的 IF EXISTS 在彼处自然空转,前向兼容。

**T3.1 DoD**:build/tsc/jest 过;**T3 真机链重跑且必须包含**:owner 在新建 self 工作区创建 chatflow 成功(200)→ 切回默认区列表不可见(隔离证明)→ member(默认区)亦不可见 → enterprise 轨回切后既有 9 条 chatflow 完好、新建 chatflow 功能正常。

**附带语义记录**:邀请落区 = 邀请者当前活跃工作区(T3 验收实测),属合理设计,写入 `docs/iam-contract.md`。

## T4 · 平台门面 + 企业路由替换(self 轨补完)

-   **FlowOpsIdentity**(`iam/self/identity.ts`):与 IdentityManager 同形的方法面(P0 收口层已定义需要哪些):`getPlatformType()` 恒返 `'enterprise'`(UI 走企业 UX)、license 校验恒有效、`getFeaturesByPlan()` 返回自有 feature map(键沿用 `utils/quotaUsage.ts` 的 `ENTERPRISE_FEATURE_FLAGS`,Apache 侧,全 true)、`initializeSSO()` 空实现(本期无 SSO)。
-   **10 条企业路由的 self 对应物**:`iam/routes.ts` 按开关挂 self 实现(auth/account/user/role/workspace/workspace-user/organization-user/login-method/audit);login-method 返回「仅密码登录」;audit 对接 flowops_login_activity(登录活动页可看);organization 相关按单组织语义实现(列表恒一条)。
-   **`/api/v1/settings`** 等平台信息端点在 self 轨返回与 enterprise 轨一致的形状。
-   **测试**:每条 self 路由至少一个 happy-path + 一个越权 403 用例。

**DoD**:tsc/jest 过;真机 self 轨 **UI 全流程人工清单**(报告里逐条勾):登录页登录 ✓ 全部管理菜单可见 ✓ 用户页邀请 ✓ 角色页建自定义角色 ✓ 工作区建/切 ✓ 登录活动有记录 ✓ chatflow 新建保存跑通(业务回归)✓ —— **全程 UI 零改动**。

## T5 · 数据迁移工具 + 双轨回归

-   `packages/server/scripts/migrate-enterprise-to-flowops-iam.js`:把既有 enterprise 表(`user`/`organization`/`workspace`/`workspace_user`/`role`/`login_activity` …)数据搬到 `flowops_` 表(**id 原样保留**——业务表的 workspaceId 外键值因此免改;角色映射:GeneralRole owner/member → 内置角色;密码 hash 原样搬,bcrypt 同算法可直接登录)。范式照 `scripts/migrate-sqlite-to-pg.js`(行数核对、失败退出非零)。
-   跑通本机真实数据迁移(2 用户/2 工作区),`FLOWOPS_IAM=self` 用**原账号原密码**登录成功 = 终极验收。
-   `docs/iam-selfbuild.md`:架构图(iam 接缝/双轨)、开关说明、契约文档索引、已知差异与后续(SSO、出货化剥离)。

**DoD**:迁移脚本真机过 + 原账号 self 轨登录成功;`FLOWOPS_IAM=enterprise` 回切一切如旧;全套 jest + `cd packages/ui && pnpm build` 过。

---

## 总门禁(每任务自查,T5 后整体复跑)

1. `cd packages/server && npx tsc --noEmit` = 0 错;`npx jest` 全过。
2. **清洁室 grep**:`grep -rn "from '.*enterprise" packages/server/src/iam/self/` = **0 行**。
3. 双轨各起一次真机(PG):enterprise 轨行为与 main 无差;self 轨 T4 人工清单全勾。
4. UI 零改动:`git diff --stat main -- packages/ui` = 空。
5. 每任务一个 commit,message 形如 `feat(iam): T2 自建认证闭环(self 轨)`。

## 边界(别越界)

-   **不做**:SSO、出货化构建剥离(后续计划)、多组织/SaaS 多租户、计费改造(billing/entitlement 是我们自己的 Apache 侧代码,不属本计划)。
-   **不改**:enterprise/ 内任何文件、UI 任何文件、核心执行链路(chatflow/agentflow 引擎)。
-   T2 契约清单若发现 UI 依赖了某个无法清洁室还原的行为 → **停下报告**,不要看 enterprise 源码"找答案"。
