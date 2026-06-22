# FlowOps 审计日志(Audit Log)· Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**分阶段、每阶段过门禁 + 人工评审再继续;A0 盘点先停下评审。**

## 背景

FlowOps = Flowise 二开,自有单轨 self IAM(`packages/server/src/iam/self/**`,FLOWiseAI enterprise 已物删=clean-room,**严禁参考/复刻任何 enterprise 审计代码,功能复用 ≠ 代码复用,全部自己写**)。

**现状**:self 只有"登录活动"(不是完整审计):

-   实体 `iam/self/entities/FlowOpsLoginActivity.ts`(表 `flowops_login_activity`:userId/activityCode/message/时间)。
-   记录 `iam/self/auth/service.ts:445 recordLoginActivity()`,只在 login/logout/失败处调用(编码 '0'/'1'/'-1'..)。
-   查询 `iam/self/admin/service.ts::listLoginActivity` → 路由 `iam/self/admin/routes.ts:182`(`auditRouter.post('/login-activity')`,`checkPermission('loginActivity:view')`)。
-   UI `packages/ui/src/views/auth/loginActivity.jsx` + `packages/ui/src/api/audit.js`。
-   权限只有 `loginActivity:view`(`iam/self/rbac/permissions.ts:64`);**没有 `auditLogs:view`**。

**缺口 = 完整审计**:记录"谁、何时、对什么、做了什么"的**操作审计**(角色/工作区/成员/组织用户的增删改、邀请、密码重置等),可按 操作人/动作/对象/时间 **查询、筛选、分页、导出**,带 `auditLogs:view` 权限 + tier 门禁 + UI。

## 0. 铁律

-   🔧 **实打实写、clean-room**:全新自有实现;不 copy enterprise;不留 stub/兜底。
-   **审计记录必须 fail-safe**:写审计失败**绝不能**让主业务操作失败/回滚 —— 记录包在 try/catch,失败只 logger.warn。
-   不动 flow 引擎/节点加载/prediction 主流程;只在 IAM/admin/auth 侧加挂点。
-   每阶段:`cd packages/server && npx tsc --noEmit` + `npx jest`(补审计测试)+ `FLOWOPS_IAM=self` 全新空库冒烟,过了再下一阶段。
-   从 `main` 切分支 `codex/audit-log`;分阶段提交,commit 结尾 `Co-Authored-By: Codex <noreply@openai.com>`;不合并 main、不碰服务器(120.26.44.206)。
-   复用 self 既有设施:迁移走 ship 迁移集、权限走 `rbac/permissions.ts`、功能门禁走 `services/entitlement/catalog.ts` + `checkFeatureByPlan`、列表/分页/i18n 参考 `loginActivity.jsx`。

## 1. 设计

### 1.1 统一审计实体 `FlowOpsAuditLog`(表 `flowops_audit_log`)

字段:`id`(uuid)、`createdDate`、`actorUserId`(nullable,可空=系统)、`actorEmail`(冗余存,用户删了也能显示)、`action`(如 `role.update`/`workspace.delete`/`workspaceUser.roleChange`/`user.invite`/`auth.login`/`auth.loginFailed`/`auth.logout`/`auth.passwordReset`)、`targetType`(role/workspace/user/membership/…)、`targetId`、`targetName`、`organizationId`、`workspaceId`、`status`(success/failure)、`ip`(nullable)、`userAgent`(nullable)、`metadata`(text/JSON:before/after、角色名、权限差异等)。关键列加 `@Index`(actorUserId/action/createdDate/organizationId)。

### 1.2 审计服务 `iam/self/audit/service.ts`

-   `recordAuditEvent(input)`:插一行;**fail-safe**(try/catch + warn,不抛)。
-   `queryAuditLogs(filters, page)`:按 actorUserId/action/targetType/dateFrom/dateTo/organizationId/workspaceId 过滤,按 createdDate desc 分页。
-   `exportAuditLogs(filters)`:返回匹配全集(供 CSV/JSON 导出)。

### 1.3 login-activity 的处置(A0 评审定)

默认建议:**统一到 `flowops_audit_log`**(auth 事件也记成 `auth.*`),`login-activity` 视图/接口改为读审计日志按 `auth.*` 过滤;`FlowOpsLoginActivity` 保留兼容或废弃由 A0 拍板。**不要两套并行重复记录。**

