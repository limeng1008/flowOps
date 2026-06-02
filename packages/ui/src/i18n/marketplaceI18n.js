// ==============================|| MARKETPLACE TEMPLATE i18n DICTIONARY ||============================== //
// Translates marketplace template name, description, and usecase labels that come from the server
// (packages/server/marketplaces/{agentflowsv2,agentflows,chatflows,tools}/*.json)
// WITHOUT modifying template JSON — preserves upstream Flowise merge compatibility.
//
// Brand / class / acronym names (RAG, AgentflowV2, HuggingFace, OpenAI, Slack, Discord, Github, SQL,
// Zod, FAISS, Mistral, Replicate, Hubspot, Airtable, ChatGPT, Llama, ReAct, Ollama, LocalAI, Perplexity AI,
// SendGrid, Spider, Webhook, etc.) stay English.

const templateNameMap = {
    // ---------- AgentflowsV2 (13) ----------
    'Agentic RAG': 'Agentic RAG',
    'Agents Handoff': '智能体交接',
    'Deep Research With Multi-turn Conversations': '多轮对话深度研究',
    'Deep Research With Subagents': '子智能体深度研究',
    'Human In The Loop': '人在回路（HITL）',
    'Interacting With API': '与 API 交互',
    Iterations: '迭代',
    'PPT Deck Agent': 'PPT 智能体',
    'SQL Agent': 'SQL 智能体',
    'Simple RAG': '基础 RAG',
    'Structured Output': '结构化输出',
    'Supervisor Worker': '主管 + 工作者',
    Translator: '翻译器',
    'Workplace Chat': 'Workplace 对话',

    // ---------- Agentflows v1 (additional) ----------
    'Branch Out Merge In': '分支 + 合并',
    'Customer Support Team Agents': '客服团队智能体',
    'Essay Writing & Grading': '作文撰写与评分',
    'Human In Loop RAG': '人在回路 RAG',
    'Lead Outreach': '潜在客户外联',
    'Multi Agents': '多智能体',
    'Patient Concierge': '患者接待',
    'Plan and Execute': '规划与执行',
    'Portfolio Management Team': '投资组合管理团队',
    'Prompt Engineering Team': '提示词工程团队',
    'Software Team': '软件团队',
    'Support Routing System': '客服路由系统',
    'Text to SQL': '文本转 SQL',

    // ---------- Chatflows (24) ----------
    'Advanced Structured Output Parser': '高级结构化输出解析器',
    'CSV Agent': 'CSV 智能体',
    'Context Chat Engine': '上下文对话引擎',
    'Conversation Chain': '对话链',
    'Conversational Agent': '对话智能体',
    'Conversational Retrieval QA Chain': '对话检索 QA 链',
    'Github Docs QnA': 'Github 文档问答',
    'HuggingFace LLM Chain': 'HuggingFace LLM 链',
    'Image Generation': '图片生成',
    'Input Moderation': '输入审核',
    'LLM Chain': 'LLM 链',
    'List Output Parser': '列表输出解析器',
    'Local QnA': '本地问答',
    'Multiple Documents QnA': '多文档问答',
    'OpenAI Assistant': 'OpenAI 助手',
    'OpenAPI YAML Agent': 'OpenAPI YAML 智能体',
    'Prompt Chaining': '提示词链式调用',
    'Query Engine': '查询引擎',
    'ReAct Agent': 'ReAct 智能体',
    'Replicate LLM': 'Replicate LLM',
    'SQL DB Chain': 'SQL 数据库链',
    'Simple Chat Engine': '简单对话引擎',
    'SubQuestion Query Engine': '子问题查询引擎',
    'Tool Agent': '工具智能体',

    // ---------- Tools (13) ----------
    'Add Hubspot Contact': '添加 Hubspot 联系人',
    'Create Airtable Record': '创建 Airtable 记录',
    'Get Current DateTime': '获取当前日期时间',
    'Get Stock Mover': '获取股票涨跌榜',
    'Make Webhook': '触发 Make Webhook',
    'Perplexity AI Search': 'Perplexity AI 搜索',
    'Print or Export Text Document': '打印或导出文本文档',
    'Send Discord Message': '发送 Discord 消息',
    'Send Slack Message': '发送 Slack 消息',
    'Send Teams Message': '发送 Teams 消息',
    'SendGrid Email': 'SendGrid 邮件',
    'Spider Web Scraper': 'Spider 网页抓取',
    'Spider Web Search & Scrape': 'Spider 网页搜索抓取'
}

