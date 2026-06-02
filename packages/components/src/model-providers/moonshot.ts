import { INodeOptionsValue } from '../Interface'
import { MOONSHOT_DEFAULT_BASE_URL } from './openAICompatible'

export const MOONSHOT_MODELS_URL = `${MOONSHOT_DEFAULT_BASE_URL.replace(/\/$/, '')}/models`

export interface MoonshotModelInfo {
    id: string
    name: string
    provider: 'moonshot'
}

export async function fetchMoonshotModels(apiKey: string): Promise<MoonshotModelInfo[]> {
    const res = await fetch(MOONSHOT_MODELS_URL, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        throw new Error(`Kimi 模型列表获取失败：${res.status}`)
    }

    const data = await res.json()
    const models = Array.isArray(data?.data) ? data.data : []

    return models
        .filter((item: any) => typeof item?.id === 'string' && item.id)
        .map((item: any) => ({
            id: item.id,
            name: item.id,
            provider: 'moonshot'
        }))
}

export async function fetchMoonshotChatModelOptions(apiKey: string): Promise<INodeOptionsValue[]> {
    const seen = new Set<string>()
    const models = await fetchMoonshotModels(apiKey)
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
