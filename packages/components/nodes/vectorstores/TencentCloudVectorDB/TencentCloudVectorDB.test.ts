import {
    createBaseNodeData,
    createFakeRecordManager,
    expectCommonNodeShape,
    expectNodeLifecycle,
    fakeProviderClient,
    resetProviderClient
} from '../cloud/cloudVectorNodeTestUtils'

jest.mock('./client', () => ({
    createTencentCloudVectorDBClient: jest.fn(() => fakeProviderClient)
}))

const { nodeClass: TencentCloudVectorDB } = require('./TencentCloudVectorDB')

describe('TencentCloudVectorDB', () => {
    beforeEach(resetProviderClient)

    it('defines a production cloud vector store node', () => {
        const node = new TencentCloudVectorDB()

        expect(node.label).toBe('Tencent Cloud VectorDB')
        expect(node.name).toBe('tencentCloudVectorDB')
        expectCommonNodeShape(node, 'tencentCloudVectorDBApi')
    })

    it('loads databases and collections with Chinese failure fallback', async () => {
        const node = new TencentCloudVectorDB()
        const nodeData = createBaseNodeData('tencentCloudVectorDB', {
            endpoint: 'https://vectordb.tencentcloudapi.com',
            apiKey: 'api-key'
        })

        await expect(node.loadMethods.listDatabases(nodeData, {})).resolves.toEqual([{ label: 'default_db', name: 'default_db' }])
        await expect(node.loadMethods.listCollections(nodeData, {})).resolves.toEqual([
            { label: 'default_collection', name: 'default_collection' }
        ])

        fakeProviderClient.listDatabases.mockRejectedValueOnce(new Error('network down'))
        await expect(node.loadMethods.listDatabases(nodeData, {})).resolves.toEqual([
            { label: '无法加载腾讯云 VectorDB 数据库：network down', name: '' }
        ])
    })

    it('upserts, searches and deletes through the shared cloud vector lifecycle', async () => {
        const node = new TencentCloudVectorDB()
        await expectNodeLifecycle(node, createBaseNodeData('tencentCloudVectorDB'))
    })

    it('uses Record Manager for dedupe and cleanup when configured', async () => {
        const node = new TencentCloudVectorDB()
        const recordManager = createFakeRecordManager()

        const result = await node.vectorStoreMethods.upsert(
            createBaseNodeData('tencentCloudVectorDB', {
                recordManager
            }),
            {}
        )

        expect(recordManager.createSchema).toHaveBeenCalled()
        expect(recordManager.update).toHaveBeenCalled()
        expect(result.numAdded).toBe(1)
    })

    it('cleans cloud vectors and Record Manager keys by document id', async () => {
        const node = new TencentCloudVectorDB()
        const recordManager = createFakeRecordManager()
        recordManager.listKeys.mockResolvedValueOnce(['record-uid-1', 'record-uid-2'])

        await node.vectorStoreMethods.delete(
            createBaseNodeData('tencentCloudVectorDB', {
                recordManager
            }),
            [],
            { docId: 'doc-source-1' }
        )

        expect(recordManager.createSchema).toHaveBeenCalled()
        expect(recordManager.listKeys).toHaveBeenCalledWith({ docId: 'doc-source-1' })
        expect(fakeProviderClient.delete).toHaveBeenCalledWith(
            expect.objectContaining({
                ids: ['record-uid-1', 'record-uid-2']
            })
        )
        expect(recordManager.deleteKeys).toHaveBeenCalledWith(['record-uid-1', 'record-uid-2'])
    })
})
