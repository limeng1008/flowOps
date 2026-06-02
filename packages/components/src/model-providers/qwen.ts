import { INodeOptionsValue } from '../Interface'
import { QWEN_DEFAULT_BASE_URL } from './openAICompatible'

export const QWEN_MODELS_URL = `${QWEN_DEFAULT_BASE_URL.replace(/\/$/, '')}/models`

export interface QwenModelInfo {
    id: string
    name: string
    provider: 'qwen'
}

export async function fetchQwenModels(apiKey: string): Promise<QwenModelInfo[]> {
    const res = await fetch(QWEN_MODELS_URL, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        throw new Error(`通义千问模型列表获取失败：${res.status}`)
    }

    const data = await res.json()
    const models = Array.isArray(data?.data) ? data.data : []

    return models
        .filter((item: any) => typeof item?.id === 'string' && item.id)
        .map((item: any) => ({
            id: item.id,
            name: item.id,
            provider: 'qwen'
        }))
}

export async function fetchQwenChatModelOptions(apiKey: string): Promise<INodeOptionsValue[]> {
    const seen = new Set<string>()
    const models = await fetchQwenModels(apiKey)
    const options: INodeOptionsValue[] = []

    for (const model of models) {
        if (seen.has(model.name)) continue
        seen.add(model.name)
        options.push({
            label: model.name,
            name: model.name
        })
    }

    return options
}
