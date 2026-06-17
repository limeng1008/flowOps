export type FlowOpsEdition = 'cloud' | 'private'

export const getFlowOpsEdition = (env: NodeJS.ProcessEnv = process.env): FlowOpsEdition => {
    const edition = `${env.FLOWOPS_EDITION ?? env.EDITION ?? ''}`.trim().toLowerCase()
    return edition === 'cloud' ? 'cloud' : 'private'
}
