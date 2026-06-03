jest.mock('../../../src/storageUtils', () => ({
    addSingleFileToStorage: jest.fn().mockResolvedValue({ path: 'stored', totalSize: 1 })
}))

import { addSingleFileToStorage } from '../../../src/storageUtils'

const ExcelJS = require('exceljs')
const { nodeClass: SpreadsheetExport } = require('./SpreadsheetExport')

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const baseOptions = { orgId: 'org1', chatflowid: 'cf1', chatId: 'chat1', agentflowRuntime: { state: { kept: true } } }

const storedArgs = () => (addSingleFileToStorage as jest.Mock).mock.calls[0]
const workbookFromStorage = async () => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(storedArgs()[1])
    return workbook
}

describe('SpreadsheetExport agentflow node', () => {
    beforeEach(() => jest.clearAllMocks())

    it('is an Agent Flows node with content/sheetName/fileName inputs', () => {
        const node = new SpreadsheetExport()
        expect(node.name).toBe('spreadsheetExportAgentflow')
        expect(node.category).toBe('Agent Flows')
        expect(node.inputs.map((i: any) => i.name)).toEqual(expect.arrayContaining(['docExportContent', 'sheetName', 'docExportFileName']))
    })

    it('exports object-array JSON as an xlsx workbook with union headers and forced-download link', async () => {
        const node = new SpreadsheetExport()
        const res = await node.run(
            {
                id: 'spreadsheetExportAgentflow_0',
                inputs: {
                    docExportContent: JSON.stringify([
                        { 姓名: '张三', 分数: 95 },
                        { 姓名: '李四', 部门: '销售' }
                    ]),
                    sheetName: '成绩表',
                    docExportFileName: '团队/成绩'
                }
            },
            '',
            baseOptions
        )

        const args = storedArgs()
        expect(args[0]).toBe(XLSX_MIME)
        expect(args[2]).toBe('团队_成绩.xlsx')
        expect(args.slice(3)).toEqual(['org1', 'cf1', 'chat1'])

        const workbook = await workbookFromStorage()
        const worksheet = workbook.getWorksheet('成绩表')
        expect(worksheet.rowCount).toBe(3)
        expect(worksheet.getRow(1).font.bold).toBe(true)
        expect(worksheet.getCell('A1').value).toBe('姓名')
        expect(worksheet.getCell('B1').value).toBe('分数')
        expect(worksheet.getCell('C1').value).toBe('部门')
        expect(worksheet.getCell('A2').value).toBe('张三')
        expect(worksheet.getCell('B2').value).toBe(95)
        expect(worksheet.getCell('A3').value).toBe('李四')
        expect(worksheet.getCell('C3').value).toBe('销售')

        expect(res.output.content).toContain('/api/v1/get-upload-file')
        expect(res.output.content).toContain('download=true')
        expect(res.output.fileName).toBe('团队_成绩.xlsx')
        expect(res.output.fileUrl).toContain('fileName=%E5%9B%A2%E9%98%9F_%E6%88%90%E7%BB%A9.xlsx')
        expect(res.state).toEqual({ kept: true })
    })

    it('exports two-dimensional JSON arrays directly as worksheet rows', async () => {
        const node = new SpreadsheetExport()
        await node.run(
            {
                id: 'spreadsheetExportAgentflow_0',
                inputs: {
                    docExportContent: JSON.stringify([
                        ['产品', '数量'],
                        ['智能体平台', 3]
                    ])
                }
            },
            '',
            baseOptions
        )

        expect(storedArgs()[2]).toBe('spreadsheet.xlsx')
        const workbook = await workbookFromStorage()
        const worksheet = workbook.getWorksheet('Sheet1')
        expect(worksheet.getCell('A1').value).toBe('产品')
        expect(worksheet.getCell('B1').value).toBe('数量')
        expect(worksheet.getCell('A2').value).toBe('智能体平台')
        expect(worksheet.getCell('B2').value).toBe(3)
    })

    it('does not store a file when content is empty', async () => {
        const node = new SpreadsheetExport()
        const res = await node.run({ id: 's', inputs: { docExportContent: '   ' } }, '', baseOptions)
        expect(addSingleFileToStorage).not.toHaveBeenCalled()
        expect(res.output.content).toContain('导出内容为空')
    })

    it('does not store a file when content is not JSON table data', async () => {
        const node = new SpreadsheetExport()
        const res = await node.run({ id: 's', inputs: { docExportContent: '{"title":"not a table"}' } }, '', baseOptions)
        expect(addSingleFileToStorage).not.toHaveBeenCalled()
        expect(res.output.content).toContain('请提供 JSON 表格数据')
    })
})
