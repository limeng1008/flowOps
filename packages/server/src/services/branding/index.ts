import { isSelfFeatureAllowed } from '../../iam/self/features'
import { FLOWOPS_ENTITLEMENT_FEATURES } from '../entitlement/catalog'

export interface FlowOpsBrand {
    name: string
    supportEmail: string
    repoUrl: string
    primaryColor: string
    logoUrl: string
}

// 内置默认品牌。空字符串 = 中性:UI 据此隐藏入口 / 显示「联系系统管理员」,绝不外露上游厂商信息。
export const DEFAULT_FLOWOPS_BRAND: FlowOpsBrand = {
    name: 'FlowOps',
    supportEmail: '',
    repoUrl: '',
    primaryColor: '',
    logoUrl: ''
}

const envOverride = (key: string): string => (process.env[key] ?? '').trim()

// 白标品牌:仅 custom-branding 授权(team+)时应用部署方的 env 覆盖,否则一律内置默认。
export const getFlowOpsBrand = (): FlowOpsBrand => {
    if (!isSelfFeatureAllowed(FLOWOPS_ENTITLEMENT_FEATURES.customBranding)) {
        return { ...DEFAULT_FLOWOPS_BRAND }
    }
    return {
        name: envOverride('FLOWOPS_BRAND_NAME') || DEFAULT_FLOWOPS_BRAND.name,
        supportEmail: envOverride('FLOWOPS_BRAND_SUPPORT_EMAIL') || DEFAULT_FLOWOPS_BRAND.supportEmail,
        repoUrl: envOverride('FLOWOPS_BRAND_REPO_URL') || DEFAULT_FLOWOPS_BRAND.repoUrl,
        primaryColor: envOverride('FLOWOPS_BRAND_PRIMARY_COLOR') || DEFAULT_FLOWOPS_BRAND.primaryColor,
        logoUrl: envOverride('FLOWOPS_BRAND_LOGO_URL') || DEFAULT_FLOWOPS_BRAND.logoUrl
    }
}
