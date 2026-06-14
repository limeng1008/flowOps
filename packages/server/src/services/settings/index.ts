import { Platform } from '../../Interface'
import { getFlowOpsEdition } from '../entitlement'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const getSettings = async () => {
    try {
        const appServer = getRunningExpressApp()
        const platformType = appServer.identityManager.getPlatformType()
        const flowOpsEdition = getFlowOpsEdition()
        const editionSettings = {
            FLOWOPS_EDITION: flowOpsEdition,
            EDITION: flowOpsEdition
        }

        switch (platformType) {
            case Platform.ENTERPRISE: {
                if (!appServer.identityManager.isLicenseValid()) {
                    return {}
                } else {
                    return { PLATFORM_TYPE: Platform.ENTERPRISE, ...editionSettings }
                }
            }
            case Platform.CLOUD: {
                return { PLATFORM_TYPE: Platform.CLOUD, ...editionSettings }
            }
            default: {
                return { PLATFORM_TYPE: Platform.OPEN_SOURCE, ...editionSettings }
            }
        }
    } catch (error) {
        return {}
    }
}

export default {
    getSettings
}
