// ==============================|| NODE METADATA i18n DICTIONARY ||============================== //
// Translates node category / label / description that come from the server (packages/components/nodes/**)
// WITHOUT modifying server TS source — preserves upstream Flowise merge compatibility.
//
// Conventions:
// - Brand / product / class names (OpenAI, ChatOpenAI, Pinecone, FAISS, Anthropic Claude, ...) stay English
// - Compound labels with a brand prefix translate the generic suffix: "Airtable Agent" → "Airtable 智能体"
// - Generic English nouns / phrases get a Chinese translation
// - All label / description keys verified verbatim from packages/components/nodes/**/*.ts
// - Strings not in the map pass through unchanged (graceful degradation)
// - Total coverage: ~180+ labels, ~170+ descriptions across 18 node categories

const nodeCategoryMap = {
    Agents: '智能体',
    'Agent Flows': 'Agent 流程',
    Cache: '缓存',
    Chains: '链',
    'Chat Models': '对话模型',
    'Document Loaders': '文档加载器',
    Embeddings: '嵌入模型',
    Engine: '引擎',
    Graph: '图',
    LLMs: 'LLMs',
    Memory: '记忆',
    Moderation: '内容审核',
    'Multi Agents': '多智能体',
    'Output Parsers': '输出解析器',
    Prompts: '提示词',
    'Record Manager': '记录管理器',
    'Response Synthesizer': '响应合成器',
    Retrievers: '检索器',
    'Sequential Agents': '顺序智能体',
    'Text Splitters': '文本分割器',
    Tools: '工具',
    'Tools (MCP)': '工具（MCP）',
    'Tools (Sequential)': '工具（Sequential）',
    Utilities: '实用工具',
    'Vector Stores': '向量库',
    'Vector Stores Indexes': '向量库索引',
    'Embeddings Indexes': '嵌入索引',
    DEPRECATING: '即将弃用'
}

