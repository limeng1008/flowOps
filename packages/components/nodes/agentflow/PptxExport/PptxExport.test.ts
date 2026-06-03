jest.mock('../../../src/storageUtils', () => ({
    addSingleFileToStorage: jest.fn().mockResolvedValue({ path: 'stored', totalSize: 1 })
}))

// pptxgenjs v4 lazily does a dynamic import('jszip') inside write(), which Jest's CJS VM cannot
// execute (TypeError: dynamic import callback without --experimental-vm-modules). We don't want to
// flip an ESM flag on the shared jest config (it affects other component tests), so we mock pptxgenjs
// and unit-test this node's orchestration (parse -> cover/title/bullets/notes -> storage -> URL).
// Real .pptx generation is verified by a ts-node smoke (unzips the file) and the live UI test.
jest.mock('pptxgenjs', () => {
    class MockPptxGenJS {
        static instances: any[] = []
        slides: any[] = []
        constructor() {
            MockPptxGenJS.instances.push(this)
        }
        addSlide() {
            const slide: any = { texts: [], notes: [] }
            this.slides.push(slide)
            return {
                addText: (text: any, opts: any) => slide.texts.push({ text, opts }),
                addNotes: (note: string) => slide.notes.push(note)
            }
        }
        async write(_opts: any) {
            return Buffer.from('PK mock-pptx ' + this.slides.length)
        }
    }
    return MockPptxGenJS
})

import { addSingleFileToStorage } from '../../../src/storageUtils'

const MockPptxGenJS = require('pptxgenjs')
const { nodeClass: PptxExport } = require('./PptxExport')

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const baseOptions = { orgId: 'org1', chatflowid: 'cf1', chatId: 'chat1', agentflowRuntime: { state: { kept: true } } }

const storedArgs = () => (addSingleFileToStorage as jest.Mock).mock.calls[0]
const lastDeck = () => MockPptxGenJS.instances[MockPptxGenJS.instances.length - 1]
const titleTexts = (slide: any) => slide.texts.filter((t: any) => typeof t.text === 'string').map((t: any) => t.text)
const bulletRun = (slide: any) => slide.texts.find((t: any) => Array.isArray(t.text))

