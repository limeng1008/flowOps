import { Embeddings } from '@langchain/core/embeddings'
import { ICommonObject, INode, INodeData, INodeParams, IndexingResult } from '../../../src/Interface'
import {
    CloudVectorProviderClient,
    getCloudVectorOutputs,
    getCommonCloudVectorInputs,
    loadCloudVectorOptions,
    resolveCloudVectorOutput,
    runCloudVectorDelete,
    runCloudVectorUpsert
} from './CloudVectorStoreUtils'

export type CloudVectorNodeConfig = {
    label: string
    name: string
    type: string
    icon: string
    description: string
    credentialName: string
    providerDisplayName: string
    databaseLoadMethod: string
    collectionLoadMethod: string
    createClient: (nodeData: INodeData, options?: ICommonObject) => Promise<CloudVectorProviderClient> | CloudVectorProviderClient
}

export abstract class CloudVectorNode implements INode {
    label: string
    name: string
    version = 1.0
    description: string
    type: string
    icon: string
    category = 'Vector Stores'
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams
    outputs: any[]
    protected readonly config: CloudVectorNodeConfig

    constructor(config: CloudVectorNodeConfig) {
        this.config = config
        this.label = config.label
        this.name = config.name
        this.type = config.type
        this.icon = config.icon
        this.description = config.description
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: true,
            credentialNames: [config.credentialName]
        }
        this.inputs = getCommonCloudVectorInputs(config.databaseLoadMethod, config.collectionLoadMethod)
        this.outputs = getCloudVectorOutputs(config.label, this.type)
    }

    loadMethods = {
        listDatabases: async (nodeData: INodeData, options?: ICommonObject) => {
            const client = await this.config.createClient(nodeData, options)
            return await loadCloudVectorOptions(
                this.config.providerDisplayName,
                () => client.listDatabases?.() ?? Promise.resolve([]),
                '数据库'
            )
        },
        listCollections: async (nodeData: INodeData, options?: ICommonObject) => {
            const client = await this.config.createClient(nodeData, options)
            return await loadCloudVectorOptions(
                this.config.providerDisplayName,
                () => client.listCollections?.(nodeData.inputs?.databaseName as string) ?? Promise.resolve([]),
                '集合'
            )
        }
    }

    //@ts-ignore
    vectorStoreMethods = {
        upsert: async (nodeData: INodeData, options?: ICommonObject): Promise<Partial<IndexingResult>> => {
            const client = await this.config.createClient(nodeData, options)
            return await runCloudVectorUpsert(nodeData, options ?? {}, client, this.config.providerDisplayName, this.type)
        },
        search: async (nodeData: INodeData, options?: ICommonObject): Promise<any> => {
            const embeddings = nodeData.inputs?.embeddings as Embeddings
            const client = await this.config.createClient(nodeData, options)
            const store = resolveCloudVectorOutput(nodeData, embeddings, client, this.config.providerDisplayName, this.type) as any
            return await store.similaritySearch(
                nodeData.inputs?.query as string,
                nodeData.inputs?.topK ? parseFloat(nodeData.inputs.topK as string) : 4
            )
        },
        delete: async (nodeData: INodeData, ids: string[], options?: ICommonObject): Promise<void> => {
            const client = await this.config.createClient(nodeData, options)
            await runCloudVectorDelete(nodeData, ids, client, this.config.providerDisplayName, this.type)
        }
    }

    async init(nodeData: INodeData, _: string, options?: ICommonObject): Promise<any> {
        const embeddings = nodeData.inputs?.embeddings as Embeddings
        const client = await this.config.createClient(nodeData, options)
        return resolveCloudVectorOutput(nodeData, embeddings, client, this.config.providerDisplayName, this.type)
    }
}
