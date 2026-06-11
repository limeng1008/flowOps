import { Request } from 'express'

export const getWorkspaceSearchOptions = (workspaceId?: string): Record<string, string> => {
    if (!workspaceId) return {}
    return { workspaceId }
}

export const getWorkspaceSearchOptionsFromReq = (req: Request): Record<string, string> =>
    getWorkspaceSearchOptions((req.user as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId)

export const getActiveWorkspaceIdForRequest = (req: Request): string =>
    (req.user as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId ?? ''
