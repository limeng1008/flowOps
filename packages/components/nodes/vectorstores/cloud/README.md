# 国产云向量库节点说明

本目录承载国产云向量库节点的共享适配层，当前覆盖：

-   Tencent Cloud VectorDB
-   Alibaba DashVector
-   Baidu VectorDB / Mochow
-   Volcengine VikingDB

## 能力范围

-   支持 `Document + Embeddings` 写入云向量库。
-   支持 `Retriever` 和 `Vector Store` 两种输出。
-   支持动态加载数据库、集合或表。
-   支持 `Auto Create If Not Exists` 自动创建集合或表。
-   支持批量 upsert、按 ID delete、topK 检索、metadata filter。
-   支持文件上传场景的 `flowise_chatId` metadata 隔离。
-   支持 Record Manager：按文档 hash 去重，按文档 ID 清理、重建和增量同步。
-   支持限流重试：遇 429 / rate limit 时按指数退避重试，配合 `Batch Size` 分批写入。
-   支持中文错误提示，覆盖认证失败、资源不存在、维度不匹配、过滤语法错误、限流和厂商错误。

## 开通与 API Key

节点面板内置“开通与凭证说明”，生产接入前需要先在对应云控制台开通服务：

-   腾讯云 VectorDB：开通向量数据库实例，拿实例 Endpoint，并在实例/账号侧准备用户名、API Key 或 Secret Key。
-   阿里云 DashVector：开通 DashVector 服务，进入 Cluster/API Key 管理获取 Endpoint 与 API Key。
-   百度智能云 VectorDB / Mochow：开通 VectorDB/Mochow 服务，准备 Endpoint、Account 和 API Key。
-   火山引擎 VikingDB：开通 VikingDB 实例，准备 Region、Endpoint、Access Key ID 和 Secret Access Key；AK/SK 在 FlowOps 中视作 API Key 类凭证。

凭证填写完成后，节点 `Database Name` 与 `Collection/Table Name` 支持动态加载；加载失败会显示中文错误，不会让下拉面板静默空白。

## 字段约定

节点默认字段如下，可在高级参数中覆盖：

-   `idField`: `id`
-   `textField`: `content`
-   `vectorField`: `vector`
-   `metadataField`: `metadata`

写入时会优先使用 metadata 中的 `idField`、`docId` 或 `id` 作为稳定 ID；都不存在时生成 UUID。

## 过滤语法

`Metadata Filter` 保留厂商原生语法：

-   JSON 字符串会自动解析为对象。
-   非 JSON 字符串会原样传给厂商 API。
-   常用 JSON 示例：`{"source":"manual.md"}`、`{"tenant":"acme","category":"合同"}`。
-   文件上传隔离示例：`{"flowise_chatId":"{{chatId}}"}`，用于只检索当前会话上传的文档。
-   如果使用厂商 SQL/DSL 字符串语法，可直接填写如 `source = "manual.md"`，FlowOps 不会改写。

这样可以最大化保留各云厂商的高级过滤能力，不在 FlowOps 层强行做一个不完整的统一 DSL。

## 自动建集合 / 表

`Auto Create If Not Exists` 打开后，节点会在 upsert 前调用厂商创建接口，并传入：

-   `Vector Dimension`
-   `Metric`
-   字段映射：`ID Field`、`Text Field`、`Vector Field`、`Metadata Field`
-   `Index Params` 厂商原生索引参数

生产环境建议先在云控制台手动确认计费规格、分片/副本、索引类型和可过滤 metadata 字段。自动建集合适合演示、POC 和标准化租户初始化；如果集合已存在，`Vector Dimension` 必须与 Embedding 模型实际维度一致。

## 维度预设

节点提供 `Embedding Preset`，未手动填写 `Vector Dimension` 时自动带出常用维度：

| Preset              | 常用维度 | 说明                         |
| ------------------- | -------- | ---------------------------- |
| `text-embedding-v4` | 1024     | 通义/千问常用中文 embedding  |
| `bge-m3`            | 1024     | BAAI 多语种 embedding        |
| `bge-large-zh`      | 1024     | 中文知识库常见开源 embedding |
| `m3e-base`          | 768      | 轻量中文 embedding           |
| `text-embedding-v3` | 1024     | 兼容旧模板或客户存量集合     |

如果云端集合已经存在，以云端集合维度为准；如果手动填写 `Vector Dimension`，手动值优先于预设。

## Record Manager 与重建

接入 Record Manager 后，upsert 会走 Flowise `index()` 管线：

-   基于文档内容 hash 去重，避免重复写入相同 chunk。
-   使用 Record Manager 生成的稳定 ID 写入云向量库，便于按文档 ID 删除和重建。
-   支持 `cleanup` 与 `sourceIdKey`，用于增量同步时清理旧 chunk。

注意：Record Manager 负责“哪些文档该保留/删除”的账本，云向量库节点负责真正的 `addDocuments/delete`。如果客户要求按整份文件重建，请保证 loader metadata 中有稳定 `source` 或自定义 `sourceIdKey`。

## 限流与分批

写入、检索和删除都会经过统一错误归一；遇到 `CLOUD_VECTOR_RATE_LIMIT` 会按 `Retry Count` 与 `Retry Delay (ms)` 指数退避重试。大批量导入建议：

-   `Batch Size` 从 32 或 64 起步，根据厂商 QPS/写入规格调大。
-   限流频繁时先降低 `Batch Size`，再提高 `Retry Count`。
-   维度不匹配、认证失败、过滤语法错误不会重试，会直接给出中文错误。

## 应用市场模板

应用市场已提供 4 个 AgentflowV2 RAG 模板：

-   腾讯云 VectorDB RAG 智能体
-   阿里云 DashVector RAG 智能体
-   百度 VectorDB RAG 智能体
-   火山 VikingDB RAG 智能体

模板默认使用 `chatZhipuAI + glm-4.5` 与 `embeddingQwen`，并在便签中写明 API Key、自动建集合、过滤条件和维度选择。用户复制模板后，只需要配置凭证、选择集合、upsert 文档，即可跑中文知识库问答。

## 依赖

-   腾讯云 VectorDB 和阿里云 DashVector 使用现有 `axios` 调用 HTTP API。
-   百度智能云 VectorDB 使用 `@mochow/mochow-sdk-node`，并保留 HTTP fallback。
-   火山引擎 VikingDB 使用 `@volcengine/openapi` 对请求签名。

依赖通过手动修改 `packages/components/package.json` 后运行 `pnpm install` 加入，未使用 `pnpm add`。
