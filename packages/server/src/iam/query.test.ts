import { readFileSync } from 'fs'
import { join } from 'path'
import { Request } from 'express'

const removedSourceDir = ['enter', 'prise'].join('')
const removedSourceCacheEntries = () => Object.keys(require.cache).filter((modulePath) => modulePath.includes(`/src/${removedSourceDir}/`))

describe('FlowOps IAM workspace query seam', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    afterEach(() => {
        jest.resetModules()
    })

    it('uses self workspace query helpers', () => {
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
        expect(removedSourceCacheEntries()).toEqual([])
    })

    it('keeps public workspace query types narrow', () => {
        const source = readFileSync(join(__dirname, 'query.ts'), 'utf8')

        expect(source).not.toContain('Record<string, unknown>')
        expect(source).not.toContain(removedSourceDir)
    })
})
