import { readFileSync } from 'fs'
import { join } from 'path'
import { Request } from 'express'

const enterpriseCacheEntries = () => Object.keys(require.cache).filter((modulePath) => modulePath.includes('/src/enterprise/'))

describe('FlowOps IAM workspace query seam', () => {
    const originalFlowOpsIam = process.env.FLOWOPS_IAM

    beforeEach(() => {
        jest.resetModules()
        process.env.FLOWOPS_IAM = 'self'
    })

    afterEach(() => {
        if (originalFlowOpsIam === undefined) delete process.env.FLOWOPS_IAM
        else process.env.FLOWOPS_IAM = originalFlowOpsIam
        jest.resetModules()
    })

    it('uses self workspace query helpers in self mode without loading enterprise modules', () => {
        const { getActiveWorkspaceIdForRequest, getWorkspaceSearchOptions, getWorkspaceSearchOptionsFromReq } = require('./query') as {
            getWorkspaceSearchOptions: (workspaceId?: string) => Record<string, unknown>
            getWorkspaceSearchOptionsFromReq: (req: Request) => Record<string, unknown>
            getActiveWorkspaceIdForRequest: (req: Request) => string
        }
        const request = { user: { activeWorkspaceId: 'workspace-self-1' } } as Request

        expect(getWorkspaceSearchOptions('workspace-self-1')).toEqual({ workspaceId: 'workspace-self-1' })
        expect(getWorkspaceSearchOptions()).toEqual({})
        expect(getWorkspaceSearchOptionsFromReq(request)).toEqual({ workspaceId: 'workspace-self-1' })
        expect(getActiveWorkspaceIdForRequest(request)).toBe('workspace-self-1')
        expect(enterpriseCacheEntries()).toEqual([])
    })

    it('uses typed enterprise module shims in the public IAM query seam', () => {
        const source = readFileSync(join(__dirname, 'query.ts'), 'utf8')

        expect(source).not.toContain('Record<string, unknown>')
    })
})
