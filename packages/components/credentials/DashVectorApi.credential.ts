import { INodeParams, INodeCredential } from '../src/Interface'

class DashVectorApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Alibaba DashVector API'
        this.name = 'dashVectorApi'
        this.version = 1.0
        this.description = '阿里云 DashVector 连接凭证'
        this.inputs = [
            { label: 'Endpoint', name: 'endpoint', type: 'url', placeholder: 'https://dashvector.cn-hangzhou.aliyuncs.com' },
            { label: 'API Key', name: 'apiKey', type: 'password' }
        ]
    }
}

module.exports = { credClass: DashVectorApi }
