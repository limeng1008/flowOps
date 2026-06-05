import { CloudVectorNode } from '../cloud/createCloudVectorNode'
import { createDashVectorClient } from './client'

class DashVector_VectorStores extends CloudVectorNode {
    constructor() {
        super({
            label: 'Alibaba DashVector',
            name: 'dashVector',
            type: 'DashVector',
            icon: 'dashvector.svg',
            description: '阿里云 DashVector：支持自动建集合、批量写入、向量检索、过滤和删除的国产云向量库节点',
            credentialName: 'dashVectorApi',
            providerDisplayName: '阿里云 DashVector',
            databaseLoadMethod: 'listDatabases',
            collectionLoadMethod: 'listCollections',
            createClient: createDashVectorClient
        })
    }
}

module.exports = { nodeClass: DashVector_VectorStores }
