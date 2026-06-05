import fs from 'fs'
import path from 'path'

const templates = [
    {
        file: '腾讯云 VectorDB RAG 智能体.json',
        provider: '腾讯云 VectorDB',
        nodeName: 'tencentCloudVectorDB'
    },
    {
        file: '阿里云 DashVector RAG 智能体.json',
        provider: '阿里云 DashVector',
        nodeName: 'dashVector'
    },
    {
        file: '百度 VectorDB RAG 智能体.json',
        provider: '百度智能云 VectorDB',
        nodeName: 'baiduVectorDB'
    },
    {
        file: '火山 VikingDB RAG 智能体.json',
        provider: '火山引擎 VikingDB',
        nodeName: 'vikingDB'
    }
]

describe('China cloud vector RAG marketplace templates', () => {
    for (const item of templates) {
        it(`ships a ready-to-configure AgentflowV2 RAG template for ${item.provider}`, () => {
            const templatePath = path.join(__dirname, '../../../marketplaces/agentflowsv2', item.file)
            expect(fs.existsSync(templatePath)).toBe(true)

            const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
            expect(template.description).toContain(item.provider)
            expect(template.description).toContain('RAG')
            expect(template.usecases).toEqual(['Agent', '知识库', '国产云向量库'])
            expect(template.nodes.map((node: any) => node.data.name)).toEqual(['startAgentflow', 'agentAgentflow', 'stickyNoteAgentflow'])
            expect(template.edges.map((edge: any) => `${edge.source}->${edge.target}`)).toEqual(['startAgentflow_0->agentAgentflow_0'])

            const startNode = template.nodes.find((node: any) => node.id === 'startAgentflow_0')
            expect(startNode.data.inputs.startInputType).toBe('chatInput')

            const agentNode = template.nodes.find((node: any) => node.id === 'agentAgentflow_0')
            expect(agentNode.data.inputs.agentModel).toBe('chatZhipuAI')
            expect(agentNode.data.inputs.agentModelConfig.modelName).toBe('glm-4.5')
            expect(agentNode.data.inputs.agentKnowledgeVSEmbeddings[0].vectorStore).toBe(item.nodeName)
            expect(agentNode.data.inputs.agentKnowledgeVSEmbeddings[0].embeddingModel).toBe('embeddingQwen')
            expect(agentNode.data.inputs.agentMessages[0].content).toContain('中文知识库问答')

            const note = template.nodes.find((node: any) => node.id === 'stickyNoteAgentflow_0')
            expect(note.data.inputs.note).toContain(item.provider)
            expect(note.data.inputs.note).toContain('API Key')
            expect(note.data.inputs.note).toContain('自动建集合')
            expect(note.data.inputs.note).toContain('text-embedding-v4')
            expect(note.data.inputs.note).toContain('bge-m3')
        })
    }
})
