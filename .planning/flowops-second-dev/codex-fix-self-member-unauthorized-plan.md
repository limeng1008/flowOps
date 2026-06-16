# 修复 self IAM 非管理员(member)登录后 403 /unauthorized · Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**只改本地代码 + 提交 git 分支。绝对不连/不碰服务器(120.26.44.206),不部署。**

## 背景 / Bug(本地可复现)

FlowOps = Flowise 二开,自建 IAM(`FLOWOPS_IAM=self`)。现象:

-   **owner(组织管理员)登录 → 正常**。
-   **member(非管理员)登录 → 立即跳 `/unauthorized`(403 禁止访问),整个后台进不去**。
-   本地 `localhost:3000` 和服务器**都能复现**(同一份 main 代码 `43acba3b`)。

**owner / member 的唯一差别**:owner `isOrganizationAdmin=true` → 前端 `isGlobal=true`,几乎所有权限守卫都**直接 bypass**;member `isGlobal=false`,走真实 `permissions` 校验。所以这是个"**非管理员用户专属**"的 bug。

## ⚠️ 已穷尽静态排查,以下都已确认"**不是**原因"(别再查,浪费时间)

我(上游会话)已逐一验证,这些都正确:

1. **后端登录响应完整正确**(curl 实测 member 登录):`permissions`=47 项**含 `chatflows:view`**、`features`=几乎全 true、`isOrganizationAdmin=false`、`activeWorkspaceId`/`assignedWorkspaces` 有效。`getLoggedInUser`(= login 与 switchWorkspace 的返回)在 `packages/server/src/iam/self/auth/service.ts` 末尾 return 里**确实带 `permissions` + `features` + `isOrganizationAdmin`**。
2. **前端写 store 的逻辑正确**:`packages/ui/src/utils/authUtils.js` `updateStateAndLocalStorage` 把 `payload.permissions/features` 和 `isOrganizationAdmin`(→`state.isGlobal`)都正确写入;`signIn.jsx` 登录成功 `dispatch(loginSuccess(data))` 后 `navigate(getPostLoginRedirectPath(...))`。
3. **`hasPermission`**(`packages/ui/src/hooks/useAuth.jsx`):member 时走 `permissions.includes('chatflows:view')`,permissions 里有 → 应返回 true。
4. **config**:`GET /api/v1/settings` 返回 `PLATFORM_TYPE='enterprise'` → `useConfig` 的 `isEnterpriseLicensed=true`(`ConfigContext.jsx`)。
5. **API 拦截器**(`packages/ui/src/api/client.js`):**只处理 401**(刷新/登出),403 仅 reject,**不会全局跳 /unauthorized**。
6. **挂载自动切换工作区**(`OrgWorkspaceBreadcrumbs/index.jsx:210`):**只在 `isOrganizationSwitching` 为真时触发**(组织切换场景),**初次登录不触发**;且其 error 分支(:266)也不跳转。排除。
    - (附带发现:member 的 47 权限里**没有 `workspace:view`**,而 `/workspace/switch` 路由 `checkPermission('workspace:view')`——切换工作区会对 member 403。本次初次登录虽不触发,但这本身可能是个设计问题,见 §5。)

**结论**:按代码,member 拥有 `chatflows:view`、store 里 permissions 正确、`/chatflows` 路由 `<RequireAuth permission='chatflows:view'>`(标准权限路由,`MainRoutes.jsx:95`)——member **理应能进**。但实际跳 /unauthorized。**这是运行时行为(渲染时序 / `<Navigate>` 副作用一旦跳走就锁死 / 某次渲染时 permissions 短暂为空)层面的 bug,静态读代码抓不到,必须跑起来打点。**

## 任务:复现 + 打点定位 + 修复

### 1) 本地复现(关键:先确保跑的是最新代码)

-   `FLOWOPS_IAM=self`(+ 本地 `FLOWOPS_LOCAL_COMMERCIAL=true` 即可,和现状一致)。**先全新构建**(`pnpm build`)或 `pnpm dev`,确保运行码 = 当前 main,别用旧 dist。
-   造一个 **member 账号**:空库时第一个注册者是 owner;再用 owner 邀请第二个用户(默认 `member` 角色),走邀请链接 `/register?token=...` 完成注册;然后**以 member 登录** → 复现 `/unauthorized`。

