import { isSelfIamMode } from './provider'
import { getHash as selfGetHash, validatePasswordOrThrow as selfValidatePasswordOrThrow } from './self/security'

type GetHash = (value: string) => string
type ValidatePasswordOrThrow = (password: string) => void

const getEnterpriseSecurity = () => {
    // P3/P4 过渡:enterprise 模式暂留 legacy 实现;self 模式绝不进入这里。
    return require('../enterprise/utils/encryption.util') as { getHash: GetHash }
}

const getEnterpriseValidation = () => {
    // P3/P4 过渡:enterprise 模式暂留 legacy 实现;self 模式绝不进入这里。
    return require('../enterprise/utils/validation.util') as { validatePasswordOrThrow: ValidatePasswordOrThrow }
}

export const getHash: GetHash = (value: string): string => {
    if (isSelfIamMode()) return selfGetHash(value)
    return getEnterpriseSecurity().getHash(value)
}

export const validatePasswordOrThrow: ValidatePasswordOrThrow = (password: string): void => {
    if (isSelfIamMode()) return selfValidatePasswordOrThrow(password)
    return getEnterpriseValidation().validatePasswordOrThrow(password)
}
