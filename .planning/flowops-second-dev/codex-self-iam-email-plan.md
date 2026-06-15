# FlowOps self IAM 邮件发送(邀请/找回密码)· Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**只改本地代码 + 提交到 git 分支,本地写完测完。绝对不连/不碰服务器(120.26.44.206)、不部署——服务器由人工事后同步。**

## 背景

FlowOps = Flowise 二开,自建 IAM(`FLOWOPS_IAM=self`)。目前 self 轨**完全不发邮件**,邀请/找回密码只是把链接返回给调用方,管理员手动转发:

-   `packages/server/src/iam/self/auth/service.ts`:
    -   `inviteAccount()`(:203-256)→ 返回 `{ tempToken, inviteLink, user }`(`inviteLink = authLink('/register', token)`,:256)。
    -   `forgotPassword()`(:296-311)→ 返回 `{ tempToken, resetLink }`(:311)。
    -   `authLink(path, token)`(:88-89)用 `process.env.APP_URL` 拼链接基址。
    -   `verifyAccount` / `resendVerificationEmail`(:337-343)在 self 是 no-op(邮箱验证未启用)。
-   SMTP 现在只接到 **enterprise** 路径(`packages/server/src/enterprise/utils/sendEmail.ts`,nodemailer + handlebars 模板)。self 不能用它(见铁律)。

**目标**:self 轨在配置了 SMTP 时,**邀请、找回密码自动发真实邮件**(邮件内含链接);**未配置 SMTP 时,保持现状(返回链接,不报错)**——即邮件是"可选增强",不破坏无 SMTP 的部署。

## ⚠️ 铁律(必须遵守)

1. **绝对不碰服务器、不部署、不连远程**;只本地改代码 + git。服务器同步由人工事后做。
2. **self 绝不 import `packages/server/src/enterprise/**`**(含 `sendEmail.ts`)。出货构建(`scripts/build-ship.sh`)会**物理删除 enterprise dist**,self 一旦依赖它,出货版直接崩。self 必须**自带**一个邮件工具(直接用 `nodemailer`)。
3. **不新增依赖**:`nodemailer@^7.0.7` + `@types/nodemailer` 已在 `packages/server/package.json`,直接用,**不要 `pnpm add`**。
4. 不改 `IdentityManager.ts`、不改 enterprise、不改后端 `registerAccount` 核心逻辑。
5. 邮件模板**原创中文 FlowOps 文案**,**不要复制 enterprise/上游的 `.hbs` 模板**(版权 + 品牌)。
6. 不破坏"未配置 SMTP → 返回链接"的回退路径(否则没邮件服务器的客户就加不了人了)。

## 推荐实现

### 1) 新增 self 邮件工具(自带,不依赖 enterprise)

新建 `packages/server/src/iam/self/email/mailer.ts`:

-   `isSelfSmtpConfigured(): boolean` —— `SMTP_HOST && SMTP_USER && SMTP_PASSWORD && SMTP_PORT(可解析为数字)` 都有才算配好。
-   `sendSelfMail({ to, subject, html, text }): Promise<void>` —— **惰性**创建 transport(在函数内创建,别在模块加载时创建,避免未配置时报错):
    ```ts
    nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true, // 465→true(SSL);587→false(STARTTLS)
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      tls: process.env.ALLOW_UNAUTHORIZED_CERTS ? { rejectUnauthorized: false } : undefined
    })
    ```
    `from` 用 `process.env.SENDER_EMAIL || process.env.SMTP_USER`。
-   读的 env 与 enterprise 同名(`SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_SECURE/SENDER_EMAIL`),配置体验一致。

### 2) 原创中文邮件模板(内联 HTML 即可,别引 handlebars 文件)

在 `mailer.ts`(或同目录 `templates.ts`)里写两段简单原创中文 HTML:

-   **邀请邮件**:标题如「邀请你加入 FlowOps」,正文说明 + 一个「接受邀请 / 立即注册」按钮链接(= inviteLink),并附纯文本兜底。
-   **重置密码邮件**:标题如「重置你的 FlowOps 密码」,正文 + 「重置密码」按钮链接(= resetLink),提示有效期 + "非本人操作请忽略"。

