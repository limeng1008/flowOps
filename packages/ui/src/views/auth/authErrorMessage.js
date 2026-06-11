const AUTH_ERROR_KEYS = {
    'Incorrect Email or Password': 'auth.errors.incorrectEmailOrPassword',
    'Unknown Username or Password': 'auth.errors.incorrectEmailOrPassword',
    'Incorrect Password': 'auth.errors.incorrectEmailOrPassword',
    'User Email Unverified': 'auth.errors.userEmailUnverified',
    'Inactive User': 'auth.errors.inactiveUser',
    'Invalid Organization Id': 'auth.errors.invalidOrganization',
    'No Workspace Assigned': 'auth.errors.invalidWorkspace',
    Forbidden: 'auth.errors.forbidden',
    'User Invited, but has not registered': 'auth.errors.invitedUser'
}

export const translateAuthErrorMessage = (message, t) => {
    if (typeof message !== 'string' || !message) return message

    const key = AUTH_ERROR_KEYS[message]
    if (!key) return message

    return t(key, message)
}
