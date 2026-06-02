import { INodeCredential, INodeParams } from '../src/Interface'

class DashScopeApi implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = '阿里云百炼 DashScope API'
        this.name = 'dashScopeApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'DashScope API Key',
                name: 'dashScopeApiKey',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: DashScopeApi }
