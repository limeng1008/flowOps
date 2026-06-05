import axios from 'axios'
import { Signer } from '@volcengine/openapi'
import { ICommonObject, INodeData } from '../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import {
    CloudVectorDeleteParams,
    CloudVectorEnsureCollectionParams,
    CloudVectorProviderClient,
    CloudVectorSearchParams,
    CloudVectorSearchResult,
    CloudVectorUpsertParams
} from '../cloud/CloudVectorStoreUtils'
import { normalizeNames, normalizeSearchResults } from '../cloud/httpClient'

type VikingDBCredentials = {
    endpoint: string
    region: string
    accessKeyId: string
    secretAccessKey: string
}

export class VikingDBClient implements CloudVectorProviderClient {
    private readonly credentials: VikingDBCredentials

    constructor(credentials: VikingDBCredentials) {
        this.credentials = credentials
    }

    async listDatabases(): Promise<string[]> {
        const response = await this.request('/api/databases/list', {})
        return normalizeNames(response.databases ?? response.data ?? [])
    }

    async listCollections(databaseName?: string): Promise<string[]> {
        const response = await this.request('/api/collections/list', { database: databaseName })
        return normalizeNames(response.collections ?? response.indexes ?? response.data ?? [])
    }

    async ensureCollection(params: CloudVectorEnsureCollectionParams): Promise<void> {
        if (!params.autoCreate) return
        await this.request('/api/collections/create', {
            database: params.databaseName,
            collection: params.collectionName,
            dimension: params.vectorDimension,
            metric: params.metric,
            fields: params.fields,
            index: params.indexParams
        })
    }

    async upsert(params: CloudVectorUpsertParams): Promise<void> {
        await this.request('/api/data/upsert', {
            database: params.databaseName,
            collection: params.collectionName,
            data: params.documents.map((doc) => ({
                id: doc.id,
                fields: {
                    [params.fields.textField]: doc.text,
                    [params.fields.vectorField]: doc.vector,
                    [params.fields.metadataField]: doc.metadata
                }
            }))
        })
    }

    async search(params: CloudVectorSearchParams): Promise<CloudVectorSearchResult[]> {
        const response = await this.request('/api/data/search', {
            database: params.databaseName,
            collection: params.collectionName,
            vector: params.vector,
            topK: params.topK,
            filter: params.filter,
            includeMetadata: params.includeMetadata,
            includeVector: params.includeVector
        })
        return normalizeSearchResults(response.results ?? response.data ?? [])
    }

    async delete(params: CloudVectorDeleteParams): Promise<void> {
        await this.request('/api/data/delete', {
            database: params.databaseName,
            collection: params.collectionName,
            ids: params.ids
        })
    }

    private async request(path: string, body: Record<string, any>): Promise<any> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }
        const requestData: any = {
            region: this.credentials.region,
            method: 'POST',
            pathname: path,
            headers,
            body: JSON.stringify(body)
        }
        try {
            const signer = new Signer(requestData, 'vikingdb')
            signer.addAuthorization({
                accessKeyId: this.credentials.accessKeyId,
                secretKey: this.credentials.secretAccessKey
            })
        } catch (e) {
            headers.Authorization = `Bearer ${this.credentials.accessKeyId}:${this.credentials.secretAccessKey}`
        }

        const response = await axios.post(`${this.credentials.endpoint.replace(/\/$/, '')}${path}`, body, { headers })
        return response.data
    }
}

export const createVikingDBClient = async (nodeData: INodeData, options?: ICommonObject): Promise<CloudVectorProviderClient> => {
    const credentialData = await getCredentialData(nodeData.credential ?? '', options ?? {})
    return new VikingDBClient({
        endpoint: getCredentialParam('endpoint', credentialData, nodeData),
        region: getCredentialParam('region', credentialData, nodeData),
        accessKeyId: getCredentialParam('accessKeyId', credentialData, nodeData),
        secretAccessKey: getCredentialParam('secretAccessKey', credentialData, nodeData)
    })
}
