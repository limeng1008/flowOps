# FlowOps 自建 IAM · P3 出货化(构建剥离 enterprise)· Codex 执行计划

> 执行者:Codex(无本项目上下文)。本文件自包含。**按 T0→T3 顺序执行,每任务过门禁再提交;失败停下报告,禁止猜改。**
>
> ## 背景
>
> 自建 IAM T0~T5 已完成并终验收(见 `codex-flowops-iam-selfbuild-plan.md`,分支 `codex/iam-selfbuild`):self 轨全功能、数据已迁移、双轨开关 `FLOWOPS_IAM` 在用。`src/enterprise/` + `src/IdentityManager.ts` 是 FlowiseAI 商业授权代码,**交付客户的产物里一行都不能有**。
>
> **P3 目标:出货构建产物(dist/安装包)物理零 enterprise**,同时 **dev 仓库保留双轨**(浸泡期 enterprise 是后备;也保上游合并能力)。
>
> **范围裁定(先读懂再动手)**:App 身份槽位翻转(`IdentityManager`→`IFlowOpsIdentity`)、兼容垫与双向桥的移除,**不属于 P3**——它们要等 enterprise 从 dev 仓库退役(未来 P4)才能做。P3 期间 dev 树的类型接缝原样不动。

---

## 0. 须知(全部沿用主计划,重申要点)

