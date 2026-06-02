import { buildOpenAICompatibleChatFields, ZHIPU_DEFAULT_BASE_URL } from './openAICompatible'

describe('OpenAI compatible provider adapter', () => {
    it('builds chat fields with the Zhipu default base URL', () => {
        const fields = buildOpenAICompatibleChatFields({
            apiKey: 'zhipu-key',
            modelName: 'glm-4.5',
            temperature: '0.2',
            streaming: false,
            providerBaseURL: ZHIPU_DEFAULT_BASE_URL
        })

        expect(fields).toMatchObject({
            apiKey: 'zhipu-key',
            openAIApiKey: 'zhipu-key',
            modelName: 'glm-4.5',
            temperature: 0.2,
            streaming: false,
            configuration: {
                baseURL: ZHIPU_DEFAULT_BASE_URL
            }
        })
    })

    it('parses advanced OpenAI compatible settings', () => {
        const fields = buildOpenAICompatibleChatFields({
            apiKey: 'zhipu-key',
            modelName: 'glm-4.5',
            customModelName: 'glm-custom',
            temperature: '0.3',
            streaming: true,
            maxTokens: '1024',
            topP: '0.8',
            frequencyPenalty: '0.1',
            presencePenalty: '0.2',
            timeout: '30',
            stopSequence: 'END, STOP',
            providerBaseURL: ZHIPU_DEFAULT_BASE_URL,
            basePath: 'https://example.com/api/v4/',
            baseOptions: '{"X-Test":"1"}'
        })

        expect(fields).toMatchObject({
            modelName: 'glm-custom',
            maxTokens: 1024,
            topP: 0.8,
            frequencyPenalty: 0.1,
            presencePenalty: 0.2,
            timeout: 30,
            stop: ['END', 'STOP'],
            configuration: {
                baseURL: 'https://example.com/api/v4/',
                defaultHeaders: {
                    'X-Test': '1'
                }
            }
        })
    })

    it('throws a helpful error for invalid base options JSON', () => {
        expect(() =>
            buildOpenAICompatibleChatFields({
                apiKey: 'zhipu-key',
                modelName: 'glm-4.5',
                providerBaseURL: ZHIPU_DEFAULT_BASE_URL,
                baseOptions: '{bad json}'
            })
        ).toThrow('Invalid JSON in the Base Options')
    })
})
