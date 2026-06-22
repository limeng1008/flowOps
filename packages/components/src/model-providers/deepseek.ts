import { INodeOptionsValue } from '../Interface'

export const DEEPSEEK_MODELS_URL = 'https://api.deepseek.com/models'

export interface DeepseekModelInfo {
    id: string
    name: string
    provider: 'deepseek'
}

export async function fetchDeepseekModels(apiKey: string): Promise<DeepseekModelInfo[]> {
    const res = await fetch(DEEPSEEK_MODELS_URL, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        throw new Error(`DeepSeek model list request failed: ${res.status}`)
    }

    const data = await res.json()
    const models = Array.isArray(data?.data) ? data.data : []

    return models
        .filter((item: any) => typeof item?.id === 'string' && item.id)
        .map((item: any) => ({
            id: item.id,
            name: item.id,
            provider: 'deepseek'
        }))
}

export async function fetchDeepseekChatModelOptions(apiKey: string): Promise<INodeOptionsValue[]> {
    const seen = new Set<string>()
    const models = await fetchDeepseekModels(apiKey)
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
