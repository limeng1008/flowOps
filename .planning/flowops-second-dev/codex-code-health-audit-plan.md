# FlowOps 代码健康审查与清理 · Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**核心范式:先只读审计出报告 → 人工逐项裁定 → 再分批清理(每批过门禁、可回滚)。Phase 1 禁止改任何代码。**
>
> 背景:FlowOps 是 Flowise v3.1.2 二开(自有品牌企业级 AI 智能体平台),经历了大量改造(全面汉化 i18n、国产模型/向量库节点、商业化 billing/payment/工单、自建 IAM T0-P3、Dify 三节点、触发器等)。改造多,难免积累补丁、冗余、临时代码。本计划做一次系统性代码健康审查与清理。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`(主)或对应 worktree;**Node 20**(`nvm use 20`);PostgreSQL。
-   从 **`main`** 切分支 **`codex/code-health`**。**不要 push、不碰 main**,做完留人工 review。
-   commit 结尾加 `Co-Authored-By: Codex <noreply@openai.com>`。

### 0.2 ⚠️ 范围铁律(最重要,违反 = 破坏可维护性)

1. **只审/清「二开 footprint」**:用 `bash scripts/fork-divergence.sh` 或 `git diff --stat upstream/main...HEAD`(upstream = FlowiseAI 官方)界定哪些文件是二开新增/修改的。**上游 Flowise 原生代码一律只读不动**——它的 `@ts-ignore`/`eslint-disable`/`TODO` 是上游的事,改了会破坏"可持续 merge 上游"这条最高纪律(见 `upstream-merge-strategy.md`)。
2. **不碰核心执行链路**:flow 引擎、节点加载、prediction 主流程、核心 DB schema——只读。
3. **不删上游节点**:`DISABLED_NODES`(47 个弃用节点)是「禁用」不是「删除」——保持禁用即可,删了上游文件会增大 merge divergence。
4. **IAM 接缝擦除桥不碰**:`packages/server/src/iam/**` 的 14 处 `as unknown as` 是 P3 双轨接缝、**P4 退役时才拆**,本计划标注但不动(详见 `docs/iam-seam-ledger.md`)。
5. **UI 改动需人工明确勾选**才做(i18n 是产品硬约束,误删翻译会让界面退英文)。

### 0.3 已知健康基线(2026-06-13 扫描,给你起点,以你复核为准)

| 信号                        | 全项目计数                                  | 备注                                    |
| --------------------------- | ------------------------------------------- | --------------------------------------- |
| 规模                        | server 729 + ui 431 + nodes 456 ≈ 1600 文件 | —                                       |
| TODO/FIXME/HACK/XXX         | 31                                          | 多数可能上游;**只清二开的**             |
| @ts-ignore / eslint-disable | 366 / 363                                   | **绝大多数上游,不动**;只看二开新增的    |
| 跳过测试(.skip/xit)         | 27（含误匹配）                              | 甄别二开 vs 上游                        |
| iam/ 擦除桥 as unknown as   | 14                                          | **P4 处理,本计划不碰**                  |
| DISABLED_NODES              | 47                                          | 保持禁用,不删                           |
| .planning 计划 md           | 33                                          | 多数已执行,可归档                       |
| entitlement 层              | 7 文件                                      | **重点审:与自建 IAM 职责是否重叠/冗余** |

---

## Phase 1 · 健康审计(只读,产出报告,禁止改代码)

产出 **`docs/health-audit/report.md`**,按下列分类系统盘点。**每一项必须标注:① 文件:行 ② 属二开还是上游 ③ 风险等级(🟢 可删/🟡 待议/🔴 勿动) ④ 建议处置 ⑤ 依据**。只盘点、不改任何代码。

1. **范围地图**:跑 `fork-divergence.sh`,列出二开新增文件数/修改文件数,作为后续所有审查的边界。
2. **死代码**(二开范围内):未被引用的导出函数/常量/类型、孤儿文件(无 import 指向)、注释掉的大段代码块。用 `grep`/`ts-prune`(如可用,**禁止 `pnpm add`**,用 `npx --no-install ts-prune` 试,不可用就 grep 人工)。
3. **冗余 / 重复实现**:
    - **重点**:`entitlement` 层(7 文件,`FLOWOPS_LOCAL_COMMERCIAL` env-bypass)vs 自建 IAM(`iam/self`)——盘清各自职责、在 self 轨/enterprise 轨分别是否活跃、有无功能重叠或死分支。这是本次审查的头号问题,**只出结论与建议,不动手**。
    - 其他:复制粘贴的相似实现、被新实现替代却仍残留的旧代码。
4. **补丁堆叠 / workaround**:`git log` 看同一文件反复 fix 的痕迹;代码里标注「临时」「workaround」「先这样」的注释;防御性兜底是否已无必要。
5. **类型健康**(仅二开新增):`@ts-ignore`/`as any`/`as unknown as`(**排除 iam/ 的 14 处 P4 桥**)——哪些是真逃逸可收紧,哪些有理由保留。
6. **TODO/FIXME/HACK 清单**:31 个逐条过——有效待办/已过期可删/应转为正式 issue。
7. **测试健康**:跳过的测试(甄别真 skip vs 误匹配),二开关键模块(iam/self、商业化、二开节点)的测试覆盖缺口。
8. **调试残留**:`console.log`(应走 logger)、临时打印、被注释的调试代码。
9. **仓库卫生**:`.planning` 33 个计划(哪些已执行可归档)、散落的 `.docx`/Word 锁文件(`~$*`)、临时脚本、`docs/` 重复或过期文档。
10. **依赖健康**:二开引入的 npm 依赖是否都在用(`depcheck` 如可用)、有无重复/可移除;`package.json` 二开新增项核对。

**Phase 1 DoD**:`report.md` 提交;分类齐全、每项带风险等级与依据;**全程零代码改动**(`git diff` 只有这一个新文件)。停下,等人工在报告上逐项勾选「清理/保留/待议」。

---

## Phase 2 · 仓库卫生清理(零代码风险,人工勾选后做)

只动非源码资产,不影响 build/test:

-   `.planning` 已执行计划归档到 `.planning/archive/`(保留可追溯,不删除)。
-   散落的 `.docx` / Word 锁文件(`~$...docx`)清理(确认非正在编辑)。
-   `console.log` 调试残留 → 删除或改 logger。
-   过期 TODO 注释清理。

**DoD**:`pnpm build` + `npx jest`(server)+ `cd packages/ui && pnpm build` 全过(证明没碰到代码逻辑);一个 commit。

---

## Phase 3 · 死代码与冗余清理(低风险,严格按报告勾选项)

**只清人工在 report.md 标了 🟢 的项**,逐项处理,**每删一项立即门禁**:

-   删二开范围内未引用的导出/函数/文件 → `grep -rn "<符号名>"` 全仓确认零引用 → `npx tsc --noEmit` + `npx jest` + build。
-   合并重复实现 / 删被替代的旧实现 → 同样门禁。
-   `entitlement` vs 自建 IAM 的冗余处置:**仅在人工明确裁定方案后执行**(可能涉及双轨语义,拿不准停下报告)。

**DoD**:每项独立 commit(便于回滚);tsc 0 错、jest 全过、双 build 过;`fork-divergence.sh` 门禁仍通过(divergence 不异常增大)。

---

## Phase 4 · 类型与测试健康(谨慎,按勾选)

-   二开真类型逃逸(**非 iam/ P4 桥**)收紧。
-   跳过的测试:能修就修,确属废弃就删,拿不准保留+标注。
-   二开关键模块补关键路径测试(可选,人工决定)。

**DoD**:tsc/jest/build 全过;类型逃逸数(二开范围)有下降且无新增 `as any`。

---

## 验收门禁(每 Phase 通用)

1. `cd packages/server && npx tsc --noEmit` = 0 错;`npx jest` 全过。
2. `cd packages/components && npx tsc --noEmit` 0 错;`cd packages/ui && pnpm build` 过。
3. `bash scripts/fork-divergence.sh` 通过(二开 divergence 未异常膨胀)。
4. 后端真机 `pnpm start`(self 轨)正常起 + 登录链可用(self 轨不回归)。

## 边界(别越界)

-   **Phase 1 绝不改代码**;Phase 2+ 只做人工勾选项,拿不准一律保留+报告。
-   不碰:上游核心/节点、IAM 接缝桥(P4)、UI(除非勾选)、商业化与 IAM 的双轨语义(只审不擅改)。
-   一次只推进一个 Phase,人工验收后再进下一个。