### 1.4 既有部署的角色权限(重要)

新增 `auditLogs:view` 到 `BUILTIN_SELF_ROLE_PERMISSIONS`(owner/admin)后,**已有库里的角色行不会自动带上新权限**。需要:迁移或启动时"内建角色权限对账"——把 owner/admin 既有 permissions JSON 补上 `auditLogs:view`(幂等)。A3 必须处理,否则老部署(如演示服)看不到审计入口。

## 2. 分阶段(每阶段过门禁 + 评审)

-   **A0 · 盘点(只读)**:核 §背景的现状(实体/记录/查询/视图/权限/角色种子机制),列全"该挂审计的动作点"(admin: createRole/updateRole/deleteRole/createWorkspace/updateWorkspace/deleteWorkspace/updateWorkspaceUserRole/deleteWorkspaceUser/updateOrganizationUser/deleteOrganizationUser;auth: registerAccount/inviteAccount/login/logout/resetPassword),给出 login-activity 统一方案 + 既有角色权限补法。产出 `docs/audit-inventory.md`,**停下评审**。
-   **A1 · 实体 + 迁移 + 服务**:`FlowOpsAuditLog` 实体 + 4 库迁移(进 ship 集)+ 审计服务(record/query/export),record fail-safe。测试覆盖 record/query/分页/export。
-   **A2 · 记录挂点**:把 `recordAuditEvent` 接到 §A0 列出的全部动作点(actor 来自方法入参/req.user;变更类记 before/after,如角色权限差异、成员角色变更);auth 事件统一记入审计(按 §1.3)。测试:每个动作产生对应审计行。
-   **A3 · 权限 + 功能门禁 + 路由**:加 `auditLogs:view` 到 `rbac/permissions.ts`(新建 auditLogs 组)+ owner/admin 内建角色 + **既有角色权限对账**(§1.4);`feat:audit`(或复用 login-activity)+ `services/entitlement/catalog.ts` 的 `IAM_FEATURES_BY_TIER`(审计归 team/enterprise);查询路由 `GET /api/v1/audit` + 导出 `GET /api/v1/audit/export`,均 `checkPermission('auditLogs:view')` + `checkFeatureByPlan`。测试:权限/功能拦截、过滤分页、导出。
-   **A4 · UI**:审计页(`views/audit/`,可参考/合并 `loginActivity.jsx`):筛选(操作人/动作/对象/时间)+ 分页表(时间/操作人/动作/对象/详情)+ 导出 CSV 按钮;菜单项 + 路由,按 `auditLogs:view`+`feat:audit` 显隐;i18n key 补 zh+en(参考之前 i18n 做法,别只留默认中文)。
-   **A5 · 终验**:全新空库:做角色/工作区/成员各类操作 → 审计页能查到对应记录;筛选/分页/导出 CSV 正常;member 无 auditLogs:view 看不到、403;free tier 隐藏(team+ 可见);既有库(模拟老部署)owner 对账后能看;`tsc`+`jest` 全过 + 真机冒烟。

## 3. 验收(DoD)

1. `flowops_audit_log` 4 库迁移全新空库可建;审计服务 record fail-safe(写失败不影响主操作)。
2. §A0 全部动作点都产生审计记录(含 actor/action/target/before-after/ip)。
3. `auditLogs:view` 权限 + `feat:audit` tier 门禁生效;既有 owner/admin 角色对账后拿到该权限。
4. 审计 UI:筛选/分页/导出可用,i18n zh+en 齐,权限/功能显隐正确。
5. login-activity 不再与审计重复记录(统一或明确分工)。
6. `tsc` 0 错、`jest` 全过、真机冒烟通过;全程 clean-room、不碰服务器/main。

## 4. 边界 / 风险

-   **不阻断主流程**:审计是旁路,record 失败只告警。
-   **不审计高频读**:只记变更/认证类动作,不记 GET/list(避免日志爆炸);资源类(chatflow/credential/apikey)CRUD 审计为可选扩展点,本计划核心是 IAM/admin/auth,审计服务做成通用、便于后续扩展。
-   拿不准(尤其 login-activity 统一方式、既有角色对账)就停下报告。
