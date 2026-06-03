import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { addSingleFileToStorage } from '../../../src/storageUtils'

// pptxgenjs ships as both CJS and ESM; require returns the class directly, but guard for default-interop.
const pptxgenModule = require('pptxgenjs')
const PptxGenJS = pptxgenModule.default || pptxgenModule

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

type Slide = { title: string; bullets: string[]; notes?: string }
type Deck = { deckTitle?: string; slides: Slide[] }

const sanitizeBaseName = (name: string): string => {
    const cleaned = (name || '').trim().replace(/[/\\:*?"<>|]/g, '_')
    return cleaned || 'presentation'
}

// Normalize bullets: string array, or object array (take first string field), numbers/booleans -> string.
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

// Parse deck JSON. Compatible with PPT Deck Agent output: { deckTitle|title, slides:[{title|heading, bullets|points|content, speakerNotes|notes}] }
// Also accepts a bare slides array.
const parseDeck = (content: string): Deck | undefined => {
    let data: any
    try {
        data = JSON.parse(content)
    } catch {
        return undefined
    }
    if (!data || typeof data !== 'object') return undefined

    const rawSlides = Array.isArray(data) ? data : data.slides
    if (!Array.isArray(rawSlides) || rawSlides.length === 0) return undefined

    const slides: Slide[] = []
    for (const s of rawSlides) {
        if (!s || typeof s !== 'object' || Array.isArray(s)) continue
        const title = String(s.title || s.heading || s.name || '')
        const bullets = toBulletStrings(s.bullets || s.points || s.content)
        const notesRaw = s.speakerNotes || s.notes
        slides.push({ title, bullets, notes: notesRaw ? String(notesRaw) : undefined })
    }
    if (slides.length === 0) return undefined

    const deckTitleRaw = Array.isArray(data) ? undefined : data.deckTitle || data.title
    return { deckTitle: deckTitleRaw ? String(deckTitleRaw) : undefined, slides }
}

const buildPptxBuffer = async (deck: Deck): Promise<Buffer> => {
    const pptx = new PptxGenJS()

    if (deck.deckTitle) {
        const cover = pptx.addSlide()
        cover.addText(deck.deckTitle, { x: 0.5, y: 2.2, w: 9, h: 1.5, fontSize: 32, bold: true, align: 'center' })
    }

    for (const slide of deck.slides) {
        const s = pptx.addSlide()
        if (slide.title) s.addText(slide.title, { x: 0.5, y: 0.3, w: 9, h: 1, fontSize: 24, bold: true })
        if (slide.bullets.length) {
            s.addText(
                slide.bullets.map((t) => ({ text: t, options: { bullet: true } })),
                { x: 0.7, y: 1.5, w: 8.6, h: 4, fontSize: 16 }
            )
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
        this.description = '将演示文稿结构（JSON：slides 数组）导出为可下载的 PPTX 文件，兼容 PPT Deck Agent 输出，返回下载链接'
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
                    '要导出的演示文稿数据（JSON），可引用上游节点输出。结构：{ deckTitle, slides: [{ title, bullets, speakerNotes }] }，或直接是 slides 数组'
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

        const buffer = await buildPptxBuffer(deck)
        const fileName = `${baseName}.pptx`
        await addSingleFileToStorage(PPTX_MIME, buffer, fileName, orgId, chatflowid, chatId)

        const fileUrl = `/api/v1/get-upload-file?chatflowId=${encodeURIComponent(chatflowid)}&chatId=${encodeURIComponent(
            chatId
        )}&fileName=${encodeURIComponent(fileName)}&download=true`
        const outputContent = `📄 已生成演示文稿 **${fileName}** —— [点击下载](${fileUrl})`

        return {
            id: nodeData.id,
            name: this.name,
            input: { fileName, slideCount: deck.slides.length },
            output: { content: outputContent, fileName, fileUrl },
            state
        }
    }
}

module.exports = { nodeClass: PptxExport_Agentflow }
