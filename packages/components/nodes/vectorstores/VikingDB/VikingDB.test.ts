import {
    createBaseNodeData,
    expectCommonNodeShape,
    expectNodeLifecycle,
    fakeProviderClient,
    resetProviderClient
} from '../cloud/cloudVectorNodeTestUtils'

jest.mock('./client', () => ({
    createVikingDBClient: jest.fn(() => fakeProviderClient)
}))

const { nodeClass: VikingDB } = require('./VikingDB')

describe('VikingDB', () => {
    beforeEach(resetProviderClient)

    it('defines a production cloud vector store node', () => {
        const node = new VikingDB()

        expect(node.label).toBe('Volcengine VikingDB')
        expect(node.name).toBe('vikingDB')
        expectCommonNodeShape(node, 'vikingDBApi')
    })

    it('loads databases and collections with Chinese failure fallback', async () => {
        const node = new VikingDB()
        const nodeData = createBaseNodeData('vikingDB', {
            endpoint: 'https://api-vikingdb.volces.com',
            region: 'cn-beijing',
            accessKeyId: 'ak',
            secretAccessKey: 'sk'
        })

        await expect(node.loadMethods.listDatabases(nodeData, {})).resolves.toEqual([{ label: 'default_db', name: 'default_db' }])
        await expect(node.loadMethods.listCollections(nodeData, {})).resolves.toEqual([
            { label: 'default_collection', name: 'default_collection' }
        ])

        fakeProviderClient.listCollections.mockRejectedValueOnce(new Error('signature invalid'))
        await expect(node.loadMethods.listCollections(nodeData, {})).resolves.toEqual([
            { label: '无法加载火山引擎 VikingDB 集合：signature invalid', name: '' }
        ])
    })

    it('upserts, searches and deletes through the shared cloud vector lifecycle', async () => {
        const node = new VikingDB()
        await expectNodeLifecycle(node, createBaseNodeData('vikingDB'))
    })
})
