# FlowOps 二开研究计划

## Goal

梳理 Flowise/FlowOps 代码结构、运行链路和可二开的边界，产出一份可执行的二开路线图：先指导团队稳妥做第一层换皮后的后续改造，再逐步进入功能层、节点层、权限/多租户层和部署层。

## Scope

-   研究当前仓库结构、包职责、启动与构建方式。
-   找出最适合二开的入口：UI、路由、菜单、国际化、主题、节点组件、API、数据库、鉴权、配置、部署。
-   区分“低风险可快速改”和“高风险需设计后改”的区域。
-   给出 1-2 周内可落地的二开工作顺序。

## Out of Scope

-   本阶段不直接重构大模块。
-   不做新的业务功能实现。
-   不覆盖用户未要求的现有换皮改动。

## Phases

| Phase                   | Status   | Output                                       |
| ----------------------- | -------- | -------------------------------------------- |
| 1. Repository Inventory | complete | 项目目录、包职责、启动脚本、技术栈清单       |
| 2. Runtime Architecture | complete | 前端、后端、组件、数据库、节点系统的调用关系 |
| 3. Extension Points     | complete | UI/菜单/主题/节点/API/鉴权/部署的二开入口    |
| 4. Risk Map             | complete | 升级冲突、耦合点、二开禁区和测试策略         |
| 5. Roadmap              | complete | 1-3 天、1 周、2-4 周二开路线图               |

## Decisions

-   先做研究与文档，不直接改业务功能。
-   以 FlowOps（企业级 AI 智能体 / 工作流自动化平台）为产品定位。

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
