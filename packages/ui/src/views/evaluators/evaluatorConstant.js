// TODO: Move this to a config file
export const evaluators = [
    {
        type: 'text',
        name: 'ContainsAny',
        labelKey: 'pages.evaluators.optionLabels.containsAny',
        descriptionKey: 'pages.evaluators.optionDescriptions.containsAny'
    },
    {
        type: 'text',
        name: 'ContainsAll',
        labelKey: 'pages.evaluators.optionLabels.containsAll',
        descriptionKey: 'pages.evaluators.optionDescriptions.containsAll'
    },
    {
        type: 'text',
        name: 'DoesNotContainAny',
        labelKey: 'pages.evaluators.optionLabels.doesNotContainAny',
        descriptionKey: 'pages.evaluators.optionDescriptions.doesNotContainAny'
    },
    {
        type: 'text',
        name: 'DoesNotContainAll',
        labelKey: 'pages.evaluators.optionLabels.doesNotContainAll',
        descriptionKey: 'pages.evaluators.optionDescriptions.doesNotContainAll'
    },
    {
        type: 'text',
        name: 'StartsWith',
        labelKey: 'pages.evaluators.optionLabels.startsWith',
        descriptionKey: 'pages.evaluators.optionDescriptions.startsWith'
    },
    {
        type: 'text',
        name: 'NotStartsWith',
        labelKey: 'pages.evaluators.optionLabels.notStartsWith',
        descriptionKey: 'pages.evaluators.optionDescriptions.notStartsWith'
    },
    {
        type: 'json',
        name: 'IsValidJSON',
        labelKey: 'pages.evaluators.optionLabels.isValidJson',
        descriptionKey: 'pages.evaluators.optionDescriptions.isValidJson'
    },
    {
        type: 'json',
        name: 'IsNotValidJSON',
        labelKey: 'pages.evaluators.optionLabels.isNotValidJson',
        descriptionKey: 'pages.evaluators.optionDescriptions.isNotValidJson'
    },
    {
        type: 'numeric',
        name: 'totalTokens',
        labelKey: 'pages.evaluators.optionLabels.totalTokens',
        descriptionKey: 'pages.evaluators.optionDescriptions.totalTokens'
    },
    {
        type: 'numeric',
        name: 'promptTokens',
        labelKey: 'pages.evaluators.optionLabels.promptTokens',
        descriptionKey: 'pages.evaluators.optionDescriptions.promptTokens'
    },
    {
        type: 'numeric',
        name: 'completionTokens',
        labelKey: 'pages.evaluators.optionLabels.completionTokens',
        descriptionKey: 'pages.evaluators.optionDescriptions.completionTokens'
    },
    {
        type: 'numeric',
        name: 'apiLatency',
        labelKey: 'pages.evaluators.optionLabels.apiLatency',
        descriptionKey: 'pages.evaluators.optionDescriptions.apiLatency'
    },
    {
        type: 'numeric',
        name: 'llm',
        labelKey: 'pages.evaluators.optionLabels.llmLatency',
        descriptionKey: 'pages.evaluators.optionDescriptions.llmLatency'
    },
    {
        type: 'numeric',
        name: 'chain',
        labelKey: 'pages.evaluators.optionLabels.chatflowLatency',
        descriptionKey: 'pages.evaluators.optionDescriptions.chatflowLatency'
    },
    {
        type: 'numeric',
        name: 'responseLength',
        labelKey: 'pages.evaluators.optionLabels.responseLength',
        descriptionKey: 'pages.evaluators.optionDescriptions.responseLength'
    }
]

export const evaluatorTypes = [
    {
        name: 'text',
        labelKey: 'pages.evaluators.optionLabels.evaluateText',
        descriptionKey: 'pages.evaluators.optionDescriptions.evaluateText'
    },
    {
        name: 'json',
        labelKey: 'pages.evaluators.optionLabels.evaluateJson',
        descriptionKey: 'pages.evaluators.optionDescriptions.evaluateJson'
    },
    {
        name: 'numeric',
        labelKey: 'pages.evaluators.optionLabels.evaluateNumeric',
        descriptionKey: 'pages.evaluators.optionDescriptions.evaluateNumeric'
    },
    {
        name: 'llm',
        labelKey: 'pages.evaluators.optionLabels.llmGrading',
        descriptionKey: 'pages.evaluators.optionDescriptions.llmGrading'
    }
]

export const numericOperators = [
    {
        name: 'equals',
        labelKey: 'pages.evaluators.optionLabels.equals'
    },
    {
        name: 'notEquals',
        labelKey: 'pages.evaluators.optionLabels.notEquals'
    },
    {
        name: 'greaterThan',
        labelKey: 'pages.evaluators.optionLabels.greaterThan'
    },
    {
        name: 'lessThan',
        labelKey: 'pages.evaluators.optionLabels.lessThan'
    },
    {
        name: 'greaterThanOrEquals',
        labelKey: 'pages.evaluators.optionLabels.greaterThanOrEquals'
    },
    {
        name: 'lessThanOrEquals',
        labelKey: 'pages.evaluators.optionLabels.lessThanOrEquals'
    }
]

export const getEvaluatorOptionLabel = (options, name, t, fallback = '') => {
    const option = options.find((item) => item.name === name)
    if (!option) return fallback
    return option.labelKey ? t(option.labelKey) : option.label || fallback
}

export const getEvaluatorOptionDescription = (option, t) => {
    if (!option) return ''
    return option.descriptionKey ? t(option.descriptionKey) : option.description || ''
}

export const localizeEvaluatorOptions = (options, t) =>
    options.map((option) => ({
        ...option,
        label: option.labelKey ? t(option.labelKey) : option.label,
        description: option.descriptionKey ? t(option.descriptionKey) : option.description
    }))
