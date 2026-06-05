import axios, { AxiosInstance } from 'axios'
import {
    CloudVectorDeleteParams,
    CloudVectorEnsureCollectionParams,
    CloudVectorProviderClient,
    CloudVectorSearchParams,
    CloudVectorSearchResult,
    CloudVectorUpsertParams
} from './CloudVectorStoreUtils'

type CloudHttpClientConfig = {
    endpoint: string
    headers?: Record<string, string | undefined>
    paths: {
        listDatabases: string
        listCollections: string
        createCollection: string
        upsert: string
        search: string
        delete: string
    }
    mapHeaders?: (headers: Record<string, string>) => Record<string, string>
    mapBody?: (action: string, body: Record<string, any>) => Record<string, any>
    mapSearchResults?: (response: any) => CloudVectorSearchResult[]
}

export class CloudVectorHttpClient implements CloudVectorProviderClient {
    private readonly client: AxiosInstance
    private readonly paths: CloudHttpClientConfig['paths']
    private readonly mapBody?: CloudHttpClientConfig['mapBody']
    private readonly mapSearchResults?: CloudHttpClientConfig['mapSearchResults']

    constructor(config: CloudHttpClientConfig) {
        const headers = Object.entries(config.headers ?? {}).reduce((acc, [key, value]) => {
            if (value) acc[key] = value
            return acc
        }, {} as Record<string, string>)
        this.client = axios.create({
            baseURL: config.endpoint.replace(/\/$/, ''),
            headers: config.mapHeaders ? config.mapHeaders(headers) : headers
        })
        this.paths = config.paths
        this.mapBody = config.mapBody
        this.mapSearchResults = config.mapSearchResults
    }

    async listDatabases(): Promise<string[]> {
        const response = await this.client.post(this.paths.listDatabases, this.body('listDatabases', {}))
        return normalizeNames(
            response.data?.databases ?? response.data?.databaseNames ?? response.data?.data ?? response.data?.result ?? []
        )
    }

    async listCollections(databaseName?: string): Promise<string[]> {
        const response = await this.client.post(this.paths.listCollections, this.body('listCollections', { databaseName }))
        return normalizeNames(
            response.data?.collections ??
                response.data?.collectionNames ??
                response.data?.tables ??
                response.data?.data ??
                response.data?.result ??
                []
        )
    }

    async ensureCollection(params: CloudVectorEnsureCollectionParams): Promise<void> {
        if (!params.autoCreate) return
        await this.client.post(this.paths.createCollection, this.body('createCollection', params))
    }

    async upsert(params: CloudVectorUpsertParams): Promise<void> {
        await this.client.post(this.paths.upsert, this.body('upsert', params))
    }

    async search(params: CloudVectorSearchParams): Promise<CloudVectorSearchResult[]> {
        const response = await this.client.post(this.paths.search, this.body('search', params))
        if (this.mapSearchResults) return this.mapSearchResults(response.data)
        return normalizeSearchResults(response.data?.documents ?? response.data?.results ?? response.data?.data ?? [])
    }

    async delete(params: CloudVectorDeleteParams): Promise<void> {
        await this.client.post(this.paths.delete, this.body('delete', params))
    }

    private body(action: string, body: Record<string, any>): Record<string, any> {
        return this.mapBody ? this.mapBody(action, body) : body
    }
}

export const normalizeNames = (values: any[]): string[] => {
    if (!Array.isArray(values)) return []
    return values
        .map((value) => {
            if (typeof value === 'string') return value
            return value?.name ?? value?.databaseName ?? value?.collectionName ?? value?.tableName
        })
        .filter(Boolean)
}

export const normalizeSearchResults = (values: any[]): CloudVectorSearchResult[] => {
    if (!Array.isArray(values)) return []
    return values.map((value) => ({
        id: value.id ?? value.documentId ?? value.primaryKey,
        text: value.text ?? value.content ?? value.pageContent,
        metadata: value.metadata ?? value.fields?.metadata ?? value.extra ?? {},
        score: value.score ?? value.distance ?? value.similarity,
        vector: value.vector
    }))
}
