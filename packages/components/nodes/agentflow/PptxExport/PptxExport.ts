import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { addSingleFileToStorage } from '../../../src/storageUtils'

// pptxgenjs ships as both CJS and ESM; require returns the class directly, but guard for default-interop.
const pptxgenModule = require('pptxgenjs')
const PptxGenJS = pptxgenModule.default || pptxgenModule

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const FONT = 'Microsoft YaHei'

type SlideSpec = {
    layout: string
    title: string
    subtitle?: string
    bullets: string[]
    left: string[]
    right: string[]
    chart?: any
    notes?: string
}
type Deck = { deckTitle?: string; subtitle?: string; theme?: string; slides: SlideSpec[] }

// ---- 主题（颜色为不带 # 的 hex，pptxgenjs 约定）----
type ThemeDef = { name: string; bg: string; band: string; title: string; body: string; accent: string; sub: string; chartColors: string[] }
const THEMES: Record<string, ThemeDef> = {
    blue: {
        name: '商务蓝',
        bg: 'FFFFFF',
        band: '1F4E79',
        title: '1F4E79',
        body: '333333',
        accent: '2E75B6',
        sub: '5B9BD5',
        chartColors: ['1F4E79', '2E75B6', '5B9BD5', '9DC3E6', 'BDD7EE', 'D6E4F0']
    },
    green: {
        name: '科技绿',
        bg: 'FFFFFF',
        band: '1E7145',
        title: '1E7145',
        body: '333333',
        accent: '2E9E5B',
        sub: '57C785',
        chartColors: ['1E7145', '2E9E5B', '57C785', '9BD7B2', 'C6E9D4', 'E2F4EA']
    },
    dark: {
        name: '暗夜蓝',
        bg: '14213D',
        band: 'E94560',
        title: 'FFFFFF',
        body: 'D6DEEB',
        accent: 'E94560',
        sub: '9DB2CE',
        chartColors: ['E94560', '4EA8DE', '6BCB77', 'FFD93D', '9A48D0', 'FF924C']
    },
    minimal: {
        name: '简约灰',
        bg: 'FFFFFF',
        band: '404040',
        title: '262626',
        body: '404040',
        accent: '808080',
        sub: 'A6A6A6',
        chartColors: ['404040', '737373', 'A6A6A6', 'BFBFBF', 'D9D9D9', 'ECECEC']
    }
}
const getTheme = (key?: string): ThemeDef => THEMES[(key || '').toLowerCase()] || THEMES.blue

