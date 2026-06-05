# FlowOps 占位 VI 速查

日期：2026-06-04

本文件记录当前临时品牌视觉体系。它不是正式设计稿，而是一套可运行、可替换的占位 VI：后续专业设计完成后，只需要替换 SVG 资产和主题变量，就能整体更新产品露出。

## 1. Logo 资产

| 用途               | 文件                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| 横版字标，浅色背景 | `packages/ui/src/assets/images/flowops-logo.svg`                           |
| 横版字标，深色背景 | `packages/ui/src/assets/images/flowops-logo-inverse.svg`                   |
| 方形图形标         | `packages/ui/src/assets/images/flowops-logo-mark.svg`                      |
| Public/PWA 图标源  | `packages/ui/public/flowops-icon.svg`                                      |
| 浏览器图标         | `packages/ui/public/favicon.ico`、`favicon-16x16.png`、`favicon-32x32.png` |
| Apple/PWA 图标     | `packages/ui/public/apple-touch-icon.png`、`logo192.png`、`logo512.png`    |

Logo 图形采用「流程节点 + 汇聚箭头」意象，表达 AI Agent 工作流编排。图形为本项目代码生成的占位 SVG，不套用第三方品牌图形。

## 2. 色彩令牌

VI token 集中在 `packages/ui/src/assets/scss/_flowops-vars.module.scss`。

| Token                               | 色值      | 用途                       |
| ----------------------------------- | --------- | -------------------------- |
| `brandPrimary` / `primaryMain`      | `#7C3AED` | 主品牌紫、主按钮、核心强调 |
| `brandPrimaryHover`                 | `#6D28D9` | 主按钮 hover               |
| `brandPrimaryActive`                | `#5B21B6` | 主按钮 active / 深色强调   |
| `brandPrimarySoft` / `primaryLight` | `#EDE9FE` | 浅紫底色、选中背景         |
| `brandSecondary` / `secondaryMain`  | `#14B8A6` | 辅助青绿、状态点、链接点缀 |
| `brandAccent`                       | `#FBBF24` | 运营提示、重点标签         |
| `brandSuccess`                      | `#16A34A` | 成功状态                   |
| `brandWarning`                      | `#F59E0B` | 警告状态                   |
| `brandDanger`                       | `#DC2626` | 错误 / 危险状态            |
| `brandInk`                          | `#0F172A` | 深色文字                   |
| `brandCanvas`                       | `#08111F` | 深色背景                   |

## 3. 字体与圆角

全局字体入口：`packages/ui/src/config.js`

```text
'Inter', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif
```

圆角 token：

| Token           | 值     | 用途               |
| --------------- | ------ | ------------------ |
| `brandRadiusSm` | `6px`  | 小控件             |
| `brandRadiusMd` | `8px`  | 按钮、输入框、卡片 |
| `brandRadiusLg` | `12px` | 面板、大容器       |

当前 `config.borderRadius` 设为 `8`，让控制台基础组件和官网卡片保持一致。

## 4. 露出点清单

| 露出点                                          | 改前                                                         | 改后                             |
| ----------------------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| 控制台侧边栏 / 顶部 Logo                        | `Logo.jsx` 直接引用 `flowops_white.svg` / `flowops_dark.svg` | `Logo.jsx` 统一调用 `BrandLogo`  |
| 登录页桌面品牌区 Logo                           | 直接 `<img src={FlowOpsLogo}>`                               | `BrandLogo tone="onDark"`        |
| 登录页移动端 Logo                               | 直接 `<img src={FlowOpsLogo}>`                               | `BrandLogo tone="onDark"`        |
| 公开官网 `/`、`/docs`、`/help` 顶栏             | 直接引用 `flowops_dark.svg`                                  | `BrandLogo tone="onDark"`        |
| 旧欢迎页组件 `views/landing`                    | 直接引用 `flowops_dark.svg`                                  | `BrandLogo tone="onDark"`        |
| 浏览器 favicon / PWA manifest                   | 旧青绿色 `flowops-icon.svg` 与 png                           | 新紫色 mark 派生 SVG / PNG / ICO |
| 分享聊天窗口默认标题头像                        | `/flowops-icon.svg`                                          | 继续指向新的 public mark         |
| 分享聊天窗口默认 Bot 头像                       | 外部示例图 URL                                               | `/flowops-icon.svg`              |
| 嵌入聊天默认按钮 / 标题头像 / Bot 头像          | 外部示例图 URL + 蓝色按钮                                    | `/flowops-icon.svg` + `#7C3AED`  |
| DocumentExport / SpreadsheetExport / PptxExport | 未发现 FlowOps/Logo 品牌页眉位                               | 本批不修改 components            |

## 5. 如何替换为正式 VI

1. 替换 `packages/ui/src/assets/images/flowops-logo.svg`、`flowops-logo-inverse.svg`、`flowops-logo-mark.svg`。
2. 同步替换 `packages/ui/public/flowops-icon.svg`。
3. 使用 `sharp` 或设计导出的位图重新生成 `packages/ui/public/favicon-16x16.png`、`favicon-32x32.png`、`apple-touch-icon.png`、`logo192.png`、`logo512.png`、`favicon.ico`。
4. 在 `packages/ui/src/assets/scss/_flowops-vars.module.scss` 更新 `brand*`、`primary*`、`secondary*` 色值。
5. 如正式字体变化，更新 `packages/ui/src/config.js` 的 `fontFamily`。
6. 保持业务代码引用 `BrandLogo`，不要在页面里重新硬编码 logo 图片路径。
7. 跑 `pnpm --filter flowise-ui build`，再用浏览器检查 `/signin`、`/`、`/docs`、`/help` 和控制台侧边栏。

## 6. 当前状态

-   已完成占位 logo、favicon、PWA 图标和主题 token。
-   已统一主要产品露出点。
-   后续仍需专业设计补正式 Logo、色彩规范、图标系统和市场物料。
