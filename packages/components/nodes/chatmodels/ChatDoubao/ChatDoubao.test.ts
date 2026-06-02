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

const DOUBAO_DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'

const modulePath = path.join(__dirname, 'ChatDoubao.ts')
const originalFetch = global.fetch

const getChatDoubao = () => {
    expect(fs.existsSync(modulePath)).toBe(true)
    return require('./ChatDoubao').nodeClass
}

describe('ChatDoubao', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn() as any
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    it('appears as a first-class chat model node with Volcengine Ark credential', () => {
        const ChatDoubao = getChatDoubao()
        const node = new ChatDoubao()

        expect(node.label).toBe('豆包 (火山方舟)')
        expect(node.name).toBe('chatDoubao')
        expect(node.category).toBe('Chat Models')
        expect(node.description).toBe('Wrapper around Doubao (Volcengine Ark) large language models that use the Chat endpoint')
        expect(node.credential.credentialNames).toEqual(['volcengineArkApi'])
        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'doubao-pro-32k'
        })
    })

    it('loads live model options from Volcengine Ark when credential is selected', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ volcengineArkApiKey: 'ark-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ data: [{ id: 'doubao-live' }] })
        })

        const ChatDoubao = getChatDoubao()
        const node = new ChatDoubao()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(global.fetch).toHaveBeenCalledWith(
            'https://ark.cn-beijing.volces.com/api/v3/models',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer ark-key'
                })
            })
        )
        expect(models).toEqual([{ label: 'doubao-live', name: 'doubao-live' }])
    })

    it('falls back to bundled model options when live Doubao models cannot be loaded', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ volcengineArkApiKey: 'ark-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network failed'))
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'doubao-pro-32k', name: 'doubao-pro-32k' }])

        const ChatDoubao = getChatDoubao()
        const node = new ChatDoubao()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(getModels).toHaveBeenCalledWith('chat', 'chatDoubao')
        expect(models).toEqual([{ label: 'doubao-pro-32k', name: 'doubao-pro-32k' }])
    })

    it('passes Volcengine Ark credentials and OpenAI compatible settings to ChatOpenAI', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ volcengineArkApiKey: 'ark-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const ChatDoubao = getChatDoubao()
        const node = new ChatDoubao()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'doubao-pro-32k',
                    customModelName: 'ep-20240601000000',
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
            apiKey: 'ark-key',
            openAIApiKey: 'ark-key',
            modelName: 'ep-20240601000000',
            temperature: 0.2,
            streaming: false,
            maxTokens: 1024,
            topP: 0.8,
            frequencyPenalty: 0.1,
            presencePenalty: 0.2,
            timeout: 30,
            stop: ['END', 'STOP'],
            configuration: {
                baseURL: DOUBAO_DEFAULT_BASE_URL,
                defaultHeaders: {
                    'X-Test': '1'
                }
            }
        })
    })
})