const sanitizeBaseName = (name: string): string => {
    const cleaned = (name || '').trim().replace(/[/\\:*?"<>|]/g, '_')
    return cleaned || 'presentation'
}

// 归一化要点：字符串数组、对象数组(取首个字符串字段)、数字/布尔
const toBulletStrings = (raw: any): string[] => {
    if (!Array.isArray(raw)) return []
    const out: string[] = []
    for (const b of raw) {
        if (b === null || b === undefined || b === '') continue
        if (typeof b === 'string') out.push(b)
        else if (typeof b === 'number' || typeof b === 'boolean') out.push(String(b))
        else if (typeof b === 'object') {
            const str = Object.values(b).find((v) => typeof v === 'string') as string | undefined
            if (str) out.push(str)
        }
    }
    return out
}

// LLM 输出常带 ```json 代码块、前后说明文字，或外层包装对象（{ presentation: {...} }）。
const stripFences = (s: string): string => {
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
    return (fenced ? fenced[1] : s).trim()
}
const tryParse = (s: string): any => {
    try {
        return JSON.parse(s)
    } catch {
        return undefined
    }
}
const looksLikeSlides = (v: any): boolean => Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && !Array.isArray(v[0])

const extractDeckJson = (content: string): any => {
    const cleaned = stripFences(content)
    let data = tryParse(cleaned)
    if (data === undefined) {
        const objAt = cleaned.indexOf('{')
        const arrAt = cleaned.indexOf('[')
        const start = objAt === -1 ? arrAt : arrAt === -1 ? objAt : Math.min(objAt, arrAt)
        if (start !== -1) {
            const close = cleaned[start] === '{' ? '}' : ']'
            const end = cleaned.lastIndexOf(close)
            if (end > start) data = tryParse(cleaned.slice(start, end + 1))
        }
    }
    if (data && !Array.isArray(data) && typeof data === 'object' && !Array.isArray(data.slides)) {
        const nested = Object.values(data).find((v: any) => looksLikeSlides(v) || (v && typeof v === 'object' && Array.isArray(v.slides)))
        if (nested) data = nested
    }
    return data
}

const parseSlide = (s: any): SlideSpec => ({
    layout: String(s.layout || '')
        .toLowerCase()
        .replace(/[\s_-]/g, ''),
    title: String(s.title || s.heading || s.name || ''),
    subtitle: s.subtitle ? String(s.subtitle) : undefined,
    bullets: toBulletStrings(s.bullets || s.points || s.content),
    left: toBulletStrings(s.left || s.leftBullets || s.leftColumn),
    right: toBulletStrings(s.right || s.rightBullets || s.rightColumn),
    chart: s.chart && typeof s.chart === 'object' ? s.chart : undefined,
    notes: s.speakerNotes || s.notes ? String(s.speakerNotes || s.notes) : undefined
})

const parseDeck = (content: string): Deck | undefined => {
    const data = extractDeckJson(content)
    if (!data || typeof data !== 'object') return undefined

    const rawSlides = Array.isArray(data) ? data : data.slides
    if (!Array.isArray(rawSlides) || rawSlides.length === 0) return undefined

    const slides: SlideSpec[] = []
    for (const s of rawSlides) {
        if (!s || typeof s !== 'object' || Array.isArray(s)) continue
        slides.push(parseSlide(s))
    }
    if (slides.length === 0) return undefined

    const obj = Array.isArray(data) ? {} : data
    const deckTitleRaw = obj.deckTitle || obj.title
    const subtitleRaw = obj.subtitle || obj.executiveSummary || obj.summary
    return {
        deckTitle: deckTitleRaw ? String(deckTitleRaw) : undefined,
        subtitle: subtitleRaw ? String(subtitleRaw) : undefined,
        theme: obj.theme ? String(obj.theme) : undefined,
        slides
    }
}

// ---- 版式渲染 ----
const newSlide = (pptx: any, theme: ThemeDef) => {
    const s = pptx.addSlide()
    s.background = { color: theme.bg }
    return s
}

const addTitleBar = (pptx: any, s: any, theme: ThemeDef, title: string) => {
    if (title) s.addText(title, { x: 0.6, y: 0.32, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: theme.title, fontFace: FONT })
    s.addShape(pptx.ShapeType.rect, { x: 0.62, y: 1.04, w: 2.0, h: 0.05, fill: { color: theme.accent } })
}

const bulletRuns = (items: string[], theme: ThemeDef) =>
    items.map((t) => ({ text: String(t), options: { bullet: true, color: theme.body, breakLine: true } }))

const renderCover = (pptx: any, theme: ThemeDef, title: string, subtitle?: string) => {
    const s = newSlide(pptx, theme)
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.45, fill: { color: theme.band } })
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.18, w: 10, h: 0.45, fill: { color: theme.band } })
    s.addText(title || '', {
        x: 0.8,
        y: 2.0,
        w: 8.4,
        h: 1.2,
        fontSize: 40,
        bold: true,
        color: theme.title,
        align: 'center',
        fontFace: FONT
    })
    s.addShape(pptx.ShapeType.rect, { x: 4.0, y: 3.25, w: 2.0, h: 0.06, fill: { color: theme.accent } })
    if (subtitle) s.addText(subtitle, { x: 1.0, y: 3.5, w: 8.0, h: 0.8, fontSize: 18, color: theme.sub, align: 'center', fontFace: FONT })
    return s
}

const renderSection = (pptx: any, theme: ThemeDef, title: string) => {
    const s = newSlide(pptx, theme)
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.3, h: 5.63, fill: { color: theme.accent } })
    s.addText(title || '', { x: 1.0, y: 2.3, w: 8.0, h: 1.0, fontSize: 32, bold: true, color: theme.title, fontFace: FONT })
    return s
}

