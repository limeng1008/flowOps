jest.mock('../../../src/storageUtils', () => ({
    addSingleFileToStorage: jest.fn().mockResolvedValue({ path: 'stored', totalSize: 1 })
}))

import { addSingleFileToStorage } from '../../../src/storageUtils'

const { nodeClass: DocumentExport } = require('./DocumentExport')

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const baseOptions = { orgId: 'org1', chatflowid: 'cf1', chatId: 'chat1', agentflowRuntime: { state: {} } }

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

    it('exports docx: stores a valid Word buffer and returns a forced-download link', async () => {
        const node = new DocumentExport()
        const res = await node.run(
            {
                id: 'documentExportAgentflow_0',
                inputs: { docExportContent: '# 标题\n正文一段\n- 要点1\n- 要点2', docExportFormat: 'docx', docExportFileName: '周报' }
            },
            '',
            baseOptions
        )

        expect(addSingleFileToStorage).toHaveBeenCalledTimes(1)
        const args = (addSingleFileToStorage as jest.Mock).mock.calls[0]
        expect(args[0]).toBe(DOCX_MIME) // mime
        expect(Buffer.isBuffer(args[1])).toBe(true)
        expect(args[1].slice(0, 2).toString('latin1')).toBe('PK') // valid .docx (zip) header
        expect(args[2]).toBe('周报.docx') // fileName
        expect(args.slice(3)).toEqual(['org1', 'cf1', 'chat1']) // orgId, chatflowid, chatId — matches streamStorageFile read order

        expect(res.output.fileName).toBe('周报.docx')
        expect(res.output.content).toContain('/api/v1/get-upload-file')
        expect(res.output.content).toContain('chatflowId=cf1')
        expect(res.output.content).toContain('fileName=' + encodeURIComponent('周报.docx'))
        expect(res.output.content).toContain('download=true')
    })

    it('exports md and txt as plain UTF-8 buffers', async () => {
        const node = new DocumentExport()

        await node.run(
            { id: 'd', inputs: { docExportContent: '# 标题\n内容', docExportFormat: 'md', docExportFileName: 'note' } },
            '',
            baseOptions
        )
        let args = (addSingleFileToStorage as jest.Mock).mock.calls[0]
        expect(args[0]).toBe('text/markdown')
        expect(args[1].toString('utf8')).toBe('# 标题\n内容')
        expect(args[2]).toBe('note.md')

        jest.clearAllMocks()
        await node.run({ id: 'd', inputs: { docExportContent: 'hello', docExportFormat: 'txt' } }, '', baseOptions)
        args = (addSingleFileToStorage as jest.Mock).mock.calls[0]
        expect(args[0]).toBe('text/plain')
        expect(args[1].toString('utf8')).toBe('hello')
        expect(args[2]).toBe('document.txt') // default base name
    })

    it('sanitizes unsafe filename characters', async () => {
        const node = new DocumentExport()
        await node.run(
            { id: 'd', inputs: { docExportContent: 'x', docExportFormat: 'txt', docExportFileName: 'a/b:c*?' } },
            '',
            baseOptions
        )
        const args = (addSingleFileToStorage as jest.Mock).mock.calls[0]
        expect(args[2]).toBe('a_b_c__.txt')
    })
})
