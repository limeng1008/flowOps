# FlowOps 营销官网（参考扣子水准，全原创）· Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**过门禁再提交；任何门禁失败停下报告，不要猜改核心。**
> 背景：现有 `packages/ui/src/views/publicSite/index.jsx`（903 行，在 `main`）是一个偏「文档门户」的朴素 MVP 官网，已挂路由 `/`、`/welcome`、`/docs`、`/help` 且中英双语。main 已收敛在线支付主线，并新增了**液态玻璃视觉系统**（见 0.2），官网正好复用它出高级质感。
> 目标：**把首页（`page='home'`）升级重做成「扣子（coze.cn）那种水准」的营销级落地页** —— 沉浸式 Hero + 能力网格 + 特性深潜 + 滚动动效 + 响应式 + 多列页脚。保留 docs/help 两页与现有路由、i18n 架构不破坏。
>
> ⚠️ **「参考扣子」= 学它的信息架构与体验水准，不是抄它**。FlowOps 是 **B 端企业私有化 AI 工作流平台**，调性要「专业、可信、可治理」，不是扣子的 C 端开发者调性。详见 0.3 原创铁律。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`；前端在 `packages/ui`；**Node 20**（`nvm use 20`）。
-   基分支 **`main`**（已收敛在线支付主线，含**液态玻璃视觉系统** + 国产云向量库；现有 publicSite 也在此），切出 **`codex/site-revamp`** 工作。**不要 push、不碰 main**，做完留人工 review。
-   纯前端任务，**不碰后端、不加后端依赖**。动效库已具备（见 0.2），原则上**零新依赖**。

### 0.2 ✅ 参考范式（先读，照抄项目自己的写法）

-   **要升级的文件**：`packages/ui/src/views/publicSite/index.jsx`（先通读它：它把中英文案放在组件内的 `zh`/`en` 对象里按 `i18n.language` 取，`HeroSection`/`SectionIntro` 已拆了小组件，已引 `gsap`。**沿用它的 i18n 取值方式和拆组件思路**，别另起一套）。
-   **路由**：`packages/ui/src/routes/LandingRoutes.jsx`（`/`、`welcome`、`docs`、`help` 都渲染 `<PublicSite page='...'/>`，外层 `MinimalLayout`）。**保持不变**，只升级 home 分支。
-   **动效范式（项目已有实战）**：`packages/ui/src/views/landing/`（之前做的青色暗色落地页，用 **GSAP** 做入场/光晕，task 实战验证过）—— 滚动动效**主用 GSAP `ScrollTrigger`**，照 landing 的 gsap 用法写。
-   **主题/品牌**：主色 AI 紫 `#7C3AED`；主题变量层 `packages/ui/src/themes/_flowops-vars`；logo 资产 `packages/ui/src/assets/images/flowops_dark.svg` / `flowops_white.svg`（已有，直接用）。
-   **🆕 液态玻璃视觉系统（强烈复用 —— 官网高级感的关键）**：`packages/ui/src/ui-component/utils/liquidGlassStyles.js` 提供 `getLiquidGlassControlSx(theme, sx)`（按钮/控件：渐变 + `backdropFilter` 模糊 + hover 动效）与 `getLiquidGlassPanelSx(theme, sx)`（面板/卡片），配色取 `theme.palette.glass.*`（`accentText`/`highlight`/`border`/`blur`/`shadow` 等）。**官网导航栏、能力卡片、CTA 按钮、各玻璃面板一律套这两个函数**，和产品内部视觉统一，立刻出高级毛玻璃质感。先 `grep -rn "getLiquidGlass" packages/ui/src` 找现有调用处照着用，别自己手搓玻璃样式。
-   **图标库**：项目已有 `@tabler/icons-react`（去 `package.json` 确认）；能力卡片图标用它，**别引新图标库**。

### 0.3 ⚠️ 原创铁律（侵权红线，必须守）

