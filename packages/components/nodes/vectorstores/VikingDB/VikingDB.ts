import { CloudVectorNode } from '../cloud/createCloudVectorNode'
import { createVikingDBClient } from './client'

class VikingDB_VectorStores extends CloudVectorNode {
    constructor() {
        super({
            label: 'Volcengine VikingDB',
            name: 'vikingDB',
            type: 'VikingDB',
            icon: 'vikingdb.svg',
            description: '火山引擎 VikingDB：支持自动建集合、批量写入、向量检索、过滤和删除的国产云向量库节点',
            credentialName: 'vikingDBApi',
            providerDisplayName: '火山引擎 VikingDB',
            databaseLoadMethod: 'listDatabases',
            collectionLoadMethod: 'listCollections',
            createClient: createVikingDBClient
        })
    }
}

module.exports = { nodeClass: VikingDB_VectorStores }
