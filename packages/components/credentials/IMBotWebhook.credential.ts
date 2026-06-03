import { INodeParams, INodeCredential } from '../src/Interface'

class IMBotWebhook implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = '群机器人 Webhook（企业微信/飞书）'
        this.name = 'imBotWebhook'
        this.version = 1.0
        this.description =
            '企业微信：群设置 → 群机器人 → 添加 → 复制 Webhook 地址；飞书：群设置 → 群机器人 → 添加自定义机器人 → 复制 Webhook（若开启“签名校验”，把 Secret 填到下方）。'
        this.inputs = [
            {
                label: 'Webhook 地址',
                name: 'webhookUrl',
                type: 'password',
                placeholder: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=… 或 https://open.feishu.cn/open-apis/bot/v2/hook/…'
            },
            {
                label: '飞书签名 Secret（可选）',
                name: 'feishuSecret',
                type: 'password',
                description: '仅当飞书自定义机器人开启了“签名校验”时需要填写',
                optional: true
            }
        ]
    }
}

module.exports = { credClass: IMBotWebhook }
