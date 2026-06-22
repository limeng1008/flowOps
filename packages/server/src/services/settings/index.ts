import { Platform } from '../../Interface'
import { getFlowOpsEdition } from '../entitlement'
import { getFlowOpsBrand } from '../branding'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const getSettings = async () => {
    try {
        const appServer = getRunningExpressApp()
        const platformType = appServer.identityManager.getPlatformType()
        const flowOpsEdition = getFlowOpsEdition()
        const editionSettings = {
            FLOWOPS_EDITION: flowOpsEdition,
            EDITION: flowOpsEdition,
            BRAND: getFlowOpsBrand()
        }

        switch (platformType) {
            case Platform.ENTERPRISE: {
                if (!appServer.identityManager.isLicenseValid()) {
                    // 许可失效也要回品牌:到期页需要支持联系方式 + 名称
                    return { BRAND: getFlowOpsBrand() }
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
