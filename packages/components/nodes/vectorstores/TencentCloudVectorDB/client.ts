import { ICommonObject, INodeData } from '../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { CloudVectorHttpClient, normalizeSearchResults } from '../cloud/httpClient'
import { CloudVectorProviderClient } from '../cloud/CloudVectorStoreUtils'

export const createTencentCloudVectorDBClient = async (
    nodeData: INodeData,
    options?: ICommonObject
): Promise<CloudVectorProviderClient> => {
    const credentialData = await getCredentialData(nodeData.credential ?? '', options ?? {})
    const endpoint = getCredentialParam('endpoint', credentialData, nodeData)
    const username = getCredentialParam('username', credentialData, nodeData)
    const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
    const secretId = getCredentialParam('secretId', credentialData, nodeData)
    const secretKey = getCredentialParam('secretKey', credentialData, nodeData)

    return new CloudVectorHttpClient({
        endpoint,
        headers: {
            Authorization: apiKey ? `Bearer ${apiKey}` : undefined,
            'X-TC-Username': username,
            'X-TC-SecretId': secretId,
            'X-TC-SecretKey': secretKey
        },
        paths: {
            listDatabases: '/database/list',
            listCollections: '/collection/list',
            createCollection: '/collection/create',
            upsert: '/document/upsert',
            search: '/document/search',
            delete: '/document/delete'
        },
        mapBody: (_, body) => ({
            database: body.databaseName,
            collection: body.collectionName,
            dimension: body.vectorDimension,
            metricType: body.metric,
            fields: body.fields,
            indexes: body.indexParams,
            documents: body.documents,
            vector: body.vector,
            limit: body.topK,
            filter: body.filter,
            includeMetadata: body.includeMetadata,
            includeVector: body.includeVector,
            ids: body.ids
        }),
        mapSearchResults: (data) => normalizeSearchResults(data?.documents ?? data?.result?.documents ?? data?.data ?? [])
    })
}
