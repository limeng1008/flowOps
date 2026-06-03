import { INode, INodeData, INodeParams, ICommonObject } from '../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { createQueryTool, QueryMode } from './core'

class CustomerServiceQuery_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams

    constructor() {
        this.label = '客服查询（订单/物流/售后）'
        this.name = 'customerServiceQuery'
        this.version = 1.0
        this.type = 'CustomerServiceQuery'
        this.icon = 'customerservicequery.svg'
        this.category = 'Tools'
        this.description = '查订单状态、物流快递跟踪、退款/售后进度。支持示例数据(免后端演示)或调用你自己的 API。给智能体(Tool Agent)调用'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['customerServiceApiAuth'],
            optional: true
        }
        this.inputs = [
            {
                label: '数据来源',
                name: 'queryMode',
                type: 'options',
                options: [
                    { label: '示例数据（免后端，演示/测试用）', name: 'mock' },
                    { label: '调用 API（填你自己的接口）', name: 'http' }
                ],
                default: 'mock'
            },
            {
                label: '订单查询 API',
                name: 'orderApiUrl',
                type: 'string',
                placeholder: 'https://api.your.com/order?no={value}',
                description: '用 {value} 占位订单号；不写占位则把单号追加到末尾',
                show: { queryMode: 'http' },
                optional: true
            },
            {
                label: '物流查询 API',
                name: 'logisticsApiUrl',
                type: 'string',
                placeholder: 'https://api.your.com/logistics?no={value}',
                description: '用 {value} 占位快递单号',
                show: { queryMode: 'http' },
                optional: true
            },
            {
                label: '退款/售后查询 API',
                name: 'aftersalesApiUrl',
                type: 'string',
                placeholder: 'https://api.your.com/aftersales?no={value}',
                description: '用 {value} 占位订单号',
                show: { queryMode: 'http' },
                optional: true
            },
            {
                label: '工具名称',
                name: 'toolName',
                type: 'string',
                default: 'customer_service_query',
                description: '智能体看到的工具名（建议英文 + 下划线）',
                optional: true,
                additionalParams: true
            },
            {
                label: '工具描述（触发时机）',
                name: 'toolDescription',
                type: 'string',
                rows: 3,
                description: '告诉智能体什么时候调用本工具；留空使用默认',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const mode = ((nodeData.inputs?.queryMode as string) || 'mock') as QueryMode
        const orderApiUrl = nodeData.inputs?.orderApiUrl as string
        const logisticsApiUrl = nodeData.inputs?.logisticsApiUrl as string
        const aftersalesApiUrl = nodeData.inputs?.aftersalesApiUrl as string
        const toolName = nodeData.inputs?.toolName as string
        const toolDescription = nodeData.inputs?.toolDescription as string

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const authHeaderValue = getCredentialParam('authHeaderValue', credentialData, nodeData)

        return createQueryTool({ mode, orderApiUrl, logisticsApiUrl, aftersalesApiUrl, authHeaderValue, toolName, toolDescription })
    }
}

module.exports = { nodeClass: CustomerServiceQuery_Tools }
