import axios from 'axios'
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

type BaiduVectorDBCredentials = {
    endpoint: string
    account: string
    apiKey: string
}

export class BaiduVectorDBClient implements CloudVectorProviderClient {
    private readonly credentials: BaiduVectorDBCredentials
    private readonly sdkClient: any

    constructor(credentials: BaiduVectorDBCredentials) {
        this.credentials = credentials
        this.sdkClient = createMochowClient(credentials)
    }

    async listDatabases(): Promise<string[]> {
        if (this.sdkClient?.listDatabases) return normalizeNames(await this.sdkClient.listDatabases())
        if (this.sdkClient?.listDatabase) return normalizeNames(await this.sdkClient.listDatabase())
        const response = await this.http('/v1/database/list', {})
        return normalizeNames(response.databases ?? response.data ?? [])
    }

    async listCollections(databaseName?: string): Promise<string[]> {
        if (this.sdkClient?.listTables) return normalizeNames(await this.sdkClient.listTables(databaseName))
        if (this.sdkClient?.listTable) return normalizeNames(await this.sdkClient.listTable(databaseName))
        const response = await this.http('/v1/table/list', { database: databaseName })
        return normalizeNames(response.tables ?? response.collections ?? response.data ?? [])
    }

    async ensureCollection(params: CloudVectorEnsureCollectionParams): Promise<void> {
        if (!params.autoCreate) return
        if (this.sdkClient?.createTable) {
            await this.sdkClient.createTable(params.databaseName, params.collectionName, {
                dimension: params.vectorDimension,
                metricType: params.metric,
                fields: params.fields,
                indexParams: params.indexParams
            })
            return
        }
        await this.http('/v1/table/create', {
            database: params.databaseName,
            table: params.collectionName,
            dimension: params.vectorDimension,
            metric: params.metric,
            fields: params.fields,
            index: params.indexParams
        })
    }

    async upsert(params: CloudVectorUpsertParams): Promise<void> {
        const rows = params.documents.map((doc) => ({
            [params.fields.idField]: doc.id,
            [params.fields.textField]: doc.text,
            [params.fields.vectorField]: doc.vector,
            [params.fields.metadataField]: doc.metadata
        }))
        if (this.sdkClient?.upsertRows) {
            await this.sdkClient.upsertRows(params.databaseName, params.collectionName, rows)
            return
        }
        await this.http('/v1/row/upsert', {
            database: params.databaseName,
            table: params.collectionName,
            rows
        })
    }

    async search(params: CloudVectorSearchParams): Promise<CloudVectorSearchResult[]> {
        if (this.sdkClient?.searchRows) {
            return normalizeSearchResults(
                await this.sdkClient.searchRows(params.databaseName, params.collectionName, {
                    vector: params.vector,
                    topK: params.topK,
                    filter: params.filter
                })
            )
        }
        const response = await this.http('/v1/row/search', {
            database: params.databaseName,
            table: params.collectionName,
            vector: params.vector,
            topK: params.topK,
            filter: params.filter,
            includeMetadata: params.includeMetadata,
            includeVector: params.includeVector
        })
        return normalizeSearchResults(response.rows ?? response.results ?? response.data ?? [])
    }

    async delete(params: CloudVectorDeleteParams): Promise<void> {
        if (this.sdkClient?.deleteRows) {
            await this.sdkClient.deleteRows(params.databaseName, params.collectionName, params.ids)
            return
        }
        await this.http('/v1/row/delete', {
            database: params.databaseName,
            table: params.collectionName,
            ids: params.ids
        })
    }

    private async http(path: string, body: Record<string, any>): Promise<any> {
        const response = await axios.post(`${this.credentials.endpoint.replace(/\/$/, '')}${path}`, body, {
            headers: {
                Authorization: `Bearer ${this.credentials.apiKey}`,
                'X-Baidu-Account': this.credentials.account
            }
        })
        return response.data
    }
}

export const createBaiduVectorDBClient = async (nodeData: INodeData, options?: ICommonObject): Promise<CloudVectorProviderClient> => {
    const credentialData = await getCredentialData(nodeData.credential ?? '', options ?? {})
    return new BaiduVectorDBClient({
        endpoint: getCredentialParam('endpoint', credentialData, nodeData),
        account: getCredentialParam('account', credentialData, nodeData),
        apiKey: getCredentialParam('apiKey', credentialData, nodeData)
    })
}

const createMochowClient = (credentials: BaiduVectorDBCredentials): any => {
    try {
        const mochow = require('@mochow/mochow-sdk-node')
        const MochowClient = mochow.MochowClient ?? mochow.default ?? mochow
        return new MochowClient({
            endpoint: credentials.endpoint,
            credential: {
                account: credentials.account,
                apiKey: credentials.apiKey
            }
        })
    } catch (e) {
        return undefined
    }
}
