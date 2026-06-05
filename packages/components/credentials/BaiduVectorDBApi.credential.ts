import { INodeParams, INodeCredential } from '../src/Interface'

class BaiduVectorDBApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Baidu VectorDB API'
        this.name = 'baiduVectorDBApi'
        this.version = 1.0
        this.description = '百度智能云 VectorDB/Mochow 连接凭证'
        this.inputs = [
            { label: 'Endpoint', name: 'endpoint', type: 'url', placeholder: 'https://vdb.bj.baidubce.com' },
            { label: 'Account', name: 'account', type: 'string' },
            { label: 'API Key', name: 'apiKey', type: 'password' }
        ]
    }
}

module.exports = { credClass: BaiduVectorDBApi }
