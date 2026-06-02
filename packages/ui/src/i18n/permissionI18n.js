const toI18nSegment = (value = '') => value.replace(/-/g, '_')

const formatCategoryFallback = (category = '') =>
    category
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toUpperCase()

const getPermissionFallback = (permission) => {
    if (typeof permission === 'string') return permission
    return permission?.value || permission?.key || ''
}

const getPermissionKey = (permission) => {
    if (typeof permission === 'string') return permission
    return permission?.key || ''
}

export const translatePermissionCategory = (category, t) =>
    t(`permissions.categories.${category}`, {
        defaultValue: formatCategoryFallback(category)
    })

export const translatePermissionLabel = (permission, t) => {
    const permissionKey = getPermissionKey(permission)
    const fallback = getPermissionFallback(permission)

    if (!permissionKey) return fallback

    const [category, action] = permissionKey.split(':')
    const fullKey = `permissions.full.${category}.${toI18nSegment(action)}`
    const actionLabel = t(`permissions.actions.${toI18nSegment(action)}`, {
        defaultValue: fallback
    })

    return t(fullKey, {
        defaultValue: actionLabel
    })
}