const renderBullets = (pptx: any, theme: ThemeDef, title: string, bullets: string[]) => {
    const s = newSlide(pptx, theme)
    addTitleBar(pptx, s, theme, title)
    if (bullets.length) {
        s.addText(bulletRuns(bullets, theme), {
            x: 0.7,
            y: 1.4,
            w: 8.6,
            h: 3.9,
            fontSize: 18,
            color: theme.body,
            fontFace: FONT,
            lineSpacingMultiple: 1.3,
            paraSpaceAfter: 8,
            valign: 'top'
        })
    }
    return s
}

const renderTwoColumn = (pptx: any, theme: ThemeDef, title: string, left: string[], right: string[]) => {
    const s = newSlide(pptx, theme)
    addTitleBar(pptx, s, theme, title)
    const col = (items: string[], x: number) => {
        if (!items.length) return
        s.addText(bulletRuns(items, theme), {
            x,
            y: 1.4,
            w: 4.2,
            h: 3.9,
            fontSize: 16,
            color: theme.body,
            fontFace: FONT,
            lineSpacingMultiple: 1.25,
            paraSpaceAfter: 6,
            valign: 'top'
        })
    }
    col(left, 0.6)
    col(right, 5.2)
    return s
}

// 归一化图表：{type, categories, series:[{name,values}]} 或 {type, data:[{label,value}]}
const normalizeChart = (pptx: any, chart: any) => {
    if (!chart || typeof chart !== 'object') return undefined
    const typeKey = String(chart.type || 'bar').toLowerCase()
    const type = pptx.ChartType[typeKey] || pptx.ChartType.bar
    let categories: string[] | undefined = Array.isArray(chart.categories) ? chart.categories.map(String) : undefined
    let series: any = chart.series
    if (!series && Array.isArray(chart.data)) {
        categories = chart.data.map((d: any) => String(d.label ?? d.name ?? ''))
        series = [{ name: chart.seriesName || '数值', values: chart.data.map((d: any) => Number(d.value ?? d.y ?? 0)) }]
    }
    if (!Array.isArray(series) || series.length === 0 || !categories || categories.length === 0) return undefined
    const data = series.map((sr: any) => ({
        name: String(sr.name || '系列'),
        labels: categories as string[],
        values: (Array.isArray(sr.values) ? sr.values : []).map((v: any) => Number(v) || 0)
    }))
    return { type, data, isPie: typeKey === 'pie' || typeKey === 'doughnut' }
}

const renderChart = (pptx: any, theme: ThemeDef, title: string, chart: any, fallbackBullets: string[]) => {
    const s = newSlide(pptx, theme)
    addTitleBar(pptx, s, theme, title)
    const norm = normalizeChart(pptx, chart)
    if (norm) {
        s.addChart(norm.type, norm.data, {
            x: 0.7,
            y: 1.4,
            w: 8.6,
            h: 3.9,
            chartColors: theme.chartColors,
            showLegend: true,
            legendPos: 'b',
            legendColor: theme.body,
            showValue: norm.isPie,
            showPercent: norm.isPie,
            dataLabelColor: norm.isPie ? 'FFFFFF' : theme.body,
            catAxisLabelColor: theme.body,
            valAxisLabelColor: theme.body,
            showTitle: false
        })
    } else if (fallbackBullets.length) {
        // 图表数据不合法时退回要点，别让这页空着
        s.addText(bulletRuns(fallbackBullets, theme), { x: 0.7, y: 1.4, w: 8.6, h: 3.9, fontSize: 18, color: theme.body, fontFace: FONT })
    }
    return s
}

const buildPptxBuffer = async (deck: Deck, themeKey?: string): Promise<Buffer> => {
    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_16x9'
    const theme = getTheme(themeKey || deck.theme)

    const firstIsCover = deck.slides[0]?.layout === 'cover'
    if (deck.deckTitle && !firstIsCover) renderCover(pptx, theme, deck.deckTitle, deck.subtitle)

    for (const slide of deck.slides) {
        let s: any
        switch (slide.layout) {
            case 'cover':
                s = renderCover(pptx, theme, slide.title || deck.deckTitle || '', slide.subtitle || deck.subtitle)
                break
            case 'section':
            case 'divider':
                s = renderSection(pptx, theme, slide.title)
                break
            case 'twocolumn':
                s = renderTwoColumn(pptx, theme, slide.title, slide.left, slide.right)
                break
            case 'chart':
                s = renderChart(pptx, theme, slide.title, slide.chart, slide.bullets)
                break
            case 'closing':
            case 'thanks':
            case 'end':
                s = renderCover(pptx, theme, slide.title || '谢谢观看', slide.subtitle)
                break
            default:
                s = renderBullets(pptx, theme, slide.title, slide.bullets)
        }
        if (slide.notes) s.addNotes(slide.notes)
    }

    return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer
}

