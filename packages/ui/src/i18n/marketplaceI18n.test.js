const fs = require('fs')
const path = require('path')

const { translateMarketplaceUsecase } = require('./marketplaceI18n')

const usecaseTranslations = {
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
    Research: '研究',
    SQL: 'SQL',
    'Web Scraping': '网页抓取',
    'Working with tables': '表格处理'
}

describe('marketplace i18n', () => {
    it.each(Object.entries(usecaseTranslations))('translates marketplace usecase %s in Chinese', (source, expected) => {
        expect(translateMarketplaceUsecase(source, 'zh')).toBe(expected)
    })

    it('keeps marketplace usecase labels unchanged in English', () => {
        expect(translateMarketplaceUsecase('Customer Support', 'en')).toBe('Customer Support')
        expect(translateMarketplaceUsecase('Deep Research', 'en')).toBe('Deep Research')
    })

    it('renders marketplace usecase filters through the translation helper', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/marketplaces/index.jsx'), 'utf8')

        expect(source).toContain('translateMarketplaceUsecase')
        expect(source).toContain('translateUsecase')
        expect(source).toContain('getOptionLabel={(option) => translateUsecase(option)}')
        expect(source).toContain('primary={translateUsecase(option)}')
        expect(source).toContain('label={translateUsecase(usecase)}')
    })

    it('renders marketplace table usecase chips through the translation helper', () => {
        const source = fs.readFileSync(path.join(__dirname, '../ui-component/table/MarketplaceTable.jsx'), 'utf8')

        expect(source).toContain('translateMarketplaceUsecase')
        expect(source).toContain('label={translateMarketplaceUsecase(usecase, currentLang)}')
    })

    it('translates the PPT Deck Agent marketplace template in Chinese', () => {
        const { translateTemplateDescription, translateTemplateName } = require('./marketplaceI18n')

        expect(translateTemplateName('PPT Deck Agent', 'zh')).toBe('PPT 智能体')
        expect(
            translateTemplateDescription(
                'Generate a structured presentation deck plan with slide content, speaker notes, and visual direction',
                'zh'
            )
        ).toBe('生成结构化 PPT 方案，包括每页内容、演讲备注和视觉方向')
    })
})
