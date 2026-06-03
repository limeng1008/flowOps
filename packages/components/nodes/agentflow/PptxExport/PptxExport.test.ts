jest.mock('../../../src/storageUtils', () => ({
    addSingleFileToStorage: jest.fn().mockResolvedValue({ path: 'stored', totalSize: 1 })
}))

// pptxgenjs v4 在 write() 内做 dynamic import('jszip')，jest 的 CJS VM 跑不了；mock 它来单测编排/版式/主题。
// 真实带主题/图表的 .pptx 由 ts-node 解包烟测覆盖。
jest.mock('pptxgenjs', () => {
    class MockSlide {
        texts: any[] = []
        shapes: any[] = []
        charts: any[] = []
        notes: any[] = []
        bg: any = null
        set background(v: any) {
            this.bg = v
        }
        addText(text: any, opts: any) {
            this.texts.push({ text, opts })
        }
        addShape(shape: any, opts: any) {
            this.shapes.push({ shape, opts })
        }
        addChart(type: any, data: any, opts: any) {
            this.charts.push({ type, data, opts })
        }
        addNotes(n: string) {
            this.notes.push(n)
        }
    }
    class MockPptxGenJS {
        static instances: any[] = []
        ShapeType = { rect: 'rect' }
        ChartType = { bar: 'bar', pie: 'pie', line: 'line', doughnut: 'doughnut' }
        layout = ''
        slides: MockSlide[] = []
        constructor() {
            MockPptxGenJS.instances.push(this)
        }
        addSlide() {
            const s = new MockSlide()
            this.slides.push(s)
            return s
        }
        async write(_opts: any) {
            return Buffer.from('PK mock-pptx ' + this.slides.length)
        }
    }
    return MockPptxGenJS
})

import { addSingleFileToStorage } from '../../../src/storageUtils'

const MockPptxGenJS = require('pptxgenjs')
const { nodeClass: PptxExport } = require('./PptxExport')

const baseOptions = { orgId: 'org1', chatflowid: 'cf1', chatId: 'chat1', agentflowRuntime: { state: { kept: true } } }
const storedArgs = () => (addSingleFileToStorage as jest.Mock).mock.calls[0]
const lastDeck = () => MockPptxGenJS.instances[MockPptxGenJS.instances.length - 1]
const allSlides = () => lastDeck().slides
const titleTexts = (slide: any) => slide.texts.filter((t: any) => typeof t.text === 'string').map((t: any) => t.text)
const bulletRun = (slide: any) => slide.texts.find((t: any) => Array.isArray(t.text))
const allShapeColors = (slide: any) => slide.shapes.map((sh: any) => sh.opts?.fill?.color).filter(Boolean)
const run = (node: any, content: string, extra: any = {}) =>
    node.run({ id: 'pptxExportAgentflow_0', inputs: { docExportContent: content, ...extra } }, '', baseOptions)

