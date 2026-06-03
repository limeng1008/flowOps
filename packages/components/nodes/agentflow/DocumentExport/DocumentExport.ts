import { Document, Packer, Paragraph, HeadingLevel } from 'docx'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { addSingleFileToStorage } from '../../../src/storageUtils'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// Minimal Markdown to .docx: headings (#, ##, ###), bullet lines, blank lines, plain paragraphs.
const markdownToDocxBuffer = async (content: string): Promise<Buffer> => {
    const lines = (content || '').split(/\r?\n/)
    const children: Paragraph[] = []

    for (const raw of lines) {
        const line = raw.trimEnd()
        if (!line.trim()) {
            children.push(new Paragraph(''))
        } else if (line.startsWith('### ')) {
            children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }))
        } else if (line.startsWith('## ')) {
            children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }))
        } else if (line.startsWith('# ')) {
            children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }))
        } else if (/^\s*[-*•]\s+/.test(line)) {
            children.push(new Paragraph({ text: line.replace(/^\s*[-*•]\s+/, ''), bullet: { level: 0 } }))
        } else {
            children.push(new Paragraph(line))
        }
    }

    if (children.length === 0) children.push(new Paragraph(''))

    const doc = new Document({ sections: [{ children }] })
    return (await Packer.toBuffer(doc)) as Buffer
}

const sanitizeBaseName = (name: string): string => {
    const cleaned = (name || '').trim().replace(/[/\\:*?"<>|]/g, '_')
    return cleaned || 'document'
}

class DocumentExport_Agentflow implements INode {
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
        this.label = '文档导出'
        this.name = 'documentExportAgentflow'
        this.version = 1.0
        this.type = 'DocumentExport'
        this.category = 'Agent Flows'
        this.description = '将内容导出为可下载的文档（Word / Markdown / 纯文本），返回下载链接'
        this.color = '#FFB266'
        this.icon = 'documentexport.svg'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Content',
                name: 'docExportContent',
                type: 'string',
                rows: 6,
                acceptVariable: true,
                description: '要导出的内容（纯文本或 Markdown），可引用上游节点输出，如 {{ llmAgentflow_0 }}'
            },
            {
                label: 'Format',
                name: 'docExportFormat',
                type: 'options',
                options: [
                    { label: 'Word (.docx)', name: 'docx' },
                    { label: 'Markdown (.md)', name: 'md' },
                    { label: 'Text (.txt)', name: 'txt' }
                ],
                default: 'docx'
            },
            {
                label: 'File Name',
                name: 'docExportFileName',
                type: 'string',
                placeholder: 'document',
                description: '文件名（不含扩展名）',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async run(nodeData: INodeData, _input: string, options: ICommonObject): Promise<any> {
        const content = (nodeData.inputs?.docExportContent as string) ?? ''
        const format = ((nodeData.inputs?.docExportFormat as string) || 'docx').toLowerCase()
        const baseName = sanitizeBaseName(nodeData.inputs?.docExportFileName as string)

        const orgId = options.orgId as string
        const chatflowid = options.chatflowid as string
        const chatId = options.chatId as string
        const state = options.agentflowRuntime?.state as ICommonObject

        let mime: string
        let buffer: Buffer
        if (format === 'docx') {
            buffer = await markdownToDocxBuffer(content)
            mime = DOCX_MIME
        } else if (format === 'md') {
            buffer = Buffer.from(content, 'utf8')
            mime = 'text/markdown'
        } else {
            buffer = Buffer.from(content, 'utf8')
            mime = 'text/plain'
        }

        const fileName = `${baseName}.${format}`
        await addSingleFileToStorage(mime, buffer, fileName, orgId, chatflowid, chatId)

        const fileUrl = `/api/v1/get-upload-file?chatflowId=${encodeURIComponent(chatflowid)}&chatId=${encodeURIComponent(
            chatId
        )}&fileName=${encodeURIComponent(fileName)}&download=true`
        const outputContent = `📄 已生成文档 **${fileName}** —— [点击下载](${fileUrl})`

        return {
            id: nodeData.id,
            name: this.name,
            input: { format, fileName },
            output: { content: outputContent, fileName, fileUrl },
            state
        }
    }
}

module.exports = { nodeClass: DocumentExport_Agentflow }