### 3) 接入 `service.ts`

-   `inviteAccount()`:照常建 invited 用户 + 生成 tempToken/inviteLink。**若 `isSelfSmtpConfigured()`** → `await sendSelfMail(...)` 发邀请邮件(`try/catch`:发信失败**不要**让整个邀请失败,记 warn)。返回体增加 `emailSent: boolean`(仍保留 `inviteLink`,管理员 UI 可继续复制/兜底)。
-   `forgotPassword()`:照常生成 resetLink。**若配置 SMTP** → 发重置邮件,返回 `{ success: true, emailSent: true }`,且**出于安全不再回传明文 `resetLink`**;**未配置 SMTP** → 维持现状返回 `{ tempToken, resetLink }`(本地/无邮件回退)。
-   `verifyAccount` / 邮箱验证强制流程**不在本次范围**(self 现为 no-op,保持不动)。

### 4) UI(可选,最小)

后端返回 `emailSent` 后,邀请弹窗可显示"已发送邀请邮件至 xxx"(发送成功时)或继续显示可复制链接(未配置/失败时)。**若改动 `register`/邀请相关前端,务必最小、零回归**;不确定就只做后端,UI 留现状(仍显示链接)。

## 测试

-   `packages/server/src/iam/self/email/mailer.test.ts`:**mock `nodemailer.createTransport`**(不真发信)。验证 `isSelfSmtpConfigured` 真值表;`sendSelfMail` 用正确 host/port/secure/auth/from 调 `sendMail`。
-   service 层:mock mailer,验证 **配置 SMTP 时** invite/forgot 会调 `sendSelfMail` 且返回 `emailSent:true`;**未配置时** 不调、走链接返回(回退)。
-   照 `packages/server/src/iam/self/auth/selfAuthService.test.ts` 现有范式。

## 验收(DoD)

1. `cd packages/server && npx tsc --noEmit` 0 错;`npx jest`(self iam + 新增 mailer 套件)全过。
2. **清洁室自检**:`grep -rn "enterprise" packages/server/src/iam/self/email` = 0;self 新代码无任何 `enterprise/**` import。
3. 出货门禁不回归:`bash scripts/verify-ship-dist.sh`(若该脚本需先 build,按其说明)——self 邮件代码不得引入 enterprise 残留。
4. **未配置 SMTP 回退**:不设 SMTP_* 时,invite/forgot 行为与改动前一致(返回链接,不报错)。
5. **真实发信(本地手验,不碰远程)**:本地 `.env` 配真实 SMTP(如腾讯企业邮 `SMTP_HOST=smtp.exmail.qq.com` `SMTP_PORT=465` `SMTP_SECURE=true` `SMTP_USER/PASSWORD=授权码` `SENDER_EMAIL=同邮箱`)+ `APP_URL=http://localhost:3000`,起 self 服务,邀请一个测试邮箱 → **收到中文邀请邮件、点链接能到注册页**。无真实 SMTP 凭证则标「待人工用真实凭证验」,不阻塞自动门禁。
6. 从 **main** 切分支 `codex/feat-self-iam-email`;**一个提交**:`feat(iam-self): 邀请/找回密码支持 SMTP 发信(未配置则回退链接)`,结尾 `Co-Authored-By: Codex <noreply@openai.com>`。
7. **不合并 main、不动服务器**;可 push 该分支到 origin(不要动 main),做完报告改了哪些文件 + 验收结果 + 是否做了真实发信验证。

## 边界

-   只做 invite + forgot-password 发信;邮箱验证强制流程不在本次范围。
-   `APP_URL` 决定邮件里链接的基址(`authLink`),是 env 不是代码;本地测用 `http://localhost:3000`,服务器同步时再按真实地址设(人工)。
-   拿不准(尤其 service.ts 返回体变更是否影响前端、forgot 不回传 link 的安全取舍)→ 停下报告。
