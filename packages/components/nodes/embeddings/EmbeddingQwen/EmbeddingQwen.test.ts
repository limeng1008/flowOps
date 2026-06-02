import * as fs from 'fs'
import * as path from 'path'

jest.mock('@langchain/openai', () => ({
    OpenAIEmbeddings: jest.fn().mockImplementation((fields) => ({ fields }))
}))

jest.mock('../../../src/utils', () => ({
    getBaseClasses: jest.fn().mockReturnValue(['Embeddings']),
    getCredentialData: jest.fn(),
    getCredentialParam: jest.fn()
}))

jest.mock('../../../src/modelLoader', () => ({
    MODEL_TYPE: { EMBEDDING: 'embedding' },
    getModels: jest.fn()
}))

import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { getModels } from '../../../src/modelLoader'

const QWEN_DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

const modulePath = path.join(__dirname, 'EmbeddingQwen.ts')

const getEmbeddingQwen = () => {
    expect(fs.existsSync(modulePath)).toBe(true)
    return require('./EmbeddingQwen').nodeClass
}

describe('EmbeddingQwen', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('appears as a first-class embedding node with DashScope credential', () => {
        const EmbeddingQwen = getEmbeddingQwen()
        const node = new EmbeddingQwen()

        expect(node.label).toBe('通义文本向量模型')
        expect(node.name).toBe('embeddingQwen')
        expect(node.category).toBe('Embeddings')
        expect(node.description).toBe('通过阿里云 DashScope 兼容模式调用 text-embedding-v3 等文本向量模型，用于知识库检索')
        expect(node.credential.credentialNames).toEqual(['dashScopeApi'])
        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'text-embedding-v3'
        })
    })

    it('lists bundled embedding models from the fork model definitions', async () => {
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'text-embedding-v3', name: 'text-embedding-v3' }])

        const EmbeddingQwen = getEmbeddingQwen()
        const node = new EmbeddingQwen()
        const models = await node.loadMethods.listModels()

        expect(getModels).toHaveBeenCalledWith('embedding', 'embeddingQwen')
        expect(models).toEqual([{ label: 'text-embedding-v3', name: 'text-embedding-v3' }])
    })

    it('passes DashScope credentials and OpenAI compatible settings to OpenAIEmbeddings', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ dashScopeApiKey: 'qwen-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const EmbeddingQwen = getEmbeddingQwen()
        const node = new EmbeddingQwen()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'text-embedding-v3',
                    stripNewLines: true,
                    batchSize: '16',
                    dimensions: '1024'
                }
            },
            '',
            {}
        )

        expect(model.fields).toMatchObject({
            openAIApiKey: 'qwen-key',
            modelName: 'text-embedding-v3',
            stripNewLines: true,
            batchSize: 16,
            dimensions: 1024,
            configuration: {
                baseURL: QWEN_DEFAULT_BASE_URL
            }
        })
    })
})
