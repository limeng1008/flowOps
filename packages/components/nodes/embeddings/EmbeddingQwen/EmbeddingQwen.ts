import { OpenAIEmbeddings } from '@langchain/openai'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getModels, MODEL_TYPE } from '../../../src/modelLoader'
import { buildOpenAICompatibleEmbeddingFields } from '../../../src/model-providers/openAICompatibleEmbedding'
import { QWEN_DEFAULT_BASE_URL } from '../../../src/model-providers/openAICompatible'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class EmbeddingQwen_Embeddings implements INode {
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
        this.label = '通义 Embedding'
        this.name = 'embeddingQwen'
        this.version = 1.0
        this.type = 'QwenEmbedding'
        this.icon = 'qwen.svg'
        this.category = 'Embeddings'
        this.description = 'Alibaba DashScope (Qwen) embedding models that use the OpenAI-compatible endpoint'
        this.baseClasses = [this.type, ...getBaseClasses(OpenAIEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['dashScopeApi']
        }
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'text-embedding-v3'
            },
            {
                label: 'Custom Model Name',
                name: 'customModelName',
                type: 'string',
                placeholder: 'text-embedding-v3',
                description: 'Custom model name to use. If provided, it will override the selected model.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Strip New Lines',
                name: 'stripNewLines',
                type: 'boolean',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Batch Size',
                name: 'batchSize',
                type: 'number',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Dimensions',
                name: 'dimensions',
                type: 'number',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                optional: true,
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
        async listModels(): Promise<INodeOptionsValue[]> {
            return await getModels(MODEL_TYPE.EMBEDDING, 'embeddingQwen')
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const dashScopeApiKey = getCredentialParam('dashScopeApiKey', credentialData, nodeData)

        const fields = buildOpenAICompatibleEmbeddingFields({
            apiKey: dashScopeApiKey,
            modelName: nodeData.inputs?.modelName as string,
            customModelName: nodeData.inputs?.customModelName as string,
            stripNewLines: nodeData.inputs?.stripNewLines as boolean,
            batchSize: nodeData.inputs?.batchSize as string,
            timeout: nodeData.inputs?.timeout as string,
            dimensions: nodeData.inputs?.dimensions as string,
            providerBaseURL: QWEN_DEFAULT_BASE_URL,
            baseOptions: nodeData.inputs?.baseOptions
        })

        const model = new OpenAIEmbeddings(fields)
        return model
    }
}

module.exports = { nodeClass: EmbeddingQwen_Embeddings }
