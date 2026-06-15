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
    Embeddings: '向量模型',
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
    'Embeddings Indexes': '向量索引',
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
    'Sequential Thinking MCP': '顺序思考 MCP',
    StripeAgentTool: 'Stripe 智能体工具',
    'Web Browser': '网页浏览器',
    'Web Scraper Tool': 'Web 抓取工具',

    // ---------- Chat Models (mostly brand/class names — only a couple translated) ----------
    'OpenAI Custom Model': 'OpenAI 自定义模型',

    // ---------- Embeddings ----------
    'AWS Bedrock Embedding': 'AWS Bedrock 向量模型',
    'Azure OpenAI Embedding': 'Azure OpenAI 向量模型',
    'Azure OpenAI Embeddings': 'Azure OpenAI 向量模型',
    'Baidu Qianfan Embedding': '百度千帆向量模型',
    'Cohere Embedding': 'Cohere 向量模型',
    'Google Gemini Embedding': 'Google Gemini 向量模型',
    'Google VertexAI Embedding': 'Google VertexAI 向量模型',
    'HuggingFace Inference Embedding': 'HuggingFace Inference 向量模型',
    'IBM Watsonx Embedding': 'IBM Watsonx 向量模型',
    'Jina Embedding': 'Jina 向量模型',
    'LocalAI Embedding': 'LocalAI 向量模型',
    'MistralAI Embedding': 'MistralAI 向量模型',
    'Ollama Embedding': 'Ollama 向量模型',
    'OpenAI Custom Embedding': 'OpenAI 兼容向量模型',
    'OpenAI Embedding': 'OpenAI 向量模型',
    'TogetherAI Embedding': 'TogetherAI 向量模型',
    'VoyageAI Embedding': 'VoyageAI 向量模型',
    '智谱 Embedding': '智谱文本向量模型',
    '通义 Embedding': '通义文本向量模型',
    '硅基流动 Embedding': '硅基流动文本向量模型',
    'DeepSeek Embedding': 'DeepSeek 文本向量模型',

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
    'List Operator': '列表操作器',
    Loop: '循环',
    'Parameter Extractor': '参数提取器',
    Start: '开始',
    State: '状态',
    'Template Transform': '模板转换',
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
    Template: '模板',
    Temperature: '随机性',
    'Text Splitter': '文本分割器',
    'Omit Metadata Keys': '忽略的元数据键',
    'Additional Metadata': '附加元数据',
    Streaming: '流式输出',
    'Max Tokens': '最大生成 Token 数',
    Embeddings: '向量模型',
    'Input Moderation': '输入审核',
    'Top Probability': '最高概率',
    Timeout: '超时',
    Query: '查询',
    'How to use': '使用说明',
    'Chat Model': '对话模型',
    'Language Model': '语言模型',
    'Base URL': '接口地址',
    Type: '类型',
    Model: '模型',
    'Frequency Penalty': '频率惩罚',
    'Base Path': '接口地址',
    Key: '键',
    'Base Options': '基础选项',
    'System Message': '系统消息',
    'Custom Pandas Read_CSV Code': '自定义 Pandas read_csv 代码',
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
    Region: '区域',
    Host: '主机',
    Description: '描述',
    'Allow Image Uploads': '允许上传图片',
    URL: 'URL',
    Tool: '工具',
    Tools: '工具',
    'Session Id': '会话 ID',
    'Session ID': '会话 ID',
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
    'Custom Model ARN': '自定义模型 ARN',
    'Custom Endpoint Host': '自定义端点 Host',
    'Max Tokens to Sample': '最大生成 Token 数',
    'Latency Optimized': '低延迟优化',
    'Use Global Inference Endpoint': '使用全局推理端点',
    'Cohere Input Type': 'Cohere 输入类型',
    'Max AWS API retries': 'AWS API 最大重试次数',
    Thinking: '深度思考',
    'Extended Thinking': '扩展思考',
    'Adaptive Thinking': '自适应思考',
    'Thinking Effort': '思考强度',
    'Thinking Budget': '思考预算',
    'Thinking Level': '思考级别',
    'Base Path to load': '加载路径',
    'Base Path to store': '存储路径',
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
    Sort: '排序',
    Cache: '缓存',
    'Async Options': '异步选项',
    Action: '动作',
    Field: '字段',
    Operator: '运算符',
    Order: '排序方向',
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
    Embedding: '向量模型',

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
    'Input Type': '输入类型',
    'Schedule Type': '调度类型',
    'Schedule Input': '定时触发',
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
    Variables: '变量',
    'Conversation Summary': '对话摘要',
    'Conversation Summary Buffer': '对话摘要缓冲',
    'Ephemeral Memory': '临时记忆',
    'Chat Input': '对话输入',
    'Form Input': '表单输入',
    'No Input': '无输入',
    'Custom Text': '自定义文本',
    'Full Webhook Payload': '完整 Webhook Payload',
    'Input Mode': '输入模式',
    'HTTP Method': 'HTTP 方法',
    'Response Mode': '响应模式',
    'Response Type': '响应类型',
    'Streaming (SSE)': '流式（SSE）',
    Synchronous: '同步',
    'Asynchronous (callback)': '异步（callback）',
    'Plain Token': '明文 Token',
    Hourly: '每小时',
    Raw: '原始',
    'Raw (Base64)': '原始（Base64）',
    'Array[String]': 'Array[String]',
    'Array[Number]': 'Array[Number]',
    'Array[Boolean]': 'Array[Boolean]',
    'Array[Object]': 'Array[Object]',
    'String Array': '字符串数组',
    Array: '数组',
    'Input Array': '输入数组',
    Slice: '切片',
    'Extract Field': '提取字段',
    Ascending: '升序',
    Descending: '降序',
    'Start Index': '开始索引',
    'End Index': '结束索引',
    Count: '数量',

    // ---------- Output anchor option labels ----------
    'Memory Retriever': '记忆检索器',
    'Memory Vector Store': '记忆向量库'
}

