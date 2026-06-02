import { INodeCredential, INodeParams } from '../src/Interface'

class SiliconFlowApi implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = '硅基流动 SiliconFlow API'
        this.name = 'siliconflowApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'SiliconFlow API Key',
                name: 'siliconflowApiKey',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: SiliconFlowApi }
