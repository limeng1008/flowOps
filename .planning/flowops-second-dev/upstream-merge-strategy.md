# FlowOps 可持续升级 / 上游合并策略

> 目标：Flowise 官方更新后，我们的二开项目能稳定 merge 上游代码，不陷入魔改维护地狱。
> 日期 2026-06-02。基于当前 fork 真实 divergence 盘点。

## 当前 divergence 诊断（实测）

| 项               | 实测                                                                                | 风险                 |
| ---------------- | ----------------------------------------------------------------------------------- | -------------------- |
| 修改的已跟踪文件 | **116**                                                                             | 高冲突               |
| 纯新增文件       | 31                                                                                  | 零冲突               |
| 主炸弹           | **92 个 view/组件被内联 i18n 污染**（`useTranslation` + `'Save'→t('common.save')`） | 上游每动同一行就冲突 |
| i18n 来源        | **我们自己引入**（上游无 i18n，i18next/react-i18next 是我们加的）                   | 整层 i18n 由我们维护 |
| theme            | `_themes-vars.module.scss` 内联改 26 行                                             | 中                   |
| 模型列表         | `models.json` 内联追加 + `modelLoader.ts` 改读本地                                  | 中                   |
| **git 拓扑**     | **origin = FlowiseAI/Flowise（上游本身），无自有 fork remote，跟踪上游 main**       | 必须立即修           |
| 接入点(好)       | `index.jsx` 仅 `import '@/i18n'` 3 行追加                                           | 理想形状             |

结论：**节点/凭证/locales 等纯新增是安全的；i18n 内联是头号债；git 拓扑是地基缺陷。**

---

## 一、Git 拓扑（地基，先修）

现状错误：origin 直接是上游。目标：

```
upstream = github.com/FlowiseAI/Flowise   (只 fetch，不 push)
origin   = 我们自己的私有仓库              (push 目标)
```

操作：

1. 建自有私有仓库，`git remote rename origin upstream` → `git remote add origin <我们的仓库>`。
2. `upstream` 设为只读：`git remote set-url --push upstream DISABLE`。
3. 我们的产品主干 = `origin/main`；不直接跟踪上游 main。
4. **钉死上游 release tag**（不追 main HEAD）：每个上游版本作为一次受控合并。
5. 合并用 **merge 不 rebase**（长期分叉 fork，冲突只解一次、保留历史）。

分支模型：

-   `main`：产品主干。
-   `merge/upstream-vX.Y.Z`：每次升级的临时合并分支，过 CI 后再并入 main。
-   功能分支：`feat/zhipu`、`feat/i18n` 等，全部 T1/T2 优先。

---

## 二、改动三层分类 + 黄金法则

| 层            | 定义                                        | 冲突 | 策略                                                      |
| ------------- | ------------------------------------------- | ---- | --------------------------------------------------------- |
| **T1 纯新增** | 新文件/新目录                               | 0    | **最大化**：节点、凭证、locales、服务、页面、模板 JSON    |
| **T2 接入点** | 必须碰上游文件，但只是「追加一行/注册一项」 | 低   | **隔离+最小化**：用醒目标记块包住我们的注册               |
| **T3 内联改** | 改上游文件的函数体/JSX 内部                 | 高   | **消灭或降级为 T1/T2**；无法消灭的必须登记 + 备可重放方案 |

黄金法则：**add ≫ wire-in ≫ modify**。每个 T3 都要有理由、进 ledger、有重放预案。

---

## 三、各层「加法化」模式

| 层                    | 现状                                  | 目标做法                                                                                                                             |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 节点/凭证             | T1 ✅                                 | 保持：全部进 `components/nodes/**`、`credentials/**`                                                                                 |
| **模型列表**          | T3（改 models.json + modelLoader.ts） | **降级**：新建 `models.flowops.json`(T1)，`modelLoader` 改为「上游 models.json + 我们的 merge 加载」，从此不再内联改上游 models.json |
| **主题色**            | T3（改 \_themes-vars 26 行）          | **降级**：抽到 `_flowops-vars.module.scss`(T1) 覆盖；若覆盖不干净则保留为已登记 T3（theme vars 上游极少动，可接受）                  |
| 路由/API              | —                                     | T2：新路由文件 + 注册处一行，注册集中在标记块                                                                                        |
| 菜单                  | T2（menu-items 改 3 处）              | 我方菜单项追加在标记块，少改上游数组结构                                                                                             |
| 品牌(Logo/index.html) | T2/T3 小                              | 可接受，登记即可                                                                                                                     |
| i18n 接入             | T2 ✅（index.jsx 3 行）               | 保持                                                                                                                                 |
| **i18n 内联**         | **T3 × 92**                           | 见第四节（头号问题）                                                                                                                 |

