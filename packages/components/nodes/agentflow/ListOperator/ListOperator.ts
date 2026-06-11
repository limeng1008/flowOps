import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { processTemplateVariables } from '../../../src/utils'

type ListOperation = 'filter' | 'sort' | 'slice' | 'extractField' | 'limit'

class ListOperator_Agentflow implements INode {
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
        this.label = 'List Operator'
        this.name = 'listOperatorAgentflow'
        this.version = 1.0
        this.type = 'ListOperator'
        this.category = 'Agent Flows'
        this.description = 'Filter, sort, slice, limit, or extract fields from an array'
        this.baseClasses = [this.type]
        this.color = '#0EA5E9'
        this.icon = 'listoperator.svg'
        this.inputs = [
            {
                label: 'Input Array',
                name: 'listOperatorInput',
                type: 'string',
                rows: 4,
                acceptVariable: true,
                acceptNodeOutputAsVariable: true
            },
            {
                label: 'Operation',
                name: 'listOperatorOperation',
                type: 'options',
                default: 'filter',
                options: [
                    { label: 'Filter', name: 'filter' },
                    { label: 'Sort', name: 'sort' },
                    { label: 'Slice', name: 'slice' },
                    { label: 'Extract Field', name: 'extractField' },
                    { label: 'Limit', name: 'limit' }
                ]
            },
            {
                label: 'Field',
                name: 'listOperatorField',
                type: 'string',
                placeholder: 'metadata.status',
                optional: true,
                show: {
                    listOperatorOperation: ['filter', 'sort', 'extractField']
                }
            },
            {
                label: 'Operator',
                name: 'listOperatorFilterOperator',
                type: 'options',
                default: 'equals',
                options: [
                    { label: 'Equal', name: 'equals' },
                    { label: 'Not Equal', name: 'notEquals' },
                    { label: 'Contains', name: 'contains' },
                    { label: 'Larger', name: 'greaterThan' },
                    { label: 'Larger Equal', name: 'greaterThanOrEqual' },
                    { label: 'Smaller', name: 'lessThan' },
                    { label: 'Smaller Equal', name: 'lessThanOrEqual' }
                ],
                show: {
                    listOperatorOperation: 'filter'
                }
            },
            {
                label: 'Value',
                name: 'listOperatorValue',
                type: 'string',
                optional: true,
                acceptVariable: true,
                acceptNodeOutputAsVariable: true,
                show: {
                    listOperatorOperation: 'filter'
                }
            },
            {
                label: 'Order',
                name: 'listOperatorOrder',
                type: 'options',
                default: 'asc',
                options: [
                    { label: 'Ascending', name: 'asc' },
                    { label: 'Descending', name: 'desc' }
                ],
                show: {
                    listOperatorOperation: 'sort'
                }
            },
            {
                label: 'Start Index',
                name: 'listOperatorStart',
                type: 'number',
                default: 0,
                show: {
                    listOperatorOperation: 'slice'
                }
            },
            {
                label: 'End Index',
                name: 'listOperatorEnd',
                type: 'number',
                optional: true,
                show: {
                    listOperatorOperation: 'slice'
                }
            },
            {
                label: 'Count',
                name: 'listOperatorCount',
                type: 'number',
                default: 10,
                show: {
                    listOperatorOperation: 'limit'
                }
            }
        ]
    }

    async run(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const state = (options.agentflowRuntime?.state as ICommonObject) || {}

        try {
            const parsed = this.parseArrayInput(nodeData.inputs?.listOperatorInput)
            if (parsed.error) {
                return this.buildReturn(nodeData, [], state, parsed.error)
            }

            const operation = (nodeData.inputs?.listOperatorOperation as ListOperation) || 'filter'
            const output = this.applyOperation(parsed.items, operation, nodeData.inputs || {})
            return this.buildReturn(nodeData, output.items, state, output.error)
        } catch (error) {
            return this.buildReturn(nodeData, [], state, error instanceof Error ? error.message : String(error))
        }
    }

    private parseArrayInput(input: unknown): { items: any[]; error?: string } {
        if (Array.isArray(input)) return { items: [...input] }

        if (typeof input !== 'string') {
            return { items: [], error: 'Input Array must be an array value or a JSON array string.' }
        }

        const trimmed = input.trim()
        if (!trimmed) return { items: [] }

        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) return { items: parsed }
            return { items: [], error: 'Input Array must be a JSON array.' }
        } catch {
            return { items: [], error: 'Input Array must be a valid JSON array string.' }
        }
    }

    private applyOperation(items: any[], operation: ListOperation, inputs: ICommonObject): { items: any[]; error?: string } {
        if (operation === 'filter') return { items: this.filterItems(items, inputs) }
        if (operation === 'sort') return { items: this.sortItems(items, inputs) }
        if (operation === 'slice') return { items: this.sliceItems(items, inputs) }
        if (operation === 'extractField') return { items: this.extractField(items, inputs) }
        if (operation === 'limit') return { items: this.limitItems(items, inputs) }
        return { items: [], error: `Unsupported list operation: ${operation}` }
    }

    private filterItems(items: any[], inputs: ICommonObject): any[] {
        const field = String(inputs.listOperatorField || '').trim()
        const operator = String(inputs.listOperatorFilterOperator || 'equals')
        const comparisonValue = this.parseScalar(inputs.listOperatorValue)

        return items.filter((item) => {
            const currentValue = field ? this.getByPath(item, field) : item
            return this.compare(currentValue, comparisonValue, operator)
        })
    }

    private sortItems(items: any[], inputs: ICommonObject): any[] {
        const field = String(inputs.listOperatorField || '').trim()
        const direction = inputs.listOperatorOrder === 'desc' ? -1 : 1

        return [...items].sort((left, right) => {
            const leftValue = field ? this.getByPath(left, field) : left
            const rightValue = field ? this.getByPath(right, field) : right
            return this.compareForSort(leftValue, rightValue) * direction
        })
    }

    private sliceItems(items: any[], inputs: ICommonObject): any[] {
        const start = this.toSafeIndex(inputs.listOperatorStart, 0)
        const endValue = inputs.listOperatorEnd
        if (endValue === undefined || endValue === null || endValue === '') return items.slice(start)
        return items.slice(start, this.toSafeIndex(endValue, items.length))
    }

    private extractField(items: any[], inputs: ICommonObject): any[] {
        const field = String(inputs.listOperatorField || '').trim()
        if (!field) return items
        return items.map((item) => {
            const value = this.getByPath(item, field)
            return value === undefined ? null : value
        })
    }

    private limitItems(items: any[], inputs: ICommonObject): any[] {
        const count = this.toSafeIndex(inputs.listOperatorCount, items.length)
        return items.slice(0, count)
    }

    private getByPath(item: any, path: string): any {
        const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
        return parts.reduce((current, part) => {
            if (current === undefined || current === null) return undefined
            return current[part]
        }, item)
    }

    private parseScalar(value: unknown): unknown {
        if (typeof value !== 'string') return value
        const trimmed = value.trim()
        if (trimmed === '') return ''
        if (trimmed === 'true') return true
        if (trimmed === 'false') return false

        const numberValue = Number(trimmed)
        if (Number.isFinite(numberValue) && /^-?\d+(\.\d+)?$/.test(trimmed)) return numberValue

        try {
            return JSON.parse(trimmed)
        } catch {
            return value
        }
    }

    private compare(currentValue: unknown, comparisonValue: unknown, operator: string): boolean {
        if (operator === 'notEquals') return !this.isEqual(currentValue, comparisonValue)
        if (operator === 'contains') return this.contains(currentValue, comparisonValue)
        if (operator === 'greaterThan') return this.toNumber(currentValue) > this.toNumber(comparisonValue)
        if (operator === 'greaterThanOrEqual') return this.toNumber(currentValue) >= this.toNumber(comparisonValue)
        if (operator === 'lessThan') return this.toNumber(currentValue) < this.toNumber(comparisonValue)
        if (operator === 'lessThanOrEqual') return this.toNumber(currentValue) <= this.toNumber(comparisonValue)
        return this.isEqual(currentValue, comparisonValue)
    }

    private isEqual(left: unknown, right: unknown): boolean {
        if (typeof left === 'number' || typeof right === 'number') return Number(left) === Number(right)
        return String(left) === String(right)
    }

    private contains(currentValue: unknown, comparisonValue: unknown): boolean {
        if (Array.isArray(currentValue)) return currentValue.some((item) => this.isEqual(item, comparisonValue))
        if (currentValue && typeof currentValue === 'object') return JSON.stringify(currentValue).includes(String(comparisonValue))
        return String(currentValue ?? '').includes(String(comparisonValue))
    }

    private compareForSort(left: unknown, right: unknown): number {
        if (left === undefined || left === null) return 1
        if (right === undefined || right === null) return -1

        const leftNumber = this.toNumberOrUndefined(left)
        const rightNumber = this.toNumberOrUndefined(right)
        if (leftNumber !== undefined && rightNumber !== undefined) return leftNumber - rightNumber

        return String(left).localeCompare(String(right))
    }

    private toNumber(value: unknown): number {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : NaN
    }

    private toNumberOrUndefined(value: unknown): number | undefined {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : undefined
    }

    private toSafeIndex(value: unknown, fallback: number): number {
        const numberValue = Number(value)
        if (!Number.isFinite(numberValue)) return fallback
        return Math.max(0, Math.trunc(numberValue))
    }

    private buildReturn(nodeData: INodeData, content: any[], state: ICommonObject, error?: string): ICommonObject {
        const output = {
            content,
            count: content.length,
            ...(error ? { _operationError: error } : {})
        }

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                listOperatorInput: nodeData.inputs?.listOperatorInput,
                listOperatorOperation: nodeData.inputs?.listOperatorOperation
            },
            output,
            state: processTemplateVariables(state, content)
        }
    }
}

module.exports = { nodeClass: ListOperator_Agentflow }
