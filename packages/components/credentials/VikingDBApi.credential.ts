import { INodeParams, INodeCredential } from '../src/Interface'

class VikingDBApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Volcengine VikingDB API'
        this.name = 'vikingDBApi'
        this.version = 1.0
        this.description = '火山引擎 VikingDB 连接凭证'
        this.inputs = [
            { label: 'Endpoint', name: 'endpoint', type: 'url', placeholder: 'https://api-vikingdb.volces.com' },
            { label: 'Region', name: 'region', type: 'string', placeholder: 'cn-beijing' },
            { label: 'Access Key ID', name: 'accessKeyId', type: 'password' },
            { label: 'Secret Access Key', name: 'secretAccessKey', type: 'password' }
        ]
    }
}

module.exports = { credClass: VikingDBApi }