const templateDescriptionMap = {
    // ---------- AgentflowsV2 ----------
    'An agent based approach using AgentflowV2 to perform self-correcting question answering over documents':
        '基于 AgentflowV2 的智能体方案，对文档进行自我纠错式问答',
    'A customer support agent that can handoff tasks to different agents based on scenarios':
        '可根据场景将任务交接给不同智能体的客服 Agent',
    'Deep research system that conducts multi-turn agent conversations to perform web search, synthesize insights and generate well-structured white papers':
        '通过多轮 Agent 对话进行网页搜索、提炼洞察并生成结构化白皮书的深度研究系统',
    'Multi-agent system that breaks down complex queries, assigns tasks to subagents, and synthesizes findings into detailed reports.':
        '将复杂查询拆解为子任务、分发给子智能体并汇总成详细报告的多智能体系统。',
    'An email reply HITL (human in the loop) agent that can proceed or refine the email with user input':
        '邮件回复的人在回路（HITL）智能体，可根据用户输入继续或优化邮件',
    'Different ways of agents that can interact with APIs': '展示智能体与 API 交互的多种方式',
    'An agent that can iterate over a list of items and perform actions on each item': '可遍历列表并对每项执行动作的智能体',
    'Generate a structured presentation deck plan with slide content, speaker notes, and visual direction':
        '生成结构化 PPT 方案，包括每页内容、演讲备注和视觉方向',
    'An agent that can perform question answering over a database': '可对数据库执行问答的智能体',
    'A basic RAG agent that can retrieve documents from document store and answer questions': '从文档库检索并回答问题的基础 RAG 智能体',
    'Return structured output from LLM': '从 LLM 返回结构化输出',
    'A hierarchical supervisor agent that plan the steps, and delegate tasks to worker agents based on user query':
        '由主管智能体规划步骤、根据用户查询将任务委派给工作者智能体的分层系统',
    'Translate text from one language to another': '将文本从一种语言翻译为另一种语言',
    'An agent that can post AI responses to Workplace channels like Slack and Teams':
        '可将 AI 响应推送到 Slack、Teams 等 Workplace 频道的智能体',

    // ---------- Agentflows v1 ----------
    'A self-improving RAG that check for relevance of a document to a user question': '检查文档与用户问题相关性的自改进 RAG',
    'Example of branching out into different agents, and merge the final responses back into one':
        '示例：分支到多个智能体并将最终响应合并为一个',
    'Customer support team consisting of Support Representative and Quality Assurance Specialist to handle support tickets':
        '由客服代表与质量保证专员组成的客服团队，处理客服工单',
    'One agent that writes essay, and another agent that grades the essay. Then loop back to first agent until the condition is met':
        '一个智能体撰写作文，另一个评分，循环直到满足条件',
    'Manually approve an action before executing tools': '执行工具前需手动审批动作',
    'Research leads and create personalized email drafts for sales team': '调研潜在客户并为销售团队生成个性化邮件草稿',
    'Multi agents with supervisor and agents, constructed using Sequential Agents nodes':
        '使用 Sequential Agents 节点构建的多智能体系统（含主管与下属智能体）',
    "Patient concierge system that always verify the user's identity first before proceeding to answer user questions":
        '先校验用户身份再回答问题的患者接待系统',
    'Generate multi-step plans, go through each plan, finish the task, revisit the plan and update accordingly':
        '生成多步骤计划，依次执行、完成任务并按需更新计划',
    'A team of portfolio manager, financial analyst, and risk manager working together to optimize an investment portfolio.':
        '由投资组合经理、金融分析师与风险经理协作优化投资组合的团队。',
    'Prompt engineering team working together to craft Worker Prompts for your AgentFlow.':
        '协作撰写 AgentFlow Worker Prompt 的提示词工程团队。',
    'Software engineering team working together to build a feature, solve a problem, or complete a task.':
        '协作开发功能、解决问题或完成任务的软件工程团队。',
    'An agent that can route a user to the billing or technical support team, or respond conversationally':
        '可将用户路由到账单 / 技术支持团队，或以对话方式回应的智能体',
    'Text to SQL query process using team of 3 agents: SQL Expert, SQL Reviewer, and SQL Executor':
        '由 SQL 专家、SQL 审核与 SQL 执行 3 个智能体协作的文本转 SQL 流程',

    // ---------- Chatflows ----------
    'Return response as a JSON structure as specified by a Zod schema': '按 Zod schema 指定的 JSON 结构返回响应',
    'Analyse and summarize CSV data': '分析并汇总 CSV 数据',
    'Answer question based on retrieved documents (context) while remembering previous conversations':
        '基于检索到的文档（上下文）回答问题，同时记忆历史对话',
    'Basic example of Conversation Chain with built-in memory - works exactly like ChatGPT': '内置记忆的对话链基础示例 — 体验如 ChatGPT',
    'A conversational agent designed to use tools and chat model to provide responses': '使用工具 + 对话模型生成响应的对话智能体',
    'Documents QnA using Retrieval Augmented Generation (RAG) with Mistral and FAISS for similarity search':
        '使用 Mistral 与 FAISS 做相似度检索的 RAG 文档问答',
    'Github Docs QnA using Retrieval Augmented Generation (RAG)': '使用 RAG 的 Github 文档问答',
    'Simple LLM Chain using HuggingFace Inference API on falcon-7b-instruct model':
        '基于 HuggingFace Inference API 与 falcon-7b-instruct 模型的简单 LLM 链',
    'Generate image using Replicate Stability text-to-image generative AI model': '使用 Replicate Stability 文本生图模型生成图片',
    'Detect text that could generate harmful output and prevent it from being sent to the language model':
        '检测可能产生有害输出的文本，阻止发送到语言模型',
    'Basic example of stateless (no memory) LLM Chain with a Prompt Template and LLM Model':
        '使用 Prompt Template 与 LLM Model 的无状态（无记忆）LLM 链基础示例',
    'Return response as a list (array) instead of a string/text': '以列表（数组）形式返回响应，而非字符串/文本',
    'QnA chain using Ollama local LLM, LocalAI embedding model, and Faiss local vector store':
        '使用 Ollama 本地 LLM、LocalAI 嵌入模型与本地 Faiss 向量库的问答链',
    'Tool agent that can retrieve answers from multiple sources using relevant Retriever Tools':
        '使用相关 Retriever Tools 从多个数据源获取答案的工具智能体',
    'OpenAI Assistant that has instructions and can leverage models, tools, and knowledge to respond to user queries':
        '配置指令并可调用模型、工具和知识库响应用户的 OpenAI Assistant',
    'Given an OpenAPI YAML file, agent automatically decide which API to call, generating url and body request from conversation':
        '给定 OpenAPI YAML，智能体根据对话自动选择 API 并生成 URL / 请求体',
    'Use output from a chain as prompt for another chain, similar to chain of thought':
        '将一个链的输出作为另一个链的提示词，类似链式思考（CoT）',
    'Stateless query engine designed to answer question over your data using LlamaIndex':
        '使用 LlamaIndex 对你的数据进行问答的无状态查询引擎',
    'An agent that uses ReAct (Reason + Act) logic to decide what action to take': '基于 ReAct（Reason + Act）逻辑决定下一步动作的智能体',
    'Use Replicate API that runs Llama 13b v2 model with LLMChain': '使用 Replicate API 调用 Llama 13b v2 模型的 LLMChain',
    'Answer questions over a SQL database': '基于 SQL 数据库回答问题',
    'Simple chat engine to handle back and forth conversations using LlamaIndex': '使用 LlamaIndex 处理多轮对话的简单对话引擎',
    'Breaks down query into sub questions for each relevant data source, then combine into final response':
        '将查询拆解为针对每个数据源的子问题，再合并为最终响应',
    'An agent designed to use tools and LLM with function calling capability to provide responses':
        '使用工具与具备 function calling 能力的 LLM 来生成响应的智能体',

    // ---------- Tools ----------
    'Add new contact to Hubspot': '向 Hubspot 新增联系人',
    'Add column1, column2 to Airtable': '向 Airtable 添加 column1、column2',
    'Useful to get todays day, date and time.': '用于获取今天的日期与时间。',
    'Get the stocks that has biggest price/volume moves, e.g. actives, gainers, losers, etc.':
        '获取价格 / 成交量变动最大的股票（如活跃、涨幅、跌幅榜等）',
    'Useful when you need to send message to Discord': '需要向 Discord 发送消息时使用',
    'Useful when conducting research using Perplexity AI online model.': '使用 Perplexity AI 在线模型做调研时使用。',
    'Send message to Discord channel': '向 Discord 频道发送消息',
    'Send message to Slack channel': '向 Slack 频道发送消息',
    'Send message to Teams channel': '向 Teams 频道发送消息',
    'Send email using SendGrid': '使用 SendGrid 发送邮件'
}

