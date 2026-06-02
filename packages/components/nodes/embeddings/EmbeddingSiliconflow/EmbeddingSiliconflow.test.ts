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

const SILICONFLOW_DEFAULT_BASE_URL = 'https://api.siliconflow.cn/v1'

const modulePath = path.join(__dirname, 'EmbeddingSiliconflow.ts')

const getEmbeddingSiliconflow = () => {
    expect(fs.existsSync(modulePath)).toBe(true)
    return require('./EmbeddingSiliconflow').nodeClass
}

describe('EmbeddingSiliconflow', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('appears as a first-class embedding node with SiliconFlow credential', () => {
        const EmbeddingSiliconflow = getEmbeddingSiliconflow()
        const node = new EmbeddingSiliconflow()

        expect(node.label).toBe('硅基流动 Embedding')
        expect(node.name).toBe('embeddingSiliconflow')
        expect(node.category).toBe('Embeddings')
        expect(node.credential.credentialNames).toEqual(['siliconflowApi'])
        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'BAAI/bge-m3'
        })
    })

    it('lists bundled embedding models from the fork model definitions', async () => {
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'BAAI/bge-m3', name: 'BAAI/bge-m3' }])

        const EmbeddingSiliconflow = getEmbeddingSiliconflow()
        const node = new EmbeddingSiliconflow()
        const models = await node.loadMethods.listModels()

        expect(getModels).toHaveBeenCalledWith('embedding', 'embeddingSiliconflow')
        expect(models).toEqual([{ label: 'BAAI/bge-m3', name: 'BAAI/bge-m3' }])
    })

    it('passes SiliconFlow credentials and OpenAI compatible settings to OpenAIEmbeddings', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ siliconflowApiKey: 'sf-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const EmbeddingSiliconflow = getEmbeddingSiliconflow()
        const node = new EmbeddingSiliconflow()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'BAAI/bge-m3',
                    customModelName: 'BAAI/bge-large-zh-v1.5'
                }
            },
            '',
            {}
        )

        expect(model.fields).toMatchObject({
            openAIApiKey: 'sf-key',
            modelName: 'BAAI/bge-large-zh-v1.5',
            configuration: {
                baseURL: SILICONFLOW_DEFAULT_BASE_URL
            }
        })
    })
})
