import {
    createBaseNodeData,
    expectCommonNodeShape,
    expectNodeLifecycle,
    fakeProviderClient,
    resetProviderClient
} from '../cloud/cloudVectorNodeTestUtils'

jest.mock('./client', () => ({
    createDashVectorClient: jest.fn(() => fakeProviderClient)
}))

const { nodeClass: DashVector } = require('./DashVector')

describe('DashVector', () => {
    beforeEach(resetProviderClient)

    it('defines a production cloud vector store node', () => {
        const node = new DashVector()

        expect(node.label).toBe('Alibaba DashVector')
        expect(node.name).toBe('dashVector')
        expectCommonNodeShape(node, 'dashVectorApi')
    })

    it('loads databases and collections with Chinese failure fallback', async () => {
        const node = new DashVector()
        const nodeData = createBaseNodeData('dashVector', {
            endpoint: 'https://dashvector.cn-hangzhou.aliyuncs.com',
            apiKey: 'api-key'
        })

        await expect(node.loadMethods.listDatabases(nodeData, {})).resolves.toEqual([{ label: 'default_db', name: 'default_db' }])
        await expect(node.loadMethods.listCollections(nodeData, {})).resolves.toEqual([
            { label: 'default_collection', name: 'default_collection' }
        ])

        fakeProviderClient.listCollections.mockRejectedValueOnce(new Error('timeout'))
        await expect(node.loadMethods.listCollections(nodeData, {})).resolves.toEqual([
            { label: '无法加载阿里云 DashVector 集合：timeout', name: '' }
        ])
    })

    it('upserts, searches and deletes through the shared cloud vector lifecycle', async () => {
        const node = new DashVector()
        await expectNodeLifecycle(node, createBaseNodeData('dashVector'))
    })
})
