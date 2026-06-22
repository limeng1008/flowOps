import { getAsyncDropdownSelectionValue, resolveAsyncDropdownValue } from './asyncDropdownUtils'

describe('async dropdown value handling', () => {
    const options = [
        { label: 'DeepSeek V4 Flash', name: 'deepseek-v4-flash' },
        { label: 'DeepSeek V4 Pro', name: 'deepseek-v4-pro' }
    ]

    it('resolves a catalog value to its option object', () => {
        expect(
            resolveAsyncDropdownValue({
                options,
                value: 'deepseek-v4-flash',
                multiple: false,
                freeSolo: true,
                chooseOptionLabel: 'Choose an option'
            })
        ).toEqual(options[0])
    })

    it('preserves an unknown value for a free-form dropdown', () => {
        expect(
            resolveAsyncDropdownValue({
                options,
                value: 'deepseek-future-model',
                multiple: false,
                freeSolo: true,
                chooseOptionLabel: 'Choose an option'
            })
        ).toBe('deepseek-future-model')
    })

    it('does not expose an unknown value in an option-only dropdown', () => {
        expect(
            resolveAsyncDropdownValue({
                options,
                value: 'unknown-model',
                multiple: false,
                freeSolo: false,
                chooseOptionLabel: 'Choose an option'
            })
        ).toBe('')
    })

    it('does not expose the choose-option sentinel as a custom value', () => {
        expect(
            resolveAsyncDropdownValue({
                options,
                value: 'Choose an option',
                multiple: false,
                freeSolo: true,
                chooseOptionLabel: 'Choose an option'
            })
        ).toBe('')
    })

    it.each([
        ['custom string', 'deepseek-future-model', 'deepseek-future-model'],
        ['catalog option', { label: 'DeepSeek V4 Pro', name: 'deepseek-v4-pro' }, 'deepseek-v4-pro'],
        ['cleared value', null, '']
    ])('normalizes a %s selection', (_, selection, expected) => {
        expect(getAsyncDropdownSelectionValue(selection)).toBe(expected)
    })
})
