export const getWorkspaceSwitchReloadPath = (locationLike = window.location) => {
    const pathname = locationLike?.pathname || '/'
    const search = locationLike?.search || ''
    const hash = locationLike?.hash || ''

    return `${pathname}${search}${hash}`
}