const nodeLabelMap = {
    // ---------- Agents ----------
    'Tool Agent': '工具智能体',
    'Conversational Agent': '对话智能体',
    'Conversational Retrieval Tool Agent': '对话检索工具智能体',
    'Airtable Agent': 'Airtable 智能体',
    'Anthropic Agent': 'Anthropic 智能体',
    'CSV Agent': 'CSV 智能体',
    'OpenAI Assistant': 'OpenAI 助手',
    'OpenAI Tool Agent': 'OpenAI 工具智能体',
    'ReAct Agent for Chat Models': 'ReAct 智能体（对话模型）',
    'ReAct Agent for LLMs': 'ReAct 智能体（LLMs）',
    'XML Agent': 'XML 智能体',

    // ---------- Chains ----------
    'LLM Chain': 'LLM 链',
    'Conversation Chain': '对话链',
    'Conversational Retrieval QA Chain': '对话检索 QA 链',
    'Retrieval QA Chain': '检索 QA 链',
    'VectorDB QA Chain': '向量库 QA 链',
    'Vectara QA Chain': 'Vectara QA 链',
    'Sql Database Chain': 'SQL 数据库链',
    'Multi Retrieval QA Chain': '多检索 QA 链',
    'Multi Prompt Chain': '多提示词链',
    'GET API Chain': 'GET API 链',
    'POST API Chain': 'POST API 链',
    'OpenAPI Chain': 'OpenAPI 链',
    'Graph Cypher QA Chain': 'Graph Cypher QA 链',

    // ---------- Memory ----------
    'Agent Memory': '智能体记忆',
    'Buffer Memory': '缓冲记忆',
    'Buffer Window Memory': '缓冲窗口记忆',
    'Conversation Summary Memory': '对话摘要记忆',
    'Conversation Summary Buffer Memory': '对话摘要缓冲记忆',
    'DynamoDB Chat Memory': 'DynamoDB 对话记忆',
    'MongoDB Atlas Chat Memory': 'MongoDB Atlas 对话记忆',
    'MySQL Agent Memory': 'MySQL 智能体记忆',
    'Postgres Agent Memory': 'Postgres 智能体记忆',
    'Redis-Backed Chat Memory': 'Redis 对话记忆',
    'SQLite Agent Memory': 'SQLite 智能体记忆',
    'Upstash Redis-Backed Chat Memory': 'Upstash Redis 对话记忆',
    'Zep Memory - Cloud': 'Zep Memory - 云端',
    'Zep Memory - Open Source': 'Zep Memory - 开源',

    // ---------- Tools ----------
    'AWS DynamoDB KV Storage': 'AWS DynamoDB 键值存储',
    'Agent as Tool': '智能体作为工具',
    Calculator: '计算器',
    'Chain Tool': '链工具',
    'Chatflow Tool': '对话流工具',
    'Code Interpreter by E2B': 'E2B 代码解释器',
    CurrentDateTime: '当前日期时间',
    'Custom MCP Server': '自定义 MCP 服务',
    'Custom MCP': '自定义 MCP',
    'Custom Tool': '自定义工具',
    'Google Calendar': 'Google 日历',
    'Google Custom Search': 'Google 自定义搜索',
    'Google Docs': 'Google 文档',
    'Google Drive': 'Google 云端硬盘',
    'Google Sheets': 'Google 表格',
    'JSON Path Extractor': 'JSON 路径提取器',
    'OpenAPI Toolkit': 'OpenAPI 工具集',
    'QueryEngine Tool': 'QueryEngine 工具',
    'Requests Delete': 'HTTP DELETE 请求',
    'Requests Get': 'HTTP GET 请求',
    'Requests Post': 'HTTP POST 请求',
    'Requests Put': 'HTTP PUT 请求',
    'Retriever Tool': '检索工具',
    StripeAgentTool: 'Stripe 智能体工具',
    'Web Browser': '网页浏览器',
    'Web Scraper Tool': 'Web 抓取工具',

    // ---------- Chat Models (mostly brand/class names — only a couple translated) ----------
    'OpenAI Custom Model': 'OpenAI 自定义模型',

    // ---------- Embeddings ----------
    'AWS Bedrock Embedding': 'AWS Bedrock 嵌入模型',
    'Azure OpenAI Embedding': 'Azure OpenAI 嵌入模型',
    'Azure OpenAI Embeddings': 'Azure OpenAI 嵌入模型',
    'Baidu Qianfan Embedding': 'Baidu Qianfan 嵌入模型',
    'Cohere Embedding': 'Cohere 嵌入模型',
    'Google Gemini Embedding': 'Google Gemini 嵌入模型',
    'Google VertexAI Embedding': 'Google VertexAI 嵌入模型',
    'HuggingFace Inference Embedding': 'HuggingFace Inference 嵌入模型',
    'IBM Watsonx Embedding': 'IBM Watsonx 嵌入模型',
    'Jina Embedding': 'Jina 嵌入模型',
    'LocalAI Embedding': 'LocalAI 嵌入模型',
    'MistralAI Embedding': 'MistralAI 嵌入模型',
    'Ollama Embedding': 'Ollama 嵌入模型',
    'OpenAI Custom Embedding': 'OpenAI 兼容向量模型',
    'OpenAI Embedding': 'OpenAI 嵌入模型',
    'TogetherAI Embedding': 'TogetherAI 嵌入模型',
    'VoyageAI Embedding': 'VoyageAI 嵌入模型',

    // ---------- Vector Stores (brands kept; only generic ones translated) ----------
    'Document Store (Vector)': '文档库（向量）',
    'In-Memory Vector Store': '内存向量库',
    'Vectara Upload File': 'Vectara 上传文件',
    'Zep Collection - Cloud': 'Zep Collection - 云端',
    'Zep Collection - Open Source': 'Zep Collection - 开源',

    // ---------- Document Loaders ----------
    'API Loader': 'API 加载器',
    'BraveSearch API Document Loader': 'BraveSearch API 文档加载器',
    'Cheerio Web Scraper': 'Cheerio Web 抓取器',
    'Csv File': 'CSV 文件',
    'Custom Document Loader': '自定义文档加载器',
    'Document Store': '文档库',
    'Docx File': 'Docx 文件',
    'Epub File': 'EPUB 文件',
    'File Loader': '文件加载器',
    'Folder with Files': '文件夹（多文件）',
    'Json File': 'JSON 文件',
    'Json Lines File': 'JSON Lines 文件',
    'Microsoft Excel': 'Microsoft Excel',
    'Microsoft PowerPoint': 'Microsoft PowerPoint',
    'Microsoft Word': 'Microsoft Word',
    'Notion Database': 'Notion 数据库',
    'Notion Folder': 'Notion 文件夹',
    'Notion Page': 'Notion 页面',
    'Pdf File': 'PDF 文件',
    'Plain Text': '纯文本',
    'Playwright Web Scraper': 'Playwright Web 抓取器',
    'Puppeteer Web Scraper': 'Puppeteer Web 抓取器',
    'S3 Directory': 'S3 目录',
    'SearchApi For Web Search': 'SearchApi 网页搜索',
    'SerpApi For Web Search': 'SerpApi 网页搜索',
    'Spider Document Loaders': 'Spider 文档加载器',
    'Text File': '文本文件',
    'Unstructured File Loader': 'Unstructured 文件加载器',
    'VectorStore To Document': '向量库转文档',

    // ---------- Text Splitters ----------
    'Recursive Character Text Splitter': '递归字符分割器',
    'Character Text Splitter': '字符分割器',
    'Markdown Text Splitter': 'Markdown 分割器',
    'HtmlToMarkdown Text Splitter': 'HtmlToMarkdown 分割器',
    'Token Text Splitter': 'Token 分割器',
    'Code Text Splitter': '代码分割器',

    // ---------- Output Parsers ----------
    'CSV Output Parser': 'CSV 输出解析器',
    'Custom List Output Parser': '自定义列表输出解析器',
    'Structured Output Parser': '结构化输出解析器',
    'Advanced Structured Output Parser': '高级结构化输出解析器',

    // ---------- Retrievers ----------
    'Vector Store Retriever': '向量库检索器',
    'Custom Retriever': '自定义检索器',
    'HyDE Retriever': 'HyDE 检索器',
    'Multi Query Retriever': '多查询检索器',
    'Similarity Score Threshold Retriever': '相似度阈值检索器',
    'Reciprocal Rank Fusion Retriever': 'RRF 检索器',
    'Cohere Rerank Retriever': 'Cohere Rerank 检索器',
    'Embeddings Filter Retriever': '嵌入过滤检索器',
    'LLM Filter Retriever': 'LLM 过滤检索器',
    'Prompt Retriever': '提示词检索器',
    'AWS Bedrock Knowledge Base Retriever': 'AWS Bedrock 知识库检索器',
    'Azure Rerank Retriever': 'Azure Rerank 检索器',
    'Extract Metadata Retriever': '元数据提取检索器',
    'Jina AI Rerank Retriever': 'Jina AI Rerank 检索器',
    'Voyage AI Rerank Retriever': 'Voyage AI Rerank 检索器',

    // ---------- Cache ----------
    'InMemory Cache': '内存缓存',
    'InMemory Embedding Cache': '内存嵌入缓存',
    'Redis Embeddings Cache': 'Redis 嵌入缓存',

    // ---------- Prompts ----------
    'Chat Prompt Template': '对话提示模板',
    'Prompt Template': '提示模板',
    'Few Shot Prompt Template': 'Few-Shot 提示模板',
    'LangFuse Prompt Template': 'LangFuse 提示模板',

    // ---------- Utilities ----------
    'Set Variable': '设置变量',
    'Get Variable': '获取变量',
    'Sticky Note': '便签',
    'Custom JS Function': '自定义 JS 函数',
    'IfElse Function': '条件判断函数',

    // ---------- Moderation ----------
    'OpenAI Moderation': 'OpenAI 内容审核',
    'Simple Prompt Moderation': '简单提示审核',

    // ---------- Sequential Agents ----------
    Agent: '智能体',
    'Condition Agent': '条件智能体',
    Condition: '条件',
    End: '结束',
    'Execute Flow': '执行流程',
    'LLM Node': 'LLM 节点',
    Loop: '循环',
    Start: '开始',
    State: '状态',
    'Tool Node': '工具节点',

    // ---------- Multi Agents ----------
    Supervisor: '主管',
    Worker: '工作节点',

    // ---------- Engine (LlamaIndex) ----------
    'Context Chat Engine': '上下文对话引擎',
    'Query Engine': '查询引擎',
    'Simple Chat Engine': '简单对话引擎',
    'Sub Question Query Engine': '子问题查询引擎',

    // ---------- Record Manager ----------
    'MySQL Record Manager': 'MySQL 记录管理器',
    'Postgres Record Manager': 'Postgres 记录管理器',
    'SQLite Record Manager': 'SQLite 记录管理器',

    // ---------- Response Synthesizer (LlamaIndex) ----------
    'Compact and Refine': '压缩并优化',
    Refine: '优化',
    'Simple Response Builder': '简单响应构建器',
    TreeSummarize: '树式汇总',

    // ---------- Common Input Fields (sorted by frequency across all nodes) ----------
    'Connect Credential': '关联凭证',
    Document: '文档',
    'Model Name': '模型名称',
    Text: '文本',
    Temperature: '温度',
    'Text Splitter': '文本分割器',
    'Omit Metadata Keys': '忽略的元数据键',
    'Additional Metadata': '附加元数据',
    Streaming: '流式输出',
    'Max Tokens': '最大 Token 数',
    Embeddings: '嵌入模型',
    'Input Moderation': '输入审核',
    'Top Probability': 'Top Probability',
    Timeout: '超时',
    Query: '查询',
    'How to use': '使用说明',
    'Chat Model': '对话模型',
    'Language Model': '语言模型',
    'Base URL': 'Base URL',
    Type: '类型',
    Model: '模型',
    'Frequency Penalty': '频率惩罚',
    'Base Path': 'Base Path',
    Key: '键',
    'Base Options': '基础选项',
    'System Message': '系统消息',
    'Presence Penalty': '存在惩罚',
    Database: '数据库',
    Value: '值',
    'Top P': 'Top P',
    'No Available Actions': '无可用动作',
    Name: '名称',
    'Memory Key': '记忆键',
    Memory: '记忆',
    Headers: '请求头',
    'Available Actions': '可用动作',
    'Vector Store': '向量库',
    Region: '地区',
    Host: '主机',
    Description: '描述',
    'Allow Image Uploads': '允许上传图片',
    URL: 'URL',
    Tools: '工具',
    'Session Id': '会话 ID',
    'Stop Sequence': '停止序列',
    'Sequential Node': '顺序节点',
    'Return Source Documents': '返回来源文档',
    'Max Results': '最大结果数',
    'Max Iterations': '最大迭代次数',
    'Window Size': '窗口大小',
    'Variable Name': '变量名',
    'Update Flow State': '更新流程状态',
    Update: '更新',
    'Tool Description': '工具描述',
    'Table Name': '表名',
    Read: '读取',
    'Format Prompt Values': '格式化提示词参数',
    Create: '创建',
    Body: '请求体',
    'Batch Size': '批大小',
    'Additional Connection Configuration': '附加连接配置',
    'Strip New Lines': '去除换行符',
    'Return Direct': '直接返回',
    Prompt: '提示词',
    Port: '端口',
    None: '无',
    Limit: '数量上限',
    'File Upload': '文件上传',
    'Custom Model Name': '自定义模型名称',
    'Chunk Size': '块大小',
    'Chunk Overlap': '块重叠',
    'AWS Credential': 'AWS 凭证',
    'Tool Name': '工具名称',
    String: '字符串',
    'Repeat Penalty': '重复惩罚',
    'One document per file': '每个文件一个文档',
    Number: '数字',
    Namespace: '命名空间',
    Medium: '中',
    Low: '低',
    'JSON Structured Output': 'JSON 结构化输出',
    'Input Variables': '输入变量',
    'Index Name': '索引名称',
    High: '高',
    'Global variable (string)': '全局变量（字符串）',
    Boolean: '布尔值',
    'Tool Calling Chat Model': '可调用工具的对话模型',
    'Override Config': '覆盖配置',
    Operation: '操作',
    Size: '大小',
    Cache: '缓存',
    'Async Options': '异步选项',
    Action: '动作',
    Yes: '是',
    No: '否',
    Show: '显示',
    Hide: '隐藏',
    Optional: '可选',
    Required: '必填',
    'API Key': 'API Key',
    'API Endpoint': 'API 端点',
    Format: '格式',
    Method: '方法',
    Path: '路径',
    Source: '来源',
    Target: '目标',
    Filter: '过滤',
    Search: '搜索',
    Code: '代码',
    Function: '函数',
    Parameters: '参数',
    Response: '响应',
    Request: '请求',
    Schema: 'Schema',
    Input: '输入',
    Output: '输出',
    'Select Store': '选择文档库',
    Dimensions: '向量维度',
    'Encoding Format': '编码格式',
    'Tool Calling Chat Model ': '可调用工具的对话模型 ',
    Embedding: '嵌入模型',

    // ---------- AgentflowV2 input fields ----------
    Instructions: '指令',
    Scenarios: '场景列表',
    Scenario: '场景',
    Content: '内容',
    'Knowledge (Document Stores)': '知识库（文档库）',
    'Knowledge (Vector Embeddings)': '知识库（向量嵌入）',
    'Knowledge Name': '知识库名称',
    'Describe Knowledge': '知识库描述',
    'Enable Memory': '启用记忆',
    'Memory Type': '记忆类型',
    'Input Message': '输入消息',
    'All Messages': '全部消息',
    'Tool Input Arguments': '工具调用参数',
    'User Message': '用户消息',
    'Assistant Message': '助手消息',
    Message: '消息',
    Messages: '消息列表',
    System: '系统',
    Assistant: '助手',
    Developer: 'Developer',
    User: '用户',
    Role: '角色',
    'Return Response As': '返回响应类型',
    'Retriever Query': '检索器查询',
    'Override System Prompt': '覆盖系统提示词',
    'Condition Agent System Prompt': 'Condition Agent 系统提示词',
    Conditions: '条件列表',
    'Default Form Values': '默认表单值',
    'Default Input': '默认输入',
    'Default Text Input': '默认文本输入',
    'Persist State': '持久化状态',
    'Loop Back To': '回环到',
    'Max Loop Count': '最大循环次数',
    'Max Token Limit': '最大 Token 上限',
    'Schedule Type': '调度类型',
    'Schedule Input': '调度输入',
    'Schedule Input Mode': '调度输入模式',
    'Cron Expression': 'Cron 表达式',
    'Start Date': '开始日期',
    'End Date': '结束日期',
    Daily: '每天',
    Weekly: '每周',
    Monthly: '每月',
    'On Day of Week': '指定星期',
    'On Day of Month': '指定日期',
    'On Time': '指定时间',
    'On Minute': '指定分钟',
    Timezone: '时区',
    Fixed: '固定',
    Dynamic: '动态',
    Enum: '枚举',
    'Enum Values': '枚举值',
    'Array Input': '数组输入',
    'Array Buffer': '数组缓冲',
    'Code Execution': '代码执行',
    'Code Interpreter': '代码解释器',
    'Anthropic Built-in Tools': 'Anthropic 内置工具',
    'OpenAI Built-in Tools': 'OpenAI 内置工具',
    'Web Fetch': 'Web 抓取',
    'Web Search': 'Web 搜索',
    'URL Context': 'URL 上下文',
    'Callback URL': '回调 URL',
    'Callback Secret': '回调密钥',
    'Webhook URL': 'Webhook URL',
    'Webhook Secret': 'Webhook 密钥',
    'Webhook Trigger': 'Webhook 触发器',
    'Signature Header': '签名 Header',
    'Signature Type': '签名类型',
    'Verify request signature': '校验请求签名',
    'Validate request shape': '校验请求结构',
    'Expected Body Parameters': '期望的 Body 参数',
    'Expected Headers': '期望的 Headers',
    'Expected Query Parameters': '期望的 Query 参数',
    'Body Type': 'Body 类型',
    'Query Params': '查询参数',
    'Content Type': 'Content-Type',
    'Add Options': '添加选项',
    Option: '选项',
    'Output Format': '输出格式',
    'JSON Array': 'JSON 数组',
    'JSON Schema': 'JSON Schema',
    'Javascript Function': 'JavaScript 函数',
    'Select Flow': '选择流程',
    'Require Human Input': '需要人工输入',
    'Human Input': '人工输入',
    'Fallback Message': '兜底消息',
    'Enable Feedback': '启用反馈',
    'Visual Picker': '可视化选择器',
    Iteration: '迭代',
    'Direct Reply': '直接回复',
    Proceed: '继续',
    Reject: '拒绝',
    Equal: '等于',
    'Not Equal': '不等于',
    Contains: '包含',
    'Not Contains': '不包含',
    'Starts With': '开始于',
    'Ends With': '结束于',
    Larger: '大于',
    'Larger Equal': '大于等于',
    Smaller: '小于',
    'Smaller Equal': '小于等于',
    'Not Empty': '非空',
    Regex: '正则',
    'Value 1': '值 1',
    'Value 2': '值 2',
    'Variable Value': '变量值',
    'Conversation Summary': '对话摘要',
    'Conversation Summary Buffer': '对话摘要缓冲',
    'Ephemeral Memory': '临时记忆',
    'Chat Input': '对话输入',
    'No Input': '无输入',
    'Custom Text': '自定义文本',
    'Response Mode': '响应模式',
    'Response Type': '响应类型',
    'Streaming (SSE)': '流式（SSE）',
    Synchronous: '同步',
    'Asynchronous (callback)': '异步（callback）',
    Raw: '原始',
    'Raw (Base64)': '原始（Base64）',
    'Array[String]': 'Array[String]',
    'Array[Number]': 'Array[Number]',
    'Array[Boolean]': 'Array[Boolean]',
    'Array[Object]': 'Array[Object]',
    'String Array': '字符串数组',

    // ---------- Output anchor option labels ----------
    'Memory Retriever': '记忆检索器',
    'Memory Vector Store': '记忆向量库'
}

