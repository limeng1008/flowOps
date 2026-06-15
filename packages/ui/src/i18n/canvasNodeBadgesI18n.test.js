const fs = require('fs')
const path = require('path')

const collectFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) return collectFiles(fullPath)
        return entry.isFile() && entry.name.endsWith('.ts') ? [fullPath] : []
    })
}

const collectNodeDescriptions = () => {
    const nodesDir = path.join(__dirname, '../../../components/nodes')
    return collectFiles(nodesDir).flatMap((file) => {
        const source = fs.readFileSync(file, 'utf8')
        const label = source
            .match(/this\.label\s*=\s*([`'"])([\s\S]*?)\1/)?.[2]
            ?.replace(/\s+/g, ' ')
            .trim()
        const matches = [...source.matchAll(/this\.description\s*=\s*([`'"])([\s\S]*?)\1/g)]
        return matches
            .map((match) => {
                const literal = `${match[1]}${match[2]}${match[1]}`
                let text = match[2]
                try {
                    text = Function(`return ${literal}`)()
                } catch {
                    text = match[2]
                }
                return {
                    file: path.relative(path.join(__dirname, '../../..'), file),
                    label,
                    text: text.replace(/\s+/g, ' ').trim()
                }
            })
            .filter((item) => item.text && !item.text.includes('${'))
    })
}

const collectNodeParameterDescriptions = () => {
    const nodesDir = path.join(__dirname, '../../../components/nodes')
    return collectFiles(nodesDir)
        .filter((file) => !file.endsWith('.test.ts'))
        .flatMap((file) => {
            const source = fs.readFileSync(file, 'utf8')
            const label = source
                .match(/this\.label\s*=\s*([`'"])([\s\S]*?)\1/)?.[2]
                ?.replace(/\s+/g, ' ')
                .trim()
            const matches = [...source.matchAll(/description\s*:\s*([`'"])([\s\S]*?)\1/g)]
            return matches
                .map((match) => {
                    const literal = `${match[1]}${match[2]}${match[1]}`
                    let text = match[2]
                    try {
                        text = Function(`return ${literal}`)()
                    } catch {
                        text = match[2]
                    }
                    return {
                        file: path.relative(path.join(__dirname, '../../..'), file),
                        label,
                        text: text.replace(/\s+/g, ' ').trim()
                    }
                })
                .filter((item) => item.text && !item.text.includes('${'))
        })
}

const isEnglishHeavyDescription = (text) => {
    const latinWords = text.match(/[A-Za-z][A-Za-z'-]{2,}/g) || []
    const cjkChars = text.match(/[\u3400-\u9fff]/g) || []
    return latinWords.length >= 4 && cjkChars.length < 8
}

describe('canvas node badge i18n coverage', () => {
    it('uses domestic-friendly copy for OpenAI-compatible embedding nodes', async () => {
        const { translateNodeLabel } = await import('./nodeI18n.js')

        expect(translateNodeLabel('OpenAI Custom Embedding', 'zh')).toBe('OpenAI 兼容向量模型')
        expect(translateNodeLabel('OpenAI Custom Embedding', 'en')).toBe('OpenAI Custom Embedding')
    })

    it('translates Zhipu GLM node copy for domestic users', async () => {
        const { translateNodeDescription } = await import('./nodeI18n.js')

        expect(translateNodeDescription('Wrapper around Zhipu GLM large language models that use the Chat endpoint', 'zh')).toBe(
            '使用 Chat 端点的智谱 GLM 大语言模型封装'
        )
        expect(translateNodeDescription('Wrapper around Zhipu GLM large language models that use the Chat endpoint', 'en')).toBe(
            'Wrapper around Zhipu GLM large language models that use the Chat endpoint'
        )
    })

    it('translates Google Docs node description in the add-node list', async () => {
        const { translateNodeDescription } = await import('./nodeI18n.js')
        const description =
            'Perform Google Docs operations such as creating, reading, updating, and deleting documents, as well as text manipulation'

        expect(translateNodeDescription(description, 'zh')).toBe('执行 Google 文档操作：创建、读取、更新、删除文档，以及文本处理。')
        expect(translateNodeDescription(description, 'en')).toBe(description)
    })

    it('translates Sequential Thinking MCP copy in the add-node list', async () => {
        const { translateNodeDescription, translateNodeLabel } = await import('./nodeI18n.js')
        const description =
            'MCP server that provides a tool for dynamic and reflective problem-solving through a structured thinking process'

        expect(translateNodeLabel('Sequential Thinking MCP', 'zh')).toBe('顺序思考 MCP')
        expect(translateNodeLabel('Sequential Thinking MCP', 'en')).toBe('Sequential Thinking MCP')
        expect(translateNodeDescription(description, 'zh')).toBe('提供结构化思考流程的 MCP 服务，用于动态、反思式地解决问题。')
        expect(translateNodeDescription(description, 'en')).toBe(description)
    })

    it('translates every English add-node description globally', async () => {
        const { translateNodeDescription } = await import('./nodeI18n.js')
        const missing = collectNodeDescriptions()
            .filter(({ text }) => isEnglishHeavyDescription(text))
            .filter(({ text }) => {
                const translated = translateNodeDescription(text, 'zh')
                return translated === text || isEnglishHeavyDescription(translated)
            })
            .map(({ label, file, text }) => `${label || '(unknown)'} | ${file} | ${text}`)

        expect(missing).toEqual([])
    })

    it('translates every English node parameter description globally', async () => {
        const { translateNodeTooltip } = await import('./nodeI18n.js')
        const missing = collectNodeParameterDescriptions()
            .filter(({ text }) => isEnglishHeavyDescription(text))
            .filter(({ text }) => {
                const translated = translateNodeTooltip(text, 'zh')
                return translated === text || isEnglishHeavyDescription(translated)
            })
            .map(({ label, file, text }) => `${label || '(unknown)'} | ${file} | ${text}`)

        expect(missing).toEqual([])
    })

    it('translates canvas node titles and node info titles', () => {
        const canvasSource = fs.readFileSync(path.join(__dirname, '../views/canvas/CanvasNode.jsx'), 'utf8')
        const infoSource = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/NodeInfoDialog.jsx'), 'utf8')

        expect(canvasSource).toContain('translateNodeLabel(data.label, currentLang)')
        expect(infoSource).toContain('translateNodeLabel(dialogProps.data.label, currentLang)')
    })

    it('translates the DEPRECATING badge through node i18n', async () => {
        const { translateNodeCategory } = await import('./nodeI18n.js')

        expect(translateNodeCategory('DEPRECATING', 'zh')).toBe('即将弃用')
        expect(translateNodeCategory('DEPRECATING', 'en')).toBe('DEPRECATING')
    })

    it('translates node input tooltip descriptions globally', async () => {
        const { translateNodeLabel, translateNodeTooltip } = await import('./nodeI18n.js')
        const tooltip = 'Override existing prompt with Chat Prompt Template. Human Message must includes {input} variable'

        const sessionTooltip =
            'If not specified, a random id will be used. Learn <a target="_blank" href="https://docs.flowiseai.com/memory/long-term-memory#ui-and-embedded-chat">more</a>'

        expect(translateNodeLabel('Session Id', 'zh')).toBe('会话 ID')
        expect(translateNodeLabel('Session ID', 'zh')).toBe('会话 ID')
        expect(translateNodeTooltip(sessionTooltip, 'zh')).toBe(
            '不填写时将使用随机会话 ID。<a target="_blank" href="https://docs.flowiseai.com/memory/long-term-memory#ui-and-embedded-chat">了解更多</a>'
        )
        expect(translateNodeTooltip(tooltip, 'zh')).toBe(
            '使用 Chat Prompt Template 覆盖默认提示词；其中 Human Message 必须包含 {input} 变量。'
        )
        expect(
            translateNodeTooltip(
                'If not specified, a random id will be used. Learn <a target="_blank" href="https://docs.flowiseai.com/memory#ui-and-embedded-chat">more</a>',
                'zh'
            )
        ).toBe('不填写时将使用随机会话 ID。<a target="_blank" href="https://docs.flowiseai.com/memory#ui-and-embedded-chat">了解更多</a>')
        expect(translateNodeTooltip('The aws region in which table is located', 'zh')).toBe('表所在的 AWS 区域。')
        expect(translateNodeTooltip('List of stop words to use when generating. Use comma to separate multiple stop words.', 'zh')).toBe(
            '生成时使用的停止词列表。多个停止词请用英文逗号分隔。'
        )
        expect(translateNodeTooltip('Seconds till a session expires. If not specified, the session will never expire.', 'zh')).toBe(
            '会话过期时间，单位为秒。不填写时会话永不过期。'
        )
        expect(translateNodeTooltip('Configure password authentication on your upstash redis instance', 'zh')).toBe(
            '配置 Upstash Redis 实例的密码认证。'
        )
        expect(translateNodeTooltip('Zep Memory Type, can be perpetual or message_window', 'zh')).toBe(
            'Zep 记忆类型，可选择永久记忆 perpetual 或消息窗口 message_window。'
        )
        expect(
            translateNodeTooltip('Temperature parameter may not apply to certain model. Please check available model parameters', 'zh')
        ).toBe('随机性参数不一定适用于所有模型，请以模型支持的参数为准。')
        expect(
            translateNodeTooltip(
                'Force the global cross-region inference profile instead of the region-specific one. Bedrock routes dynamically across regions for maximum availability.',
                'zh'
            )
        ).toBe('强制使用全局跨区域推理配置，而不是当前区域专属配置。Bedrock 会在多个区域间动态路由，以提高可用性。')
        expect(translateNodeLabel('Temperature', 'zh')).toBe('随机性')
        expect(translateNodeLabel('Max Tokens to Sample', 'zh')).toBe('最大生成 Token 数')
        expect(translateNodeLabel('Latency Optimized', 'zh')).toBe('低延迟优化')
        expect(translateNodeLabel('Use Global Inference Endpoint', 'zh')).toBe('使用全局推理端点')
        expect(translateNodeLabel('Cohere Input Type', 'zh')).toBe('Cohere 输入类型')
        expect(translateNodeLabel('Max AWS API retries', 'zh')).toBe('AWS API 最大重试次数')
        expect(translateNodeLabel('Tool', 'zh')).toBe('工具')
        expect(translateNodeLabel('Top Probability', 'zh')).toBe('最高概率')
        expect(translateNodeLabel('Thinking', 'zh')).toBe('深度思考')
        expect(
            translateNodeTooltip(
                'Enable deep thinking mode for complex reasoning tasks. When enabled, the model will use extended thinking before responding.',
                'zh'
            )
        ).toBe('启用深度思考模式，用于复杂推理任务。开启后，模型会在回复前进行扩展思考。')
        expect(
            translateNodeTooltip(
                'Custom endpoint host to use for the model. Provide the hostname without scheme. If provided, will override the default endpoint host.',
                'zh'
            )
        ).toBe('模型使用的自定义端点 Host。只填写主机名，不需要带 http/https；填写后会覆盖默认端点。')
        expect(
            translateNodeTooltip(
                'Specifies the type of input passed to the model. Required for cohere embedding models v3 and higher. <a target="_blank" href="https://docs.cohere.com/reference/embed">Official Docs</a>',
                'zh'
            )
        ).toBe(
            '指定传给模型的输入类型。Cohere embedding v3 及以上模型必填。<a target="_blank" href="https://docs.cohere.com/reference/embed">官方文档</a>'
        )
        expect(
            translateNodeTooltip('Documents batch size to send to AWS API for Titan model embeddings. Used to avoid throttling.', 'zh')
        ).toBe('发送到 AWS API 的 Titan 向量模型文档批大小，用于降低触发限流的概率。')
        expect(translateNodeTooltip('Add an input message as user message at the end of the conversation', 'zh')).toBe(
            '在对话末尾追加一条用户消息作为输入消息。'
        )
        expect(
            translateNodeTooltip(
                'Give your agent context about different document sources. Document stores must be upserted in advance.',
                'zh'
            )
        ).toBe('为智能体提供不同文档来源作为上下文。文档库需要提前完成入库。')
        expect(
            translateNodeTooltip(
                'Give your agent context about different document sources from existing vector stores and embeddings',
                'zh'
            )
        ).toBe('从现有向量库和嵌入中为智能体提供不同文档来源作为上下文。')
        expect(
            translateNodeTooltip('Document stores to retrieve information from. Document stores must be upserted in advance.', 'zh')
        ).toBe('用于检索信息的文档库。文档库需要提前完成入库。')
        expect(
            translateNodeTooltip(
                'This will limit the number of AWS API for Titan model embeddings call retries. Used to avoid throttling.',
                'zh'
            )
        ).toBe('限制 Titan 向量模型调用 AWS API 的重试次数，用于降低触发限流的概率。')
        expect(translateNodeTooltip(tooltip, 'en')).toBe(tooltip)
    })

    it('translates Start node schedule and webhook trigger copy', async () => {
        const { translateNodeLabel, translateNodeTooltip } = await import('./nodeI18n.js')

        expect(translateNodeLabel('Webhook Trigger', 'zh')).toBe('Webhook 触发器')
        expect(translateNodeLabel('Schedule Input', 'zh')).toBe('定时触发')
        expect(translateNodeLabel('Full Webhook Payload', 'zh')).toBe('完整 Webhook Payload')
        expect(translateNodeTooltip('Trigger the workflow via an external webhook', 'zh')).toBe('通过外部 Webhook 请求触发工作流。')
        expect(translateNodeTooltip('Start the workflow on a recurring schedule (cron)', 'zh')).toBe('按重复计划（cron）自动触发工作流。')
        expect(
            translateNodeTooltip(
                'Standard 5-field cron expression (minute hour day month weekday). Example: "0 9 * * 1-5" runs at 09:00 every weekday.',
                'zh'
            )
        ).toBe('标准 5 位 cron 表达式（分 时 日 月 周）。例如 "0 9 * * *" 表示每天 09:00 触发，"0 9 * * 1-5" 表示工作日 09:00 触发。')
        expect(translateNodeTooltip('Default question/input passed to the flow when it is triggered by the scheduler.', 'zh')).toBe(
            '调度器触发时传给流程的默认问题 / 输入。'
        )
        expect(translateNodeTooltip('How Flowise replies to the incoming webhook request.', 'zh')).toBe(
            'FlowOps 如何回复传入的 Webhook 请求。'
        )
        expect(translateNodeTooltip('Trigger the workflow via an external webhook', 'en')).toBe(
            'Trigger the workflow via an external webhook'
        )
    })

    it('translates CSV agent input label, tooltip, and placeholder copy', async () => {
        const { translateNodeInputPlaceholder, translateNodeLabel, translateNodeTooltip } = await import('./nodeI18n.js')
        const prompt =
            'I want you to act as a document that I am having a conversation with. Your name is "AI Assistant". You will provide me with answers from the given info. If the answer is not included, say exactly "Hmm, I am not sure." and stop after that. Refuse to answer any question not about the info. Never break character.'
        const tooltip =
            'Custom Pandas <a target="_blank" href="https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html">read_csv</a> function. Takes in an input: "csv_data"'

        expect(translateNodeLabel('Custom Pandas Read_CSV Code', 'zh')).toBe('自定义 Pandas read_csv 代码')
        expect(translateNodeTooltip(tooltip, 'zh')).toBe(
            '自定义 Pandas <a target="_blank" href="https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html">read_csv</a> 函数。输入参数为 "csv_data"。'
        )
        expect(translateNodeInputPlaceholder(prompt, 'zh')).toBe(
            '请你扮演一份正在与我对话的文档。你的名字是 "AI Assistant"。你需要基于给定信息回答我的问题。如果答案不在信息中，请只说 "Hmm, I am not sure."，然后停止回答。拒绝回答任何与给定信息无关的问题，并始终保持角色设定。'
        )
        expect(translateNodeLabel('Custom Pandas Read_CSV Code', 'en')).toBe('Custom Pandas Read_CSV Code')
        expect(translateNodeTooltip(tooltip, 'en')).toBe(tooltip)
        expect(translateNodeInputPlaceholder(prompt, 'en')).toBe(prompt)
    })

    it('translates node list badges in AddNodes', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/canvas/AddNodes.jsx'), 'utf8')

        expect(source).toMatch(/label=\{translateNodeCategory\(\s*node\.badge,\s*currentLang\s*\)\}/)
        expect(source).not.toContain('label={node.badge}')
    })

    it('translates badges in NodeInfoDialog', () => {
        const source = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/NodeInfoDialog.jsx'), 'utf8')

        expect(source).toContain("import { useTranslation } from 'react-i18next'")
        expect(source).toContain('translateNodeCategory')
        expect(source).toContain('translateNodeCategory(dialogProps.data.badge, currentLang)')
    })

    it('routes shared tooltip text through node i18n', () => {
        const tooltipSource = fs.readFileSync(path.join(__dirname, '../ui-component/tooltip/TooltipWithParser.jsx'), 'utf8')
        const nodeInputSource = fs.readFileSync(path.join(__dirname, '../views/canvas/NodeInputHandler.jsx'), 'utf8')

        expect(tooltipSource).toContain('translateNodeTooltip')
        expect(tooltipSource).toContain('const translatedTitle = translateNodeTooltip(title, currentLang)')
        expect(nodeInputSource).toContain('translateNodeTooltip')
        expect(nodeInputSource).toContain('title={tT(inputParam.description)}')
    })
})
