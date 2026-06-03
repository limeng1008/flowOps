import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { Moderation } from '../Moderation'
import { ContentSafetyModerationMode, ContentSafetyModerationRunner, ContentSafetyViolationAction } from './ContentSafetyModerationRunner'

class ContentSafetyModeration implements INode {
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
        this.label = '内容安全审核'
        this.name = 'contentSafetyModeration'
        this.version = 1.0
        this.type = 'Moderation'
        this.icon = 'contentsafety.svg'
        this.category = 'Moderation'
        this.description = '对输入或输出文本做内容安全审核，支持本地词库、外部审核接口和示例数据，可拦截、脱敏或仅记录'
        this.baseClasses = [this.type, ...getBaseClasses(Moderation)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['contentSafetyApi'],
            optional: true
        }
        this.inputs = [
            {
                label: '审核模式',
                name: 'moderationMode',
                type: 'options',
                options: [
                    { label: '本地词库/正则（离线，信创友好）', name: 'local' },
                    { label: '调用内容安全接口（填你自己的审核接口）', name: 'http' },
                    { label: '示例数据（免后端演示）', name: 'mock' }
                ],
                default: 'local'
            },
            {
                label: '敏感词',
                name: 'sensitiveWords',
                type: 'string',
                rows: 4,
                description: '敏感词，支持逗号或换行分隔',
                show: { moderationMode: 'local' },
                optional: true
            },
            {
                label: '自定义正则',
                name: 'customRegex',
                type: 'string',
                description: '可选：用于匹配手机号、身份证号等规则类内容',
                show: { moderationMode: 'local' },
                optional: true
            },
            {
                label: '审核接口地址',
                name: 'apiUrl',
                type: 'string',
                placeholder: 'https://api.your.com/content-safety',
                description: 'POST 文本到你的内容安全接口，请求体为 { text }',
                show: { moderationMode: 'http' },
                optional: true
            },
            {
                label: '命中后动作',
                name: 'onViolation',
                type: 'options',
                options: [
                    { label: '拦截', name: 'block' },
                    { label: '脱敏替换', name: 'mask' },
                    { label: '放行仅记录', name: 'passLog' }
                ],
                default: 'block'
            },
            {
                label: '拦截提示语',
                name: 'moderationErrorMessage',
                type: 'string',
                rows: 2,
                default: '您的内容包含敏感信息，已被拦截。',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        if (nodeData.inputs?.credentialId) {
            nodeData.credential = nodeData.inputs?.credentialId
        }

        let authHeaderValue = ''
        if (nodeData.credential) {
            const credentialData = await getCredentialData(nodeData.credential ?? '', options)
            authHeaderValue = getCredentialParam('authHeaderValue', credentialData, nodeData)
        }

        return new ContentSafetyModerationRunner({
            moderationMode: ((nodeData.inputs?.moderationMode as string) || 'local') as ContentSafetyModerationMode,
            sensitiveWords: nodeData.inputs?.sensitiveWords as string,
            customRegex: nodeData.inputs?.customRegex as string,
            apiUrl: nodeData.inputs?.apiUrl as string,
            authHeaderValue,
            onViolation: ((nodeData.inputs?.onViolation as string) || 'block') as ContentSafetyViolationAction,
            moderationErrorMessage: (nodeData.inputs?.moderationErrorMessage as string) || '您的内容包含敏感信息，已被拦截。'
        })
    }
}

module.exports = { nodeClass: ContentSafetyModeration }
