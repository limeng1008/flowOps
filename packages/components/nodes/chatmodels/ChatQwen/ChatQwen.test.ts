import * as fs from 'fs'
import * as path from 'path'

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

import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { getModels } from '../../../src/modelLoader'

const QWEN_DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

const modulePath = path.join(__dirname, 'ChatQwen.ts')
const originalFetch = global.fetch

const getChatQwen = () => {
    expect(fs.existsSync(modulePath)).toBe(true)
    return require('./ChatQwen').nodeClass
}

describe('ChatQwen', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn() as any
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    it('appears as a first-class chat model node with DashScope credential', () => {
        const ChatQwen = getChatQwen()
        const node = new ChatQwen()

        expect(node.label).toBe('通义千问 (Qwen)')
        expect(node.name).toBe('chatQwen')
        expect(node.category).toBe('Chat Models')
        expect(node.description).toBe(
            'Wrapper around Alibaba Tongyi Qwen large language models (DashScope OpenAI-compatible) that use the Chat endpoint'
        )
        expect(node.credential.credentialNames).toEqual(['dashScopeApi'])
        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'qwen-plus'
        })
    })

    it('loads live model options from DashScope when credential is selected', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ dashScopeApiKey: 'qwen-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ data: [{ id: 'qwen-live' }] })
        })

        const ChatQwen = getChatQwen()
        const node = new ChatQwen()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(global.fetch).toHaveBeenCalledWith(
            'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer qwen-key'
                })
            })
        )
        expect(models).toEqual([{ label: 'qwen-live', name: 'qwen-live' }])
    })

    it('falls back to bundled model options when live Qwen models cannot be loaded', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ dashScopeApiKey: 'qwen-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network failed'))
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'qwen-plus', name: 'qwen-plus' }])

        const ChatQwen = getChatQwen()
        const node = new ChatQwen()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(getModels).toHaveBeenCalledWith('chat', 'chatQwen')
        expect(models).toEqual([{ label: 'qwen-plus', name: 'qwen-plus' }])
    })

    it('passes DashScope credentials and OpenAI compatible settings to ChatOpenAI', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ dashScopeApiKey: 'qwen-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const ChatQwen = getChatQwen()
        const node = new ChatQwen()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'qwen-plus',
                    customModelName: 'qwen-max-latest',
                    temperature: '0.2',
                    streaming: false,
                    maxTokens: '1024',
                    topP: '0.8',
                    frequencyPenalty: '0.1',
                    presencePenalty: '0.2',
                    timeout: '30',
                    stopSequence: 'END, STOP',
                    baseOptions: '{"X-Test":"1"}'
                }
            },
            '',
            {}
        )

        expect(model.fields).toMatchObject({
            apiKey: 'qwen-key',
            openAIApiKey: 'qwen-key',
            modelName: 'qwen-max-latest',
            temperature: 0.2,
            streaming: false,
            maxTokens: 1024,
            topP: 0.8,
            frequencyPenalty: 0.1,
            presencePenalty: 0.2,
            timeout: 30,
            stop: ['END', 'STOP'],
            configuration: {
                baseURL: QWEN_DEFAULT_BASE_URL,
                defaultHeaders: {
                    'X-Test': '1'
                }
            }
        })
    })
})
