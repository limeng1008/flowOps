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
})