class PptxExport_Agentflow implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    color: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'PPT 导出'
        this.name = 'pptxExportAgentflow'
        this.version = 1.0
        this.type = 'PptxExport'
        this.category = 'Agent Flows'
        this.description = '将演示文稿结构（JSON：slides 数组）导出为带主题/版式/图表的专业 PPTX，兼容 PPT Deck Agent 输出，返回下载链接'
        this.color = '#D24726'
        this.icon = 'pptxexport.svg'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Content',
                name: 'docExportContent',
                type: 'string',
                rows: 6,
                acceptVariable: true,
                description:
                    '演示文稿 JSON，可引用上游节点输出。每页可选 layout：cover/section/bullets/twoColumn/chart/closing；chart 页用 { chart: { type:"bar|pie|line", categories:[], series:[{name,values}] } }；不写 layout 默认要点页'
            },
            {
                label: '主题',
                name: 'pptxTheme',
                type: 'options',
                options: [
                    { label: '商务蓝', name: 'blue' },
                    { label: '科技绿', name: 'green' },
                    { label: '暗夜蓝', name: 'dark' },
                    { label: '简约灰', name: 'minimal' }
                ],
                default: 'blue',
                optional: true
            },
            {
                label: 'File Name',
                name: 'docExportFileName',
                type: 'string',
                placeholder: 'presentation',
                description: '文件名（不含扩展名）',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async run(nodeData: INodeData, _input: string, options: ICommonObject): Promise<any> {
        const content = (nodeData.inputs?.docExportContent as string) ?? ''
        const theme = (nodeData.inputs?.pptxTheme as string) || 'blue'
        const baseName = sanitizeBaseName(nodeData.inputs?.docExportFileName as string)

        const orgId = options.orgId as string
        const chatflowid = options.chatflowid as string
        const chatId = options.chatId as string
        const state = options.agentflowRuntime?.state as ICommonObject

        // Guard: empty content would silently produce an empty file. Tell the user how to wire it.
        if (!content.trim()) {
            return {
                id: nodeData.id,
                name: this.name,
                input: {},
                output: {
                    content:
                        '⚠️ 导出内容为空：请在「PPT 导出」节点的 Content 中引用上游节点输出（例如上游 LLM / PPT Deck 节点），或直接填入演示文稿 JSON，再运行。'
                },
                state
            }
        }

        const deck = parseDeck(content)
        if (!deck) {
            return {
                id: nodeData.id,
                name: this.name,
                input: {},
                output: {
                    content:
                        '⚠️ 请提供演示文稿 JSON：包含 slides 数组，每页含 title 与 bullets（例如 {"deckTitle":"标题","slides":[{"title":"第一页","bullets":["要点一","要点二"]}]}）。'
                },
                state
            }
        }

        const buffer = await buildPptxBuffer(deck, theme)
        const fileName = `${baseName}.pptx`
        await addSingleFileToStorage(PPTX_MIME, buffer, fileName, orgId, chatflowid, chatId)

        const fileUrl = `/api/v1/get-upload-file?chatflowId=${encodeURIComponent(chatflowid)}&chatId=${encodeURIComponent(
            chatId
        )}&fileName=${encodeURIComponent(fileName)}&download=true`
        const outputContent = `📄 已生成演示文稿 **${fileName}**（主题：${getTheme(theme).name}）—— [点击下载](${fileUrl})`

        return {
            id: nodeData.id,
            name: this.name,
            input: { fileName, theme, slideCount: deck.slides.length },
            output: { content: outputContent, fileName, fileUrl },
            state
        }
    }
}

module.exports = { nodeClass: PptxExport_Agentflow }
