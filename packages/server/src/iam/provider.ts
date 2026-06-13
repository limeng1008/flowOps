import { existsSync } from 'fs'
import { join } from 'path'

export type IamProviderName = 'enterprise' | 'self'

const enterpriseDistExists = existsSync(join(__dirname, '..', 'enterprise'))
let loggedMissingEnterpriseDist = false

const shouldForceSelfForShipDist = (): boolean => {
    if (enterpriseDistExists) return false

    if (!loggedMissingEnterpriseDist) {
        loggedMissingEnterpriseDist = true
        console.info('[FlowOps IAM] packages/server/dist/enterprise not found; forcing FLOWOPS_IAM=self for ship build.')
    }

    return true
}

export const getIamProviderName = (): IamProviderName => {
    if (shouldForceSelfForShipDist()) return 'self'
    return process.env.FLOWOPS_IAM === 'self' ? 'self' : 'enterprise'
}

export const isSelfIamMode = (): boolean => getIamProviderName() === 'self'