const usecaseMap = {
    Agent: '智能体',
    Basic: '基础',
    Chatbot: '聊天机器人',
    'Customer Support': '客户支持',
    'Deep Research': '深度研究',
    'Documents QnA': '文档问答',
    Engineering: '工程',
    Extraction: '信息抽取',
    'Finance & Accounting': '财务与会计',
    'Hierarchical Agent Teams': '分层智能体团队',
    'Human In Loop': '人在回路',
    'Image Generation': '图像生成',
    'Interacting with API': 'API 交互',
    Leads: '潜在客户',
    Presentation: '演示文稿',
    'Reflective Agent': '反思型智能体',
    SQL: 'SQL',
    'Working with tables': '表格处理'
}

const isZh = (lang) => !!lang && (lang === 'zh' || lang.startsWith('zh-'))

export const translateTemplateName = (text, lang) => {
    if (!text) return text
    if (isZh(lang) && templateNameMap[text]) return templateNameMap[text]
    return text
}

export const translateTemplateDescription = (text, lang) => {
    if (!text) return text
    if (isZh(lang) && templateDescriptionMap[text]) return templateDescriptionMap[text]
    return text
}

export const translateMarketplaceUsecase = (text, lang) => {
    if (!text) return text
    if (isZh(lang) && usecaseMap[text]) return usecaseMap[text]
    return text
}
