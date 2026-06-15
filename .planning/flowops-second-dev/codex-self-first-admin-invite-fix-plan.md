# FlowOps self IAM 首个管理员免邀请码注册修复 · Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**只改本地代码 + 提交到 git 分支。绝对不连/不碰服务器(120.26.44.206)、不部署、不跑任何远程命令。**

## 背景 / Bug

FlowOps = Flowise 二开,自建 IAM(`FLOWOPS_IAM=self`)。私有化部署时**第一个管理员注册被前端"邀请码必填"卡死**,但后端本就支持首个用户免邀请码 bootstrap → 每个客户首次部署都会踩。

根因(已勘察):

-   **后端(正确,不用改逻辑)**:`packages/server/src/iam/self/auth/service.ts` 的 `registerAccount()`(:139-200):当 `flowops_user` 计数 `=== 0` 时走第一分支(:149-178),把第一个用户建成 **owner**(自动建组织 + 默认工作区 + owner 角色),**完全忽略 tempToken**;只有第 2 个用户起(:181-182)才校验邀请码。
-   **前端(bug 所在)**:`packages/ui/src/views/auth/register.jsx`:self 模式下 `useConfig()` 的 `isEnterpriseLicensed === true`(见 `packages/ui/src/store/context/ConfigContext.jsx:27`,`PLATFORM_TYPE==='enterprise'`),`register()`(:152)走 enterprise 分支,用 `buildRegisterEnterpriseUserSchema`(:42-54)把 `token`(邀请码)做成 `z.string().min(1)` **必填** → 第一个 admin 没有邀请码无法提交(报"请输入邀请码")。

## 目标

self 模式下,**系统还没有任何用户(首个管理员)时,注册不需要邀请码**;有用户之后第 2+ 个用户仍走邀请码注册。**enterprise / cloud / open-source 三种模式的注册行为零回归。**

## 推荐改法(最小侵入,复用已有调用,无需新接口)

register.jsx 挂载时**已经调用** `loginMethodApi.getDefaultLoginMethods()`(:224 → `GET /api/v1/loginmethod/default`)。给这个响应加一个布尔标志,前端读它即可,**不新增接口、不增加额外请求**。

### 1) 后端(self,additive)

`packages/server/src/iam/self/auth/routes.ts`:

-   现状:`loginMethodRouter.get('/default', (_req, res) => res.json(passwordOnlyLoginMethods()))`(:167)同步静态返回 `{providers:[],callbacks:[],passwordLoginEnabled:true}`。
-   改为 async,返回体加 `allowOpenRegistration: <flowops_user 计数 === 0>`。用现成的 `service()`(`FlowOpsAuthService`)取 dataSource 数 `FlowOpsUser`;给 `FlowOpsAuthService` 加一个方法,如 `async isFirstAdminSetup(): Promise<boolean> { return (await this.dataSource.getRepository(FlowOpsUser).count()) === 0 }`。
-   ⚠️ `/loginmethod/default` 是**公开端点(未登录可访问)**:只能暴露这个布尔,**绝不要返回用户数、邮箱等任何隐私**。
-   enterprise 轨的 login-method 控制器(`packages/server/src/enterprise/**`)**不要改**,它自然没有该字段(前端 falsy 兜底即可)。

### 2) 前端 `register.jsx`

-   从 `getDefaultProvidersApi.data?.allowOpenRegistration === true` 取 `allowOpenRegistration`。
-   当 `allowOpenRegistration` 为 true(self 首个管理员):
    1. 校验用**不带 token** 的那套(`buildRegisterCloudUserSchema` 同款,无邀请码字段);
    2. **隐藏邀请码输入框**(那段 `inviteCodeInput` UI);
    3. 提交 body **不带 `tempToken`**(类似 cloud:`{ user: { name, email, credential } }`)。
-   当为 false / undefined:**维持现状**(enterprise 必填邀请码 / cloud 无邀请码 / open-source 原样)。
-   具体:把 `register()`(:149-200)里 `if (isEnterpriseLicensed)` 收紧为 `if (isEnterpriseLicensed && !allowOpenRegistration)`;`allowOpenRegistration` 时走"无 token 提交"路径。**务必不影响 `isCloud` / open-source 既有分支**。

> 备选(若上面前端改动风险大):仅把 self 模式的邀请码校验从必填改为可选、提交照发(空 token),让后端做权威判断(首用户放行;第 2+ 用户空 token → 后端 403 "Invite token is required",前端展示该错)。UX 略差(邀请用户改为提交后才报错),作为兜底,不推荐为首选。

## 约束 / 铁律

-   **绝对不碰服务器、不部署、不连任何远程主机**;只在本地改代码 + git。
-   不改 `IdentityManager.ts`、`packages/server/src/enterprise/**`(FlowiseAI 商业授权);只动 self(`packages/server/src/iam/self/**`)+ 共享 UI `register.jsx`。
-   `register.jsx` 是上游共享文件:**改动最小化**,只加 `allowOpenRegistration` 这一条件分支,不重构无关逻辑,保证 enterprise/cloud/open-source 零回归。
-   若动到用户可见文案,走项目 i18n(`en.json` + `zh.json` 都补);本修复尽量不引入新文案(以隐藏字段为主)。
-   不 `pnpm add` 新依赖。

## 测试

-   后端单测(照 `packages/server/src/iam/self/auth/selfAuthService.test.ts` 范式):`isFirstAdminSetup()` 空库 true、有用户 false;self `/loginmethod/default` 空库返回 `allowOpenRegistration=true`、有用户 false。
-   回归:enterprise/cloud 的 register 校验路径不变(若有相关测试)。

## 验收(DoD)

1. `cd packages/server && npx tsc --noEmit` 0 错;`npx jest`(self iam + 相关套件)全过。
2. UI:`pnpm --filter flowise-ui lint`(或对 register.jsx 跑 eslint)0 错;UI 能 build。
3. **行为(本地起服务、self 轨、空库;不要碰远程)**:
    - 空 `flowops_user`:`/register` **不显示邀请码框**,填姓名/邮箱/密码即可创建,创建出的账号是 owner(`flowops_user=1`,自动建 org + 默认 workspace + owner)。
    - 有用户后:`/register` 恢复邀请码必填;无邀请码注册被拒(后端 403)。
    - enterprise / cloud 模式 register 行为不变(回归)。
4. 从 **main** 切分支 `codex/fix-self-first-admin-invite`;**一个提交**:`fix(iam-self): 首个管理员注册免邀请码 bootstrap(self 轨)`,结尾 `Co-Authored-By: Codex <noreply@openai.com>`。
5. **不合并 main、不动服务器**;可 push 该分支到 origin(但不要 push/动 main),做完留人工 review(由我合并 main)。

## 边界

-   不改后端 `registerAccount` 核心逻辑(已正确);只新增"对外暴露首管标志"。
-   公开端点只暴露布尔,不泄露用户数/隐私。
-   拿不准(尤其 register.jsx 分支重构、ConfigContext 各模式取值)→ 停下报告,别瞎改导致 enterprise/cloud 回归。
