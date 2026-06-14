# FlowOps 国产向量库节点 · Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**过门禁再提交；任何门禁失败、或 SDK/接口拿不准，停下报告，不要猜改核心。**
> 目标：补齐有名的**专用国产向量库**节点——腾讯云向量数据库（T1）、阿里云 DashVector（T2 可选）。向量库节点是 Flowise 最复杂的一类（要实现 langchain `VectorStore` 接口 + Flowise 的 upsert/检索集成），务必照范式来。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`；**Node 20**（`nvm use 20`）。在分支 **`feat/cn-vectorstores`** 上工作，**不要 push、不碰 main**，留人工 review。

### 0.2 ⚠️ 已被现有节点覆盖的国产/兼容向量库——别重建，只写文档

先做一件低风险的事：新增 `docs/国产向量库支持.md`，说明这些**用现有节点即可**：

-   **Milvus / Zilliz Cloud** → 用现有 `Milvus` 节点
-   **PolarDB / 人大金仓 Kingbase / GaussDB（含 pgvector）** → 用现有 `Postgres`(PGVector) 节点，`DATABASE` 指过去
-   **腾讯云 ES / 阿里云 ES / 华为云 CSS** → 用现有 `Elasticsearch` / `OpenSearch` 节点
-   **阿里云 Tair（Redis 系）** → 用现有 `Redis` 节点
    （这部分是文档，不写代码。）

### 0.3 ✅ 参考范式（先读，照抄结构）

-   **向量库节点结构**：`packages/components/nodes/vectorstores/Milvus/Milvus.ts`（`implements INode`、`category:'Vector Stores'`、`baseClasses=[type,'VectorStoreRetriever','BaseRetriever']`、`vectorStoreMethods.upsert()`、`init()` 返回 retriever、用 `getBaseClasses(<LCStore>)`、凭证经 `getCredentialData/getCredentialParam`）。Qdrant 节点亦可对照。
-   **凭证 + 依赖处理**：参考 FlowOps 已加的国产模型节点（`nodes/chatmodels/ChatQwen` 等）与其凭证。
-   **langchain VectorStore 接口**：目标库 `@langchain/community` 没有现成集成（已确认），需**自写一个继承 `@langchain/core/vectorstores` 的 `VectorStore` 子类**，至少实现：`_vectorstoreType()`、`addVectors(vectors, documents)`、`addDocuments(documents)`、`similaritySearchVectorWithScore(query, k, filter)`，以及静态 `fromDocuments/fromTexts`（包装 SDK 的建集合/upsert/检索）。

### 0.4 ⚠️ 依赖铁律（踩过的坑）

-   新增 SDK（如 `@tcvectordb/tcvectordb`）**不要用 `pnpm add`**（会把 `@types/node` 升到 25 破坏 tsc）。做法：**手动**在 `packages/components/package.json` 的 `dependencies` 按字母序加包，再 `pnpm install`（reconcile），然后 `cd packages/components && npx tsc --noEmit` 必须 0 错；若报 `.at()`/@types/node 相关错，停下报告。
-   不造不存在的 API；SDK 用法以**官方文档/类型定义**为准。

---

## 1. T1 · 腾讯云向量数据库（Tencent Cloud VectorDB）

-   目录 `packages/components/nodes/vectorstores/TencentVectorDB/`：`TencentVectorDB.ts`（节点）+（如需）`core.ts`（自写 LCVectorStore 子类）+ `tencentvectordb.svg` + `TencentVectorDB.test.ts`。
-   SDK：`@tcvectordb/tcvectordb`（官方 Node SDK，按 0.4 手动加依赖）。
-   label：`腾讯云向量数据库`；name：`tencentVectorDB`；`category:'Vector Stores'`。
-   **凭证**：新增 `credentials/TencentVectorDBApi.credential.ts`，name `tencentVectorDBApi`，字段：`url`（实例地址）、`username`（默认 root）、`apiKey`（password）。
-   节点 inputs（对照 Milvus）：embeddings（输入锚点）、`database`、`collection`、`topK`(默认 4)、可选维度/相似度度量等（以 SDK 必填项为准，能省则省）。
-   `vectorStoreMethods.upsert`：把文档分块 →embeddings→ 写入腾讯向量库集合（不存在则按 SDK 建集合）。
-   `init`：返回检索器（`asRetriever(topK)`），供「对话检索 QA 链」/Agent 知识库使用。
-   自写 VectorStore 子类（core.ts）：用 SDK 的 collection upsert / search 实现上面 0.3 的方法；search 把 SDK 结果转成 `[Document, score]`。

## 2. T2（可选）· 阿里云 DashVector

-   同范式：`nodes/vectorstores/DashVector/` + 凭证（endpoint + apiKey）+ 自写 LCVectorStore 包装 DashVector SDK/REST。**先把 T1 做完过门禁，再评估 T2。**

## 3. 测试（mock SDK，验结构与编排）

-   `jest.mock('@tcvectordb/tcvectordb')`（或对其 client 打桩），覆盖：
    -   节点形态：`category==='Vector Stores'`、baseClasses 含 `VectorStoreRetriever`/`BaseRetriever`、凭证名正确。
    -   `upsert`：调用 SDK 的写入方法、传入的向量/文档数量正确。
    -   检索：`similaritySearchVectorWithScore` 把 SDK 返回映射为 `[Document, score]`。
-   **真实连通性需要真实实例，无法在 CI 验**——报告里写「待人工用真实腾讯向量库实例验证 upsert + 检索」。

## 4. 门禁（必过）

-   `cd packages/components && npx tsc --noEmit` = 0（特别确认 @types/node 没被升）
-   `npx jest TencentVectorDB`（及 DashVector）全过
-   `pnpm --filter flowise-components build` 过（节点 + svg + 凭证进 dist）

## 5. 边界 / 验收（DoD）

-   只新增 `nodes/vectorstores/<Dir>/*` + 1~2 个 credential + 改 `package.json`/`pnpm-lock.yaml`（加 SDK）；**不改核心、不改既有节点**。
-   若 `package.json` 被改：把它登记进 `FORK-CHANGES.md` 的 `Components-deps` 分类（已存在），并跑 `bash scripts/fork-divergence.sh` 确认 `passed`。
-   节点出现在「Vector Stores」分类，可接 embeddings + 在文档库 Upsert 流程/检索中选用（报告里写"待人工真机验证"）。
-   全在 `feat/cn-vectorstores`、未并 main、逐节点单独 commit（`feat(components): 新增「腾讯云向量数据库」向量库节点`，结尾 `Co-Authored-By: Codex <noreply@openai.com>`）。
-   报告列出：用了哪个 SDK/版本、实现了 VectorStore 的哪些方法、mock 测了什么、还需人工真机验的点、`docs/国产向量库支持.md` 覆盖的兼容库清单。

## 6. 提交规范

-   husky 跑 prettier+eslint；注释别出现 `*/`；JSON 无重复键。
-   先做 §0.2 文档 + T1，过门禁停下等 review，再评估 T2。
