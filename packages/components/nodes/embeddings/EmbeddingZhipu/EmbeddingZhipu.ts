import { OpenAIEmbeddings } from '@langchain/openai'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getModels, MODEL_TYPE } from '../../../src/modelLoader'
import { buildOpenAICompatibleEmbeddingFields } from '../../../src/model-providers/openAICompatibleEmbedding'
import { ZHIPU_DEFAULT_BASE_URL } from '../../../src/model-providers/openAICompatible'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class EmbeddingZhipu_Embeddings implements INode {
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
        this.label = '智谱文本向量模型'
        this.name = 'embeddingZhipu'
        this.version = 1.0
        this.type = 'ZhipuEmbedding'
        this.icon = 'zhipu.svg'
        this.category = 'Embeddings'
        this.description = '通过智谱 OpenAI 兼容接口调用 embedding-3 等文本向量模型，用于知识库检索'
        this.baseClasses = [this.type, ...getBaseClasses(OpenAIEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['zhipuAIApi']
        }
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'embedding-3'
            },
            {
                label: 'Custom Model Name',
                name: 'customModelName',
                type: 'string',
                placeholder: 'embedding-3',
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
            return await getModels(MODEL_TYPE.EMBEDDING, 'embeddingZhipu')
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const zhipuAIApiKey = getCredentialParam('zhipuAIApiKey', credentialData, nodeData)

        const fields = buildOpenAICompatibleEmbeddingFields({
            apiKey: zhipuAIApiKey,
            modelName: nodeData.inputs?.modelName as string,
            customModelName: nodeData.inputs?.customModelName as string,
            stripNewLines: nodeData.inputs?.stripNewLines as boolean,
            batchSize: nodeData.inputs?.batchSize as string,
            timeout: nodeData.inputs?.timeout as string,
            dimensions: nodeData.inputs?.dimensions as string,
            providerBaseURL: ZHIPU_DEFAULT_BASE_URL,
            baseOptions: nodeData.inputs?.baseOptions
        })

        const model = new OpenAIEmbeddings(fields)
        return model
    }
}

module.exports = { nodeClass: EmbeddingZhipu_Embeddings }
