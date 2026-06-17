const SELF_SSO_WHITELIST_URLS: readonly string[] = Object.freeze([])

export const getSelfSsoWhitelistUrls = (): string[] => [...SELF_SSO_WHITELIST_URLS]
