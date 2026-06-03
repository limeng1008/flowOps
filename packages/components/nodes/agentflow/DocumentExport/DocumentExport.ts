import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { addSingleFileToStorage } from '../../../src/storageUtils'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const HEADING_KEYS = ['title', 'heading', 'name', 'headline', 'subject', '标题', '主题', '名称']

// Inline **bold** -> TextRun[]
const parseInline = (text: string): TextRun[] => {
    const runs: TextRun[] = []
    for (const part of String(text).split(/(\*\*[^*]+\*\*)/g)) {
        if (!part) continue
        if (part.startsWith('**') && part.endsWith('**')) runs.push(new TextRun({ text: part.slice(2, -2), bold: true }))
        else runs.push(new TextRun(part))
    }
    return runs.length ? runs : [new TextRun(String(text))]
}

// Markdown line -> styled Paragraph (headings #/##/###, bullets -/*/•, plain)
const markdownToParagraphs = (content: string): Paragraph[] => {
    const out: Paragraph[] = []
    for (const raw of (content || '').split(/\r?\n/)) {
        const line = raw.trimEnd()
        if (!line.trim()) {
            out.push(new Paragraph(''))
        } else if (line.startsWith('### ')) {
            out.push(new Paragraph({ children: parseInline(line.slice(4)), heading: HeadingLevel.HEADING_3 }))
        } else if (line.startsWith('## ')) {
            out.push(new Paragraph({ children: parseInline(line.slice(3)), heading: HeadingLevel.HEADING_2 }))
        } else if (line.startsWith('# ')) {
            out.push(new Paragraph({ children: parseInline(line.slice(2)), heading: HeadingLevel.HEADING_1 }))
        } else if (/^\s*[-*•]\s+/.test(line)) {
            out.push(new Paragraph({ children: parseInline(line.replace(/^\s*[-*•]\s+/, '')), bullet: { level: 0 } }))
        } else {
            out.push(new Paragraph({ children: parseInline(line) }))
        }
    }
    return out
}

// Structured JSON (e.g. LLM structured output) -> presentation-aware Paragraphs
const jsonToParagraphs = (data: any): Paragraph[] => {
    const out: Paragraph[] = []
    const nextLevel = (lvl: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
        lvl === HeadingLevel.HEADING_1 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3

    const renderArray = (arr: any[], level: any) => {
        for (const item of arr) {
            if (item === null || item === undefined || item === '') continue
            if (typeof item === 'object' && !Array.isArray(item)) {
                const strVals = Object.values(item).filter((v) => typeof v === 'string') as string[]
                // single-field object (e.g. {type: "..."}) -> a bullet
                if (Object.keys(item).length === 1 && strVals.length === 1) {
                    out.push(new Paragraph({ children: parseInline(strVals[0]), bullet: { level: 0 } }))
                } else {
                    renderObject(item, level)
                }
            } else if (Array.isArray(item)) {
                renderArray(item, level)
            } else {
                out.push(new Paragraph({ children: parseInline(String(item)), bullet: { level: 0 } }))
            }
        }
    }

    const renderObject = (obj: Record<string, any>, level: any) => {
        let titled = false
        for (const hk of HEADING_KEYS) {
            if (typeof obj[hk] === 'string' && obj[hk].trim()) {
                out.push(new Paragraph({ children: parseInline(obj[hk]), heading: level }))
                titled = true
                break
            }
        }
        for (const [k, v] of Object.entries(obj)) {
            if (titled && HEADING_KEYS.includes(k)) continue
            if (v === null || v === undefined || v === '') continue
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                out.push(new Paragraph({ children: parseInline(String(v)) }))
            } else if (Array.isArray(v)) {
                renderArray(v, nextLevel(level))
            } else if (typeof v === 'object') {
                renderObject(v, nextLevel(level))
            }
        }
    }

    if (Array.isArray(data)) renderArray(data, HeadingLevel.HEADING_2)
    else if (data && typeof data === 'object') renderObject(data, HeadingLevel.HEADING_1)
    else out.push(new Paragraph({ children: parseInline(String(data)) }))

    return out
}

// Pick renderer: structured JSON if it parses as object/array, else Markdown.
const contentToParagraphs = (content: string): Paragraph[] => {
    const trimmed = (content || '').trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            const data = JSON.parse(trimmed)
            if (data && typeof data === 'object') {
                const paragraphs = jsonToParagraphs(data)
                if (paragraphs.length) return paragraphs
            }
        } catch {
            // not valid JSON -> fall through to markdown
        }
    }
    const md = markdownToParagraphs(content)
    return md.length ? md : [new Paragraph('')]
}

const buildDocxBuffer = async (content: string): Promise<Buffer> => {
    const doc = new Document({ sections: [{ children: contentToParagraphs(content) }] })
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
        this.description = '将内容导出为带格式的可下载文档（Word / Markdown / 纯文本），支持 Markdown 与结构化 JSON，返回下载链接'
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
                description:
                    '要导出的内容，可引用上游节点输出（如上游 LLM 节点）。支持 Markdown（#/##/-）或结构化 JSON，docx 会渲染成对应的标题/正文/列表'
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

        // Guard: empty content would silently produce an empty file. Tell the user how to wire it.
        if (!content.trim()) {
            return {
                id: nodeData.id,
                name: this.name,
                input: { format },
                output: {
                    content:
                        '⚠️ 导出内容为空：请在「文档导出」节点的 Content 中引用上游节点输出（例如上游 LLM 节点），或直接填入文本，再运行。'
                },
                state
            }
        }

        let mime: string
        let buffer: Buffer
        if (format === 'docx') {
            buffer = await buildDocxBuffer(content)
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
