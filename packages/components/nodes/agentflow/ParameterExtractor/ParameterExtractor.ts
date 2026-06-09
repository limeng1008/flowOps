import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { BaseMessageLike } from '@langchain/core/messages'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { configureStructuredOutput, processTemplateVariables } from '../../../src/utils'
import { IStructuredOutput } from '../Interface.Agentflow'

type ParameterType = 'string' | 'number' | 'boolean' | 'array'

interface IParameterDefinition {
    name: string
    type: ParameterType
    description: string
    required: boolean
}

class ParameterExtractor_Agentflow implements INode {
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
        this.label = 'Parameter Extractor'
        this.name = 'parameterExtractorAgentflow'
        this.version = 1.0
        this.type = 'ParameterExtractor'
        this.category = 'Agent Flows'
        this.description = 'Extract typed parameters from input text with structured model output'
        this.baseClasses = [this.type]
        this.color = '#7C3AED'
        this.inputs = [
            {
                label: 'Model',
                name: 'parameterExtractorModel',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                loadConfig: true
            },
            {
                label: 'Input',
                name: 'parameterExtractorInput',
                type: 'string',
                rows: 4,
                default: '{{ question }}',
                acceptVariable: true,
                acceptNodeOutputAsVariable: true
            },
            {
                label: 'Parameters',
                name: 'parameterExtractorParameters',
                type: 'array',
                acceptVariable: true,
                array: [
                    {
                        label: 'Name',
                        name: 'parameterName',
                        type: 'string',
                        placeholder: 'customerName'
                    },
                    {
                        label: 'Type',
                        name: 'parameterType',
                        type: 'options',
                        default: 'string',
                        options: [
                            { label: 'String', name: 'string' },
                            { label: 'Number', name: 'number' },
                            { label: 'Boolean', name: 'boolean' },
                            { label: 'Array', name: 'array' }
                        ]
                    },
                    {
                        label: 'Description',
                        name: 'parameterDescription',
                        type: 'string',
                        rows: 2,
                        optional: true
                    },
                    {
                        label: 'Required',
                        name: 'parameterRequired',
                        type: 'boolean',
                        default: true,
                        optional: true
                    }
                ]
            },
            {
                label: 'Instructions',
                name: 'parameterExtractorInstructions',
                type: 'string',
                rows: 3,
                optional: true,
                acceptVariable: true
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async listModels(_: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
            const componentNodes = options.componentNodes as {
                [key: string]: INode
            }

            const returnOptions: INodeOptionsValue[] = []
            for (const nodeName in componentNodes) {
                const componentNode = componentNodes[nodeName]
                if (componentNode.category === 'Chat Models') {
                    if (componentNode.tags?.includes('LlamaIndex')) {
                        continue
                    }
                    returnOptions.push({
                        label: componentNode.label,
                        name: nodeName,
                        imageSrc: componentNode.icon
                    })
                }
            }
            return returnOptions
        }
    }

    async run(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const state = (options.agentflowRuntime?.state as ICommonObject) || {}
        const parameterDefinitions = this.normalizeParameters(nodeData.inputs?.parameterExtractorParameters)

        if (!parameterDefinitions.length) {
            return this.buildReturn(nodeData, {}, state, 'No parameters configured for extraction.')
        }

        try {
            const selectedModel = nodeData.inputs?.parameterExtractorModel as string
            if (!selectedModel) {
                return this.buildReturn(
                    nodeData,
                    this.emptyResult(parameterDefinitions),
                    state,
                    'Model is required for parameter extraction.'
                )
            }

            const componentNode = (options.componentNodes as ICommonObject)?.[selectedModel]
            const nodeInstanceFilePath = componentNode?.filePath as string
            if (!nodeInstanceFilePath) {
                return this.buildReturn(
                    nodeData,
                    this.emptyResult(parameterDefinitions),
                    state,
                    `Model component "${selectedModel}" was not found.`
                )
            }

            const modelConfig = (nodeData.inputs?.parameterExtractorModelConfig as ICommonObject) || {}
            const nodeModule = await import(nodeInstanceFilePath)
            const modelNodeInstance = new nodeModule.nodeClass()
            const modelNodeData = {
                ...nodeData,
                credential: modelConfig['FLOWISE_CREDENTIAL_ID'],
                inputs: {
                    ...nodeData.inputs,
                    ...modelConfig
                }
            }

            let llmNodeInstance = (await modelNodeInstance.init(modelNodeData, '', options)) as BaseChatModel
            llmNodeInstance = configureStructuredOutput(llmNodeInstance, this.toStructuredOutput(parameterDefinitions))

            const messages = this.buildMessages(
                nodeData.inputs?.parameterExtractorInput,
                parameterDefinitions,
                nodeData.inputs?.parameterExtractorInstructions as string
            )
            const response = await llmNodeInstance.invoke(messages, { signal: options.abortController?.signal })
            const structured = this.extractStructuredObject(response)
            const { output, errors } = this.normalizeOutput(structured, parameterDefinitions)

            return this.buildReturn(nodeData, output, state, errors.join('; ') || undefined)
        } catch (error) {
            if (error instanceof Error && error.message === 'Aborted') {
                throw error
            }
            return this.buildReturn(
                nodeData,
                this.emptyResult(parameterDefinitions),
                state,
                error instanceof Error ? error.message : String(error)
            )
        }
    }

    private normalizeParameters(parameters: unknown): IParameterDefinition[] {
        if (!Array.isArray(parameters)) return []

        const seen = new Set<string>()
        return parameters
            .map((item: any) => {
                const name = String(item?.parameterName || item?.name || '').trim()
                const type = this.normalizeParameterType(item?.parameterType || item?.type)
                const description = String(item?.parameterDescription || item?.description || '')
                const required = item?.parameterRequired === undefined ? true : Boolean(item.parameterRequired)
                return { name, type, description, required }
            })
            .filter((item) => {
                if (!item.name || seen.has(item.name)) return false
                seen.add(item.name)
                return true
            })
    }

    private normalizeParameterType(type: unknown): ParameterType {
        if (type === 'number' || type === 'boolean' || type === 'array') return type
        return 'string'
    }

    private toStructuredOutput(parameters: IParameterDefinition[]): IStructuredOutput[] {
        return parameters.map((parameter) => ({
            key: parameter.name,
            type: parameter.type === 'array' ? 'stringArray' : parameter.type,
            description: [parameter.description, parameter.required ? 'Required.' : 'Optional.'].filter(Boolean).join(' ')
        }))
    }

    private buildMessages(input: unknown, parameters: IParameterDefinition[], instructions?: string): BaseMessageLike[] {
        const parameterSummary = parameters
            .map((parameter) => {
                const requiredLabel = parameter.required ? 'required' : 'optional'
                return `- ${parameter.name} (${parameter.type}, ${requiredLabel}): ${parameter.description || 'No description'}`
            })
            .join('\n')

        const systemParts = [
            'Extract the configured parameters from the user input.',
            'Return values through the configured structured output schema.',
            'If a value is not present, leave it empty so the workflow can handle it safely.',
            instructions ? `Additional instructions: ${instructions}` : '',
            `Parameters:\n${parameterSummary}`
        ].filter(Boolean)

        return [
            {
                role: 'system',
                content: systemParts.join('\n\n')
            },
            {
                role: 'user',
                content: this.stringifyInput(input)
            }
        ]
    }

    private stringifyInput(input: unknown): string {
        if (typeof input === 'string') return input
        if (input === undefined || input === null) return ''
        try {
            return JSON.stringify(input)
        } catch {
            return String(input)
        }
    }

    private extractStructuredObject(response: any): ICommonObject {
        if (!response) return {}
        if (response.content && typeof response.content === 'object' && !Array.isArray(response.content)) {
            return response.content
        }
        if (typeof response === 'object' && !Array.isArray(response) && response.content === undefined) {
            return response
        }
        return {}
    }

    private normalizeOutput(structured: ICommonObject, parameters: IParameterDefinition[]): { output: ICommonObject; errors: string[] } {
        const output: ICommonObject = {}
        const errors: string[] = []

        for (const parameter of parameters) {
            const hasValue = Object.prototype.hasOwnProperty.call(structured, parameter.name)
            const rawValue = hasValue ? structured[parameter.name] : undefined
            const { value, error } = this.normalizeValue(rawValue, parameter)

            output[parameter.name] = value

            if (parameter.required && (value === null || value === undefined || value === '')) {
                errors.push(`Missing required parameter "${parameter.name}"`)
            } else if (error) {
                errors.push(error)
            }
        }

        return { output, errors }
    }

    private normalizeValue(value: unknown, parameter: IParameterDefinition): { value: unknown; error?: string } {
        if (value === undefined || value === null || value === '') {
            return { value: null }
        }

        if (parameter.type === 'string') {
            if (typeof value === 'string') return { value }
            if (typeof value === 'object') return { value: JSON.stringify(value) }
            return { value: String(value) }
        }

        if (parameter.type === 'number') {
            const numberValue = typeof value === 'number' ? value : Number(value)
            if (Number.isFinite(numberValue)) return { value: numberValue }
            return { value: null, error: `Parameter "${parameter.name}" is not a valid number` }
        }

        if (parameter.type === 'boolean') {
            if (typeof value === 'boolean') return { value }
            if (typeof value === 'string') {
                const lower = value.toLowerCase().trim()
                if (lower === 'true') return { value: true }
                if (lower === 'false') return { value: false }
            }
            return { value: null, error: `Parameter "${parameter.name}" is not a valid boolean` }
        }

        if (Array.isArray(value)) return { value }
        return { value: null, error: `Parameter "${parameter.name}" is not a valid array` }
    }

    private emptyResult(parameters: IParameterDefinition[]): ICommonObject {
        return parameters.reduce((acc, parameter) => {
            acc[parameter.name] = null
            return acc
        }, {} as ICommonObject)
    }

    private buildReturn(nodeData: INodeData, content: ICommonObject, state: ICommonObject, error?: string): ICommonObject {
        const output = {
            content,
            ...content,
            ...(error ? { _extractionError: error } : {})
        }

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                parameterExtractorInput: nodeData.inputs?.parameterExtractorInput,
                parameterExtractorParameters: nodeData.inputs?.parameterExtractorParameters,
                parameterExtractorInstructions: nodeData.inputs?.parameterExtractorInstructions
            },
            output,
            state: processTemplateVariables(state, content)
        }
    }
}

module.exports = { nodeClass: ParameterExtractor_Agentflow }
