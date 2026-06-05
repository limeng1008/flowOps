import { Document } from '@langchain/core/documents'
import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import { CloudVectorStore } from './CloudVectorStoreUtils'
import { CloudVectorHttpClient } from './httpClient'

type CapturedRequest = {
    url?: string
    headers: Record<string, string | string[] | undefined>
    body: Record<string, any>
}

const embeddings = {
    embedDocuments: jest.fn(async (texts: string[]) => texts.map(() => [0.1, 0.2, 0.3])),
    embedQuery: jest.fn(async () => [0.1, 0.2, 0.3])
}

describe('CloudVectorHttpClient integration', () => {
    let server: Server
    let endpoint: string
    let requests: CapturedRequest[] = []
    let upsertAttempts = 0

    beforeAll(async () => {
        server = createServer((request, response) => {
            let rawBody = ''
            request.on('data', (chunk) => {
                rawBody += chunk
            })
            request.on('end', () => {
                const body = rawBody ? JSON.parse(rawBody) : {}
                requests.push({
                    url: request.url,
                    headers: request.headers,
                    body
                })

                if (request.url === '/databases/list') {
                    sendJson(response, 200, { databases: ['db_cn'] })
                    return
                }
                if (request.url === '/collections/list') {
                    sendJson(response, 200, { collections: ['kb_collection'] })
                    return
                }
                if (request.url === '/collections/create') {
                    sendJson(response, 200, { ok: true })
                    return
                }
                if (request.url === '/vectors/upsert') {
                    upsertAttempts += 1
                    if (upsertAttempts === 1) {
                        sendJson(response, 429, { message: 'Too many requests' })
                        return
                    }
                    sendJson(response, 200, { ok: true })
                    return
                }
                if (request.url === '/vectors/search') {
                    sendJson(response, 200, {
                        results: [
                            {
                                id: 'doc-1',
                                text: '命中文档',
                                metadata: { source: 'manual.md' },
                                score: 0.92
                            }
                        ]
                    })
                    return
                }
                if (request.url === '/vectors/delete') {
                    sendJson(response, 200, { ok: true })
                    return
                }

                sendJson(response, 404, { message: `Unexpected path ${request.url}` })
            })
        })

        await new Promise<void>((resolve) => {
            server.listen(0, '127.0.0.1', resolve)
        })
        const address = server.address() as AddressInfo
        endpoint = `http://127.0.0.1:${address.port}`
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()))
        })
    })

    beforeEach(() => {
        requests = []
        upsertAttempts = 0
        jest.clearAllMocks()
    })

    it('uses a mock HTTP server for discovery, auto create, retry, search and delete', async () => {
        const client = new CloudVectorHttpClient({
            endpoint,
            headers: {
                'x-api-key': 'test-key'
            },
            paths: {
                listDatabases: '/databases/list',
                listCollections: '/collections/list',
                createCollection: '/collections/create',
                upsert: '/vectors/upsert',
                search: '/vectors/search',
                delete: '/vectors/delete'
            }
        })

        await expect(client.listDatabases()).resolves.toEqual(['db_cn'])
        await expect(client.listCollections('db_cn')).resolves.toEqual(['kb_collection'])

        const store = new CloudVectorStore(embeddings as any, {
            providerName: '测试云向量库',
            typeName: 'TestCloudVector',
            client,
            resource: { databaseName: 'db_cn', collectionName: 'kb_collection' },
            fields: {
                idField: 'id',
                textField: 'content',
                vectorField: 'vector',
                metadataField: 'metadata'
            },
            autoCreate: true,
            vectorDimension: 3,
            metric: 'cosine',
            batchSize: 1,
            retryCount: 1,
            retryDelayMs: 1
        })

        await expect(
            store.addDocuments([new Document({ pageContent: '知识库内容', metadata: { docId: 'doc-1', source: 'manual.md' } })], {
                chatId: 'chat-001'
            })
        ).resolves.toEqual(['doc-1'])

        const createRequest = requests.find((request) => request.url === '/collections/create')
        expect(createRequest?.body).toEqual(
            expect.objectContaining({
                databaseName: 'db_cn',
                collectionName: 'kb_collection',
                vectorDimension: 3,
                metric: 'cosine'
            })
        )

        const upsertRequests = requests.filter((request) => request.url === '/vectors/upsert')
        expect(upsertRequests).toHaveLength(2)
        expect(upsertRequests[1].headers['x-api-key']).toBe('test-key')
        expect(upsertRequests[1].body.documents[0]).toEqual(
            expect.objectContaining({
                id: 'doc-1',
                text: '知识库内容',
                vector: [0.1, 0.2, 0.3],
                metadata: expect.objectContaining({
                    id: 'doc-1',
                    source: 'manual.md',
                    flowise_chatId: 'chat-001'
                })
            })
        )

        const results = await store.similaritySearchVectorWithScore([0.1, 0.2, 0.3], 4, { source: 'manual.md' })
        expect(results[0][0].pageContent).toBe('命中文档')
        expect(results[0][0].metadata).toEqual({ source: 'manual.md', id: 'doc-1' })
        expect(results[0][1]).toBe(0.92)

        const searchRequest = requests.find((request) => request.url === '/vectors/search')
        expect(searchRequest?.body).toEqual(
            expect.objectContaining({
                topK: 4,
                filter: { source: 'manual.md' },
                includeMetadata: true,
                includeVector: false
            })
        )

        await store.delete({ ids: ['doc-1'] })
        const deleteRequest = requests.find((request) => request.url === '/vectors/delete')
        expect(deleteRequest?.body.ids).toEqual(['doc-1'])
    })
})

const sendJson = (response: any, statusCode: number, body: Record<string, any>) => {
    response.writeHead(statusCode, { 'content-type': 'application/json' })
    response.end(JSON.stringify(body))
}