const nodeDescriptionMap = {
    // ---------- Agentflow Start triggers ----------
    'Start the conversation with chat input': '使用聊天输入启动对话。',
    'Start the workflow with form inputs': '使用表单输入启动工作流。',
    'Trigger the workflow via an external webhook': '通过外部 Webhook 请求触发工作流。',
    'Start the workflow on a recurring schedule (cron)': '按重复计划（cron）自动触发工作流。',
    'Expected Content-Type of incoming requests. For application/x-www-form-urlencoded, if the entire payload is a JSON string in a "payload" field (e.g. GitHub webhooks), it is automatically parsed — use $webhook.body.* as normal.':
        '传入请求期望的 Content-Type。对于 application/x-www-form-urlencoded，如果整个 payload 作为 "payload" 字段中的 JSON 字符串传入（例如 GitHub Webhook），系统会自动解析；下游仍可正常使用 $webhook.body.*。',
    'Send a request to this URL to trigger the workflow': '向此 URL 发送请求即可触发工作流。',
    'What this Start node passes as input to the rest of the flow when a webhook fires.':
        'Webhook 触发时，这个 Start 节点传给后续流程的输入内容。',
    'Pass a fixed string. Reference webhook fields with $webhook.body.* / $webhook.headers.* / $webhook.query.*':
        '传入固定文本。可通过 $webhook.body.* / $webhook.headers.* / $webhook.query.* 引用 Webhook 字段。',
    'Pass nothing. Use $webhook.* references inside downstream node configs to access the payload.':
        '不传入输入。可在下游节点配置中使用 $webhook.* 引用访问 payload。',
    'Pass the full JSON-serialized webhook payload (body, headers, query). Useful for debugging; bloats LLM context.':
        '传入完整 JSON 序列化的 Webhook payload（body、headers、query）。适合调试，但会增大 LLM 上下文。',
    'Text passed to downstream nodes as the user input. Use {{ $webhook.body.* }}, {{ $webhook.headers.* }}, or {{ $webhook.query.* }} to interpolate fields from the incoming request.':
        '作为用户输入传给下游节点的文本。可使用 {{ $webhook.body.* }}、{{ $webhook.headers.* }} 或 {{ $webhook.query.* }} 插入传入请求字段。',
    'How Flowise replies to the incoming webhook request.': 'FlowOps 如何回复传入的 Webhook 请求。',
    'Wait for the flow to finish and return the full result as JSON. Simple but blocks the caller; can time out for senders with short HTTP windows.':
        '等待流程完成并以 JSON 返回完整结果。简单直接，但会阻塞调用方；对 HTTP 超时时间较短的发送方可能超时。',
    'Return 202 Accepted immediately and run the flow in the background. Set a Callback URL below to have the result POSTed there when the flow finishes; leave it blank for fire-and-forget. Best for senders with short HTTP timeouts.':
        '立即返回 202 Accepted，并在后台运行流程。填写下方 Callback URL 后，流程完成时会 POST 结果；留空则只触发不回调。适合 HTTP 超时时间较短的发送方。',
    'Return a Server-Sent Events stream so the caller sees tokens and agent steps as they happen. Best for custom callers (browsers using fetch+ReadableStream, internal services). NOT compatible with senders that expect a single quick response.':
        '返回 Server-Sent Events 流，让调用方实时看到 token 和 Agent 步骤。适合自定义调用方（使用 fetch+ReadableStream 的浏览器、内部服务）。不适合只接受单次快速响应的发送方。',
    'Reject requests that are missing required headers, body fields, or query parameters declared below. Turn this on to enforce a request contract and catch bad requests early. Leave off to accept any payload and let the flow handle validation itself.':
        '拒绝缺少下方必填 headers、body 字段或 query 参数的请求。开启后可强制请求契约并提前发现异常请求；关闭则接受任意 payload，由流程自行校验。',
    'Standard 5-field cron expression (minute hour day month weekday). Example: "0 9 * * 1-5" runs at 09:00 every weekday.':
        '标准 5 位 cron 表达式（分 时 日 月 周）。例如 "0 9 * * *" 表示每天 09:00 触发，"0 9 * * 1-5" 表示工作日 09:00 触发。',
    'Use a visual picker to select schedule options': '使用可视化选择器配置定时选项。',
    'Use a cron expression to define the schedule': '使用 cron 表达式定义定时计划。',
    'Run every hour at the specified time': '按指定分钟每小时运行一次。',
    'Run every day at the specified time': '每天在指定时间运行。',
    'Run every week on the specified day and time': '每周在指定星期和时间运行。',
    'Run every month on the specified date and time': '每月在指定日期和时间运行。',
    'Minute of the hour when the schedule should run (0-59). For example, "30" means the schedule will run at the 30th minute of the hour.':
        '定时任务在每小时的第几分钟运行（0-59）。例如 "30" 表示每小时第 30 分钟运行。',
    'Optional date after which the schedule will stop firing.': '可选。超过该日期后定时任务停止触发。',
    'IANA timezone. Defaults to UTC.': 'IANA 时区，默认 UTC。中国常用 Asia/Shanghai。',
    'How the schedule should invoke this flow on each fire.': '每次定时触发时，调度器如何调用此流程。',
    'Pass a fixed text string as the question on every fire': '每次触发都传入固定文本作为问题。',
    'Pass default values for the form fields below on every fire': '每次触发都为下方表单字段传入默认值。',
    'Fire with no input.': '触发时不传入输入。',
    'Default question/input passed to the flow when it is triggered by the scheduler.': '调度器触发时传给流程的默认问题 / 输入。',
    'Define the typed fields this scheduled flow receives on each fire.': '定义该定时流程每次触发时接收的字段。',
    'Default values for the form fields above, as a JSON object keyed by variable name. Example: { "team": "engineering", "metric": "p95" }':
        '上方表单字段的默认值，使用变量名作为 key 的 JSON 对象。例如：{ "team": "engineering", "metric": "p95" }。',
    'Start fresh for every execution without past chat history': '每次执行都从空上下文开始，不带历史对话。',

    // ---------- Agentflow nodes ----------
    'Starting point of the agentflow': 'Agentflow 的起始节点',
    'Large language models to analyze user-provided inputs and generate responses': '用于分析用户输入并生成回复的大语言模型',
    'Dynamically choose and utilize tools during runtime, enabling multi-step reasoning': '运行时动态选择并调用工具，支持多步推理',
    'Tools allow LLM to interact with external systems': '允许 LLM 与外部系统交互的工具',
    'Retrieve information from vector database': '从向量数据库检索信息',
    'Directly reply to the user with a message': '直接向用户回复消息',
    'Request human input, approval or rejection during execution': '执行过程中请求人工输入、审批或拒绝',
    'Add notes to the agent flow': '给 agent flow 添加备注',
    'Execute the nodes within the iteration block through N iterations': '在迭代块内执行节点，共执行 N 次',
    'Loop back to a previous node': '回到前一个节点继续执行',
    'Split flows based on If Else conditions': '根据 If Else 条件拆分流程',
    'Utilize an agent to split flows based on dynamic conditions': '使用智能体根据动态条件拆分流程',

    // ---------- Engine / Graph / Synthesizer / Retriever ----------
    'Breaks complex query into sub questions for each relevant data source, then gather all the intermediate responses and synthesizes a final response':
        '将复杂查询拆分为面向各相关数据源的子问题，收集中间回答并合成最终回复',
    'Connect with Neo4j graph database': '连接 Neo4j 图数据库',
    'Create and refine an answer by sequentially going through each retrieved text chunk. This makes a separate LLM call per Node. Good for more detailed answers.':
        '依次遍历每个检索到的文本块来创建并优化答案。每个节点会单独调用一次 LLM，适合更细致的回答。',
    'CompactRefine is a slight variation of Refine that first compacts the text chunks into the smallest possible number of chunks.':
        'CompactRefine 是 Refine 的轻微变体，会先将文本块压缩为尽可能少的块。',
    'Given a set of text chunks and the query, recursively construct a tree and return the root node as the response. Good for summarization purposes.':
        '基于一组文本块和查询递归构建树，并返回根节点作为响应。适合摘要场景。',
    'Iterate over the initially returned documents and extract, from each, only the content that is relevant to the query':
        '遍历初始返回的文档，并从每个文档中仅提取与查询相关的内容',

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
    'Give your agent context about different document sources. Document stores must be upserted in advance.':
        '为智能体提供不同文档来源作为上下文。文档库需要提前完成入库。',
    'Give your agent context about different document sources from existing vector stores and embeddings':
        '从现有向量库和嵌入中为智能体提供不同文档来源作为上下文。',
    'Document stores to retrieve information from. Document stores must be upserted in advance.':
        '用于检索信息的文档库。文档库需要提前完成入库。',
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
    'Wrapper around Serper.dev - Google Search API': '通过 Serper.dev 调用 Google 搜索接口的工具封装。',
    'Wrapper around TavilyAPI - A specialized search engine designed for LLMs and AI agents':
        'Tavily API 封装 — 专为 LLMs 与 AI agent 设计的搜索引擎',
    'Wrapper around WolframAlpha - a powerful computational knowledge engine': 'WolframAlpha 封装 — 强大的计算知识引擎',
    'Perform Gmail operations for drafts, messages, labels, and threads': '执行 Gmail 操作：草稿、邮件、标签、会话线程',
    'Perform Google Calendar operations such as managing events, calendars, and checking availability':
        '执行 Google 日历操作：管理事件、日历、检查可用时段',
    'Perform Google Docs operations such as creating, reading, updating, and deleting documents, as well as text manipulation':
        '执行 Google 文档操作：创建、读取、更新、删除文档，以及文本处理。',
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
    'MCP server that provides a tool for dynamic and reflective problem-solving through a structured thinking process':
        '提供结构化思考流程的 MCP 服务，用于动态、反思式地解决问题。',

    // ---------- Chat Models ----------
    'Access models through the Nemo Guardrails API': '通过 Nemo Guardrails API 访问模型',
    'Chat completion using open-source LLM on Ollama': '使用 Ollama 上的开源 LLM 进行对话补全',
    'Connect to a Litellm server using OpenAI-compatible API': '通过 OpenAI 兼容 API 接入 Litellm 服务',
    'Custom/FineTuned model using OpenAI Chat compatible API': '通过 OpenAI Chat 兼容 API 接入自定义 / 微调模型',
    'Use local LLMs like llama.cpp, gpt4all using LocalAI': '通过 LocalAI 调用本地大语言模型，例如 llama.cpp、gpt4all。',
    'Wrapper around Alibaba Tongyi Chat Endpoints': 'Alibaba Tongyi 对话接口封装',
    'Wrapper around Azure OpenAI Chat LLM specific for LlamaIndex': '专为 LlamaIndex 使用场景封装的 Azure OpenAI 对话模型。',
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
    'Wrapper around NVIDIA NIM Inference API': '用于调用 NVIDIA NIM 推理接口的模型封装。',
    'Wrapper around Open Router Inference API': 'OpenRouter Inference API 封装',
    'Wrapper around OpenAI Chat LLM specific for LlamaIndex': '专为 LlamaIndex 使用场景封装的 OpenAI 对话模型。',
    'Wrapper around OpenAI large language models that use the Chat endpoint': '使用 Chat 端点的 OpenAI 大语言模型封装',
    'Wrapper around Perplexity large language models that use the Chat endpoint': '使用 Chat 端点的 Perplexity 大语言模型封装',
    'Wrapper around Sambanova Chat Endpoints': 'Sambanova 对话接口封装',
    'Wrapper around TogetherAI large language models': 'TogetherAI 大语言模型封装',
    'Wrapper around VertexAI large language models that use the Chat endpoint': '使用 Chat 端点的 VertexAI 大语言模型封装',
    'Wrapper around Alibaba Tongyi Qwen large language models (DashScope OpenAI-compatible) that use the Chat endpoint':
        '通过阿里云 DashScope 兼容模式调用通义千问对话模型',
    'Wrapper around Doubao (Volcengine Ark) large language models that use the Chat endpoint':
        '通过火山方舟 OpenAI 兼容接口调用豆包对话模型',
    'Wrapper around MiniMax large language models that use the Chat endpoint': '通过 MiniMax OpenAI 兼容接口调用 MiniMax 对话模型',
    'Wrapper around Kimi/Moonshot large language models that use the Chat endpoint': '使用 Chat 端点的 Kimi / 月之暗面大语言模型封装',
    'Wrapper around Zhipu GLM large language models that use the Chat endpoint': '使用 Chat 端点的智谱 GLM 大语言模型封装',
    'Wrapper around AWS Bedrock large language models. Supports built-in, imported, fine-tuned, and provisioned-throughput models.':
        'AWS Bedrock 大语言模型封装。支持内置、导入、微调和预置吞吐量模型。',

    // ---------- Embeddings ----------
    'AWSBedrock embedding models to generate embeddings for a given text': '使用 AWS Bedrock 向量模型为文本生成向量',
    'Azure OpenAI API embeddings specific for LlamaIndex': '专为 LlamaIndex 的 Azure OpenAI 文本向量模型',
    'Azure OpenAI API to generate embeddings for a given text': '使用 Azure OpenAI API 为文本生成向量',
    'Baidu Qianfan API to generate embeddings for a given text': '使用百度千帆 API 为文本生成向量',
    'Cohere API to generate embeddings for a given text': '使用 Cohere API 为文本生成向量',
    'Generate embeddings for a given text using open source model on IBM Watsonx': '使用 IBM Watsonx 上的开源模型为文本生成向量',
    'Generate embeddings for a given text using open source model on Ollama': '使用 Ollama 上的开源模型为文本生成向量',
    'Google Generative API to generate embeddings for a given text': '使用 Google Generative API 为文本生成向量',
    'Google vertexAI API to generate embeddings for a given text': '使用 Google vertexAI API 为文本生成向量',
    'HuggingFace Inference API to generate embeddings for a given text': '使用 HuggingFace Inference API 为文本生成向量',
    'JinaAI API to generate embeddings for a given text': '使用 JinaAI API 为文本生成向量',
    'MistralAI API to generate embeddings for a given text': '使用 MistralAI API 为文本生成向量',
    'OpenAI API to generate embeddings for a given text': '使用 OpenAI API 为文本生成向量',
    'OpenAI Embedding specific for LlamaIndex': '专为 LlamaIndex 的 OpenAI 文本向量模型',
    'TogetherAI Embedding models to generate embeddings for a given text': '使用 TogetherAI 向量模型为文本生成向量',
    'Use local embeddings models like llama.cpp': '使用本地向量模型（如 llama.cpp）',
    'Voyage AI API to generate embeddings for a given text': '使用 Voyage AI API 为文本生成向量',
    'Zhipu AI embedding models that use the OpenAI-compatible endpoint':
        '通过智谱 OpenAI 兼容接口调用 embedding-3 等文本向量模型，用于知识库检索',
    'Alibaba DashScope (Qwen) embedding models that use the OpenAI-compatible endpoint':
        '通过阿里云 DashScope 兼容模式调用 text-embedding-v3 等文本向量模型，用于知识库检索',
    'SiliconFlow hosted embedding models (bge, bce, etc.) that use the OpenAI-compatible endpoint':
        '通过硅基流动 OpenAI 兼容接口调用 bge、bce 等文本向量模型，用于知识库检索',
    'DeepSeek compatible embedding models that use the OpenAI-compatible endpoint':
        '通过 DeepSeek 兼容接口调用 deepseek-embedding-v1 文本向量模型，用于知识库检索',

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
    'Upsert data as embedding or string and perform similarity search with Upstash, the leading serverless data platform':
        '使用 Upstash 存入向量或字符串并进行相似度检索。Upstash 是领先的无服务器数据平台',
    'Upsert embedded data and load existing index using Couchbase, a award-winning distributed NoSQL database':
        '使用获奖分布式 NoSQL 数据库 Couchbase 存入嵌入并加载现有索引',
    'Upsert embedded data and perform similarity search upon query using SingleStore, a fast and distributed cloud relational database':
        '使用快速分布式云关系型数据库 SingleStore 存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity or mmr search upon query using DataStax Astra DB, a serverless vector database that’s perfect for managing mission-critical AI workloads':
        '使用无服务器向量库 DataStax Astra DB 存入嵌入并进行相似度 / MMR 检索，适合关键 AI 工作负载',
    "Upsert embedded data and perform similarity search upon query using Milvus, world's most advanced open-source vector database":
        '使用全球最先进的开源向量库 Milvus 存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity or mmr search upon query using MongoDB Atlas, a managed cloud mongodb database':
        '使用云托管 MongoDB Atlas 存入嵌入并进行相似度 / MMR 检索',
    'Upsert embedded data and perform similarity search upon query using Elasticsearch, a distributed search and analytics engine':
        '使用分布式搜索与分析引擎 Elasticsearch 存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity search upon query using Qdrant, a scalable open source vector database written in Rust':
        '使用基于 Rust 编写的可扩展开源向量库 Qdrant 存入嵌入并进行相似度检索',
    'Upsert embedded data and perform similarity or mmr search using Pinecone, a leading fully managed hosted vector database':
        '使用领先的全托管向量库 Pinecone 存入嵌入并进行相似度 / MMR 检索',
    'Upsert embedded data and perform similarity or mmr search using Weaviate, a scalable open-source vector database':
        '使用可扩展的开源向量库 Weaviate 存入嵌入并进行相似度 / MMR 检索',
    'Upsert embedded data and perform similarity or mmr search upon query using Zep, a fast and scalable building block for LLM apps':
        '使用快速、可扩展的 LLM 应用构建模块 Zep 存入嵌入并进行相似度 / MMR 检索',
    'Upsert embedded data and perform similarity search upon query using Redis, an open source, in-memory data structure store':
        '使用开源内存数据结构存储 Redis 存入嵌入并进行相似度检索',
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
    'Load data from Apify Website Content Crawler': '从 Apify 网站内容爬虫加载网页数据。',
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
    'Extract typed parameters from input text with structured model output': '使用模型结构化输出从输入文本中提取指定类型参数',
    'Filter, sort, slice, limit, or extract fields from an array': '对数组进行过滤、排序、切片、截断或字段提取',
    'Render a text template with runtime variables': '使用运行时变量渲染文本模板',

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
    'Add an input message as user message at the end of the conversation': '在对话末尾追加一条用户消息作为输入消息。',
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

const nodeTooltipMap = {
    // ---------- Common node input help ----------
    'Custom Pandas <a target="_blank" href="https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html">read_csv</a> function. Takes in an input: "csv_data"':
        '自定义 Pandas <a target="_blank" href="https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html">read_csv</a> 函数。输入参数为 "csv_data"。',
    'Override existing prompt with Chat Prompt Template. Human Message must includes {input} variable':
        '使用 Chat Prompt Template 覆盖默认提示词；其中 Human Message 必须包含 {input} 变量。',
    'If Chat Prompt Template is provided, this will be ignored': '如果已提供 Chat Prompt Template，将忽略这里的系统消息。',
    'If not specified, a random id will be used. Learn <a target="_blank" href="https://docs.flowiseai.com/memory/long-term-memory#ui-and-embedded-chat">more</a>':
        '不填写时将使用随机会话 ID。<a target="_blank" href="https://docs.flowiseai.com/memory/long-term-memory#ui-and-embedded-chat">了解更多</a>',
    'If not specified, a random id will be used. Learn <a target="_blank" href="https://docs.flowiseai.com/memory#ui-and-embedded-chat">more</a>':
        '不填写时将使用随机会话 ID。<a target="_blank" href="https://docs.flowiseai.com/memory#ui-and-embedded-chat">了解更多</a>',
    'The aws region in which table is located': '表所在的 AWS 区域。',
    'List of stop words to use when generating. Use comma to separate multiple stop words.':
        '生成时使用的停止词列表。多个停止词请用英文逗号分隔。',
    'Seconds till a session expires. If not specified, the session will never expire.': '会话过期时间，单位为秒。不填写时会话永不过期。',
    'Configure password authentication on your upstash redis instance': '配置 Upstash Redis 实例的密码认证。',
    'Zep Memory Type, can be perpetual or message_window': 'Zep 记忆类型，可选择永久记忆 perpetual 或消息窗口 message_window。',
    'Detect text that could generate harmful output and prevent it from being sent to the language model':
        '检测可能产生有害输出的内容，并阻止其发送给语言模型。',
    'If left empty, a default BufferMemory will be used': '留空时将使用默认 Buffer Memory。',
    'Using previous chat history, rephrase question into a standalone question': '根据历史对话，将用户问题改写成可独立理解的问题。',
    'Taking the rephrased question, search for answer from the provided context': '基于改写后的问题，从提供的上下文中检索并生成答案。',
    'Prompt must include input variables: {chat_history} and {question}': '提示词必须包含输入变量：{chat_history} 和 {question}。',
    'Prompt must include input variable: {context}': '提示词必须包含输入变量：{context}。',
    'Custom model name to use. If provided, it will override the selected model.': '自定义模型名称；填写后会覆盖上方选择的模型。',
    'Custom model name to use. If provided, it will override the model selected': '自定义模型名称；填写后会覆盖已选择的模型。',
    'If provided, will override model selected from Model Name option': '填写后会覆盖“模型名称”下拉框中选择的模型。',
    'Custom model name or Volcengine Ark endpoint ID (ep-xxx) to use. If provided, it will override the selected model.':
        '自定义模型名称或火山方舟端点 ID（ep-xxx）；填写后会覆盖上方选择的模型。',
    'For imported, fine-tuned, or provisioned-throughput models. Enter the full ARN. Imported models are auto-detected and routed to the correct API. For fine-tuned models, use the deployment ARN (custom-model-deployment/... for on-demand, or provisioned-model/... for Provisioned Throughput) — the raw custom-model/... artifact ARN is not invokable. For built-in models, use the dropdown above instead.':
        '用于已导入、微调或预置吞吐量模型。请填写完整 ARN；导入模型会自动识别并路由到正确 API。微调模型请填写部署 ARN（按需使用 custom-model-deployment/...，预置吞吐量使用 provisioned-model/...），原始 custom-model/... 产物 ARN 不能直接调用。内置模型请使用上方下拉框。',
    'Hostname-only override for a custom VPC endpoint or proxy (e.g. bedrock-runtime.us-east-1.amazonaws.com). Do NOT enter model ARNs or inference profile IDs here.':
        '自定义 VPC 端点或代理只需填写主机名（例如 bedrock-runtime.us-east-1.amazonaws.com）。这里不要填写模型 ARN 或推理配置 ID。',
    'Default headers to include with every request to the API.': '每次请求 API 时附带的默认请求头。',
    'Additional options to pass to the Deepseek client. This should be a JSON object.':
        '传给 DeepSeek 客户端的附加选项，请填写 JSON 对象。',
    'Base URL for the API. Leave empty to use the default.': 'API 的 Base URL。留空时使用默认地址。',
    'Temperature parameter may not apply to certain model. Please check available model parameters':
        '随机性参数不一定适用于所有模型，请以模型支持的参数为准。',
    'Enable deep thinking mode for complex reasoning tasks. When enabled, the model will use extended thinking before responding.':
        '启用深度思考模式，用于复杂推理任务。开启后，模型会在回复前进行扩展思考。',
    'Max Tokens parameter may not apply to certain model. Please check available model parameters':
        '最大生成 Token 数不一定适用于所有模型，请以模型支持的参数为准。',
    'Enable latency optimized configuration for supported models. Refer to the supported <a href="https://docs.aws.amazon.com/bedrock/latest/userguide/latency-optimized-inference.html" target="_blank">latecny optimized models</a> for more details.':
        '为支持的模型启用低延迟优化。可查看 <a href="https://docs.aws.amazon.com/bedrock/latest/userguide/latency-optimized-inference.html" target="_blank">低延迟优化模型</a> 了解详情。',
    'Force the global cross-region inference profile instead of the region-specific one. Bedrock routes dynamically across regions for maximum availability.':
        '强制使用全局跨区域推理配置，而不是当前区域专属配置。Bedrock 会在多个区域间动态路由，以提高可用性。',
    'Region to use for the model.': '模型使用的云服务区域。',
    'Custom endpoint host to use for the model. Provide the hostname without scheme. If provided, will override the default endpoint host.':
        '模型使用的自定义端点 Host。只填写主机名，不需要带 http/https；填写后会覆盖默认端点。',
    'Specifies the type of input passed to the model. Required for cohere embedding models v3 and higher. <a target="_blank" href="https://docs.cohere.com/reference/embed">Official Docs</a>':
        '指定传给模型的输入类型。Cohere embedding v3 及以上模型必填。<a target="_blank" href="https://docs.cohere.com/reference/embed">官方文档</a>',
    'Documents batch size to send to AWS API for Titan model embeddings. Used to avoid throttling.':
        '发送到 AWS API 的 Titan 向量模型文档批大小，用于降低触发限流的概率。',
    'This will limit the number of AWS API for Titan model embeddings call retries. Used to avoid throttling.':
        '限制 Titan 向量模型调用 AWS API 的重试次数，用于降低触发限流的概率。',
    'Whether or not to stream tokens as they are generated.': '是否在模型生成 Token 时实时流式返回。',
    'Whether or not to stream tokens as they are generated': '是否在模型生成 Token 时实时流式返回。',
    'Allow image input. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.':
        '允许图片输入。更多说明可查看 <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">文档</a>。',
    'Number of top results to fetch. Default to 4': '要获取的结果数量，默认 4。',
    'Number of characters in each chunk. Default is 1000.': '每个文本块的字符数，默认 1000。',
    'Number of characters to overlap between chunks. Default is 200.': '相邻文本块之间重叠的字符数，默认 200。',
    'Additional metadata to be added to the extracted documents': '要添加到抽取文档上的附加元数据。',
    'Query to retrieve documents from retriever. If not specified, user question will be used':
        '用于从检索器取回文档的查询；不填写时使用用户问题。',
    'Allow file upload on the chat': '允许用户在对话中上传文件。',
    'Describe to LLM when it should use this tool': '告诉 LLM 什么时候应该调用这个工具。',
    'Name of the tool': '工具名称。',
    'Whether to return source documents': '是否返回来源文档。',
    'Return source documents': '返回来源文档。',
    'Add an input message as user message at the end of the conversation': '在对话末尾追加一条用户消息作为输入消息。',
    'Give your agent context about different document sources. Document stores must be upserted in advance.':
        '为智能体提供不同文档来源作为上下文。文档库需要提前完成入库。',
    'Give your agent context about different document sources from existing vector stores and embeddings':
        '从现有向量库和嵌入中为智能体提供不同文档来源作为上下文。',
    'Document stores to retrieve information from. Document stores must be upserted in advance.':
        '用于检索信息的文档库。文档库需要提前完成入库。',
    'Window of size k to surface the last k back-and-forth to use as memory.': '保留最近 k 轮对话作为记忆。',
    'Uses a window of size k to surface the last k back-and-forth to use as memory': '使用大小为 k 的窗口，把最近 k 轮对话作为记忆。',
    'Summarizes the conversation and stores the current summary in memory': '对对话进行摘要，并将当前摘要存入记忆。',
    'Memory for agentflow to remember the state of the conversation': '让 Agentflow 记住当前对话状态。'
}

// Common input placeholders — most are example values (URLs, emails, model names) kept as-is.
// Only generic ones are translated.
const nodeInputPlaceholderMap = {
    'Email Subject': '邮件主题',
    'Email content': '邮件内容',
    'I want you to act as a document that I am having a conversation with. Your name is "AI Assistant". You will provide me with answers from the given info. If the answer is not included, say exactly "Hmm, I am not sure." and stop after that. Refuse to answer any question not about the info. Never break character.':
        '请你扮演一份正在与我对话的文档。你的名字是 "AI Assistant"。你需要基于给定信息回答我的问题。如果答案不在信息中，请只说 "Hmm, I am not sure."，然后停止回答。拒绝回答任何与给定信息无关的问题，并始终保持角色设定。'
}

const isZh = (lang) => !!lang && (lang === 'zh' || lang.startsWith('zh-'))

const isEnglishHeavyCopy = (text) => {
    if (!text || typeof text !== 'string') return false
    const latinWords = text.match(/[A-Za-z][A-Za-z'-]{2,}/g) || []
    const cjkChars = text.match(/[\u3400-\u9fff]/g) || []
    return latinWords.length >= 4 && cjkChars.length < 8
}

const normalizeTooltipText = (text) => text.replace(/\s+/g, ' ').trim()

const exactNodeTooltipFallbackMap = {
    'Search the web for the latest information': '搜索网页获取最新信息。',
    'Generate images based on a text prompt': '根据文本提示生成图片。',
    'Extract content from given URLs': '从给定 URL 中提取内容。',
    'Search real-time web content': '搜索实时网页内容。',
    'Retrieve full content from specified web pages': '读取指定网页的完整内容。',
    'Enable memory for the conversation thread': '为当前会话线程启用记忆。',
    'Instruct the Agent to give output in a JSON structured schema': '要求 Agent 按 JSON 结构化 Schema 输出。',
    'Instruct the LLM to give output in a JSON structured schema': '要求 LLM 按 JSON 结构化 Schema 输出。',
    'Enum values. Separated by comma': '枚举值，多个值请用英文逗号分隔。',
    'JSON schema for the structured output': '结构化输出使用的 JSON Schema。',
    'First value to be compared with': '用于比较的第一个值。',
    'A general instructions of what the condition agent should do': '描述条件 Agent 应该执行的总体指令。',
    'Input to be used for the condition agent': '条件 Agent 使用的输入内容。',
    'Define the scenarios that will be used as the conditions to split the flow': '定义用于拆分流程的条件场景。',
    'Override initial system prompt for Condition Agent': '覆盖 Condition Agent 的初始系统提示词。',
    'Expert use only. Modifying this can significantly alter agent behavior. Leave default if unsure':
        '仅供高级用户使用。修改此项可能显著改变 Agent 行为；不确定时请保持默认值。',
    'Input variables can be used in the function with prefix $. For example: $foo': '函数中可使用带 $ 前缀的输入变量，例如 $foo。',
    'The function to execute. Must return a string or an object that can be converted to a string.':
        '要执行的函数。必须返回字符串，或返回可转换为字符串的对象。',
    'Override the config passed to the flow': '覆盖传递给流程的配置。',
    'Override the config passed to the flow.': '覆盖传递给流程的配置。',
    'The input array to iterate over': '需要遍历的输入数组。',
    'Message to display if the loop count is exceeded': '循环次数超限时显示的消息。',
    'Specify the type of form input': '指定表单输入类型。',
    'Variable name must be camel case. For example: firstName, lastName, etc.': '变量名必须使用驼峰命名，例如 firstName、lastName 等。',
    'Declare expected query parameters. Leave empty to accept any.': '声明期望的查询参数；留空则接受任意参数。',
    'Declare expected request headers. Leave empty to accept any.': '声明期望的请求头；留空则接受任意请求头。',
    'Define expected parameters in the webhook request body. Leave empty to accept any JSON body.':
        '定义 Webhook 请求体中的期望参数；留空则接受任意 JSON 请求体。',
    'Runtime state during the execution of the workflow': '工作流执行期间的运行时状态。',
    'Persist the state in the same session': '在同一会话中持久化状态。',
    'Maximum number of messages to return': '要返回的最大消息数量。',
    'Maximum number of events to return': '要返回的最大事件数量。',
    'Maximum number of results to return': '要返回的最大结果数量。',
    'Maximum number of results to return (1-1000)': '要返回的最大结果数量（1-1000）。',
    'BCC email address(es), comma-separated': '密送邮箱地址，多个请用英文逗号分隔。',
    'CC email address(es), comma-separated': '抄送邮箱地址，多个请用英文逗号分隔。',
    'Description of what the tool does. This is for LLM to determine when to use this tool.':
        '描述该工具的用途，供 LLM 判断何时调用此工具。',
    'Return the output of the tool directly to the user': '将工具输出直接返回给用户。',
    'Enter AWS Access Key ID and Secret Access Key': '输入 AWS 访问密钥 ID 和 Secret Access Key，用于授权访问 AWS 服务。',
    'Enter Composio API key in the credential field': '在凭证字段中输入 Composio API key。',
    'No available actions, please check your API key and refresh': '没有可用动作，请检查 API key 后刷新。',
    'No DynamoDB tables found in this region': '当前区域没有找到 DynamoDB 表。',
    'Only when loading JSONL files': '仅在加载 JSONL 文件时使用。',
    'Only when loading PDF files': '仅在加载 PDF 文件时使用。',
    'How values should be represented in the output': '设置输出中的值展示方式。',
    'If all results should be returned or only up to a given limit': '设置是否返回全部结果，或仅返回指定数量以内的结果。',
    'Crawl relative links from HTML URL': '从 HTML URL 抓取相对链接。',
    'Select a go to wait until option': '选择页面跳转后的等待条件。',
    'Only content inside this selector will be extracted. Leave empty to use the entire page body.':
        '仅提取该选择器内的内容；留空则使用整个页面正文。',
    'Only needed when using Qdrant cloud hosted': '仅在使用 Qdrant 云托管服务时需要。',
    'Only needed when using Weaviate cloud hosted': '仅在使用 Weaviate 云托管服务时需要。',
    'Only needed if you have chroma on cloud services with X-Api-key': '仅在云服务中的 Chroma 需要 X-Api-key 时填写。',
    'Use SSL to connect to Postgres': '使用 SSL 连接 Postgres。',
    'Different option to connect to Postgres': '选择连接 Postgres 的方式。',
    'Distance metric for similarity search': '相似度检索使用的距离度量。',
    'Similarity measure used in Elasticsearch.': 'Elasticsearch 使用的相似度度量。',
    'Similarity measure used in Qdrant.': 'Qdrant 使用的相似度度量。',
    'Dimension used for storing vector embedding': '用于存储向量嵌入的维度。',
    'Path to load faiss.index file': '加载 faiss.index 文件的路径。',
    'Path to the client PEM file': '客户端 PEM 文件路径。',
    'Path to the client key file': '客户端 key 文件路径。',
    'Path to the root PEM file': '根 PEM 文件路径。',
    'Server name for the secure connection': '安全连接使用的服务器名称。',
    'Enable secure connection to Milvus server': '启用到 Milvus 服务的安全连接。',
    'Name of the field (column) that contains the actual content': '包含实际内容的字段（列）名称。',
    'Name of the field (column) that contains the Embedding': '包含 Embedding 的字段（列）名称。',
    'Name of the field (column) that contains the metadata of the document': '包含文档元数据的字段（列）名称。',
    'Name of the field (column) that contains the vector': '包含向量的字段（列）名称。',
    'Show the output result in the Prediction API response': '在 Prediction API 响应中显示输出结果。',
    'Function must return a value': '函数必须返回一个值。',
    'Use LLM to generate a description': '使用 LLM 生成描述。'
}

const translateNodeTooltipByPattern = (text) => {
    const normalized = normalizeTooltipText(text)
    const lower = normalized.toLowerCase()

    if (exactNodeTooltipFallbackMap[normalized]) return exactNodeTooltipFallbackMap[normalized]
    if (lower.includes('comma-separated') || lower.includes('comma separated')) return '请填写以英文逗号分隔的列表。'
    if (lower.includes('json schema')) return '请填写用于结构化数据的 JSON Schema。'
    if (lower.includes('json body')) return '请填写 JSON 格式的请求体。'
    if (lower.includes('json object')) return '请填写 JSON 对象格式的配置。'
    if (lower.includes('base url')) return '填写服务的 Base URL；留空时使用默认地址。'
    if (lower.includes('api key')) return '填写对应服务的 API key 或在凭证中配置。'
    if (lower.includes('credential')) return '选择或配置访问该服务所需的凭证。'
    if (lower.includes('oauth')) return '选择对应服务的 OAuth 凭证。'
    if (lower.includes('webhook')) return '配置 Webhook 请求、签名或回调相关参数。'
    if (lower.includes('signature')) return '配置请求签名校验相关参数。'
    if (lower.includes('callback')) return '配置流程完成后的回调地址或回调签名。'
    if (lower.includes('email')) return '填写邮箱相关参数；多个值通常可用英文逗号分隔。'
    if (lower.includes('calendar')) return '配置日历、事件或可用时间查询相关参数。'
    if (lower.includes('google drive')) return '配置 Google 云端硬盘文件、文件夹或共享盘相关参数。'
    if (lower.includes('google docs')) return '配置 Google 文档的创建、读取、更新或文本操作参数。'
    if (lower.includes('google spreadsheet') || lower.includes('google sheets')) return '配置 Google 表格范围、值或批量操作参数。'
    if (lower.includes('jira')) return '配置 Jira 工单、评论或用户相关操作参数。'
    if (lower.includes('microsoft teams')) return '配置 Microsoft Teams 团队、频道、聊天或消息相关参数。'
    if (lower.includes('microsoft outlook')) return '配置 Microsoft Outlook 邮件、日历或事件相关参数。'
    if (lower.includes('dynamodb')) return '配置 AWS DynamoDB 表、区域或键值存储参数。'
    if (lower.includes('aws')) return '配置 AWS 服务访问、区域或资源相关参数。'
    if (lower.includes('vectara')) return '配置 Vectara 检索、过滤、上传或摘要相关参数。'
    if (lower.includes('qdrant')) return '配置 Qdrant 集合、过滤、相似度或云托管连接参数。'
    if (lower.includes('milvus')) return '配置 Milvus 连接、安全证书或过滤查询参数。'
    if (lower.includes('weaviate')) return '配置 Weaviate 连接、集合或混合检索参数。'
    if (lower.includes('pinecone')) return '配置 Pinecone 索引、命名空间或元数据字段参数。'
    if (lower.includes('postgres')) return '配置 Postgres 连接、表、列或向量检索参数。'
    if (lower.includes('redis')) return '配置 Redis 连接、索引、字段或缓存参数。'
    if (lower.includes('mongodb')) return '配置 MongoDB Atlas 连接、集合或向量字段参数。'
    if (lower.includes('elasticsearch')) return '配置 Elasticsearch 索引、连接或相似度参数。'
    if (lower.includes('opensearch')) return '配置 OpenSearch 引擎、索引或相似度参数。'
    if (lower.includes('meilisearch')) return '配置 Meilisearch 实例、索引或混合搜索参数。'
    if (lower.includes('ollama')) return '配置 Ollama 模型推理参数。'
    if (lower.includes('reasoning')) return '配置模型推理能力、推理强度或推理摘要相关参数。'
    if (lower.includes('temperature')) return '配置模型输出随机性；数值越高，回答通常越发散。'
    if (lower.includes('top-k') || lower.includes('top k')) return '配置 Top-K 采样或返回结果数量。'
    if (lower.includes('top-p') || lower.includes('nucleus')) return '配置 nucleus / Top-P 采样参数。'
    if (lower.includes('token')) return '配置模型生成、上下文或推理过程使用的 Token 参数。'
    if (lower.includes('model')) return '配置模型名称、模型能力或模型调用参数。'
    if (lower.includes('prompt')) return '配置提示词、提示词变量或消息模板。'
    if (lower.includes('message')) return '配置消息内容、消息来源或消息返回方式。'
    if (lower.includes('conversation history')) return '配置提示词中包含哪些历史对话消息。'
    if (lower.includes('memory')) return '配置会话记忆、窗口大小或记忆存储方式。'
    if (lower.includes('document loader') || lower.includes('metadata keys')) return '配置文档加载器的元数据键；可按需忽略默认元数据字段。'
    if (lower.includes('metadata')) return '配置文档或检索结果的元数据字段、过滤条件或附加信息。'
    if (lower.includes('chunk')) return '配置文档切分、块大小、重叠或切分策略。'
    if (lower.includes('ocr') || lower.includes('partition')) return '配置文档解析、OCR 或分区策略。'
    if (lower.includes('selector')) return '配置页面选择器；留空时通常使用完整页面内容。'
    if (lower.includes('crawl') || lower.includes('scrape')) return '配置网页抓取、爬取范围、深度或等待策略。'
    if (lower.includes('search')) return '配置搜索查询、搜索范围、结果数量或过滤条件。'
    if (lower.includes('query')) return '配置查询内容、查询参数或检索过滤条件。'
    if (lower.includes('filter')) return '配置过滤条件，用于限制返回或检索的结果。'
    if (lower.includes('file')) return '配置文件上传、文件读取、文件路径或文件处理选项。'
    if (lower.includes('folder')) return '配置文件夹、目录或批量文件处理选项。'
    if (lower.includes('url') || lower.includes('link')) return '填写相关 URL / 链接地址或链接处理方式。'
    if (lower.includes('path')) return '填写文件路径、加载路径或接口路径。'
    if (lower.includes('header')) return '配置请求头或响应头相关参数。'
    if (lower.includes('body')) return '配置请求体、Body 参数或 Body 格式。'
    if (lower.includes('request')) return '配置请求参数、请求格式或请求处理方式。'
    if (lower.includes('response')) return '配置响应内容、响应格式或返回方式。'
    if (lower.includes('return')) return '配置该节点返回给下游或用户的内容。'
    if (lower.includes('select')) return '选择当前节点需要使用的选项或资源。'
    if (lower.includes('maximum number') || lower.includes('max number') || lower.includes('number of')) return '设置要处理或返回的数量。'
    if (lower.includes('whether')) return '设置是否启用当前选项。'
    if (lower.includes('enable')) return '启用或配置当前功能选项。'
    if (lower.includes('custom')) return '配置当前节点的自定义行为或自定义输入。'
    if (lower.includes('tool')) return '配置工具名称、工具说明、工具输入或工具返回方式。'
    if (lower.includes('agent')) return '配置 Agent 的输入、工具调用、审批或执行行为。'
    if (lower.includes('flow')) return '配置流程调用、流程输入或流程执行方式。'

    if (isEnglishHeavyCopy(normalized)) return '该参数用于配置当前节点的相关行为，请结合字段名称和节点上下文填写。'
    return text
}

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

export const translateNodeTooltip = (text, lang) => {
    if (!text || typeof text !== 'string') return text
    if (isZh(lang)) return nodeTooltipMap[text] || nodeDescriptionMap[text] || translateNodeTooltipByPattern(text)
    return text
}

export const translateNodeInputPlaceholder = (text, lang) => {
    if (!text) return text
    if (isZh(lang) && nodeInputPlaceholderMap[text]) return nodeInputPlaceholderMap[text]
    return text
}
