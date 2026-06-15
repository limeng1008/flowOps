export const getLogoutRedirectPath = (logoutResponse) => {
    if (!logoutResponse || typeof logoutResponse !== 'object') return null
    if (logoutResponse.redirectTo) return logoutResponse.redirectTo

    const successMessages = new Set(['logged_out', 'Logout Successful'])
    return successMessages.has(logoutResponse.message) ? '/login' : null
}
