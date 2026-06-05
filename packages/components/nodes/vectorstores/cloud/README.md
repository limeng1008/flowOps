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
-   支持中文错误提示，覆盖认证失败、资源不存在、维度不匹配、过滤语法错误、限流和厂商错误。

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

这样可以最大化保留各云厂商的高级过滤能力，不在 FlowOps 层强行做一个不完整的统一 DSL。

## 依赖

-   腾讯云 VectorDB 和阿里云 DashVector 使用现有 `axios` 调用 HTTP API。
-   百度智能云 VectorDB 使用 `@mochow/mochow-sdk-node`，并保留 HTTP fallback。
-   火山引擎 VikingDB 使用 `@volcengine/openapi` 对请求签名。

依赖通过手动修改 `packages/components/package.json` 后运行 `pnpm install` 加入，未使用 `pnpm add`。
