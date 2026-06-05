import { CloudVectorNode } from '../cloud/createCloudVectorNode'
import { createBaiduVectorDBClient } from './client'

class BaiduVectorDB_VectorStores extends CloudVectorNode {
    constructor() {
        super({
            label: 'Baidu VectorDB',
            name: 'baiduVectorDB',
            type: 'BaiduVectorDB',
            icon: 'baiduvectordb.svg',
            description: '百度智能云 VectorDB/Mochow：支持自动建表、批量写入、向量检索、过滤和删除的国产云向量库节点',
            credentialName: 'baiduVectorDBApi',
            providerDisplayName: '百度智能云 VectorDB',
            databaseLoadMethod: 'listDatabases',
            collectionLoadMethod: 'listCollections',
            createClient: createBaiduVectorDBClient
        })
    }
}

module.exports = { nodeClass: BaiduVectorDB_VectorStores }
