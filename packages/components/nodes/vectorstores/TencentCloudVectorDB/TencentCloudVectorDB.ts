import { CloudVectorNode } from '../cloud/createCloudVectorNode'
import { createTencentCloudVectorDBClient } from './client'

class TencentCloudVectorDB_VectorStores extends CloudVectorNode {
    constructor() {
        super({
            label: 'Tencent Cloud VectorDB',
            name: 'tencentCloudVectorDB',
            type: 'TencentCloudVectorDB',
            icon: 'tencentcloudvectordb.svg',
            description: '腾讯云 VectorDB：支持自动建集合、批量写入、向量检索、过滤和删除的国产云向量库节点',
            credentialName: 'tencentCloudVectorDBApi',
            providerDisplayName: '腾讯云 VectorDB',
            databaseLoadMethod: 'listDatabases',
            collectionLoadMethod: 'listCollections',
            createClient: createTencentCloudVectorDBClient
        })
    }
}

module.exports = { nodeClass: TencentCloudVectorDB_VectorStores }