1. **信息架构可参考扣子，文案/配图/图标/代码必须 100% 原创**。
2. **禁止**抓取、复制、改写扣子（coze.cn）的任何文字、图片、SVG、CSS、JS、配色方案。
3. 页面**不得出现**「扣子 / Coze / 字节 / 火山」等他方商标或品牌名（FlowOps 真实支持的模型如「豆包(火山方舟)」可在「支持的模型」处如实列出，但官网叙事主体是 FlowOps）。
4. 文案**讲 FlowOps 自己的真实能力**（见 0.4 素材），**不吹未实现的功能**，不照搬扣子的 slogan/卖点措辞。
5. 调性 = **B 端企业向**：私有化、数据不出域、国产模型、可治理、合规、计费。不要 C 端「人人都能做 Bot」的口吻。

### 0.4 ✅ FlowOps 真实能力素材（写文案的依据，别编造）

可视化画布编排（拖拽节点搭工作流）· 国产大模型（通义千问/豆包/Kimi/智谱 GLM/MiniMax）· 中文知识库 RAG（智谱/通义/硅基流动 embedding）· 工具与 MCP 集成 · 多 Agent 编排（AgentflowV2）· 执行记录 Trace 追踪 · 计费治理（按 Token/Bot/席位）· 内容安全审核（合规护栏）· 私有化部署（Docker + PostgreSQL + 信创麒麟/统信/鲲鹏 + 离线 airgap）· 文档/表格/PPT 导出 · 转人工（企业微信/飞书）· 全中文界面。

### 0.5 ⚠️ 视觉降级策略（Codex 是代码 agent，做不了精美插画/产品截图）

扣子官网的精致主要在**配图**。Codex 能做到结构/布局/动效/响应式对齐，配图按下面降级，**差距留给后续人工补图**：

-   **能做**：CSS 渐变背景、玻璃拟态卡片、SVG 几何装饰（渐变光球/网格/流线/抽象画布示意）、GSAP 滚动动效、已有图标库、产品截图**占位框**（带尺寸与 `alt`，注释 `TODO 替换为真实产品截图`）。
-   **不要做**：到处找网图、AI 生成版权不明的图、复制任何第三方插画。
-   产品截图位用**纯 CSS 画的「浏览器窗口/画布」mock 占位**（圆角卡片 + 顶部三个点 + 内部用色块/线条示意节点连线），并在报告里列出「待人工替换的截图位清单」。

---

## 1. 页面版块设计（home 落地页，参考扣子信息架构，全原创内容）

按下列顺序实现，每块都要中英双语 + 响应式（xs 移动端单列堆叠 / md 桌面多列）+ 进入视口的 GSAP 滚动入场：

1. **顶部导航 NavBar**（吸顶，滚动时加毛玻璃背景）：左 logo（`flowops_dark.svg`）+ 中菜单（产品能力 / 解决方案 / 私有化 / 文档 / 帮助）+ 右「登录」「免费试用」按钮 + 中英切换（复用现有 i18n 切换）。移动端收成汉堡菜单。
2. **Hero 首屏**：超大主标题（FlowOps 的一句话定位，自拟，B 端企业向）+ 副标题（1-2 句价值）+ 双 CTA（「免费开始」→ `/signin`，「查看文档」→ `/docs`）+ 背景抽象动效（GSAP 浮动渐变光球 + 网格）+ 右侧/下方产品画布 mock 占位。
3. **信任墙 / 支持的模型**：一行横向排列「支持的国产大模型」徽标（通义千问/豆包/Kimi/智谱 GLM/MiniMax —— 这是 FlowOps 真实卖点），可做缓慢横向滚动（marquee）。徽标用文字胶囊或已有品牌图标（项目 components 里有 lobe-icons 品牌图标可参考，但官网这里用简洁文字徽标即可，别引新资源）。
4. **核心能力网格**：6–9 张能力卡片（图标 + 标题 + 一句描述），取自 0.4 素材：可视化编排 / 国产模型 / 中文知识库 / 工具与 MCP / 多 Agent 编排 / 执行追踪 / 计费治理 / 内容安全 / 私有化部署。卡片 hover 微动效。
5. **特性深潜（图文交错 3 屏）**：左右交替（图占位 + 文案），三个主题：①「可视化搭建，不写代码也能编排 AI 工作流」②「企业级治理：计费、权限、执行追踪、内容安全」③「私有化与信创：数据不出域，离线可部署」。
6. **解决方案 / 适用场景**：3–4 个场景卡片（电商智能客服 / 企业知识库问答 / 办公自动化（报告/会议纪要/PPT）/ 营销内容生产），每个一句话 + 「了解更多」。
7. **数据指标条**：3–4 个大数字（如 节点类型数 / 支持模型数 / 模板数 …—— **用能从代码核出的真实数字或留占位并注释「待填真实数据」**，不要编造夸大数字）。
8. **私有化 / 企业能力**：突出 Docker 一键部署、PostgreSQL、信创（麒麟/统信/鲲鹏）、离线 airgap、SSO、数据不出域、内容安全合规。配一个部署/合规示意。
9. **底部强 CTA**：再次转化区（大标题 + 「免费开始」按钮 + 「联系我们/提交工单」次按钮 → 链到 `/signin` 或工单页若已存在）。
10. **多列页脚 Footer**：产品 / 解决方案 / 资源（文档·帮助·更新日志）/ 公司（关于·联系）/ 法律（隐私政策·用户协议占位）+ 版权行 + 中英切换。

