const isChooseOptionValue = (candidate, chooseOptionLabel) => candidate === 'choose an option' || candidate === chooseOptionLabel

export const findMatchingOptions = (options = [], value, multiple, chooseOptionLabel) => {
    if (multiple) {
        let values = []
        if (!isChooseOptionValue(value, chooseOptionLabel) && value && typeof value === 'string') {
            values = JSON.parse(value)
        } else {
            values = value
        }
        if (!Array.isArray(values)) return []
        return options.filter((option) => values.includes(option.name))
    }

    return options.find((option) => option.name === value)
}

export const resolveAsyncDropdownValue = ({ options, value, multiple, freeSolo, chooseOptionLabel }) => {
    const matchingValue = findMatchingOptions(options, value, multiple, chooseOptionLabel)

    if (multiple) return matchingValue
    if (matchingValue) return matchingValue
    if (freeSolo && typeof value === 'string' && value && !isChooseOptionValue(value, chooseOptionLabel)) return value

    return ''
}

export const getAsyncDropdownSelectionValue = (selection) => {
    if (typeof selection === 'string') return selection
    return selection?.name || ''
}