---

## 四、i18n 可持续策略（头号债）

**残酷事实**：对一个硬编码英文的上游 UI 做就地 i18n，**必然要改这些上游文件**，没有运行时魔法能在 React/MUI 里完全规避。所以目标不是「零改动」，而是**让改动廉价、机械、可重放**。

推荐组合拳：

1. **变换保持机械统一**（现状已是）：永远三件套——`import useTranslation` / `const {t}=useTranslation()` / `'EN'→t('key')`。统一 = 可被 codemod 自动重放。
2. **写一个 i18n codemod**（jscodeshift/babel）：以 locale 目录为单一事实源。上游合并把某文件改乱时，流程是「**取上游版该文件 → 重跑 codemod 重新包 t() → 完成**」，而不是手解 92 个冲突。codemod 对干净 case 自动处理、对模糊 case 报警人工补。
3. **稳定 key**：key 命名稳定（`namespace.key`），不随上游英文微调而变，保证映射跨版本耐用。
4. **隔离为「最后一层」**：概念上把 i18n 当作干净上游合并之后最后叠加的一层；ledger 记录所有被 i18n 触碰的文件。
5. **有意识地约束范围**：只 i18n 用户真正用到的界面，不要把每个 admin/dev 页都包进去。**92 个文件可能已过度铺开**——评估是否回收一部分（低频页保留英文），直接缩小炸弹半径。
6. **尝试上游化**：Flowise 社区一直有 i18n 诉求。把「i18n 脚手架 + provider」PR 给上游，若被合并则我们这层 diff 直接归零。即便不被合并，也按「可被上游接受」的形状来写。
7. 已否决方案：全量运行时 JSX 文本拦截（Babel 宏自动包所有文本）——对 MUI props 太脆弱、太侵入。

**给用户的诚实结论**：全量 UI i18n 是一项**长期维护税**；我们能把它做到「便宜且机械」而非「为零」。其余各层（节点/模型/主题/路由）可压到接近零冲突。

---

## 五、Fork 改动账本 + CI 护栏

1. **`FORK-CHANGES.md` 账本**（进仓库跟踪）：登记每个 T2/T3 文件——类别、原因、重放说明。divergence 一目了然且有边界。
2. **CI 护栏**：
    - 合并后门禁：`pnpm install && pnpm build` + 跑我们的测试套件（component tests、i18n tests）必须过。
    - **divergence 报告脚本**：`git diff upstream/<tag> --name-status` → 统计新增/修改；把「修改集」与 ledger 白名单比对，**发现白名单外的新内联改动就 fail**（防止 divergence 悄悄长大）。
    - 趋势看板：修改文件数随时间应持平或下降，不应增长。

---

## 六、当前债务整改（一次性）

1. **修 git 拓扑**：建自有仓库 → origin 指我们、upstream 指 FlowiseAI、钉死当前 release tag、把现有改动落到功能分支。（当前还是未提交状态且 origin=上游，动手前必须先修。）
2. models.json：内联追加 → 改为 `models.flowops.json` + 加载期合并（消灭 T3）。
3. 主题：评估抽 `_flowops-vars` 覆盖层（消灭/缩小 T3）。
4. i18n：写 codemod + ledger；拍板最终 i18n 范围（是否回收一部分）。
5. 写 `FORK-CHANGES.md`，登记当前所有 T2/T3。
6. 搭 CI divergence 门禁。

---

## 七、上游升级 runbook（每次官方更新照此走）

1. `git fetch upstream --tags`
2. `git switch -c merge/upstream-vX.Y.Z main`
3. `git merge vX.Y.Z`
4. 解冲突：i18n-only 冲突 → 取上游版 + 重跑 codemod；我方注册/追加块 → keep both；上游重命名/移动 → 同步我方注册。
5. `pnpm install && pnpm build && pnpm test`（含 component / i18n 测试）。
6. 跑 divergence 报告，更新 ledger。
7. PR → review → 并入 main → 打我方 release tag。

---

## 与既有纪律一致

本策略是 `product-direction.md`「沿用 Flowise 主逻辑、只做加法不改核心」纪律的工程化落地：把「加法优先」从口号变成可度量（divergence 报告）、可执行（runbook + codemod）、有门禁（CI）的机制。
