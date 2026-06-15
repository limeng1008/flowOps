const makeEdge = (source, sourceHandle, target, targetHandle) => ({
    source,
    sourceHandle,
    target,
    targetHandle,
    type: 'buttonedge',
    id: `${source}-${sourceHandle}-${target}-${targetHandle}`
})

const withNodeShell = ({ id, position, width = 300, height = 260, data }) => ({
    id,
    position,
    type: data.name === 'stickyNote' ? 'stickyNote' : 'customNode',
    data: {
        id,
        selected: false,
        outputs: {},
        ...data
    },
    width,
    height,
    selected: false,
    positionAbsolute: position,
    dragging: false
})

export const createFeishuHandoffChatflowTemplate = () => {
    const chatModelId = 'chatOpenAI_0'
    const memoryId = 'bufferMemory_0'
    const handoffId = 'humanHandoff_0'
    const agentId = 'toolAgent_0'
    const noteId = 'stickyNote_0'

    const chatModelOutput = `${chatModelId}-output-chatOpenAI-ChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable`
    const memoryOutput = `${memoryId}-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory`
    const handoffOutput = `${handoffId}-output-humanHandoff-HumanHandoff|Tool`
    const agentModelInput = `${agentId}-input-model-BaseChatModel`
    const agentMemoryInput = `${agentId}-input-memory-BaseChatMemory`
    const agentToolsInput = `${agentId}-input-tools-Tool`
    const agentPromptInput = `${agentId}-input-chatPromptTemplate-ChatPromptTemplate`
    const agentModerationInput = `${agentId}-input-inputModeration-Moderation`

    return {
        nodes: [
            withNodeShell({
                id: chatModelId,
                position: { x: 80, y: 90 },
                height: 520,
                data: {
                    label: 'ChatOpenAI',
                    version: 8.2,
                    name: 'chatOpenAI',
                    type: 'ChatOpenAI',
                    baseClasses: ['ChatOpenAI', 'BaseChatModel', 'BaseLanguageModel', 'Runnable'],
                    category: 'Chat Models',
                    description: 'Wrapper around OpenAI large language models that use the Chat endpoint',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['openAIApi'],
                            id: `${chatModelId}-input-credential-credential`,
                            display: true
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'asyncOptions',
                            loadMethod: 'listModels',
                            default: 'gpt-4o-mini',
                            id: `${chatModelId}-input-modelName-asyncOptions`,
                            display: true
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            step: 0.1,
                            default: 0.2,
                            optional: true,
                            id: `${chatModelId}-input-temperature-number`,
                            display: true
                        },
                        {
                            label: 'Streaming',
                            name: 'streaming',
                            type: 'boolean',
                            default: true,
                            optional: true,
                            additionalParams: true,
                            id: `${chatModelId}-input-streaming-boolean`,
                            display: true
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        modelName: 'gpt-4o-mini',
                        temperature: 0.2,
                        streaming: true
                    },
                    outputAnchors: [
                        {
                            id: chatModelOutput,
                            name: 'chatOpenAI',
                            label: 'ChatOpenAI',
                            type: 'ChatOpenAI | BaseChatModel | BaseLanguageModel | Runnable'
                        }
                    ]
                }
            }),
            withNodeShell({
                id: memoryId,
                position: { x: 80, y: 650 },
                height: 260,
                data: {
                    label: 'Buffer Memory',
                    version: 2,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Retrieve chat messages stored in database',
                    inputParams: [
                        {
                            label: 'Session Id',
                            name: 'sessionId',
                            type: 'string',
                            default: '',
                            optional: true,
                            additionalParams: true,
                            id: `${memoryId}-input-sessionId-string`
                        },
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            additionalParams: true,
                            id: `${memoryId}-input-memoryKey-string`
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        sessionId: '',
                        memoryKey: 'chat_history'
                    },
                    outputAnchors: [
                        {
                            id: memoryOutput,
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ]
                }
            }),
            withNodeShell({
                id: handoffId,
                position: { x: 480, y: 120 },
                height: 360,
                data: {
                    label: '转接人工坐席（企业微信/飞书）',
                    version: 1,
                    name: 'humanHandoff',
                    type: 'HumanHandoff',
                    baseClasses: ['HumanHandoff', 'Tool'],
                    category: 'Tools',
                    description: '转人工时把会话历史推送到企业微信/飞书群机器人，由人工坐席接手',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['imBotWebhook'],
                            id: `${handoffId}-input-credential-credential`
                        },
                        {
                            label: '平台',
                            name: 'platform',
                            type: 'options',
                            options: [
                                { label: '企业微信', name: 'wecom' },
                                { label: '飞书', name: 'feishu' }
                            ],
                            default: 'feishu',
                            id: `${handoffId}-input-platform-options`
                        },
                        {
                            label: '消息标题',
                            name: 'sessionLabel',
                            type: 'string',
                            default: 'AI 客服飞书转人工',
                            optional: true,
                            id: `${handoffId}-input-sessionLabel-string`
                        },
                        {
                            label: '工具名称',
                            name: 'toolName',
                            type: 'string',
                            default: 'human_handoff',
                            optional: true,
                            additionalParams: true,
                            id: `${handoffId}-input-toolName-string`
                        },
                        {
                            label: '工具描述（触发时机）',
                            name: 'toolDescription',
                            type: 'string',
                            rows: 3,
                            optional: true,
                            additionalParams: true,
                            id: `${handoffId}-input-toolDescription-string`
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        platform: 'feishu',
                        sessionLabel: 'AI 客服飞书转人工',
                        toolName: 'human_handoff',
                        toolDescription:
                            '当用户明确要求人工、知识库未覆盖、情绪升级，或遇到订单/支付/物流/售后投诉时，调用本工具把完整对话历史转接到飞书坐席群。'
                    },
                    outputAnchors: [
                        {
                            id: handoffOutput,
                            name: 'humanHandoff',
                            label: 'HumanHandoff',
                            type: 'HumanHandoff | Tool'
                        }
                    ]
                }
            }),
            withNodeShell({
                id: agentId,
                position: { x: 880, y: 220 },
                height: 460,
                data: {
                    label: 'Tool Agent',
                    version: 2,
                    name: 'toolAgent',
                    type: 'AgentExecutor',
                    baseClasses: ['AgentExecutor', 'BaseChain', 'Runnable'],
                    category: 'Agents',
                    description: 'Agent that uses Function Calling to pick the tools and args to call',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessage',
                            type: 'string',
                            default: 'You are a helpful AI assistant.',
                            description: 'If Chat Prompt Template is provided, this will be ignored',
                            rows: 4,
                            optional: true,
                            additionalParams: true,
                            id: `${agentId}-input-systemMessage-string`,
                            display: true
                        },
                        {
                            label: 'Max Iterations',
                            name: 'maxIterations',
                            type: 'number',
                            optional: true,
                            additionalParams: true,
                            id: `${agentId}-input-maxIterations-number`,
                            display: true
                        },
                        {
                            label: 'Enable Detailed Streaming',
                            name: 'enableDetailedStreaming',
                            type: 'boolean',
                            default: false,
                            description: 'Stream detailed intermediate steps during agent execution',
                            optional: true,
                            additionalParams: true,
                            id: `${agentId}-input-enableDetailedStreaming-boolean`,
                            display: true
                        }
                    ],
                    inputAnchors: [
                        { label: 'Tools', name: 'tools', type: 'Tool', list: true, id: agentToolsInput, display: true },
                        { label: 'Memory', name: 'memory', type: 'BaseChatMemory', id: agentMemoryInput, display: true },
                        {
                            label: 'Tool Calling Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            description:
                                'Only compatible with models that are capable of function calling: ChatOpenAI, ChatMistral, ChatAnthropic, ChatGoogleGenerativeAI, ChatVertexAI, GroqChat',
                            id: agentModelInput,
                            display: true
                        },
                        {
                            label: 'Chat Prompt Template',
                            name: 'chatPromptTemplate',
                            type: 'ChatPromptTemplate',
                            description: 'Override existing prompt with Chat Prompt Template. Human Message must includes {input} variable',
                            optional: true,
                            id: agentPromptInput,
                            display: true
                        },
                        {
                            label: 'Input Moderation',
                            description:
                                'Detect text that could generate harmful output and prevent it from being sent to the language model',
                            name: 'inputModeration',
                            type: 'Moderation',
                            optional: true,
                            list: true,
                            id: agentModerationInput,
                            display: true
                        }
                    ],
                    inputs: {
                        tools: [`{{${handoffId}.data.instance}}`],
                        memory: `{{${memoryId}.data.instance}}`,
                        model: `{{${chatModelId}.data.instance}}`,
                        chatPromptTemplate: '',
                        systemMessage:
                            '你是企业客服助手。优先直接回答用户问题；当用户要求人工、问题超出知识范围、情绪升级或涉及订单/支付/物流/售后投诉时，调用 human_handoff 转接到飞书坐席群，并简短告知用户已转接。',
                        inputModeration: '',
                        maxIterations: '',
                        enableDetailedStreaming: ''
                    },
                    outputAnchors: [
                        {
                            id: `${agentId}-output-toolAgent-AgentExecutor|BaseChain|Runnable`,
                            name: 'toolAgent',
                            label: 'AgentExecutor',
                            type: 'AgentExecutor | BaseChain | Runnable'
                        }
                    ]
                }
            }),
            withNodeShell({
                id: noteId,
                position: { x: 480, y: 540 },
                height: 120,
                data: {
                    label: 'Sticky Note',
                    version: 2,
                    name: 'stickyNote',
                    type: 'StickyNote',
                    baseClasses: ['StickyNote'],
                    tags: ['Utilities'],
                    category: 'Utilities',
                    description: 'Add a sticky note',
                    inputParams: [
                        {
                            label: '',
                            name: 'note',
                            type: 'string',
                            rows: 1,
                            placeholder: 'Type something here',
                            optional: true,
                            id: `${noteId}-input-note-string`
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        note: '导入后配置 2 处：① ChatOpenAI 节点选择模型凭证；② 转接人工坐席节点选择飞书群机器人 Webhook 凭证，如启用飞书签名请在凭证里填写 secret。用户要求人工、知识库未覆盖或订单/支付/售后投诉时，智能体会带完整对话历史转接飞书。'
                    },
                    outputAnchors: [
                        {
                            id: `${noteId}-output-stickyNote-StickyNote`,
                            name: 'stickyNote',
                            label: 'StickyNote',
                            type: 'StickyNote'
                        }
                    ]
                }
            })
        ],
        edges: [
            makeEdge(handoffId, handoffOutput, agentId, agentToolsInput),
            makeEdge(chatModelId, chatModelOutput, agentId, agentModelInput),
            makeEdge(memoryId, memoryOutput, agentId, agentMemoryInput)
        ]
    }
}

export const createFeishuHandoffTemplateFlowData = () => JSON.stringify(createFeishuHandoffChatflowTemplate())
