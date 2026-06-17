export type IamProviderName = 'self'

export const getIamProviderName = (): IamProviderName => 'self'

/** @deprecated FlowOps IAM is single-track self IAM. Kept only for old internal imports. */
export const isSelfIamMode = (): boolean => true
