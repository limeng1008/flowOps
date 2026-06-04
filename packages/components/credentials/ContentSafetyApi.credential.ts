import { INodeParams, INodeCredential } from '../src/Interface'

class ContentSafetyApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = '内容安全审核 API 鉴权（可选）'
        this.name = 'contentSafetyApi'
        this.version = 1.0
        this.description =
            '调用你自己的内容安全审核接口时的鉴权请求头值，会作为 Authorization 头发送。例如 "Bearer xxxxx" 或 "AppKey xxxxx"。接口无需鉴权可不填本凭证。'
        this.inputs = [
            {
                label: 'Authorization 头的值',
                name: 'authHeaderValue',
                type: 'password',
                placeholder: 'Bearer your-token'
            }
        ]
    }
}

module.exports = { credClass: ContentSafetyApi }
