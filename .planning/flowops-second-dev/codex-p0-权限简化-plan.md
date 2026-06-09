# Codex 执行计划：T-A / P0 权限简化（扣子式 4+1 角色）

> 读 `codex-任务总览-权限付费双形态.md` 第 2 节（共享纪律）后再执行。
> 分支：`git worktree add .../codex-perm-simplify -b feat/perm-simplify release/flowops-commercialization-v1`

## 0. 目标
把 Flowise 的 **~70 颗粒权限 + 自定义角色 + 组织层**，简化成扣子式 **4 空间角色 + 1 平台超管**，开箱即用。
**核心原则：不改鉴权引擎**，只做 ① 预置角色 bundle ② 隐藏复杂 UI ③ 折叠组织层。

## 1. 现状（已勘明，供定位）
- 权限目录：`packages/server/src/enterprise/rbac/Permissions.ts`（~70 权限/17 类）、`PermissionCheck.ts`（校验，**不要改其逻辑**）。
- 角色：`enterprise/database/entities/role.entity.ts` + `enterprise/services/role.service.ts`（已有"默认角色"概念，参考其 `role.service.test.ts`）。
- 实体：`organization / workspace / role / user / organization-user / workspace-user`。
- 控制器/路由：`enterprise/controllers/role.controller.ts`、`routes/role.route.ts`、`account.controller.ts`。
- UI：角色/成员/组织管理在 `packages/ui/src/views/`（`organization`、`account`、`roles` 一带，Codex 自行定位确认）。

## 2. 任务拆解

### T-A1 预置 4 个空间角色（权限 bundle）
- 固定 4 个角色（名 + 权限集），权限集从 `Permissions.ts` 取子集：
  - **Owner**：全量。
  - **Admin**：全量 − `workspace:delete` − 计费 − `sso:manage`。
  - **Member**：`chatflows/agentflows/tools/assistants/documentStores/variables/templates/executions` 的 view/create/update/delete/duplicate/export/import/config；**不含** credentials 明文/`apikeys`/`workspace:*` 管理/`admin`/`users:manage`/`roles:manage`。
  - **Viewer**：各 `:view` + 运行/对话（chatflows/agentflows 的 view + 预测执行）。
- 新建空间/注册时自动绑定创建者为 **Owner**；邀请成员时**只能选这 4 个**。
- 实现：扩展 `role.service` 的默认角色 seed（参考其现有"默认 workspace member role"逻辑），**不新增引擎能力**。
- 验收：新空间自带这 4 个角色；无法创建第 5 个自定义角色（入口在 T-A2 隐藏）。

### T-A2 隐藏颗粒权限编辑 + 自定义角色（UI）
- 角色管理 UI：隐藏"权限矩阵勾选"、隐藏"新建自定义角色"；只读展示 4 个预置角色及其说明。
- 分配成员角色处：下拉只给这 4 个。
- 后端 `PermissionCheck` **照常校验**（不动）。
- 验收：UI 无颗粒权限编辑/自定义角色入口；用 4 角色实测越权被后端拦截（证明没绕过校验）。

### T-A3 折叠"组织"层（默认组织 + 隐藏 UI）
- 注册/首启自动建默认组织并归属用户；UI 隐藏"组织管理/组织切换"，只暴露 **"空间(workspace)"**。
- 验收：普通用户界面无"组织"概念，只见"空间"。

### T-A4 成员管理（扣子式）
- 空间成员页：邀请（邮箱，复用现有 `account.invite`）、成员列表、改角色（4 选 1）、移除。
- 验收：邀请 → 选角色 → 成员加入并生效。

### T-A5 平台超级管理员入口（4+1 的"1"）
- 确认"平台超管"（默认组织 owner / 持 `users:manage`）能：看所有用户、管所有空间、管 License/计费入口；其余角色不可达。
- 验收：仅平台超管能进全局用户管理；空间角色访问被拒。

### T-A6 i18n + 门禁
- en/zh 同步新增/调整文案（角色名、成员页、说明）。
- 过门禁：`tsc` / `npx jest role.service rbac` / `fork-divergence` / `pnpm --filter flowise-ui build`。

## 3. 不要碰 / 红线
- ❌ 不改 `Permissions.ts` 权限目录、`PermissionCheck.ts` 校验逻辑（只读取/预置/隐藏）。
- ❌ 不删 organization/role 实体（只在 UI 折叠 + 后端预置）。
- 🔒 **隐藏 ≠ 绕过**：底层权限校验必须照常生效，T-A2 验收必须包含"越权被拦截"的证明。
- 核心文件改动（role.service、UI、路由等）逐个登记 `FORK-CHANGES.md`（分类 `Perm-simplify`）。

## 4. 交付
- 分支 `feat/perm-simplify`，提交按 T-A1…T-A6 拆分，Codex trailer。
- 末尾写一句话验收说明（含"越权被拦截"证据），等维护者评审，不自合 main。