> 文案：上述每块的具体中英文字**由 Codex 按 0.4 真实能力自拟**，言之有物、专业克制；不确定的数据留占位 + 注释。

## 2. 技术实现要求

-   **拆组件**：把 home 拆成 `publicSite/sections/` 下的 `NavBar.jsx`/`Hero.jsx`/`ModelWall.jsx`/`CapabilityGrid.jsx`/`FeatureDeepDive.jsx`/`Solutions.jsx`/`Metrics.jsx`/`Enterprise.jsx`/`FinalCTA.jsx`/`Footer.jsx`，由 `index.jsx` 在 `page==='home'` 时组装。**docs/help 两页逻辑保持原样**。
-   **i18n**：沿用现有 `publicSite` 的中英对象方式（或抽到 `i18n/locales` 的 `pages.site.*`，二选一，**与现有一致优先**）；**所有可见文案中英双语全覆盖**（项目硬约束）。
-   **动效**：**主用 GSAP `ScrollTrigger`**（照 `views/landing` 写法）做各 section 进入视口的淡入/上移/交错；Hero 背景光球用 GSAP 循环。`framer-motion` 版本是老的 `^4.1.13`（API 与新版差异大），**非必要不用**；要用只用最基础的 `motion.div` 入场，别用新版 `useScroll` 等。
-   **响应式**：MUI `sx` 断点 `xs/sm/md`；移动端导航汉堡化、网格单列、字号缩放。**两种宽度都要自测无错位/无横向滚动条**。
-   **性能**：section 图片/占位用 `loading="lazy"`；动效只用 `transform`/`opacity`（不触发 reflow）；`prefers-reduced-motion` 时降级关动效（可访问性）。
-   **不破坏**：路由、`MinimalLayout`、docs/help、现有 i18n key 全部保持；登录/试用按钮链到现有 `/signin`。

## 3. 验收（DoD）

-   `cd packages/ui && pnpm build` 通过（无 import/语法错）。
-   桌面（≥1280）与移动（375）两种宽度截图自查：各 section 不错位、无横向滚动条、文字不溢出。
-   中英切换：home 所有可见文案都跟着切换，无漏译。
-   动效：滚动各 section 有入场动画；`prefers-reduced-motion` 下不闪不抖。
-   docs/help 两页与 `/`、`/welcome`、`/docs`、`/help` 路由仍正常。
-   报告附：①「待人工替换的真实产品截图位」清单 ②「待填真实数据指标」清单 ③ 确认无任何扣子素材/商标。
-   单独 commit：`feat(ui): FlowOps 营销官网首页改版（Hero/能力网格/特性/私有化/页脚 + GSAP 滚动动效 + 响应式双语）`，结尾 `Co-Authored-By: Codex <noreply@openai.com>`。

## 4. 范围边界（别越界）

-   **只升级 home 首屏**；不重写 docs/help 内容、不动后端、不动路由结构。
-   **零新依赖**（GSAP/framer-motion/tabler 都已在）；要加任何依赖先停下报告。
-   不抓网图、不碰扣子素材、不出现他方商标（0.3 红线）。
-   真实产品截图、精美插画、真实经营数据 = **留占位 + 注释**，由人工后补；不要编造数据、不要塞版权不明的图。
-   一次做完一块过门禁再下一块；拿不准（尤其 i18n 取值方式、gsap 与现有写法）停下报告。
