import config from '@/config'

export const getPostLoginRedirectPath = (locationState) => {
    const requestedPath = typeof locationState?.path === 'string' ? locationState.path.trim() : ''

    return requestedPath || config.defaultPath
}
