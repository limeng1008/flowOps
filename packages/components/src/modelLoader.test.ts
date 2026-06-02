import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import { getModels, MODEL_TYPE } from './modelLoader'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('modelLoader', () => {
    const originalModelListConfig = process.env.MODEL_LIST_CONFIG_JSON
    const componentsRoot = path.join(__dirname, '..')
    const upstreamModelsPath = path.join(componentsRoot, 'models.json')
    const flowopsModelsPath = path.join(componentsRoot, 'models.flowops.json')

    beforeEach(() => {
        delete process.env.MODEL_LIST_CONFIG_JSON
        jest.clearAllMocks()
        mockedAxios.get.mockResolvedValue({
            status: 200,
            data: {
                chat: [
                    {
                        name: 'deepseek',
                        models: [{ label: 'deepseek-chat', name: 'deepseek-chat' }]
                    }
                ],
                llm: [],
                embedding: []
            }
        } as any)
    })

    afterAll(() => {
        if (originalModelListConfig === undefined) {
            delete process.env.MODEL_LIST_CONFIG_JSON
        } else {
            process.env.MODEL_LIST_CONFIG_JSON = originalModelListConfig
        }
    })

    it('uses bundled fork model definitions by default so custom providers appear in async dropdowns', async () => {
        const models = await getModels(MODEL_TYPE.CHAT, 'chatZhipuAI')

        expect(models.map((model) => model.name)).toEqual(expect.arrayContaining(['glm-4.5', 'glm-4.5-air']))
        expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('merges FlowOps providers when the base model list comes from MODEL_LIST_CONFIG_JSON', async () => {
        process.env.MODEL_LIST_CONFIG_JSON = 'https://example.com/models.json'

        const models = await getModels(MODEL_TYPE.CHAT, 'chatZhipuAI')

        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/models.json')
        expect(models.map((model) => model.name)).toEqual(expect.arrayContaining(['glm-4.5', 'glm-4.5-air']))
    })

    it('keeps FlowOps-only providers in models.flowops.json instead of mutating upstream models.json', () => {
        const upstreamModels = JSON.parse(fs.readFileSync(upstreamModelsPath, 'utf8'))
        const flowopsModels = JSON.parse(fs.readFileSync(flowopsModelsPath, 'utf8'))

        expect(upstreamModels.chat.map((provider: any) => provider.name)).not.toContain('chatZhipuAI')
        expect(flowopsModels.chat.find((provider: any) => provider.name === 'chatZhipuAI')?.models).toEqual(
            expect.arrayContaining([expect.objectContaining({ name: 'glm-4.5' }), expect.objectContaining({ name: 'glm-4.5-air' })])
        )
    })
})
