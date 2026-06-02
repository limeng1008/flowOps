import { BaseCache } from '@langchain/core/caches'
import { ChatOpenAI } from '@langchain/openai'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getModels, MODEL_TYPE } from '../../../src/modelLoader'
import { buildOpenAICompatibleChatFields, DOUBAO_DEFAULT_BASE_URL } from '../../../src/model-providers/openAICompatible'
import { fetchDoubaoChatModelOptions } from '../../../src/model-providers/doubao'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class ChatDoubao_ChatModels implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = '豆包 (火山方舟)'
        this.name = 'chatDoubao'
        this.version = 1.0
        this.type = 'ChatDoubao'
        this.icon = 'doubao.svg'
        this.category = 'Chat Models'
        this.description = '通过火山方舟 OpenAI 兼容接口调用豆包对话模型'
        this.baseClasses = [this.type, ...getBaseClasses(ChatOpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['volcengineArkApi']
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'doubao-pro-32k'
            },
            {
                label: 'Custom Model Name',
                name: 'customModelName',
                type: 'string',
                placeholder: 'ep-xxxxxxxxxxxx 或 doubao-pro-32k',
                description:
                    'Custom model name or Volcengine Ark endpoint ID (ep-xxx) to use. If provided, it will override the selected model.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.7,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Frequency Penalty',
                name: 'frequencyPenalty',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Presence Penalty',
                name: 'presencePenalty',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Stop Sequence',
                name: 'stopSequence',
                type: 'string',
                rows: 4,
                optional: true,
                description: 'List of stop words to use when generating. Use comma to separate multiple stop words.',
                additionalParams: true
            },
            {
                label: 'Base Options',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                description: 'Default headers to include with every request to the API.',
                additionalParams: true
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async listModels(nodeData: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
            const fallbackModels = async () => getModels(MODEL_TYPE.CHAT, 'chatDoubao')

            if (!nodeData.credential) return await fallbackModels()

            try {
                const credentialData = await getCredentialData(nodeData.credential ?? '', options)
                const volcengineArkApiKey = getCredentialParam('volcengineArkApiKey', credentialData, nodeData)

                if (!volcengineArkApiKey) return await fallbackModels()

                const liveModels = await fetchDoubaoChatModelOptions(volcengineArkApiKey)
                return liveModels.length ? liveModels : await fallbackModels()
            } catch (error) {
                return await fallbackModels()
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        if (nodeData.inputs?.credentialId) {
            nodeData.credential = nodeData.inputs?.credentialId
        }

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const volcengineArkApiKey = getCredentialParam('volcengineArkApiKey', credentialData, nodeData)
        const cache = nodeData.inputs?.cache as BaseCache

        const fields = buildOpenAICompatibleChatFields({
            apiKey: volcengineArkApiKey,
            modelName: nodeData.inputs?.modelName as string,
            customModelName: nodeData.inputs?.customModelName as string,
            temperature: nodeData.inputs?.temperature as string,
            streaming: nodeData.inputs?.streaming as boolean,
            maxTokens: nodeData.inputs?.maxTokens as string,
            topP: nodeData.inputs?.topP as string,
            frequencyPenalty: nodeData.inputs?.frequencyPenalty as string,
            presencePenalty: nodeData.inputs?.presencePenalty as string,
            timeout: nodeData.inputs?.timeout as string,
            stopSequence: nodeData.inputs?.stopSequence as string,
            cache,
            providerBaseURL: DOUBAO_DEFAULT_BASE_URL,
            baseOptions: nodeData.inputs?.baseOptions
        })

        const model = new ChatOpenAI(fields)
        return model
    }
}

module.exports = { nodeClass: ChatDoubao_ChatModels }
