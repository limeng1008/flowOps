import { ICommonObject, INodeData } from '../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { CloudVectorHttpClient, normalizeSearchResults } from '../cloud/httpClient'
import { CloudVectorProviderClient } from '../cloud/CloudVectorStoreUtils'

export const createDashVectorClient = async (nodeData: INodeData, options?: ICommonObject): Promise<CloudVectorProviderClient> => {
    const credentialData = await getCredentialData(nodeData.credential ?? '', options ?? {})
    const endpoint = getCredentialParam('endpoint', credentialData, nodeData)
    const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

    return new CloudVectorHttpClient({
        endpoint,
        headers: {
            'dashvector-auth-token': apiKey,
            Authorization: apiKey ? `Bearer ${apiKey}` : undefined
        },
        paths: {
            listDatabases: '/v1/databases',
            listCollections: '/v1/collections',
            createCollection: '/v1/collections/create',
            upsert: '/v1/collections/upsert',
            search: '/v1/collections/query',
            delete: '/v1/collections/delete-docs'
        },
        mapBody: (_, body) => ({
            database: body.databaseName,
            collection: body.collectionName,
            name: body.collectionName,
            dimension: body.vectorDimension,
            metric: body.metric,
            fields: body.fields,
            index: body.indexParams,
            docs: body.documents?.map((doc: any) => ({
                id: doc.id,
                vector: doc.vector,
                fields: {
                    [body.fields.textField]: doc.text,
                    [body.fields.metadataField]: doc.metadata
                }
            })),
            vector: body.vector,
            topk: body.topK,
            filter: body.filter,
            includeVector: body.includeVector,
            includeMetadata: body.includeMetadata,
            ids: body.ids
        }),
        mapSearchResults: (data) => normalizeSearchResults(data?.output ?? data?.docs ?? data?.documents ?? data?.results ?? [])
    })
}
