import { fetchZhipuChatModelOptions, fetchZhipuModels, guessZhipuModelType, ZHIPU_MODELS_URL } from './zhipu'

describe('Zhipu model provider', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        global.fetch = jest.fn()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('classifies Zhipu model ids by capability', () => {
        expect(guessZhipuModelType('glm-4.5')).toBe('chat')
        expect(guessZhipuModelType('embedding-3')).toBe('embedding')
        expect(guessZhipuModelType('bge-rerank')).toBe('rerank')
        expect(guessZhipuModelType('cogview-3')).toBe('image')
        expect(guessZhipuModelType('glm-4v-plus')).toBe('vision')
        expect(guessZhipuModelType('glm-5v')).toBe('vision')
        expect(guessZhipuModelType('glm-ocr')).toBe('vision')
    })

    it('fetches and normalizes the Zhipu model list', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [{ id: 'glm-4.5' }, { id: 'embedding-3' }, { id: 'bge-rerank' }, { id: 'cogview-3' }, { id: 'glm-4v-plus' }]
            })
        })

        const models = await fetchZhipuModels('zhipu-key')

        expect(global.fetch).toHaveBeenCalledWith(ZHIPU_MODELS_URL, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer zhipu-key',
                'Content-Type': 'application/json'
            }
        })
        expect(models).toEqual([
            { id: 'glm-4.5', name: 'glm-4.5', provider: 'zhipu', type: 'chat' },
            { id: 'embedding-3', name: 'embedding-3', provider: 'zhipu', type: 'embedding' },
            { id: 'bge-rerank', name: 'bge-rerank', provider: 'zhipu', type: 'rerank' },
            { id: 'cogview-3', name: 'cogview-3', provider: 'zhipu', type: 'image' },
            { id: 'glm-4v-plus', name: 'glm-4v-plus', provider: 'zhipu', type: 'vision' }
        ])
    })

    it('returns Flowise chat options from live Zhipu chat models only', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [{ id: 'glm-4.5' }, { id: 'embedding-3' }, { id: 'glm-4.5' }, { id: 'glm-4.5-air' }]
            })
        })

        const options = await fetchZhipuChatModelOptions('zhipu-key')

        expect(options).toEqual([
            { label: 'glm-4.5', name: 'glm-4.5' },
            { label: 'glm-4.5-air', name: 'glm-4.5-air' }
        ])
    })

    it('throws a helpful error when the Zhipu model endpoint fails', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 401
        })

        await expect(fetchZhipuModels('bad-key')).rejects.toThrow('智谱模型列表获取失败：401')
    })
})
