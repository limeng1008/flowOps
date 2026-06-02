# 隐藏上游弃用节点（DISABLED_NODES）

> 目的：面向**非开发者**用户、**全新私有化部署**，把上游已标 deprecating 的 47 个节点从节点面板隐藏，保持面板干净、防误用将被删除的节点。替代品均已就位（见下）。
> 机制：`DISABLED_NODES` 环境变量，逗号分隔，按节点 `name` 匹配（`packages/server/src/NodesPool.ts:78` `disabled_nodes.includes(newNodeInstance.name)`）。纯配置、零改核心、可随时增删。

## 安全性核查（已验证）

-   与存活节点**无 name 冲突**：弃用 LLM `awsBedrock` ≠ 存活 chat `awsChatBedrock`；11 个弃用 LLM 的 name 均不出现在 chatmodels。禁用它们不会误杀任何聊天模型。
-   ⚠️ 适用**全新部署**：若有历史 flow 仍引用这些弃用节点，禁用后该 flow 会打不开——需先迁移。我们私有化为主、无历史包袱，契合。

## 47 个弃用节点 → 替代品

**① LLM 文本补全 → 对应 Chat Models（11）**
`awsBedrock` `azureOpenAI` `cohere` `fireworks` `googlevertexai` `huggingFaceInference_LLMs` `ibmWatsonx` `ollama` `openAI` `sambanova` `togetherAI`
→ 用 `chatmodels/*`（ChatOpenAI、ChatCohere、AWSChatBedrock 等，均已存在）

**② LlamaIndex 集成（整条线砍）→ 主线 LangChain 节点（22）**
agent：`anthropicAgentLlamaIndex` `openAIToolAgentLlamaIndex`
chat：`chatOpenAI_LlamaIndex` `chatAnthropic_LlamaIndex` `chatMistral_LlamaIndex` `chatOllama_LlamaIndex` `chatTogetherAI_LlamaIndex` `chatGroq_LlamaIndex` `azureChatOpenAI_LlamaIndex`
embedding：`openAIEmbedding_LlamaIndex` `azureOpenAIEmbeddingsLlamaIndex`
vectorstore：`pineconeLlamaIndex` `simpleStoreLlamaIndex`
engine：`queryEngine` `subQuestionQueryEngine` `simpleChatEngine` `contextChatEngine`
responsesynthesizer：`refineLlamaIndex` `compactrefineLlamaIndex` `treeSummarizeLlamaIndex` `simpleResponseBuilderLlamaIndex`
tool：`queryEngineToolLlamaIndex`
→ 用标准 ChatOpenAI / OpenAIEmbedding / Pinecone 等 + AgentflowV2 做 RAG

**③ 老 Agent → AgentFlow `Agent` 节点 / Custom Assistant（5）**
`conversationalAgent` `reactAgentChat` `reactAgentLLM` `airtableAgent` → AgentFlow `Agent`
`openAIAssistant` → Custom Assistant

**④ 老 Chains → AgentflowV2 积木（7）**
`retrievalQAChain` `vectorDBQAChain` `multiPromptChain` `multiRetrievalQAChain` `getApiChain` `postApiChain` `openApiChain`
→ AgentflowV2 的 Retriever + LLM + HTTP + Condition 重搭

**⑤ 其它（2）**：`agentMemory`（→ AgentflowV2 Agent 内置记忆）、`vectaraUpload`（→ Vectara 检索节点）

> 合计：① 11 + ② 22 + ③ 5 + ④ 7 + ⑤ 2 = **47**。

## 即用配置（逗号分隔，无空格）

```
DISABLED_NODES=airtableAgent,conversationalAgent,anthropicAgentLlamaIndex,openAIToolAgentLlamaIndex,openAIAssistant,reactAgentChat,reactAgentLLM,getApiChain,openApiChain,postApiChain,multiPromptChain,multiRetrievalQAChain,retrievalQAChain,vectorDBQAChain,azureChatOpenAI_LlamaIndex,chatAnthropic_LlamaIndex,chatMistral_LlamaIndex,chatOllama_LlamaIndex,chatOpenAI_LlamaIndex,chatTogetherAI_LlamaIndex,chatGroq_LlamaIndex,azureOpenAIEmbeddingsLlamaIndex,openAIEmbedding_LlamaIndex,contextChatEngine,simpleChatEngine,queryEngine,subQuestionQueryEngine,awsBedrock,azureOpenAI,cohere,fireworks,googlevertexai,huggingFaceInference_LLMs,ibmWatsonx,ollama,openAI,sambanova,togetherAI,agentMemory,compactrefineLlamaIndex,refineLlamaIndex,simpleResponseBuilderLlamaIndex,treeSummarizeLlamaIndex,queryEngineToolLlamaIndex,pineconeLlamaIndex,simpleStoreLlamaIndex,vectaraUpload
```

## 在哪里设置

-   **dev**：`packages/server/.env`（已加，本地 gitignored）。
-   **私有化部署**：docker-compose 的 `environment:` / k8s env / 部署模板的 `.env`。建议写进 FlowOps 部署模板，做到"默认隐藏弃用节点"。
-   改完需重启 server（NodesPool 在启动时扫描）。
-   反悔：删掉对应 name 即可恢复某节点。