const nodeDescriptionMap = {
    // ---------- Agents ----------
    'Agent that uses Function Calling to pick the tools and args to call': '调用 Function Calling 自动选择工具和参数的智能体',
    'Agent that uses OpenAI Function Calling to pick the tools and args to call using LlamaIndex':
        '通过 LlamaIndex 使用 OpenAI Function Calling 自动选择工具和参数的智能体',
    'Agent that uses Anthropic Claude Function Calling to pick the tools and args to call using LlamaIndex':
        '通过 LlamaIndex 使用 Anthropic Claude Function Calling 自动选择工具和参数的智能体',
    'Agent that is designed for LLMs that are good for reasoning/writing XML (e.g: Anthropic Claude)':
        '为擅长推理 / 编写 XML 的 LLMs 设计的智能体（如 Anthropic Claude）',
    'Conversational agent for a chat model. It will utilize chat specific prompts': '面向对话模型的对话智能体，使用对话场景专用提示词',
    'Agent that uses the ReAct logic to decide what action to take, optimized to be used with Chat Models':
        '基于 ReAct 逻辑决定下一步动作的智能体，针对对话模型优化',
    'Agent that uses the ReAct logic to decide what action to take, optimized to be used with LLMs':
        '基于 ReAct 逻辑决定下一步动作的智能体，针对 LLMs 优化',
    'Agent that calls a vector store retrieval and uses Function Calling to pick the tools and args to call':
        '调用向量库检索 + Function Calling 自动选择工具和参数的智能体',
    'Agent used to answer queries on Airtable table': '用于回答 Airtable 表格相关问题的智能体',
    'Agent used to answer queries on CSV data': '用于回答 CSV 数据相关问题的智能体',
    'An agent that uses OpenAI Assistant API to pick the tool and args to call': '调用 OpenAI Assistant API 自动选择工具和参数的智能体',

    // ---------- Chains ----------
    'Chain to run queries against LLMs': '对 LLMs 发起查询的链',
    'Chat models specific conversational chain with memory': '面向对话模型的对话链（带记忆）',
    'Document QA - built on RetrievalQAChain to provide a chat history component': '文档问答 — 基于 RetrievalQAChain，附带对话历史',
    'QA chain for vector databases': '面向向量库的问答链',
    'QA chain for Vectara': '面向 Vectara 的问答链',
    'Answer questions over a SQL database': '基于 SQL 数据库回答问题',
    'QA Chain that automatically picks an appropriate vector store from multiple retrievers': '自动从多个检索器中挑选合适向量库的问答链',
    'Chain automatically picks an appropriate prompt from multiple prompt templates': '自动从多个提示词模板中挑选合适模板的链',
    'Chain to run queries against GET API': '对 GET API 发起查询的链',
    'Chain to run queries against POST API': '对 POST API 发起查询的链',
    'Chain that automatically select and call APIs based only on an OpenAPI spec': '仅依据 OpenAPI 规范自动选择并调用 API 的链',
    'Advanced chain for question-answering against a Neo4j graph by generating Cypher statements':
        '通过生成 Cypher 语句对 Neo4j 图进行问答的高级链',
    'QA chain to answer a question based on the retrieved documents': '基于检索到的文档回答问题的问答链',

    // ---------- Memory ----------
    'Memory for agentflow to remember the state of the conversation': '让 agentflow 记忆对话状态的记忆模块',
    'Memory for agentflow to remember the state of the conversation using MySQL database': '使用 MySQL 让 agentflow 记忆对话状态',
    'Memory for agentflow to remember the state of the conversation using Postgres database': '使用 Postgres 让 agentflow 记忆对话状态',
    'Memory for agentflow to remember the state of the conversation using SQLite database': '使用 SQLite 让 agentflow 记忆对话状态',
    'Retrieve chat messages stored in database': '读取数据库中的对话消息',
    'Stores and manages chat memory using Mem0 service': '通过 Mem0 服务存储与管理对话记忆',
    'Stores the conversation in MongoDB Atlas': '将对话存储到 MongoDB Atlas',
    'Stores the conversation in dynamo db table': '将对话存储到 DynamoDB 表',
    'Summarizes the conversation and stores the current summary in memory': '对对话进行摘要并将当前摘要存到内存',
    'Summarizes the conversation and stores the memory in Redis server': '对对话进行摘要并将记忆存到 Redis 服务',
    'Summarizes the conversation and stores the memory in Upstash Redis server': '对对话进行摘要并将记忆存到 Upstash Redis 服务',
    'Summarizes the conversation and stores the memory in zep server': '对对话进行摘要并将记忆存到 Zep 服务',
    'Uses a window of size k to surface the last k back-and-forth to use as memory': '使用大小为 k 的窗口，把最近的 k 轮对话作为记忆',
    'Uses token length to decide when to summarize conversations': '基于 token 长度决定何时对对话进行摘要',

    // ---------- Tools ----------
    'Execute HTTP DELETE requests': '执行 HTTP DELETE 请求',
    'Execute HTTP GET requests': '执行 HTTP GET 请求',
    'Execute HTTP POST requests': '执行 HTTP POST 请求',
    'Execute HTTP PUT requests': '执行 HTTP PUT 请求',
    'Execute code in a sandbox environment': '在沙盒环境中执行代码',
    'Extract values from JSON using path expressions': '使用路径表达式从 JSON 中提取值',
    'Get todays day, date and time.': '获取当前日期与时间。',
    'Gives agent the ability to visit a website and extract information': '让智能体具备访问网站并提取信息的能力',
    'Load OpenAPI specification, and converts each API endpoint to a tool': '加载 OpenAPI 规范，并将每个 API 端点转换为工具',
    "Use custom tool you've created in Flowise within chatflow": '在对话流中使用你在 FlowOps 创建的自定义工具',
    'Custom MCP Config': '自定义 MCP 配置',
    'Use tools from authorized MCP servers configured in workspace': '使用工作区中已授权的 MCP 服务提供的工具',
    'Perform calculations on response': '对响应执行数学计算',
    'Search and read content from academic papers on Arxiv': '检索并读取 Arxiv 上的学术论文内容',
    'Store and retrieve versioned text values in AWS DynamoDB': '在 AWS DynamoDB 中存储与读取带版本的文本值',
    'Publish messages to AWS SNS topics': '向 AWS SNS Topic 发布消息',
    'Real-time API for accessing Google Search data': '访问 Google 搜索数据的实时 API',
    'Runs MCP stdio-based servers over SSE (Server-Sent Events) or WebSockets (WS)':
        '通过 SSE（Server-Sent Events）或 WebSocket（WS）运行基于 MCP stdio 的服务',
    'Scrapes web pages recursively by following links OR by fetching URLs from the default sitemap.':
        '通过跟随链接或从默认 sitemap 抓取 URL 来递归抓取网页。',
    'Tool used to invoke query engine': '用于调用 query engine 的工具',
    'Toolset with over 250+ Apps for building AI-powered applications': '提供 250+ 应用、用于构建 AI 应用的工具集',
    'Use Stripe Agent function calling for financial transactions': '通过 Stripe Agent function calling 完成金融交易',
    'Use a chain as allowed tool for agent': '把链作为智能体可用工具',
    'Use a retriever as allowed tool for agent': '把检索器作为智能体可用工具',
    'Use as a tool to execute another agentflow': '作为工具调用另一条 agentflow',
    'Use as a tool to execute another chatflow': '作为工具调用另一条 chatflow',
    'Wrapper around BraveSearch API - a real-time API to access Brave search results':
        'BraveSearch API 封装 — 访问 Brave 搜索结果的实时 API',
    'Wrapper around Exa Search API - search engine fully designed for use by LLMs': 'Exa Search API 封装 — 专为 LLMs 设计的搜索引擎',
    'Wrapper around Google Custom Search API - a real-time API to access Google search results':
        'Google Custom Search API 封装 — 访问 Google 搜索结果的实时 API',
    'Wrapper around SearXNG - a free internet metasearch engine': 'SearXNG 封装 — 免费的互联网元搜索引擎',
    'Wrapper around SerpAPI - a real-time API to access Google search results': 'SerpAPI 封装 — 访问 Google 搜索结果的实时 API',
    'Wrapper around Serper.dev - Google Search API': 'Serper.dev 封装 — Google Search API',
    'Wrapper around TavilyAPI - A specialized search engine designed for LLMs and AI agents':
        'Tavily API 封装 — 专为 LLMs 与 AI agent 设计的搜索引擎',
    'Wrapper around WolframAlpha - a powerful computational knowledge engine': 'WolframAlpha 封装 — 强大的计算知识引擎',
    'Perform Gmail operations for drafts, messages, labels, and threads': '执行 Gmail 操作：草稿、邮件、标签、会话线程',
    'Perform Google Calendar operations such as managing events, calendars, and checking availability':
        '执行 Google 日历操作：管理事件、日历、检查可用时段',
    'Perform Google Drive operations such as managing files, folders, sharing, and searching':
        '执行 Google 云端硬盘操作：管理文件、文件夹、共享与搜索',
    'Perform Google Sheets operations such as managing spreadsheets, reading and writing values':
        '执行 Google 表格操作：管理表格、读写单元格',
    'Perform Jira operations for issues, comments, and users': '执行 Jira 操作：工单、评论、用户',
    'Perform Microsoft Outlook operations for calendars, events, and messages': '执行 Microsoft Outlook 操作：日历、事件、邮件',
    'Perform Microsoft Teams operations for channels, chats, and chat messages': '执行 Microsoft Teams 操作：频道、聊天、消息',
    'MCP Server for Browserless - scrape pages, take screenshots, generate PDFs, and more':
        'Browserless 的 MCP 服务 — 抓取页面、截图、生成 PDF 等',
    'MCP Server for Pipedream. For critical actions, ensure "Require Human Input" is enabled on the Agent node.':
        'Pipedream 的 MCP 服务。关键动作请在 Agent 节点上开启 "Require Human Input"。',
    'MCP Server for Teradata (remote HTTP streamable)': 'Teradata 的 MCP 服务（远程 HTTP 流式）',
    'MCP Server for the GitHub API': 'GitHub API 的 MCP 服务',
    'MCP Server for the Slack API': 'Slack API 的 MCP 服务',
    'MCP server that integrates the Brave Search API - a real-time API to access web search capabilities':
        '集成 Brave Search API 的 MCP 服务 — 访问网络搜索的实时 API',
    'MCP server that provides read-only access to PostgreSQL databases': '提供 PostgreSQL 数据库只读访问的 MCP 服务',

    // ---------- Chat Models ----------
    'Access models through the Nemo Guardrails API': '通过 Nemo Guardrails API 访问模型',
    'Chat completion using open-source LLM on Ollama': '使用 Ollama 上的开源 LLM 进行对话补全',
    'Connect to a Litellm server using OpenAI-compatible API': '通过 OpenAI 兼容 API 接入 Litellm 服务',
    'Custom/FineTuned model using OpenAI Chat compatible API': '通过 OpenAI Chat 兼容 API 接入自定义 / 微调模型',
    'Use local LLMs like llama.cpp, gpt4all using LocalAI': '通过 LocalAI 使用本地 LLM（如 llama.cpp、gpt4all）',
    'Wrapper around Alibaba Tongyi Chat Endpoints': 'Alibaba Tongyi 对话接口封装',
    'Wrapper around Azure OpenAI Chat LLM specific for LlamaIndex': '专为 LlamaIndex 的 Azure OpenAI 对话 LLM 封装',
    'Wrapper around Azure OpenAI large language models that use the Chat endpoint': '使用 Chat 端点的 Azure OpenAI 大语言模型封装',
    'Wrapper around BaiduWenxin Chat Endpoints': 'BaiduWenxin 对话接口封装',
    'Wrapper around Cerebras Inference API': 'Cerebras Inference API 封装',
    'Wrapper around ChatAnthropic LLM specific for LlamaIndex': '专为 LlamaIndex 的 ChatAnthropic LLM 封装',
    'Wrapper around ChatAnthropic large language models that use the Chat endpoint': '使用 Chat 端点的 ChatAnthropic 大语言模型封装',
    'Wrapper around ChatMistral LLM specific for LlamaIndex': '专为 LlamaIndex 的 ChatMistral LLM 封装',
    'Wrapper around ChatOllama LLM specific for LlamaIndex': '专为 LlamaIndex 的 ChatOllama LLM 封装',
    'Wrapper around ChatTogetherAI LLM specific for LlamaIndex': '专为 LlamaIndex 的 ChatTogetherAI LLM 封装',
    'Wrapper around Cloudflare Workers AI chat models': 'Cloudflare Workers AI 对话模型封装',
    'Wrapper around Cohere Chat Endpoints': 'Cohere 对话接口封装',
    'Wrapper around CometAPI large language models that use the Chat endpoint': '使用 Chat 端点的 CometAPI 大语言模型封装',
    'Wrapper around Deepseek large language models that use the Chat endpoint': '使用 Chat 端点的 Deepseek 大语言模型封装',
    'Wrapper around Fireworks Chat Endpoints': 'Fireworks 对话接口封装',
    'Wrapper around Google Gemini large language models that use the Chat endpoint': '使用 Chat 端点的 Google Gemini 大语言模型封装',
    'Wrapper around Grok from XAI': 'xAI 的 Grok 模型封装',
    'Wrapper around Groq API with LPU Inference Engine': 'Groq API 封装（LPU 推理引擎）',
    'Wrapper around Groq LLM specific for LlamaIndex': '专为 LlamaIndex 的 Groq LLM 封装',
    'Wrapper around HuggingFace large language models': 'HuggingFace 大语言模型封装',
    'Wrapper around IBM watsonx.ai foundation models': 'IBM watsonx.ai 基础模型封装',
    'Wrapper around Mistral large language models that use the Chat endpoint': '使用 Chat 端点的 Mistral 大语言模型封装',
    'Wrapper around NVIDIA NIM Inference API': 'NVIDIA NIM Inference API 封装',
    'Wrapper around Open Router Inference API': 'OpenRouter Inference API 封装',
    'Wrapper around OpenAI Chat LLM specific for LlamaIndex': '专为 LlamaIndex 的 OpenAI Chat LLM 封装',
    'Wrapper around OpenAI large language models that use the Chat endpoint': '使用 Chat 端点的 OpenAI 大语言模型封装',
    'Wrapper around Perplexity large language models that use the Chat endpoint': '使用 Chat 端点的 Perplexity 大语言模型封装',
    'Wrapper around Sambanova Chat Endpoints': 'Sambanova 对话接口封装',
    'Wrapper around TogetherAI large language models': 'TogetherAI 大语言模型封装',
    'Wrapper around VertexAI large language models that use the Chat endpoint': '使用 Chat 端点的 VertexAI 大语言模型封装',
    'Wrapper around Zhipu GLM large language models that use the Chat endpoint': '使用 Chat 端点的智谱 GLM 大语言模型封装',

    // ---------- Embeddings ----------
    'AWSBedrock embedding models to generate embeddings for a given text': '使用 AWS Bedrock 嵌入模型为文本生成嵌入',
    'Azure OpenAI API embeddings specific for LlamaIndex': '专为 LlamaIndex 的 Azure OpenAI API 嵌入',
    'Azure OpenAI API to generate embeddings for a given text': '使用 Azure OpenAI API 为文本生成嵌入',
    'Baidu Qianfan API to generate embeddings for a given text': '使用 Baidu Qianfan API 为文本生成嵌入',
    'Cohere API to generate embeddings for a given text': '使用 Cohere API 为文本生成嵌入',
    'Generate embeddings for a given text using open source model on IBM Watsonx': '使用 IBM Watsonx 上的开源模型为文本生成嵌入',
    'Generate embeddings for a given text using open source model on Ollama': '使用 Ollama 上的开源模型为文本生成嵌入',
    'Google Generative API to generate embeddings for a given text': '使用 Google Generative API 为文本生成嵌入',
    'Google vertexAI API to generate embeddings for a given text': '使用 Google vertexAI API 为文本生成嵌入',
    'HuggingFace Inference API to generate embeddings for a given text': '使用 HuggingFace Inference API 为文本生成嵌入',
    'JinaAI API to generate embeddings for a given text': '使用 JinaAI API 为文本生成嵌入',
    'MistralAI API to generate embeddings for a given text': '使用 MistralAI API 为文本生成嵌入',
    'OpenAI API to generate embeddings for a given text': '使用 OpenAI API 为文本生成嵌入',
    'OpenAI Embedding specific for LlamaIndex': '专为 LlamaIndex 的 OpenAI 嵌入',
    'TogetherAI Embedding models to generate embeddings for a given text': '使用 TogetherAI 嵌入模型为文本生成嵌入',
    'Use local embeddings models like llama.cpp': '使用本地嵌入模型（如 llama.cpp）',
    'Voyage AI API to generate embeddings for a given text': '使用 Voyage AI API 为文本生成嵌入',

    // ---------- LLMs ----------
    'Use Replicate to run open source models on cloud': '使用 Replicate 在云端运行开源模型',
    'Wrapper around AWS Bedrock large language models': 'AWS Bedrock 大语言模型封装',
    'Wrapper around Azure OpenAI large language models': 'Azure OpenAI 大语言模型封装',
    'Wrapper around Cohere large language models': 'Cohere 大语言模型封装',
    'Wrapper around Fireworks API for large language models': 'Fireworks API 大语言模型封装',
    'Wrapper around GoogleVertexAI large language models': 'GoogleVertexAI 大语言模型封装',
    'Wrapper around OpenAI large language models': 'OpenAI 大语言模型封装',
    'Wrapper around Sambanova API for large language models': 'SambaNova API 大语言模型封装',
    'Wrapper around open source large language models on Ollama': 'Ollama 上的开源大语言模型封装',

    // ---------- Vector Stores ----------
    'In-memory vectorstore that stores embeddings and does an exact, linear search for the most similar embeddings.':
        '内存向量库 — 存储嵌入并通过精确线性搜索查找最相似项。',
    'Upload files to Vectara': '上传文件到 Vectara',
    'Upsert embedded data and perform similarity or mmr search upon query using Supabase via pgvector extension':
        '通过 Supabase 的 pgvector 扩展存入嵌入并进行相似度 / MMR 检索',
    'Upsert embedded data and perform similarity search upon query using Chroma, an open-source embedding database':
        '使用开源嵌入数据库 Chroma 存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity search upon query using Faiss library from Meta':
        '使用 Meta 的 Faiss 库存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity search upon query using Vectara, a LLM-powered search-as-a-service':
        '使用 LLM 驱动的搜索即服务 Vectara 存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity search upon query using pgvector on Postgres':
        '使用 Postgres 的 pgvector 存入嵌入并进行相似度检索',
    'Upsert embedded data to local path and perform similarity search': '将嵌入存到本地路径并进行相似度检索',
    'Search and retrieve documents from Document Store': '从文档库检索与读取文档',
    'Upsert embedded data and load existing index using Couchbase, a award-winning distributed NoSQL database':
        '使用获奖分布式 NoSQL 数据库 Couchbase 存入嵌入并加载现有索引',
    'Upsert embedded data and perform similarity or mmr search upon query using DataStax Astra DB, a serverless vector database that’s perfect for managing mission-critical AI workloads':
        '使用无服务器向量库 DataStax Astra DB 存入嵌入并进行相似度 / MMR 检索，适合关键 AI 工作负载',
    'Upsert embedded data and perform similarity or mmr search upon query using MongoDB Atlas, a managed cloud mongodb database':
        '使用云托管 MongoDB Atlas 存入嵌入并进行相似度 / MMR 检索',
    'Upsert embedded data and perform similarity or mmr search using Pinecone, a leading fully managed hosted vector database':
        '使用领先的全托管向量库 Pinecone 存入嵌入并进行相似度 / MMR 检索',
    'Upsert embedded data and perform similarity search upon query using Meilisearch hybrid search functionality':
        '使用 Meilisearch 的混合搜索能力存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity search upon query using Milvus, world’s most advanced open-source vector database':
        '使用全球最先进的开源向量库 Milvus 存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity search upon query using OpenSearch, an open-source, all-in-one vector database':
        '使用开源一体化向量库 OpenSearch 存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity search upon query using Pinecone, a leading fully managed hosted vector database':
        '使用领先的全托管向量库 Pinecone 存入嵌入并进行相似度检索',
    "Use AWS Kendra's intelligent search service for document retrieval and semantic search":
        '使用 AWS Kendra 智能搜索服务进行文档检索与语义搜索',

    // ---------- Document Loaders ----------
    'Extract data from URLs using Oxylabs': '使用 Oxylabs 从 URL 抓取数据',
    'Load Data from S3 Buckets': '从 S3 存储桶加载数据',
    'Load and process data from BraveSearch results': '加载并处理 BraveSearch 结果数据',
    'Load and process data from web search results': '加载并处理网页搜索结果数据',
    'Load data from Apify Website Content Crawler': '从 Apify Website Content Crawler 加载数据',
    'Load data from EPUB files': '从 EPUB 文件加载数据',
    'Load data from Notion Database (each row is a separate document with all properties as metadata)':
        '从 Notion 数据库加载数据（每行作为独立文档，所有属性作为元数据）',
    'Load data from Notion Page (including child pages all as separate documents)': '从 Notion 页面加载数据（含子页面，每页作为独立文档）',
    'Load data from URL using FireCrawl': '使用 FireCrawl 从 URL 加载数据',
    'Load data from a Figma file': '从 Figma 文件加载数据',
    'Load data from real-time search results': '从实时搜索结果加载数据',
    'Load data from the exported and unzipped Notion folder': '从已导出并解压的 Notion 文件夹加载数据',
    'Scrape & Crawl the web with Spider': '使用 Spider 抓取与爬取网页',
    'Search documents with scores from vector store': '从向量库搜索文档（含相似度分值）',
    'Use Unstructured.io to load data from a file path': '使用 Unstructured.io 从文件路径加载数据',
    'A generic file loader that can load different file types': '可加载多种文件类型的通用文件加载器',
    'Custom function for loading documents': '自定义文档加载函数',
    'Load data from Airtable table': '从 Airtable 表格加载数据',
    'Load data from CSV files': '从 CSV 文件加载数据',
    'Load data from DOCX files': '从 DOCX 文件加载数据',
    'Load data from GitBook': '从 GitBook 加载数据',
    'Load data from Google Sheets as documents': '从 Google 表格加载数据为文档',
    'Load data from JSON Lines files': '从 JSON Lines 文件加载数据',
    'Load data from JSON files': '从 JSON 文件加载数据',
    'Load data from Microsoft Excel files': '从 Microsoft Excel 文件加载数据',
    'Load data from Microsoft PowerPoint files': '从 Microsoft PowerPoint 文件加载数据',
    'Load data from Microsoft Word files': '从 Microsoft Word 文件加载数据',
    'Load data from PDF files': '从 PDF 文件加载数据',
    'Load data from a Confluence Document': '从 Confluence 文档加载数据',
    'Load data from a GitHub repository': '从 GitHub 仓库加载数据',
    'Load data from an API': '从 API 加载数据',
    'Load data from folder with multiple files': '从含多文件的文件夹加载数据',
    'Load data from plain text': '从纯文本加载数据',
    'Load data from pre-configured document stores': '从已配置的文档库加载数据',
    'Load data from text files': '从文本文件加载数据',
    'Load data from webpages': '从网页加载数据',
    'Load documents from Google Drive files': '从 Google 云端硬盘文件加载文档',
    'Load issues from Jira': '从 Jira 加载工单',

    // ---------- Text Splitters ----------
    'Converts Html to Markdown and then split your content into documents based on the Markdown headers':
        '先将 HTML 转为 Markdown，再按 Markdown 标题分割为文档',
    'Split documents based on language-specific syntax': '按编程语言特定语法分割文档',
    'Split documents recursively by different characters - starting with "\\n\\n", then "\\n", then " "':
        '按多种字符递归分割 — 依次按 "\\n\\n"、"\\n"、" "',
    'Split your content into documents based on the Markdown headers': '按 Markdown 标题分割文档',
    'Splits a raw text string by first converting the text into BPE tokens, then split these tokens into chunks and convert the tokens within a single chunk back into text.':
        '先将文本转为 BPE token，再按 chunk 分割 token 并将每个 chunk 还原为文本。',
    'splits only on one type of character (defaults to "\\n\\n").': '仅按单一字符分割（默认 "\\n\\n"）。',

    // ---------- Output Parsers ----------
    'Parse the output of an LLM call as a comma-separated list of values': '将 LLM 输出解析为逗号分隔的列表',
    'Parse the output of an LLM call as a list of values.': '将 LLM 输出解析为列表。',
    'Parse the output of an LLM call into a given (JSON) structure.': '将 LLM 输出解析为指定的（JSON）结构。',
    'Parse the output of an LLM call into a given structure by providing a Zod schema.': '通过提供 Zod schema 将 LLM 输出解析为指定结构。',

    // ---------- Retrievers ----------
    'A document compressor that uses embeddings to drop documents unrelated to the query': '使用嵌入丢弃与查询无关文档的文档压缩器',
    'Azure Rerank indexes the documents from most to least semantically relevant to the query.':
        'Azure Rerank 按与查询的语义相关度对文档从高到低重排。',
    'Cohere Rerank indexes the documents from most to least semantically relevant to the query.':
        'Cohere Rerank 按与查询的语义相关度对文档从高到低重排。',
    'Connect to AWS Bedrock Knowledge Base API and retrieve relevant chunks': '接入 AWS Bedrock Knowledge Base API 检索相关片段',
    'Extract keywords/metadata from the query and use it to filter documents': '从查询中提取关键词 / 元数据并用于过滤文档',
    'Generate multiple queries from different perspectives for a given user input query': '为用户输入从多视角生成多条查询',
    'Jina AI Rerank indexes the documents from most to least semantically relevant to the query.':
        'Jina AI Rerank 按与查询的语义相关度对文档从高到低重排。',
    'Reciprocal Rank Fusion to re-rank search results by multiple query generation.':
        '通过多查询生成对结果进行 Reciprocal Rank Fusion 重排。',
    'Return results based on predefined format': '基于预定义格式返回结果',
    'Return results based on the minimum similarity percentage': '基于最小相似度阈值返回结果',
    'Store prompt template with name & description to be later queried by MultiPromptChain':
        '以名称与描述存储提示词模板，供 MultiPromptChain 后续查询',
    'Store vector store as retriever to be later queried by MultiRetrievalQAChain':
        '将向量库作为检索器存储，供 MultiRetrievalQAChain 后续查询',
    'Use HyDE retriever to retrieve from a vector store': '使用 HyDE 检索器从向量库检索',
    'Voyage AI Rerank indexes the documents from most to least semantically relevant to the query.':
        'Voyage AI Rerank 按与查询的语义相关度对文档从高到低重排。',

    // ---------- Cache ----------
    'Cache LLM response in Redis, useful for sharing cache across multiple processes or servers':
        '将 LLM 响应缓存到 Redis，便于跨进程 / 跨服务共享',
    'Cache LLM response in Upstash Redis, serverless data for Redis and Kafka':
        '将 LLM 响应缓存到 Upstash Redis（Redis 与 Kafka 的无服务器数据）',
    'Cache LLM response in memory, will be cleared once app restarted': '将 LLM 响应缓存到内存（应用重启后清空）',
    'Cache LLM response using Momento, a distributed, serverless cache': '使用分布式无服务器缓存 Momento 缓存 LLM 响应',
    'Cache generated Embeddings in Redis to avoid needing to recompute them.': '将生成的嵌入缓存到 Redis 避免重复计算。',
    'Cache generated Embeddings in memory to avoid needing to recompute them.': '将生成的嵌入缓存到内存避免重复计算。',

    // ---------- Prompts ----------
    'Fetch schema from LangFuse to represent a prompt for an LLM': '从 LangFuse 拉取 schema 作为 LLM 的提示词',
    'Prompt template you can build with examples': '可使用示例构建的提示词模板',
    'Schema to represent a basic prompt for an LLM': '描述 LLM 基础提示词的 schema',
    'Schema to represent a chat prompt': '描述对话提示词的 schema',

    // ---------- Utilities ----------
    'Add a sticky note': '添加便签',
    'Execute custom javascript function': '执行自定义 JavaScript 函数',
    'Get variable that was saved using Set Variable node': '读取由 Set Variable 节点保存的变量',
    'Set variable which can be retrieved at a later stage. Variable is only available during runtime.':
        '设置变量供后续阶段读取（仅在运行时有效）。',
    'Split flows based on If Else javascript functions': '基于 If/Else JavaScript 函数分流',

    // ---------- Moderation ----------
    'Check whether content complies with OpenAI usage policies.': '检查内容是否符合 OpenAI 使用政策。',
    'Check whether input consists of any text from Deny list, and prevent being sent to LLM':
        '检查输入是否包含拒绝列表中的内容，阻止其发送到 LLM',

    // ---------- Sequential Agents ----------
    'A centralized state object, updated by nodes in the graph, passing from one node to another':
        '集中式状态对象，由图中节点逐一更新并传递',
    'Agent that can execute tools': '能执行工具的智能体',
    'Conditional function to determine which route to take next': '决定下一步路由的条件函数',
    'End conversation': '结束对话',
    'Loop back to the specific sequential node': '回环到指定的顺序节点',
    'Run Chat Model and return the output': '运行对话模型并返回输出',
    'Starting point of the conversation': '对话起点',
    'Uses an agent to determine which route to take next': '使用智能体决定下一步路由',
    'Execute chatflow/agentflow and return final response': '执行 chatflow / agentflow 并返回最终响应',
    "Execute tool and return tool's output": '执行工具并返回工具输出',

    // ---------- Engine (LlamaIndex) ----------
    'Answer question based on retrieved documents (context) with built-in memory to remember conversation':
        '基于检索到的文档（上下文）回答问题，内置记忆保留对话',
    'Simple engine to handle back and forth conversations': '处理来回多轮对话的简单引擎',
    'Simple query engine built to answer question over your data, without memory': '面向数据的简单查询引擎，不带记忆',

    // ---------- Record Manager ----------
    'Use MySQL to keep track of document writes into the vector databases': '使用 MySQL 跟踪写入向量库的文档',
    'Use Postgres to keep track of document writes into the vector databases': '使用 Postgres 跟踪写入向量库的文档',
    'Use SQLite to keep track of document writes into the vector databases': '使用 SQLite 跟踪写入向量库的文档',

    // ---------- Response Synthesizer (LlamaIndex) ----------
    'Apply a query to a collection of text chunks, gathering the responses in an array, and return a combined string of all responses. Useful for individual queries on each text chunk.':
        '对一组文本片段执行查询，将各响应聚合为数组并合并为字符串。适用于对每个片段独立提问。',

    // ---------- Common Input Field Descriptions (sorted by frequency) ----------
    'Concatenated string from pageContent of documents': '由文档 pageContent 拼接的字符串',
    'Array of document objects containing metadata and pageContent': '包含 metadata 与 pageContent 的文档对象数组',
    'Additional metadata to be added to the extracted documents': '添加到抽取出文档的附加元数据',
    'Number of top results to fetch. Default to 4': '返回结果数，默认 4',
    'Detect text that could generate harmful output and prevent it from being sent to the language model':
        '检测可能产生有害输出的文本，阻止发送到语言模型',
    'Query to retrieve documents from retriever. If not specified, user question will be used':
        '用于从检索器检索文档的查询；未指定则使用用户问题',
    'Override the default base URL for the API, e.g., ': '覆盖 API 的默认 Base URL，例如：',
    'Default headers to include with every request to the API.': '对该 API 每次请求附带的默认请求头。',
    'Keep track of the record to prevent duplication': '跟踪记录以避免重复',
    'Update runtime state during the execution of the workflow': '工作流执行期间更新运行时状态',
    'Summarize conversations once token limit is reached. Default to 2000': '达到 token 上限时对对话进行摘要，默认 2000',
    'ID of the team (required for channel messages)': '团队 ID（频道消息必填）',
    'Uses a fixed window size to surface the last N messages': '使用固定窗口大小保留最近 N 条消息',
    'Number of characters to overlap between chunks. Default is 200.': '块之间重叠的字符数，默认 200。',
    'Number of characters in each chunk. Default is 1000.': '每个块的字符数，默认 1000。',
    'Allow file upload on the chat': '允许在对话中上传文件',
    'Recipient email address(es), comma-separated': '收件人邮箱地址（多个用逗号分隔）',
    'Name of the tool': '工具名称',
    'ID of the chat or channel': '对话或频道 ID',
    'Describe to LLM when it should use this tool': '向 LLM 说明何时调用此工具',
    'Whether the application supports both My Drives and shared drives': '是否同时支持「我的云端硬盘」和共享云端硬盘',
    'This prompt will be added at the end of the messages as human message': '该提示词将作为用户消息追加到消息列表末尾',
    'Temperature parameter may not apply to certain model. Please check available model parameters':
        'Temperature 参数可能不适用于某些模型，请查看模型可用参数',
    'Number of top results to fetch. Default to the TopK of the Base Retriever': '返回结果数，默认与 Base Retriever 的 TopK 相同',
    'Max length of the output. Remove this if you want to return the entire response': '输出最大长度。如想返回完整响应请删除此项',
    'Max Tokens parameter may not apply to certain model. Please check available model parameters':
        'Max Tokens 参数可能不适用于某些模型，请查看模型可用参数',
    'Input variables can be used in the function with prefix $. For example: $var': '可在函数中以 $ 前缀使用输入变量，例如 $var',
    'In the event that the first call fails, will make another call to the model to fix any errors.':
        '若首次调用失败，将再次请求模型以修复错误。',
    'ID of the team that contains the channel': '包含该频道的团队 ID',
    'Configure JWT authentication on your Zep instance (Optional)': '为你的 Zep 实例配置 JWT 鉴权（可选）',
    'Actions to perform': '执行的动作',
    'Write and run Python code in a sandboxed environment': '在沙盒环境中编写并运行 Python 代码',
    'Window of size k to surface the last k back-and-forth to use as memory.': '大小为 k 的窗口，保留最近 k 轮对话作为记忆。',
    'Use the user question from the historical conversation messages as input.': '使用历史对话中的用户问题作为输入。',
    'Use the last conversation message from the historical conversation messages as input.': '使用历史对话中的最后一条消息作为输入。',
    'Use all conversation messages from the historical conversation messages as input.': '使用全部历史对话消息作为输入。',
    'Type of operation': '操作类型',
    'Table with pk (partition) and sk (sort) keys': '包含 pk（分区）与 sk（排序）键的表',
    'Summarizes the whole conversation': '对整个对话进行摘要',
    'Select a method to retrieve relative links': '选择检索相对链接的方法',
    'Second value to be compared with': '用于比较的第二个值',
    'Scrape relative links from XML sitemap URL': '从 XML sitemap URL 抓取相对链接',
    'Retrieve all messages from the conversation': '从对话中检索所有消息'
}

// Common input placeholders — most are example values (URLs, emails, model names) kept as-is.
// Only generic ones are translated.
const nodeInputPlaceholderMap = {
    'Email Subject': '邮件主题',
    'Email content': '邮件内容'
}

const isZh = (lang) => !!lang && (lang === 'zh' || lang.startsWith('zh-'))

export const translateNodeCategory = (text, lang) => {
    if (!text) return text
    if (isZh(lang) && nodeCategoryMap[text]) return nodeCategoryMap[text]
    return text
}

export const translateNodeLabel = (text, lang) => {
    if (!text) return text
    if (isZh(lang) && nodeLabelMap[text]) return nodeLabelMap[text]
    return text
}

export const translateNodeDescription = (text, lang) => {
    if (!text) return text
    if (isZh(lang) && nodeDescriptionMap[text]) return nodeDescriptionMap[text]
    return text
}

export const translateNodeInputPlaceholder = (text, lang) => {
    if (!text) return text
    if (isZh(lang) && nodeInputPlaceholderMap[text]) return nodeInputPlaceholderMap[text]
    return text
}
