import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { addSingleFileToStorage } from '../../../src/storageUtils'

const ExcelJS = require('exceljs')

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

type TableData = {
    rows: any[][]
    hasHeader: boolean
}

const sanitizeBaseName = (name: string): string => {
    const cleaned = (name || '').trim().replace(/[/\\:*?"<>|]/g, '_')
    return cleaned || 'spreadsheet'
}

const sanitizeSheetName = (name: string): string => {
    const cleaned = (name || '')
        .trim()
        .replace(/[[\]*?:/\\]/g, ' ')
        .slice(0, 31)
        .trim()
    return cleaned || 'Sheet1'
}

const normalizeCellValue = (value: any): any => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) return value
    return JSON.stringify(value)
}

const parseTableData = (content: string): TableData | undefined => {
    let data: any
    try {
        data = JSON.parse(content)
    } catch {
        return undefined
    }

    if (!Array.isArray(data) || data.length === 0) return undefined

    if (data.every((row) => Array.isArray(row))) {
        const rows = data.map((row) => row.map(normalizeCellValue))
        return rows.some((row) => row.length > 0) ? { rows, hasHeader: true } : undefined
    }

    if (data.every((row) => row && typeof row === 'object' && !Array.isArray(row))) {
        const headers: string[] = []
        for (const row of data) {
            for (const key of Object.keys(row)) {
                if (!headers.includes(key)) headers.push(key)
            }
        }
        if (headers.length === 0) return undefined

        const rows = [headers, ...data.map((row) => headers.map((key) => normalizeCellValue(row[key])))]
        return { rows, hasHeader: true }
    }

    return undefined
}

const buildXlsxBuffer = async (content: string, sheetName: string): Promise<Buffer | undefined> => {
    const table = parseTableData(content)
    if (!table) return undefined

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sanitizeSheetName(sheetName))
    for (const row of table.rows) worksheet.addRow(row)
    if (table.hasHeader) worksheet.getRow(1).font = { bold: true }

    return Buffer.from(await workbook.xlsx.writeBuffer())
}

class SpreadsheetExport_Agentflow implements INode {
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
        this.label = '表格导出'
        this.name = 'spreadsheetExportAgentflow'
        this.version = 1.0
        this.type = 'SpreadsheetExport'
        this.category = 'Agent Flows'
        this.description = '将 JSON 表格数据导出为可下载 Excel 文件（.xlsx），支持对象数组和二维数组'
        this.color = '#21A366'
        this.icon = 'spreadsheetexport.svg'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Content',
                name: 'docExportContent',
                type: 'string',
                rows: 6,
                acceptVariable: true,
                description: '要导出的 JSON 表格数据，可引用上游节点输出。支持对象数组或二维数组。'
            },
            {
                label: 'Sheet Name',
                name: 'sheetName',
                type: 'string',
                placeholder: 'Sheet1',
                description: 'Excel 工作表名称',
                optional: true
            },
            {
                label: 'File Name',
                name: 'docExportFileName',
                type: 'string',
                placeholder: 'spreadsheet',
                description: '文件名（不含扩展名）',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async run(nodeData: INodeData, _input: string, options: ICommonObject): Promise<any> {
        const content = (nodeData.inputs?.docExportContent as string) ?? ''
        const sheetName = ((nodeData.inputs?.sheetName as string) || 'Sheet1').trim()
        const baseName = sanitizeBaseName(nodeData.inputs?.docExportFileName as string)

        const orgId = options.orgId as string
        const chatflowid = options.chatflowid as string
        const chatId = options.chatId as string
        const state = options.agentflowRuntime?.state as ICommonObject

        if (!content.trim()) {
            return {
                id: nodeData.id,
                name: this.name,
                input: { sheetName: sanitizeSheetName(sheetName) },
                output: {
                    content:
                        '⚠️ 导出内容为空：请在「表格导出」节点的 Content 中引用上游节点输出（例如上游 LLM 节点），或直接填入 JSON 表格数据，再运行。'
                },
                state
            }
        }

        const buffer = await buildXlsxBuffer(content, sheetName)
        if (!buffer) {
            return {
                id: nodeData.id,
                name: this.name,
                input: { sheetName: sanitizeSheetName(sheetName) },
                output: {
                    content: '⚠️ 请提供 JSON 表格数据：对象数组（如 [{"name":"张三"}]）或二维数组（如 [["姓名"],["张三"]]）。'
                },
                state
            }
        }

        const fileName = `${baseName}.xlsx`
        await addSingleFileToStorage(XLSX_MIME, buffer, fileName, orgId, chatflowid, chatId)

        const fileUrl = `/api/v1/get-upload-file?chatflowId=${encodeURIComponent(chatflowid)}&chatId=${encodeURIComponent(
            chatId
        )}&fileName=${encodeURIComponent(fileName)}&download=true`
        const outputContent = `📄 已生成表格 **${fileName}** —— [点击下载](${fileUrl})`

        return {
            id: nodeData.id,
            name: this.name,
            input: { sheetName: sanitizeSheetName(sheetName), fileName },
            output: { content: outputContent, fileName, fileUrl },
            state
        }
    }
}

module.exports = { nodeClass: SpreadsheetExport_Agentflow }