-   仓库根 `/Volumes/project/Flowise`;Node 20;PG 16;分支:从 `codex/iam-selfbuild` 切 **`codex/iam-p3-ship`**,每任务独立 commit,不 push 不碰 main。
-   **清洁室铁律全套沿用**(主计划 §0.2 六条 + 事件记录;搜索必须走 `scripts/iam-clean-search.sh`;诊断泄出即停报)。
-   **UI 零改动**;零新依赖;`.env` 不进 git。
-   主计划的类型接缝规则(擦除桥仅限 iam/、禁 `& any`、禁 typeof enterprise)继续有效——T1 惰化只是把**值导入**变懒,**不新增任何类型构造**。
-   **浸泡期门禁操作规程(事件 #5 连带裁定)**:① `.env` 现含 `PORT=3000` 与 `FLOWOPS_IAM=self`,且 dotenv 为 override:true——**命令行内联 env 会被 .env 碾压**(本项目头号陷阱),不要试图用 `PORT=3100` 绕端口。② 真机门禁前:`lsof -ti:3000 | xargs kill -9` 停掉浸泡后端 → 跑门禁(self 轨即默认 `pnpm start`)→ 验 enterprise 轨时**临时注释 .env 的 `FLOWOPS_IAM=self` 行**,验完恢复 → 门禁结束后重启浸泡后端(默认 `pnpm start` 即 self 轨)。`.env` 不在 git,放心改但必须复原。

---

## T0 · 缝合审计(动刀前的全面体检)

产出 **`docs/iam-seam-ledger.md`**(桥点造册,出货审计的证据文件):

1. **桥点清单**:全仓 `as unknown as`(预期:iam/boot.ts 4、iam/identity.ts 3、iam/middleware.ts 2,共 9 处 + utils 3 处上游原有)逐条登记:文件/行/方向/用途/P4 移除条件。
2. **enterprise 触点全景**:`grep -rnE "from '[^']*enterprise|require\(.*enterprise" packages/server/src --include="*.ts" | grep -v "^packages/server/src/enterprise/" | grep -v test` 全量列表(预期:iam/ 接缝文件 + IdentityManager.ts 自身 + database/migrations 四库 index + **四库 `1765360298674-AddApiKeyPermission.ts`**——后者自 P0 §2-4 例外条款起即为已知触点,P3 初版预期清单漏抄,T0.5 裁定已补)→ 这就是 T1 要惰化、T2 要分叉的完整靶面。
3. **全规则复检**:主计划四道 grep 门禁 + tsc + jest 全量 + 双轨真机启动,结果记入 ledger。
4. 列出 `dist/` 现状里的 enterprise 产物路径清单(`find packages/server/dist -path "*enterprise*"` + `dist/IdentityManager.js*`)——T3 的删除靶面。

**DoD**:ledger 文件提交;复检全绿;靶面清单与预期一致(出入即停报)。

## T1 · 接缝惰化(enterprise 值导入全部变懒加载)

**目标**:`FLOWOPS_IAM=self` 时,进程**从头到尾不 require 任何 enterprise 模块**——这是 T3 物理删除后还能启动的前提。

1. `iam/` 各接缝文件(boot/entities/identity/middleware/query/routes/services/sso):顶层 `import { X } from '../enterprise/...'` **值导入**改为分支内 `require()`(只在 `isSelfIamMode()===false` 路径执行;CommonJS 输出,require 合法)。**type-only import 保留不动**(编译期擦除,无运行时痕迹)。每处加注释「P3 惰化:self 轨不加载 enterprise」。
2. `database/entities/index.ts`:enterprise 实体的注册改为**运行时条件并入**(self 模式 → 不并入 enterprise 实体;flowops\_ 实体始终在)。注意 dev 库已有 enterprise 表——实体不注册仅意味着 TypeORM 不管理它们,数据无损。
3. `utils/constants.ts` 的 SSO 白名单项:经 `iam/sso` 改为**函数化/条件化**(self → 不追加 SSO URI;enterprise → 惰性 require 后追加)。禁止把 enterprise 的 URI 字符串硬编码到我方文件(那是复制)。
4. `iam/self/features.ts`:`feat:sso-config` 在 self 轨置 **false**(self 无 SSO,避免 UI 配置页打到不存在的端点)。
5. **验证手段(本任务核心门禁,统一用「目录改名冒烟」)**:build 后临时 `mv packages/server/dist/enterprise packages/server/dist/enterprise.off`(连同 `mv dist/IdentityManager.js dist/IdentityManager.js.off`),`FLOWOPS_IAM=self pnpm start` 必须正常启动,并通过认证链探针(无邀请注册被 403 拒 / 已有账号登录 200 / me 200);验完改回原名,enterprise 轨照常启动。若 self 轨在改名状态下报「Cannot find module ...enterprise...」即 T1 未完成,定位该 require 继续惰化。
6. 测试:新增 jest 用例断言 self 模式下 `require.cache` 无 enterprise 路径(起进程级测试若复杂,降级为「目录改名冒烟」写进报告即可,停报勿猜)。
7. **四库 `AddApiKeyPermission` 处置(T0.5 裁定,两处小改 ×4 文件)**:① 第 2 行 `import { Role }` 改 **`import type { Role }`**(该文件 Role 仅作类型标注于原生 SQL 结果,无运行时使用;type-only 编译期擦除,dist 零痕迹——T4.2 已批准的模式);② 后半段 role 表更新逻辑包进 **`if (await queryRunner.hasTable('role')) { ... }`** 守卫(全新 ship 库无 role 表,原代码无条件 SELECT 必崩;已有库行为零变化)。处理后该 migration **保留在两套集合中**(apikey 列段 ship 库也需要)。这是 Apache 文件,可自由阅读编辑;已应用过的库按名跳过不会重跑,守卫只影响全新库。

**DoD**:tsc 0 + jest 全量过 + 四道接缝 grep 门禁不变;**「目录改名」冒烟:self 轨在无 enterprise dist 下完整启动并通过登录链**;enterprise 轨(目录还原后)行为零变化。

## T2 · 自建版 migration 集分叉

1. **设计升级(T0.5 裁定):两套数组不够,必须两个文件**——四库 index.ts 顶层静态 import 了 11 个 enterprise migration 类,无论导出哪个数组,require index 即加载 enterprise,T1 惰化目标即破。改为:`index.ts`(现状全集,enterprise 轨用,不动)+ 新增 **`index.ship.ts`**(只 import Apache+flowops 来源的 migration 类,**零 enterprise import**;`AddApiKeyPermission` 经 T1-7 处理后属 Apache 安全,纳入);DataSource 装配处按 `isSelfIamMode()` **惰性 require 对应模块**(self 模式 require `./migrations/<库>/index.ship`),self 进程全程不加载全集 index。
2. DataSource 装配处:按 `isSelfIamMode()` 选用数组(self → ship 集)。dev 库已记录的 enterprise migration 行会被 TypeORM 忽略,无碍;**全新空库 + self 轨启动 = 只建 Apache 表 + flowops\_ 表,零 enterprise 表**。
3. **冒烟(写进报告)**:建临时空库 `flowise_ship_smoke` → `FLOWOPS_IAM=self` 指向它启动 → 表清单断言(无 user/organization/workspace 等 enterprise 表,有 flowops\_ 六表)→ 首人注册 → 登录 → 建 chatflow 全链 → 删临时库。
4. T3.1 的 FK 解耦 migration 属我方,留在两套集合中(ship 集里它对全新库自然空转,IF EXISTS 兜底)。

**DoD**:tsc/jest 过;空库冒烟全链绿;dev 库(enterprise 轨/self 轨)启动均零变化。

## T3 · 出货构建管道 + 零残留门禁

1. **`scripts/build-ship.sh`**:`pnpm build`(server+components+ui)→ **物理剪除**:`rm -rf packages/server/dist/enterprise packages/server/dist/IdentityManager.js*`(含 .d.ts/.map)→ 调用第 2 步校验 → 产出说明(出货物 = 仓库减 `src/enterprise`、减 `src/IdentityManager.ts`、减 `.planning`,dist 已剪除;打包方式留人工,脚本只负责构建+剪除+校验)。
2. **`scripts/verify-ship-dist.sh`(零残留门禁,CI 可挂)**:断言 ① `find packages/server/dist -path "*enterprise*"` 空;② `dist/IdentityManager.*` 不存在;③ `grep -rl "src/enterprise\|/enterprise/" packages/server/dist --include="*.js"` 仅允许命中惰化 require 的**字符串字面量**所在接缝文件(列白名单:iam/ 编译产物;这些 require 在 self 模式永不执行——若能进一步把 require 路径也做成变量拼接以躲过 grep,**不要做**,可读性优先,白名单即可);④ `dist/database/migrations` 的 ship 集产物不含 enterprise 类。
3. **终极冒烟**:`build-ship.sh` 全跑 → 在剪除后的 dist 上,空库 + `FLOWOPS_IAM=self` 启动 → 首人注册 → 登录 → 邀请 → 建 chatflow 全链 → UI 静态资源可访问(8080 build 产物或 3000 托管)。
4. **ship 模式缺省**:`iam/provider.ts` 增加——当 `dist/enterprise` 不存在(`fs.existsSync` 一次性探测)时**强制 self 并打印一行启动日志**,防止客户环境误设 `FLOWOPS_IAM=enterprise` 导致 require 崩溃(给出清晰报错优于裸崩)。
5. 文档:`docs/iam-selfbuild.md` 补「出货构建」章节(命令/校验/已知白名单);`docs/iam-seam-ledger.md` 补 T3 结果。

**DoD**:`build-ship.sh` exit 0;`verify-ship-dist.sh` 全断言过;剪除产物上的空库全链冒烟绿;dev 树双轨照常(`pnpm build` 常规产物不受影响);全量 jest + tsc 过。

## 边界(别越界)

-   **不做**:槽位翻转、垫子/桥移除、enterprise 源码删除(P4 退役阶段)、SSO 自建、安装包/docker 打包(后续)、UI 任何改动。
-   拿不准(尤其 require 惰化的求值顺序、migration 选择装配点)**停下报告**。
