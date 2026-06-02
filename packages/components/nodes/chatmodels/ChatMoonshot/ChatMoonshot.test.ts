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

const MOONSHOT_DEFAULT_BASE_URL = 'https://api.moonshot.cn/v1'

const modulePath = path.join(__dirname, 'ChatMoonshot.ts')
const originalFetch = global.fetch

const getChatMoonshot = () => {
    expect(fs.existsSync(modulePath)).toBe(true)
    return require('./ChatMoonshot').nodeClass
}

describe('ChatMoonshot', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn() as any
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    it('appears as a first-class chat model node with Moonshot credential', () => {
        const ChatMoonshot = getChatMoonshot()
        const node = new ChatMoonshot()

        expect(node.label).toBe('Kimi (月之暗面)')
        expect(node.name).toBe('chatMoonshot')
        expect(node.category).toBe('Chat Models')
        expect(node.description).toBe('Wrapper around Kimi/Moonshot large language models that use the Chat endpoint')
        expect(node.credential.credentialNames).toEqual(['moonshotApi'])
        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'kimi-k2.6'
        })
    })

    it('loads live model options from Moonshot when credential is selected', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ moonshotApiKey: 'moonshot-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ data: [{ id: 'kimi-live' }] })
        })

        const ChatMoonshot = getChatMoonshot()
        const node = new ChatMoonshot()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.moonshot.cn/v1/models',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer moonshot-key'
                })
            })
        )
        expect(models).toEqual([{ label: 'kimi-live', name: 'kimi-live' }])
    })

    it('falls back to bundled model options when live Moonshot models cannot be loaded', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ moonshotApiKey: 'moonshot-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network failed'))
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'kimi-k2.6', name: 'kimi-k2.6' }])

        const ChatMoonshot = getChatMoonshot()
        const node = new ChatMoonshot()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(getModels).toHaveBeenCalledWith('chat', 'chatMoonshot')
        expect(models).toEqual([{ label: 'kimi-k2.6', name: 'kimi-k2.6' }])
    })

    it('passes Moonshot credentials and OpenAI compatible settings to ChatOpenAI', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ moonshotApiKey: 'moonshot-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const ChatMoonshot = getChatMoonshot()
        const node = new ChatMoonshot()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'kimi-k2.6',
                    customModelName: 'kimi-custom',
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
            apiKey: 'moonshot-key',
            openAIApiKey: 'moonshot-key',
            modelName: 'kimi-custom',
            temperature: 0.2,
            streaming: false,
            maxTokens: 1024,
            topP: 0.8,
            frequencyPenalty: 0.1,
            presencePenalty: 0.2,
            timeout: 30,
            stop: ['END', 'STOP'],
            configuration: {
                baseURL: MOONSHOT_DEFAULT_BASE_URL,
                defaultHeaders: {
                    'X-Test': '1'
                }
            }
        })
    })
})
