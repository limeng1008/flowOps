import { INodeOptionsValue } from '../Interface'
import { ZHIPU_DEFAULT_BASE_URL } from './openAICompatible'

export const ZHIPU_MODELS_URL = `${ZHIPU_DEFAULT_BASE_URL.replace(/\/$/, '')}/models`

export type ZhipuModelType = 'chat' | 'embedding' | 'rerank' | 'image' | 'vision'

export interface ZhipuModelInfo {
    id: string
    name: string
    provider: 'zhipu'
    type: ZhipuModelType
}

export function guessZhipuModelType(modelId: string): ZhipuModelType {
    const id = modelId.toLowerCase()

    if (id.includes('embedding')) return 'embedding'
    if (id.includes('rerank')) return 'rerank'
    if (id.includes('image') || id.includes('cogview')) return 'image'
    if (id.includes('glm-4v') || id.includes('glm-5v') || id.includes('ocr')) return 'vision'

    return 'chat'
}

export async function fetchZhipuModels(apiKey: string): Promise<ZhipuModelInfo[]> {
    const res = await fetch(ZHIPU_MODELS_URL, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        throw new Error(`智谱模型列表获取失败：${res.status}`)
    }

    const data = await res.json()
    const models = Array.isArray(data?.data) ? data.data : []

    return models
        .filter((item: any) => typeof item?.id === 'string' && item.id)
        .map((item: any) => ({
            id: item.id,
            name: item.id,
            provider: 'zhipu',
            type: guessZhipuModelType(item.id)
        }))
}

export async function fetchZhipuChatModelOptions(apiKey: string): Promise<INodeOptionsValue[]> {
    const seen = new Set<string>()
    const models = await fetchZhipuModels(apiKey)
    const chatModels = models.filter((model) => model.type === 'chat')
    const options: INodeOptionsValue[] = []

    for (const model of chatModels) {
        if (seen.has(model.name)) continue
        seen.add(model.name)
        options.push({
            label: model.name,
            name: model.name
        })
    }

    return options
}
