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

const MINIMAX_DEFAULT_BASE_URL = 'https://api.minimaxi.com/v1'

const modulePath = path.join(__dirname, 'ChatMinimax.ts')
const originalFetch = global.fetch

const getChatMinimax = () => {
    expect(fs.existsSync(modulePath)).toBe(true)
    return require('./ChatMinimax').nodeClass
}

describe('ChatMinimax', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn() as any
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    it('appears as a first-class chat model node with MiniMax credential', () => {
        const ChatMinimax = getChatMinimax()
        const node = new ChatMinimax()

        expect(node.label).toBe('MiniMax')
        expect(node.name).toBe('chatMinimax')
        expect(node.category).toBe('Chat Models')
        expect(node.description).toBe('通过 MiniMax OpenAI 兼容接口调用 MiniMax 对话模型')
        expect(node.credential.credentialNames).toEqual(['minimaxApi'])
        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'MiniMax-Text-01'
        })
    })

    it('loads live model options from MiniMax when credential is selected', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ minimaxApiKey: 'minimax-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ data: [{ id: 'minimax-live' }] })
        })

        const ChatMinimax = getChatMinimax()
        const node = new ChatMinimax()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.minimaxi.com/v1/models',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer minimax-key'
                })
            })
        )
        expect(models).toEqual([{ label: 'minimax-live', name: 'minimax-live' }])
    })

    it('falls back to bundled model options when live MiniMax models cannot be loaded', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ minimaxApiKey: 'minimax-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network failed'))
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'MiniMax-Text-01', name: 'MiniMax-Text-01' }])

        const ChatMinimax = getChatMinimax()
        const node = new ChatMinimax()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(getModels).toHaveBeenCalledWith('chat', 'chatMinimax')
        expect(models).toEqual([{ label: 'MiniMax-Text-01', name: 'MiniMax-Text-01' }])
    })

    it('passes MiniMax credentials and OpenAI compatible settings to ChatOpenAI', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ minimaxApiKey: 'minimax-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const ChatMinimax = getChatMinimax()
        const node = new ChatMinimax()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'MiniMax-Text-01',
                    customModelName: 'abab6.5s-chat',
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
            apiKey: 'minimax-key',
            openAIApiKey: 'minimax-key',
            modelName: 'abab6.5s-chat',
            temperature: 0.2,
            streaming: false,
            maxTokens: 1024,
            topP: 0.8,
            frequencyPenalty: 0.1,
            presencePenalty: 0.2,
            timeout: 30,
            stop: ['END', 'STOP'],
            configuration: {
                baseURL: MINIMAX_DEFAULT_BASE_URL,
                defaultHeaders: {
                    'X-Test': '1'
                }
            }
        })
    })
})
