import { FLOWOPS_ENTITLEMENT_FEATURES } from '../entitlement/catalog'
import { isSelfFeatureAllowed } from '../../iam/self/features'

// 高级节点 → 所需功能位(catalog 商业化位)。未登记的节点不门控,所有档可见。
// 该机制可复用:后续 content-safety / human-handoff 等高级节点同样在此登记。
export const NODE_FEATURE_GATES: Record<string, string> = {
    pptxExportAgentflow: FLOWOPS_ENTITLEMENT_FEATURES.pptExcelExport,
    spreadsheetExportAgentflow: FLOWOPS_ENTITLEMENT_FEATURES.pptExcelExport
}

// 节点是否被当前部署档位授权(未登记门控的节点恒 true)。
export const isNodeAllowedByEntitlement = (nodeName: string): boolean => {
    const requiredFeature = NODE_FEATURE_GATES[nodeName]
    return !requiredFeature || isSelfFeatureAllowed(requiredFeature)
}
