const fs = require('fs')
const path = require('path')

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

        expect(translateNodeTooltip(tooltip, 'zh')).toBe(
            '使用 Chat Prompt Template 覆盖默认提示词；其中 Human Message 必须包含 {input} 变量。'
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
