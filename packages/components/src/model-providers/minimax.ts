import { INodeOptionsValue } from '../Interface'
import { MINIMAX_DEFAULT_BASE_URL } from './openAICompatible'

export const MINIMAX_MODELS_URL = `${MINIMAX_DEFAULT_BASE_URL.replace(/\/$/, '')}/models`

export interface MinimaxModelInfo {
    id: string
    name: string
    provider: 'minimax'
}

export async function fetchMinimaxModels(apiKey: string): Promise<MinimaxModelInfo[]> {
    const res = await fetch(MINIMAX_MODELS_URL, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        throw new Error(`MiniMax 模型列表获取失败：${res.status}`)
    }

    const data = await res.json()
    const models = Array.isArray(data?.data) ? data.data : []

    return models
        .filter((item: any) => typeof item?.id === 'string' && item.id)
        .map((item: any) => ({
            id: item.id,
            name: item.id,
            provider: 'minimax'
        }))
}

export async function fetchMinimaxChatModelOptions(apiKey: string): Promise<INodeOptionsValue[]> {
    const seen = new Set<string>()
    const models = await fetchMinimaxModels(apiKey)
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
