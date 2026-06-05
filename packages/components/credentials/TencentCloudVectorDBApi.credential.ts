import { INodeParams, INodeCredential } from '../src/Interface'

class TencentCloudVectorDBApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Tencent Cloud VectorDB API'
        this.name = 'tencentCloudVectorDBApi'
        this.version = 1.0
        this.description = '腾讯云 VectorDB 连接凭证'
        this.inputs = [
            { label: 'Endpoint', name: 'endpoint', type: 'url', placeholder: 'https://vectordb.tencentcloudapi.com' },
            { label: 'Username', name: 'username', type: 'string', optional: true },
            { label: 'API Key', name: 'apiKey', type: 'password', optional: true },
            { label: 'Secret ID', name: 'secretId', type: 'password', optional: true },
            { label: 'Secret Key', name: 'secretKey', type: 'password', optional: true }
        ]
    }
}

module.exports = { credClass: TencentCloudVectorDBApi }
