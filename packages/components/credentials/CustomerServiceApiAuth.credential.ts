import { INodeParams, INodeCredential } from '../src/Interface'

class CustomerServiceApiAuth implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = '客服查询 API 鉴权（可选）'
        this.name = 'customerServiceApiAuth'
        this.version = 1.0
        this.description =
            '调用你自己的订单/物流/售后接口时的鉴权请求头值，会作为 Authorization 头发送。例如 "Bearer xxxxx" 或 "AppKey xxxxx"。接口无需鉴权可不填本凭证。'
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

module.exports = { credClass: CustomerServiceApiAuth }
