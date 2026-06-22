import { DEEPSEEK_MODELS_URL, fetchDeepseekChatModelOptions, fetchDeepseekModels } from './deepseek'

describe('DeepSeek model provider', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        global.fetch = jest.fn()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('fetches and normalizes the DeepSeek model list', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [{ id: 'deepseek-v4-flash' }, { id: '' }, {}, { id: 'deepseek-v4-pro' }]
            })
        })

        const models = await fetchDeepseekModels('deepseek-key')

        expect(global.fetch).toHaveBeenCalledWith(DEEPSEEK_MODELS_URL, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer deepseek-key',
                'Content-Type': 'application/json'
            }
        })
        expect(models).toEqual([
            { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', provider: 'deepseek' },
            { id: 'deepseek-v4-pro', name: 'deepseek-v4-pro', provider: 'deepseek' }
        ])
    })

    it('returns unique Flowise options from live DeepSeek models', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [{ id: 'deepseek-v4-flash' }, { id: 'deepseek-v4-flash' }, { id: 'deepseek-v4-pro' }]
            })
        })

        const options = await fetchDeepseekChatModelOptions('deepseek-key')

        expect(options).toEqual([
            { label: 'deepseek-v4-flash', name: 'deepseek-v4-flash' },
            { label: 'deepseek-v4-pro', name: 'deepseek-v4-pro' }
        ])
    })

    it('throws a helpful error when the DeepSeek model endpoint fails', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 401
        })

        await expect(fetchDeepseekModels('bad-key')).rejects.toThrow('DeepSeek model list request failed: 401')
    })
})
