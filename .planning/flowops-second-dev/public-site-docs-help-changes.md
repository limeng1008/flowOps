# 官网 / 文档 / 帮助中心变更记录

日期：2026-06-04

## 目标

在当前 FlowOps 项目内先落地公开访问的官网、文档中心和帮助中心 MVP，用于承接商业化前置工作：产品介绍、上手说明、FAQ 和后续客服/工单入口。

## 本次做了什么

-   新增公开官网首页：`/`
-   保留欢迎页入口：`/welcome`，指向同一套官网首页
-   新增文档中心：`/docs`
-   新增帮助中心：`/help`
-   页面定位统一为「AI Agent 工作流管理平台」，不切换到电商客服场景
-   页面支持中文 / English 切换，复用项目已有 i18n 语言状态
-   页面复用 FlowOps Logo、现有产品视觉资产和 GSAP 轻量入场动画
-   将公开页面放在当前 UI 项目中，不新建独立官网项目

## 改了哪些文件

-   `packages/ui/src/routes/index.jsx`
    -   将公开站路由提前，确保 `/` 命中官网首页
-   `packages/ui/src/routes/LandingRoutes.jsx`
    -   扩展公开路由，接入 `/`、`/welcome`、`/docs`、`/help`
-   `packages/ui/src/views/publicSite/index.jsx`
    -   新增公开站页面组件，包含官网首页、文档中心、帮助中心
-   `.planning/flowops-second-dev/public-site-docs-help-changes.md`
    -   新增本变更记录

## 没做什么

-   没有改后端核心逻辑
-   没有改计费逻辑
-   没有改控制台内页业务功能
-   没有接入真实工单系统
-   没有接入文档搜索、Markdown/MDX 文档库或在线客服

## 已验证

-   `pnpm --filter flowise-ui build` 通过
-   `git diff --check` 通过
-   `curl -I --max-time 10 http://localhost:3000/` 返回 `HTTP/1.1 200 OK`
-   `curl -I --max-time 10 http://localhost:3000/docs` 返回 `HTTP/1.1 200 OK`
-   `curl -I --max-time 10 http://localhost:3000/help` 返回 `HTTP/1.1 200 OK`
-   使用 Playwright + 本机 Chrome 检查桌面端 `/`、`/docs`、`/help`，页面均正常渲染且有首屏标题
-   使用 Playwright + 本机 Chrome 检查移动端 390px 宽度，三个页面 `clientWidth/scrollWidth` 均为 `390/390`，无横向溢出
-   验证截图输出到 `/tmp/flowops-home.png`、`/tmp/flowops-docs.png`、`/tmp/flowops-help.png`、`/tmp/flowops-home-mobile.png`
