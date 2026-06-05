import {
    createBaseNodeData,
    expectCommonNodeShape,
    expectNodeLifecycle,
    fakeProviderClient,
    resetProviderClient
} from '../cloud/cloudVectorNodeTestUtils'

jest.mock('./client', () => ({
    createBaiduVectorDBClient: jest.fn(() => fakeProviderClient)
}))

const { nodeClass: BaiduVectorDB } = require('./BaiduVectorDB')

describe('BaiduVectorDB', () => {
    beforeEach(resetProviderClient)

    it('defines a production cloud vector store node', () => {
        const node = new BaiduVectorDB()

        expect(node.label).toBe('Baidu VectorDB')
        expect(node.name).toBe('baiduVectorDB')
        expectCommonNodeShape(node, 'baiduVectorDBApi')
    })

    it('loads databases and collections with Chinese failure fallback', async () => {
        const node = new BaiduVectorDB()
        const nodeData = createBaseNodeData('baiduVectorDB', {
            endpoint: 'https://vdb.bj.baidubce.com',
            account: 'account',
            apiKey: 'api-key'
        })

        await expect(node.loadMethods.listDatabases(nodeData, {})).resolves.toEqual([{ label: 'default_db', name: 'default_db' }])
        await expect(node.loadMethods.listCollections(nodeData, {})).resolves.toEqual([
            { label: 'default_collection', name: 'default_collection' }
        ])

        fakeProviderClient.listDatabases.mockRejectedValueOnce(new Error('forbidden'))
        await expect(node.loadMethods.listDatabases(nodeData, {})).resolves.toEqual([
            { label: '无法加载百度智能云 VectorDB 数据库：forbidden', name: '' }
        ])
    })

    it('upserts, searches and deletes through the shared cloud vector lifecycle', async () => {
        const node = new BaiduVectorDB()
        await expectNodeLifecycle(node, createBaseNodeData('baiduVectorDB'))
    })
})
