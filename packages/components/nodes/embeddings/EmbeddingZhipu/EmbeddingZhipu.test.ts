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

const ZHIPU_DEFAULT_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/'

const modulePath = path.join(__dirname, 'EmbeddingZhipu.ts')

const getEmbeddingZhipu = () => {
    expect(fs.existsSync(modulePath)).toBe(true)
    return require('./EmbeddingZhipu').nodeClass
}

describe('EmbeddingZhipu', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('appears as a first-class embedding node with Zhipu credential', () => {
        const EmbeddingZhipu = getEmbeddingZhipu()
        const node = new EmbeddingZhipu()

        expect(node.label).toBe('智谱 Embedding')
        expect(node.name).toBe('embeddingZhipu')
        expect(node.category).toBe('Embeddings')
        expect(node.credential.credentialNames).toEqual(['zhipuAIApi'])
        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'embedding-3'
        })
    })

    it('lists bundled embedding models from the fork model definitions', async () => {
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'embedding-3', name: 'embedding-3' }])

        const EmbeddingZhipu = getEmbeddingZhipu()
        const node = new EmbeddingZhipu()
        const models = await node.loadMethods.listModels()

        expect(getModels).toHaveBeenCalledWith('embedding', 'embeddingZhipu')
        expect(models).toEqual([{ label: 'embedding-3', name: 'embedding-3' }])
    })

    it('passes Zhipu credentials and OpenAI compatible settings to OpenAIEmbeddings', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ zhipuAIApiKey: 'zhipu-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const EmbeddingZhipu = getEmbeddingZhipu()
        const node = new EmbeddingZhipu()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'embedding-3',
                    customModelName: 'embedding-2',
                    stripNewLines: true,
                    batchSize: '16',
                    timeout: '30',
                    dimensions: '1024',
                    baseOptions: '{"X-Test":"1"}'
                }
            },
            '',
            {}
        )

        expect(model.fields).toMatchObject({
            openAIApiKey: 'zhipu-key',
            modelName: 'embedding-2',
            stripNewLines: true,
            batchSize: 16,
            timeout: 30,
            dimensions: 1024,
            configuration: {
                baseURL: ZHIPU_DEFAULT_BASE_URL,
                defaultHeaders: {
                    'X-Test': '1'
                }
            }
        })
    })
})
