import { isSelfIamMode } from './provider'
import { getSelfSsoWhitelistUrls } from './self/sso'

type SsoProvider = {
    LOGIN_URI: string
    LOGOUT_URI: string
    CALLBACK_URI: string
}

type SsoProviders = {
    Auth0SSO: SsoProvider
    AzureSSO: SsoProvider
    GithubSSO: SsoProvider
    GoogleSSO: SsoProvider
}

const loadEnterpriseSsoProviders = (): SsoProviders => {
    return {
        Auth0SSO: require('../enterprise/sso/Auth0SSO').default,
        AzureSSO: require('../enterprise/sso/AzureSSO').default,
        GithubSSO: require('../enterprise/sso/GithubSSO').default,
        GoogleSSO: require('../enterprise/sso/GoogleSSO').default
    }
}

export const getSsoWhitelistUrls = (): string[] => {
    if (isSelfIamMode()) return getSelfSsoWhitelistUrls()

    const { Auth0SSO, AzureSSO, GithubSSO, GoogleSSO } = loadEnterpriseSsoProviders()
    return [
        AzureSSO.LOGIN_URI,
        AzureSSO.LOGOUT_URI,
        AzureSSO.CALLBACK_URI,
        GoogleSSO.LOGIN_URI,
        GoogleSSO.LOGOUT_URI,
        GoogleSSO.CALLBACK_URI,
        Auth0SSO.LOGIN_URI,
        Auth0SSO.LOGOUT_URI,
        Auth0SSO.CALLBACK_URI,
        GithubSSO.LOGIN_URI,
        GithubSSO.LOGOUT_URI,
        GithubSSO.CALLBACK_URI
    ]
}
