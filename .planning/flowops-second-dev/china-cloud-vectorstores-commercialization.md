# 国产云向量库节点商业化联调记录

日期：2026-06-05
分支：`codex/china-cloud-vectorstores`

## 本批 P1/P2 改动

-   P1 商用体验：4 个节点补中文配置示例、开通/API Key 指引、自动建集合说明、metadata filter 示例和 embedding 维度预设。
-   P1 模板：新增 4 个 AgentflowV2 应用市场模板，分别对应腾讯云 VectorDB、阿里云 DashVector、百度智能云 VectorDB/Mochow、火山引擎 VikingDB。
-   P2 工程增强：共享适配层接入 Record Manager，支持按稳定文档 ID 写入、去重、重建和 cleanup。
-   P2 稳定性：统一限流重试/指数退避，写入、检索、删除均走同一错误归一逻辑。
-   P2 测试：新增 mock HTTP server 集成测试，覆盖资源发现、自动建集合、429 重试、写入、检索和删除。

## 真实云端联调状态

本批未执行真实云端联调。当前工作区没有腾讯云、阿里云、百度智能云、火山引擎的可用测试实例与 API Key / AK-SK；为避免把个人或客户密钥写入仓库，本次只落地 mock HTTP server 集成测试与节点级单测。

## 待真实环境复测脚本

拿到四家云测试凭证后，每家按同一套 smoke 流程验收：

1. 在云控制台创建测试实例，记录 Endpoint、Region、API Key / AK-SK。
2. 在 FlowOps 凭证页新建对应向量库凭证。
3. 新建文档库，选择对应国产云向量库节点，使用 `embeddingQwen`。
4. 打开 `Auto Create If Not Exists`，选择 `Embedding Preset = text-embedding-v4`，确认 `Vector Dimension = 1024`。
5. 上传 2 个小文档并 upsert，确认云控制台集合/表内新增向量记录。
6. 在 Vector Store Query 或应用市场 RAG 模板里检索关键词，确认命中 source metadata。
7. 开启 Record Manager 后重复 upsert 同一文档，确认重复 chunk 不增加。
8. 删除文档或重建知识库，确认按稳定 ID cleanup 后旧记录不可检索。
9. 将 `Batch Size` 调小并压测写入，若触发厂商限流，确认 FlowOps 返回前已自动重试。

## 验证命令

-   `cd packages/components && npx jest TencentCloudVectorDB DashVector BaiduVectorDB VikingDB cloudVectorStore httpClient --runInBand`
-   `cd packages/server && npx jest chinaCloudVectorRagTemplates.test.ts --runInBand`
-   `node -e "for (const f of ['腾讯云 VectorDB RAG 智能体.json','阿里云 DashVector RAG 智能体.json','百度 VectorDB RAG 智能体.json','火山 VikingDB RAG 智能体.json']) JSON.parse(require('fs').readFileSync('packages/server/marketplaces/agentflowsv2/'+f,'utf8'))"`
-   `cd packages/components && npx tsc --noEmit`
-   `pnpm --filter flowise-components build`

## FORK-CHANGES 说明

本批主要新增节点测试、模板和文档，并修改上一批新增的共享云向量库适配层。根目录 `FORK-CHANGES.md` 已将 `Components-deps` 分类说明扩展到国产云向量库 SDK 与构建依赖；新增文件不进入 Modified File Ledger。
