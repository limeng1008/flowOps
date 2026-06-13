type GetHash = (value: string) => string
type ValidatePasswordOrThrow = (password: string) => void

export const getHash: GetHash = (value: string): string => {
    // P3 惰化:self 轨不加载 enterprise。
    return (require('../enterprise/utils/encryption.util') as { getHash: GetHash }).getHash(value)
}

export const validatePasswordOrThrow: ValidatePasswordOrThrow = (password: string): void => {
    // P3 惰化:self 轨不加载 enterprise。
    return (require('../enterprise/utils/validation.util') as { validatePasswordOrThrow: ValidatePasswordOrThrow }).validatePasswordOrThrow(
        password
    )
}
