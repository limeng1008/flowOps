import { getOrCreateStoredSecret } from '../../utils'

let jwtAuthTokenSecret: string | undefined
let jwtRefreshTokenSecret: string | undefined

export const SELF_ACCESS_TOKEN_COOKIE = 'flowops_access_token'
export const SELF_REFRESH_TOKEN_COOKIE = 'flowops_refresh_token'

export const initSelfAuthSecrets = async (): Promise<void> => {
    jwtAuthTokenSecret = await getOrCreateStoredSecret({
        envKey: 'JWT_AUTH_TOKEN_SECRET',
        fileName: 'jwt-auth-token-secret',
        awsSecretIdSuffix: 'JwtAuthTokenSecret'
    })
    jwtRefreshTokenSecret = await getOrCreateStoredSecret({
        envKey: 'JWT_REFRESH_TOKEN_SECRET',
        fileName: 'jwt-refresh-token-secret',
        awsSecretIdSuffix: 'JwtRefreshTokenSecret'
    })
}

export const getSelfJwtAuthTokenSecret = (): string => {
    if (jwtAuthTokenSecret) return jwtAuthTokenSecret
    if (process.env.JWT_AUTH_TOKEN_SECRET?.trim()) return process.env.JWT_AUTH_TOKEN_SECRET.trim()
    throw new Error('JWT auth token secret has not been initialized')
}

export const getSelfJwtRefreshTokenSecret = (): string => {
    if (jwtRefreshTokenSecret) return jwtRefreshTokenSecret
    if (process.env.JWT_REFRESH_TOKEN_SECRET?.trim()) return process.env.JWT_REFRESH_TOKEN_SECRET.trim()
    throw new Error('JWT refresh token secret has not been initialized')
}
