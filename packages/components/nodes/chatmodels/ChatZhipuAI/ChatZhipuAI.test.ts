jest.mock('@langchain/openai', () => ({
    ChatOpenAI: jest.fn().mockImplementation((fields) => ({ fields }))
}))

jest.mock('../../../src/utils', () => ({
    getBaseClasses: jest.fn().mockReturnValue(['BaseChatModel']),
    getCredentialData: jest.fn(),
    getCredentialParam: jest.fn()
}))

jest.mock('../../../src/modelLoader', () => ({
    MODEL_TYPE: { CHAT: 'chat' },
    getModels: jest.fn()
}))

jest.mock('../../../src/model-providers/zhipu', () => ({
    fetchZhipuChatModelOptions: jest.fn()
}))

import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { getModels } from '../../../src/modelLoader'
import { ZHIPU_DEFAULT_BASE_URL } from '../../../src/model-providers/openAICompatible'
import { fetchZhipuChatModelOptions } from '../../../src/model-providers/zhipu'

const { nodeClass: ChatZhipuAI } = require('./ChatZhipuAI')

describe('ChatZhipuAI', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('appears as a first-class chat model node with Zhipu credential', () => {
        const node = new ChatZhipuAI()

        expect(node.label).toBe('智谱 GLM')
        expect(node.name).toBe('chatZhipuAI')
        expect(node.category).toBe('Chat Models')
        expect(node.description).toBe('Wrapper around Zhipu GLM large language models that use the Chat endpoint')
        expect(node.credential.credentialNames).toEqual(['zhipuAIApi'])
        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'glm-4.5'
        })
        expect(node.inputs.map((input: any) => input.name)).not.toContain('basePath')
    })

    it('loads live model options from Zhipu when credential is selected', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ zhipuAIApiKey: 'zhipu-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(fetchZhipuChatModelOptions as jest.Mock).mockResolvedValue([{ label: 'glm-live', name: 'glm-live' }])

        const node = new ChatZhipuAI()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(fetchZhipuChatModelOptions).toHaveBeenCalledWith('zhipu-key')
        expect(models).toEqual([{ label: 'glm-live', name: 'glm-live' }])
    })

    it('falls back to bundled model options when live Zhipu models cannot be loaded', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ zhipuAIApiKey: 'zhipu-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(fetchZhipuChatModelOptions as jest.Mock).mockRejectedValue(new Error('network failed'))
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'glm-4.5', name: 'glm-4.5' }])

        const node = new ChatZhipuAI()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(getModels).toHaveBeenCalledWith('chat', 'chatZhipuAI')
        expect(models).toEqual([{ label: 'glm-4.5', name: 'glm-4.5' }])
    })

    it('passes Zhipu credentials and OpenAI compatible settings to ChatOpenAI', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ zhipuAIApiKey: 'zhipu-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const node = new ChatZhipuAI()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'glm-4.5',
                    customModelName: 'glm-custom',
                    temperature: '0.2',
                    streaming: false,
                    maxTokens: '1024',
                    topP: '0.8',
                    frequencyPenalty: '0.1',
                    presencePenalty: '0.2',
                    timeout: '30',
                    stopSequence: 'END, STOP',
                    basePath: 'https://example.com/should-not-be-used/',
                    baseOptions: '{"X-Test":"1"}'
                }
            },
            '',
            {}
        )

        expect(model.fields).toMatchObject({
            apiKey: 'zhipu-key',
            openAIApiKey: 'zhipu-key',
            modelName: 'glm-custom',
            temperature: 0.2,
            streaming: false,
            maxTokens: 1024,
            topP: 0.8,
            frequencyPenalty: 0.1,
            presencePenalty: 0.2,
            timeout: 30,
            stop: ['END', 'STOP'],
            configuration: {
                baseURL: ZHIPU_DEFAULT_BASE_URL,
                defaultHeaders: {
                    'X-Test': '1'
                }
            }
        })
    })
})