describe('PptxExport agentflow node（主题 + 版式 + 图表）', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        MockPptxGenJS.instances.length = 0
    })

    it('is an Agent Flows node with content/theme/fileName inputs', () => {
        const node = new PptxExport()
        expect(node.name).toBe('pptxExportAgentflow')
        expect(node.inputs.map((i: any) => i.name)).toEqual(expect.arrayContaining(['docExportContent', 'pptxTheme', 'docExportFileName']))
    })

    it('默认主题(商务蓝)：封面+要点页，应用主题底色/色带，要点带项目符号，含备注与下载链接', async () => {
        const node = new PptxExport()
        const res = await run(
            node,
            JSON.stringify({
                deckTitle: '季度汇报',
                slides: [
                    { title: '业绩概览', bullets: ['营收增长 20%', '新客户 50 家'], speakerNotes: '强调增长动力' },
                    { title: '下季计划', bullets: [{ point: '扩张华南市场' }] }
                ]
            }),
            { docExportFileName: '汇报/Q3' }
        )

        const args = storedArgs()
        expect(args[2]).toBe('汇报_Q3.pptx')
        expect(args.slice(3)).toEqual(['org1', 'cf1', 'chat1'])

        const slides = allSlides()
        expect(slides.length).toBe(3) // 封面 + 2 内容页
        expect(slides[0].bg.color).toBe('FFFFFF') // 商务蓝底色
        expect(allShapeColors(slides[0])).toContain('1F4E79') // 封面色带=主题 band
        expect(titleTexts(slides[0])).toContain('季度汇报')
        expect(titleTexts(slides[1])).toContain('业绩概览')
        expect(bulletRun(slides[1]).text.map((b: any) => b.text)).toEqual(['营收增长 20%', '新客户 50 家'])
        expect(bulletRun(slides[1]).text.every((b: any) => b.options.bullet)).toBe(true)
        expect(slides[1].notes).toContain('强调增长动力')
        expect(titleTexts(slides[2])).toContain('下季计划')
        expect(bulletRun(slides[2]).text.map((b: any) => b.text)).toEqual(['扩张华南市场'])

        expect(res.output.content).toContain('download=true')
        expect(res.output.content).toContain('商务蓝')
        expect(res.input.theme).toBe('blue')
        expect(res.input.slideCount).toBe(2)
        expect(res.state).toEqual({ kept: true })
    })

    it('切换主题(科技绿)：底色/色带用绿色系', async () => {
        const node = new PptxExport()
        await run(node, JSON.stringify({ deckTitle: 'T', slides: [{ title: 'A', bullets: ['x'] }] }), { pptxTheme: 'green' })
        expect(allShapeColors(allSlides()[0])).toContain('1E7145') // 科技绿 band
    })

    it('chart 版式：生成原生图表（类型/标签/数值正确），用主题配色', async () => {
        const node = new PptxExport()
        await run(
            node,
            JSON.stringify({
                slides: [
                    {
                        layout: 'chart',
                        title: '季度营收',
                        chart: { type: 'bar', categories: ['Q1', 'Q2', 'Q3'], series: [{ name: '营收', values: [100, 120, 150] }] }
                    }
                ]
            })
        )
        const slide = allSlides()[0]
        expect(slide.charts.length).toBe(1)
        expect(slide.charts[0].type).toBe('bar')
        expect(slide.charts[0].data[0]).toMatchObject({ name: '营收', labels: ['Q1', 'Q2', 'Q3'], values: [100, 120, 150] })
        expect(slide.charts[0].opts.chartColors).toEqual(expect.arrayContaining(['1F4E79']))
    })

    it('chart 版式兼容 data:[{label,value}] 简写', async () => {
        const node = new PptxExport()
        await run(
            node,
            JSON.stringify({
                slides: [
                    {
                        layout: 'chart',
                        title: '占比',
                        chart: {
                            type: 'pie',
                            data: [
                                { label: '甲', value: 60 },
                                { label: '乙', value: 40 }
                            ]
                        }
                    }
                ]
            })
        )
        const c = allSlides()[0].charts[0]
        expect(c.type).toBe('pie')
        expect(c.data[0].labels).toEqual(['甲', '乙'])
        expect(c.data[0].values).toEqual([60, 40])
    })

    it('section / twoColumn 版式各自渲染', async () => {
        const node = new PptxExport()
        await run(
            node,
            JSON.stringify({
                slides: [
                    { layout: 'section', title: '第一章' },
                    { layout: 'twoColumn', title: '对比', left: ['左1', '左2'], right: ['右1'] }
                ]
            })
        )
        const slides = allSlides()
        expect(titleTexts(slides[0])).toContain('第一章')
        // twoColumn：两列各一个 bullet 数组 addText
        const bulletArrays = slides[1].texts.filter((t: any) => Array.isArray(t.text))
        expect(bulletArrays.length).toBe(2)
        expect(bulletArrays[0].text.map((b: any) => b.text)).toEqual(['左1', '左2'])
        expect(bulletArrays[1].text.map((b: any) => b.text)).toEqual(['右1'])
    })

    it('无 layout 的旧结构默认走要点页（向后兼容）', async () => {
        const node = new PptxExport()
        await run(node, JSON.stringify([{ title: '只有一页', bullets: ['内容'] }]))
        const slides = allSlides()
        expect(slides.length).toBe(1) // 裸数组无 deckTitle → 无封面
        expect(titleTexts(slides[0])).toContain('只有一页')
    })

    it('容错：```json 代码块包裹仍能解析渲染', async () => {
        const node = new PptxExport()
        await run(node, '```json\n{"deckTitle":"会","slides":[{"title":"页","bullets":["a"]}]}\n```')
        expect(allSlides().length).toBe(2)
        expect(titleTexts(allSlides()[0])).toContain('会')
    })

    it('空内容 / 无 slides：给提示且不存文件', async () => {
        const node = new PptxExport()
        const r1 = await run(node, '   ')
        expect(addSingleFileToStorage).not.toHaveBeenCalled()
        expect(r1.output.content).toContain('导出内容为空')
        const r2 = await run(node, '{"foo":"bar"}')
        expect(addSingleFileToStorage).not.toHaveBeenCalled()
        expect(r2.output.content).toContain('slides 数组')
    })
})
