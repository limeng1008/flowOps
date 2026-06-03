jest.mock('../../../src/storageUtils', () => ({
    addSingleFileToStorage: jest.fn().mockResolvedValue({ path: 'stored', totalSize: 1 })
}))

import { addSingleFileToStorage } from '../../../src/storageUtils'

const JSZip = require('jszip')
const { nodeClass: DocumentExport } = require('./DocumentExport')

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const baseOptions = { orgId: 'org1', chatflowid: 'cf1', chatId: 'chat1', agentflowRuntime: { state: {} } }

const storedArgs = () => (addSingleFileToStorage as jest.Mock).mock.calls[0]
const docxXml = async (buffer: Buffer): Promise<string> => {
    const zip = await JSZip.loadAsync(buffer)
    return zip.file('word/document.xml').async('string')
}

describe('DocumentExport agentflow node', () => {
    beforeEach(() => jest.clearAllMocks())

    it('is an Agent Flows node with content/format/fileName inputs', () => {
        const node = new DocumentExport()
        expect(node.name).toBe('documentExportAgentflow')
        expect(node.category).toBe('Agent Flows')
        expect(node.inputs.map((i: any) => i.name)).toEqual(
            expect.arrayContaining(['docExportContent', 'docExportFormat', 'docExportFileName'])
        )
    })

    it('docx from Markdown: applies Word heading styles and keeps text; returns forced-download link', async () => {
        const node = new DocumentExport()
        const res = await node.run(
            {
                id: 'documentExportAgentflow_0',
                inputs: {
                    docExportContent: '# 月度报告\n\n这是正文一段。\n\n## 小节标题\n- 要点一\n- 要点二',
                    docExportFormat: 'docx',
                    docExportFileName: '周报'
                }
            },
            '',
            baseOptions
        )

        const args = storedArgs()
        expect(args[0]).toBe(DOCX_MIME)
        expect(args[2]).toBe('周报.docx')
        expect(args.slice(3)).toEqual(['org1', 'cf1', 'chat1'])

        const xml = await docxXml(args[1])
        expect(xml).toContain('Heading1') // 一级标题样式
        expect(xml).toContain('月度报告') // 标题文字
        expect(xml).toContain('Heading2') // 二级标题样式
        expect(xml).toContain('小节标题')
        expect(xml).toContain('正文一段')
        expect(xml).toContain('要点一')

        expect(res.output.content).toContain('/api/v1/get-upload-file')
        expect(res.output.content).toContain('download=true')
    })

    it('docx from structured JSON: renders title/sections as headings (not raw JSON)', async () => {
        const node = new DocumentExport()
        const report = JSON.stringify({
            title: '青岛天气报告',
            summary: '概要内容段落',
            sections: [{ heading: '气温变化', content: '气温正文', bullets: [{ type: '最高 30 度' }] }]
        })
        await node.run({ id: 'd', inputs: { docExportContent: report, docExportFormat: 'docx' } }, '', baseOptions)

        const xml = await docxXml(storedArgs()[1])
        expect(xml).toContain('Heading1')
        expect(xml).toContain('青岛天气报告') // title -> H1
        expect(xml).toContain('Heading2')
        expect(xml).toContain('气温变化') // section heading -> H2
        expect(xml).toContain('概要内容段落') // summary -> paragraph
        expect(xml).toContain('最高 30 度') // bullet
        expect(xml).not.toContain('"title"') // 不是原始 JSON 文本
    })

    it('exports md and txt as plain UTF-8 buffers', async () => {
        const node = new DocumentExport()
        await node.run(
            { id: 'd', inputs: { docExportContent: '# 标题\n内容', docExportFormat: 'md', docExportFileName: 'note' } },
            '',
            baseOptions
        )
        let args = storedArgs()
        expect(args[0]).toBe('text/markdown')
        expect(args[1].toString('utf8')).toBe('# 标题\n内容')
        expect(args[2]).toBe('note.md')

        jest.clearAllMocks()
        await node.run({ id: 'd', inputs: { docExportContent: 'hello', docExportFormat: 'txt' } }, '', baseOptions)
        args = storedArgs()
        expect(args[0]).toBe('text/plain')
        expect(args[1].toString('utf8')).toBe('hello')
        expect(args[2]).toBe('document.txt')
    })

    it('does not produce a file when content is empty; returns a guidance message', async () => {
        const node = new DocumentExport()
        const res = await node.run({ id: 'd', inputs: { docExportContent: '   ', docExportFormat: 'docx' } }, '', baseOptions)
        expect(addSingleFileToStorage).not.toHaveBeenCalled()
        expect(res.output.content).toContain('导出内容为空')
    })

    it('sanitizes unsafe filename characters', async () => {
        const node = new DocumentExport()
        await node.run(
            { id: 'd', inputs: { docExportContent: 'x', docExportFormat: 'txt', docExportFileName: 'a/b:c*?' } },
            '',
            baseOptions
        )
        expect(storedArgs()[2]).toBe('a_b_c__.txt')
    })
})
