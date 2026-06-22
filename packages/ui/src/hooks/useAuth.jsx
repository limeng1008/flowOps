import { useSelector } from 'react-redux'
import { useConfig } from '@/store/context/ConfigContext'

export const useAuth = () => {
    const { isOpenSource, isCloud } = useConfig()
    const permissions = useSelector((state) => state.auth.permissions)
    const features = useSelector((state) => state.auth.features)
    const tier = useSelector((state) => state.auth.tier)
    const isGlobal = useSelector((state) => state.auth.isGlobal)
    const currentUser = useSelector((state) => state.auth.user)

    const hasPermission = (permissionId) => {
        if (isOpenSource || isGlobal) {
            return true
        }
        if (!permissionId) return false
        const permissionIds = permissionId.split(',')
        if (permissions && permissions.length) {
            return permissionIds.some((permissionId) => permissions.includes(permissionId))
        }
        return false
    }

    const hasAssignedWorkspace = (workspaceId) => {
        if (isOpenSource || isGlobal) {
            return true
        }
        const activeWorkspaceId = currentUser?.activeWorkspaceId || ''
        if (workspaceId === activeWorkspaceId) {
            return true
        }
        return false
    }

    const hasDisplay = (display) => {
        if (!display) {
            return true
        }

        // FlowOps: edition 门控（不依赖后端 feature flag）—— 在线计费/工单仅 cloud 版显示，private 版隐藏
        if (display === 'edition:cloud') {
            return isCloud
        }
        if (display === 'edition:private') {
            return !isCloud
        }

        // if it has display flag, but user has no features, then it should not be displayed
        if (!features || Array.isArray(features) || Object.keys(features).length === 0) {
            return false
        }

        // check if the display flag is in the features
        if (Object.hasOwnProperty.call(features, display)) {
            const flag = features[display] === 'true' || features[display] === true
            return flag
        }

        return false
    }

    // 按 tier 解锁的功能位门控（与 hasDisplay 同一套后端 features，命名更贴近「功能授权」语义）
    const hasFeature = (feature) => hasDisplay(feature)

    return { hasPermission, hasAssignedWorkspace, hasDisplay, hasFeature, tier }
}