describe('PptxExport agentflow node', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        MockPptxGenJS.instances.length = 0
    })

    it('is an Agent Flows node with content/fileName inputs', () => {
        const node = new PptxExport()
        expect(node.name).toBe('pptxExportAgentflow')
        expect(node.category).toBe('Agent Flows')
        expect(node.inputs.map((i: any) => i.name)).toEqual(expect.arrayContaining(['docExportContent', 'docExportFileName']))
    })

    it('builds a cover + slides deck (title/bullets/notes, object-bullet extraction) and returns a forced-download link', async () => {
        const node = new PptxExport()
        const res = await node.run(
            {
                id: 'pptxExportAgentflow_0',
                inputs: {
                    docExportContent: JSON.stringify({
                        deckTitle: '季度汇报',
                        slides: [
                            { title: '业绩概览', bullets: ['营收增长 20%', '新客户 50 家'], speakerNotes: '强调增长动力' },
                            { title: '下季计划', bullets: [{ point: '扩张华南市场' }] }
                        ]
                    }),
                    docExportFileName: '汇报/Q3'
                }
            },
            '',
            baseOptions
        )

        // storage: mime / sanitized filename / path order (orgId, chatflowid, chatId)
        const args = storedArgs()
        expect(args[0]).toBe(PPTX_MIME)
        expect(Buffer.isBuffer(args[1])).toBe(true)
        expect(args[2]).toBe('汇报_Q3.pptx')
        expect(args.slice(3)).toEqual(['org1', 'cf1', 'chat1'])

        // deck structure: cover + 2 content slides
        const deck = lastDeck()
        expect(deck.slides.length).toBe(3)
        expect(titleTexts(deck.slides[0])).toContain('季度汇报') // 封面
        expect(titleTexts(deck.slides[1])).toContain('业绩概览') // 第一页标题
        expect(bulletRun(deck.slides[1]).text.map((b: any) => b.text)).toEqual(['营收增长 20%', '新客户 50 家'])
        expect(bulletRun(deck.slides[1]).text.every((b: any) => b.options.bullet)).toBe(true)
        expect(deck.slides[1].notes).toContain('强调增长动力')
        expect(titleTexts(deck.slides[2])).toContain('下季计划')
        expect(bulletRun(deck.slides[2]).text.map((b: any) => b.text)).toEqual(['扩张华南市场']) // 对象要点取字符串字段

        // output
        expect(res.output.content).toContain('/api/v1/get-upload-file')
        expect(res.output.content).toContain('download=true')
        expect(res.output.fileName).toBe('汇报_Q3.pptx')
        expect(res.input.slideCount).toBe(2)
        expect(res.state).toEqual({ kept: true })
    })

    it('accepts a bare slides array (no cover) and uses default file name', async () => {
        const node = new PptxExport()
        await node.run(
            { id: 'p', inputs: { docExportContent: JSON.stringify([{ title: '只有一页', bullets: ['内容'] }]) } },
            '',
            baseOptions
        )
        expect(storedArgs()[2]).toBe('presentation.pptx')
        const deck = lastDeck()
        expect(deck.slides.length).toBe(1) // 无封面
        expect(titleTexts(deck.slides[0])).toContain('只有一页')
    })

    it('does not store a file when content is empty; returns a guidance message', async () => {
        const node = new PptxExport()
        const res = await node.run({ id: 'p', inputs: { docExportContent: '   ' } }, '', baseOptions)
        expect(addSingleFileToStorage).not.toHaveBeenCalled()
        expect(res.output.content).toContain('导出内容为空')
    })

    it('does not store a file when JSON has no slides; returns a guidance message', async () => {
        const node = new PptxExport()
        const res = await node.run({ id: 'p', inputs: { docExportContent: '{"foo":"bar"}' } }, '', baseOptions)
        expect(addSingleFileToStorage).not.toHaveBeenCalled()
        expect(res.output.content).toContain('slides 数组')
    })

    it('tolerates a ```json code fence around the deck (common LLM output)', async () => {
        const node = new PptxExport()
        await node.run(
            {
                id: 'p',
                inputs: {
                    docExportContent: '```json\n{"deckTitle":"季度会","slides":[{"title":"开场","bullets":["要点甲","要点乙"]}]}\n```'
                }
            },
            '',
            baseOptions
        )
        expect(addSingleFileToStorage).toHaveBeenCalled()
        const deck = lastDeck()
        expect(deck.slides.length).toBe(2) // 封面 + 1
        expect(titleTexts(deck.slides[0])).toContain('季度会')
        expect(titleTexts(deck.slides[1])).toContain('开场')
        expect(bulletRun(deck.slides[1]).text.map((b: any) => b.text)).toEqual(['要点甲', '要点乙'])
    })

    it('tolerates prose around the deck (slices the balanced JSON out)', async () => {
        const node = new PptxExport()
        await node.run(
            { id: 'p', inputs: { docExportContent: '好的，这是演示文稿：{"slides":[{"title":"唯一页","bullets":["内容"]}]}。完成。' } },
            '',
            baseOptions
        )
        const deck = lastDeck()
        expect(deck.slides.length).toBe(1) // 无 deckTitle → 无封面
        expect(titleTexts(deck.slides[0])).toContain('唯一页')
    })

    it('unwraps a wrapper object ({ presentation: {...} }) and builds the deck', async () => {
        const node = new PptxExport()
        await node.run(
            {
                id: 'p',
                inputs: {
                    docExportContent: JSON.stringify({ presentation: { deckTitle: '年度', slides: [{ title: '第一页', bullets: ['x'] }] } })
                }
            },
            '',
            baseOptions
        )
        const deck = lastDeck()
        expect(deck.slides.length).toBe(2) // 封面 + 1
        expect(titleTexts(deck.slides[0])).toContain('年度')
        expect(titleTexts(deck.slides[1])).toContain('第一页')
    })
})
