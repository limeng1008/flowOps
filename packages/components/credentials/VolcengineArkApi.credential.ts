import { INodeCredential, INodeParams } from '../src/Interface'

class VolcengineArkApi implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = '火山方舟 API'
        this.name = 'volcengineArkApi'
        this.version = 1.0
        this.inputs = [
            {
                label: '火山方舟 API Key',
                name: 'volcengineArkApiKey',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: VolcengineArkApi }
