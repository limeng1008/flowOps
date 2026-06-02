import { INodeOptionsValue } from '../Interface'
import { DOUBAO_DEFAULT_BASE_URL } from './openAICompatible'

export const DOUBAO_MODELS_URL = `${DOUBAO_DEFAULT_BASE_URL.replace(/\/$/, '')}/models`

export interface DoubaoModelInfo {
    id: string
    name: string
    provider: 'doubao'
}

export async function fetchDoubaoModels(apiKey: string): Promise<DoubaoModelInfo[]> {
    const res = await fetch(DOUBAO_MODELS_URL, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        throw new Error(`豆包模型列表获取失败：${res.status}`)
    }

    const data = await res.json()
    const models = Array.isArray(data?.data) ? data.data : []

    return models
        .filter((item: any) => typeof item?.id === 'string' && item.id)
        .map((item: any) => ({
            id: item.id,
            name: item.id,
            provider: 'doubao'
        }))
}

export async function fetchDoubaoChatModelOptions(apiKey: string): Promise<INodeOptionsValue[]> {
    const seen = new Set<string>()
    const models = await fetchDoubaoModels(apiKey)
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
