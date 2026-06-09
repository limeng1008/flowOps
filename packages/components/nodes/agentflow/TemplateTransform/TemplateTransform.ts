import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { processTemplateVariables } from '../../../src/utils'

class TemplateTransform_Agentflow implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    color: string
    baseClasses: string[]
    documentation?: string
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Template Transform'
        this.name = 'templateTransformAgentflow'
        this.version = 1.0
        this.type = 'TemplateTransform'
        this.category = 'Agent Flows'
        this.description = 'Render a text template with runtime variables'
        this.baseClasses = [this.type]
        this.color = '#F97316'
        this.inputs = [
            {
                label: 'Template',
                name: 'templateTransformTemplate',
                type: 'string',
                rows: 8,
                acceptVariable: true,
                acceptNodeOutputAsVariable: true
            },
            {
                label: 'Variables',
                name: 'templateTransformVariables',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Variable Name',
                        name: 'variableName',
                        type: 'string',
                        placeholder: 'customerName'
                    },
                    {
                        label: 'Variable Value',
                        name: 'variableValue',
                        type: 'string',
                        acceptVariable: true,
                        acceptNodeOutputAsVariable: true
                    }
                ]
            }
        ]
    }

    async run(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const state = (options.agentflowRuntime?.state as ICommonObject) || {}

        try {
            const template = this.stringifyValue(nodeData.inputs?.templateTransformTemplate)
            if (!template.trim()) {
                return this.buildReturn(nodeData, '', state, [], 'Template is empty. Nothing was rendered.')
            }

            const variables = this.normalizeVariables(nodeData.inputs?.templateTransformVariables)
            const missingVariables = new Set<string>()
            const rendered = template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, rawName: string) => {
                const variableName = String(rawName).trim()
                if (!Object.prototype.hasOwnProperty.call(variables, variableName)) {
                    missingVariables.add(variableName)
                    return ''
                }
                return this.stringifyValue(variables[variableName])
            })

            const missingList = [...missingVariables]
            const notice = missingList.length ? `Missing template variables: ${missingList.join(', ')}` : undefined

            return this.buildReturn(nodeData, rendered, state, missingList, notice)
        } catch (error) {
            return this.buildReturn(nodeData, '', state, [], error instanceof Error ? error.message : String(error))
        }
    }

    private normalizeVariables(rawVariables: unknown): ICommonObject {
        if (!rawVariables) return {}

        if (Array.isArray(rawVariables)) {
            return rawVariables.reduce((acc, item: any) => {
                const name = String(item?.variableName || item?.name || '').trim()
                if (!name) return acc
                acc[name] = item?.variableValue ?? item?.value ?? ''
                return acc
            }, {} as ICommonObject)
        }

        if (typeof rawVariables === 'object') {
            return rawVariables as ICommonObject
        }

        if (typeof rawVariables === 'string') {
            try {
                const parsed = JSON.parse(rawVariables)
                return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
            } catch {
                return {}
            }
        }

        return {}
    }

    private stringifyValue(value: unknown): string {
        if (value === undefined || value === null) return ''
        if (typeof value === 'string') return value
        if (typeof value === 'number' || typeof value === 'boolean') return String(value)
        try {
            return JSON.stringify(value)
        } catch {
            return String(value)
        }
    }

    private buildReturn(
        nodeData: INodeData,
        content: string,
        state: ICommonObject,
        missingVariables: string[],
        notice?: string
    ): ICommonObject {
        const output = {
            content,
            missingVariables,
            ...(notice ? { _transformNotice: notice } : {})
        }

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                templateTransformTemplate: nodeData.inputs?.templateTransformTemplate,
                templateTransformVariables: nodeData.inputs?.templateTransformVariables
            },
            output,
            state: processTemplateVariables(state, content)
        }
    }
}

module.exports = { nodeClass: TemplateTransform_Agentflow }