### 2) 打点定位(核心)

在 `packages/ui/src/routes/RequireAuth.jsx`、`DefaultRedirect.jsx`、`hooks/useAuth.jsx` 临时加 `console.log`,**以 member 复现时**记录每次渲染/跳转时的真实值:

-   `RequireAuth`:进入的是哪条分支、哪一行 `<Navigate to='/unauthorized'>` 真正触发;当时的 `loading` / `isOpenSource` / `isEnterpriseLicensed` / `isCloud` / `isGlobal` / `permissions`(长度+是否含目标权限)/ 目标 `permission` 值。
-   `signIn` 跳转后:`getPostLoginRedirectPath(location.state)` 实际返回的路径(是不是 `/chatflows`,还是被 `location.state.path` 带去了某个 member 无权的页面)。
-   是否存在"**某一次渲染 permissions 为空 → `<Navigate replace>` 跳走 /unauthorized → 之后 permissions 到位也回不来**"的时序问题(owner 因 `isGlobal` 早就 true 而幸免)。

把**实测到的真实分支与值**写进报告——这是定位的依据。

### 3) 修复根因

按 §2 定位到的真实原因修。可能的修法方向(以实测为准,别盲改):

-   若是**时序/空 permissions 抢跑**:让守卫在"已认证但 permissions 尚未就绪"时**等待而非立即跳 /unauthorized**(类似 `if (loading) return null` 的处理,或等 `permissions` 非空再判),保证 member 数据到位后能正常渲染;owner 行为不变。
-   若是**跳转目标错**:修 `getPostLoginRedirectPath` / `location.state.path` 逻辑,member 落到其有权的默认页(`DefaultRedirect` 已有"按权限选首个可达页"的逻辑,可复用)。
-   若确认**还掺杂 `workspace:view` 门控问题**(见 §5):一并修。

## 约束 / 铁律

-   **绝不碰服务器、不部署、不连远程**;只本地改 + git。
-   不改 `IdentityManager.ts`、`packages/server/src/enterprise/**`;后端只在确有必要时动 `iam/self/**`,优先在前端守卫层修。
-   **owner / cloud / open-source 行为零回归**——只让"已正确授权的非管理员"不再被误拦。
-   守卫是上游共享文件(`RequireAuth.jsx`/`DefaultRedirect.jsx`):改动最小、聚焦,删除所有临时 `console.log` 再提交。

## 验收(DoD)

1. **复现 → 修复后**:member(仅有 view 类权限)登录后能正常进入其**有权**的页面(如 `/chatflows`),不再被全量拦到 /unauthorized;只有访问其**确实无权**的具体路由时才 /unauthorized。
2. **owner 回归**:owner 登录行为完全不变。
3. `cd packages/server && npx tsc --noEmit` 0 错;相关 `npx jest` 过;UI `eslint` 改动文件 0 错;UI 能 build。
4. 若加了前端守卫单测(推荐):member 态(isGlobal=false + permissions 含 chatflows:view)下 `RequireAuth permission='chatflows:view'` 渲染 children 而非跳转。
5. 报告里写清:**实测定位到的真实根因**(哪行跳的、当时的值)、修法、回归验证。
6. 从 **main** 切分支 `codex/fix-self-member-unauthorized`,**一个提交**,结尾 `Co-Authored-By: Codex <noreply@openai.com>`;**不合并 main、不动服务器**,留人工 review。

## §5 附:可能的次生问题(member 缺 `workspace:view`)

`packages/server/src/iam/self/rbac/permissions.ts` 的 `MEMBER_SELF_PERMISSIONS` 不含 `workspace:view`,而 `packages/server/src/iam/self/admin/routes.ts` 的 `/workspace/switch` 用 `checkPermission('workspace:view')`。即**member 无法切换进自己所在的工作区**(切换=组织切换后的重定向场景)。这在本次"初次登录 /unauthorized"里**不是直接触发点**(初次登录不自动切),但若 §2 定位发现工作区上下文初始化也牵涉其中,应一并评估:要么放宽"切换进自己已属工作区"不需 `workspace:view`,要么给 member 适当补该读权限。**仅在与主 bug 相关时处理,否则在报告里标注为独立后续项,不擅自扩大改动。**
