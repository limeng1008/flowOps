export type IamProviderName = 'enterprise' | 'self'

export const getIamProviderName = (): IamProviderName => (process.env.FLOWOPS_IAM === 'self' ? 'self' : 'enterprise')

export const isSelfIamMode = (): boolean => getIamProviderName() === 'self'
