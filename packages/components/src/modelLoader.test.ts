import axios from 'axios'
import { getModels, MODEL_TYPE } from './modelLoader'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('modelLoader', () => {
    const originalModelListConfig = process.env.MODEL_LIST_CONFIG_JSON

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
})
