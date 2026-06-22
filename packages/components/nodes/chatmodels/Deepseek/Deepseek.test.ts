jest.mock('@langchain/deepseek', () => ({
    ChatDeepSeek: jest.fn().mockImplementation((fields) => ({ fields }))
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

jest.mock('../../../src/model-providers/deepseek', () => ({
    fetchDeepseekChatModelOptions: jest.fn()
}))

import { getModels } from '../../../src/modelLoader'
import { fetchDeepseekChatModelOptions } from '../../../src/model-providers/deepseek'
import { getCredentialData, getCredentialParam } from '../../../src/utils'

const { nodeClass: Deepseek } = require('./Deepseek')

describe('Deepseek', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('uses a free-form model catalog with the current default model', () => {
        const node = new Deepseek()

        expect(node.inputs.find((input: any) => input.name === 'modelName')).toMatchObject({
            type: 'asyncOptions',
            loadMethod: 'listModels',
            default: 'deepseek-v4-flash',
            freeSolo: true
        })
    })

    it('loads live models with the selected DeepSeek credential', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ deepseekApiKey: 'deepseek-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        ;(fetchDeepseekChatModelOptions as jest.Mock).mockResolvedValue([{ label: 'deepseek-v4-flash', name: 'deepseek-v4-flash' }])

        const node = new Deepseek()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(getCredentialData).toHaveBeenCalledWith('cred-1', {})
        expect(fetchDeepseekChatModelOptions).toHaveBeenCalledWith('deepseek-key')
        expect(models).toEqual([{ label: 'deepseek-v4-flash', name: 'deepseek-v4-flash' }])
        expect(getModels).not.toHaveBeenCalled()
    })

    it('uses bundled models when no credential is selected', async () => {
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'deepseek-chat', name: 'deepseek-chat' }])

        const node = new Deepseek()
        const models = await node.loadMethods.listModels({}, {})

        expect(getCredentialData).not.toHaveBeenCalled()
        expect(getModels).toHaveBeenCalledWith('chat', 'deepseek')
        expect(models).toEqual([{ label: 'deepseek-chat', name: 'deepseek-chat' }])
    })

    it.each([
        ['request failure', () => (fetchDeepseekChatModelOptions as jest.Mock).mockRejectedValue(new Error('network failed'))],
        ['empty response', () => (fetchDeepseekChatModelOptions as jest.Mock).mockResolvedValue([])]
    ])('uses bundled models after a live %s', async (_, configureLiveResult) => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ deepseekApiKey: 'deepseek-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])
        configureLiveResult()
        ;(getModels as jest.Mock).mockResolvedValue([{ label: 'deepseek-v4-flash', name: 'deepseek-v4-flash' }])

        const node = new Deepseek()
        const models = await node.loadMethods.listModels({ credential: 'cred-1' }, {})

        expect(getModels).toHaveBeenCalledWith('chat', 'deepseek')
        expect(models).toEqual([{ label: 'deepseek-v4-flash', name: 'deepseek-v4-flash' }])
    })

    it('passes a manually entered model name to ChatDeepSeek unchanged', async () => {
        ;(getCredentialData as jest.Mock).mockResolvedValue({ deepseekApiKey: 'deepseek-key' })
        ;(getCredentialParam as jest.Mock).mockImplementation((key, credentialData) => credentialData[key])

        const node = new Deepseek()
        const model = await node.init(
            {
                credential: 'cred-1',
                inputs: {
                    modelName: 'deepseek-future-model',
                    temperature: '0.2',
                    streaming: false
                }
            },
            '',
            {}
        )

        expect(model.fields).toMatchObject({
            modelName: 'deepseek-future-model',
            apiKey: 'deepseek-key',
            openAIApiKey: 'deepseek-key',
            temperature: 0.2,
            streaming: false
        })
    })
})
