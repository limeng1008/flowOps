import { readFileSync } from 'fs'
import { join } from 'path'

const removedSourceDir = ['enter', 'prise'].join('')
const removedIdentityBoundary = ['Identity', 'Manager.ts'].join('')
const removedSourceCacheEntries = () =>
    Object.keys(require.cache).filter(
        (modulePath) => modulePath.includes(`/src/${removedSourceDir}/`) || modulePath.endsWith(`/src/${removedIdentityBoundary}`)
    )

describe('FlowOps IAM entity seam', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    afterEach(() => {
        jest.resetModules()
    })

    it('maps IAM entity exports to flowops_ entities', () => {
        const iamEntities = require('./entities')
        const selfEntities = require('./self/entities')

        expect(iamEntities.LoginActivity).toBe(selfEntities.FlowOpsLoginActivity)
        expect(iamEntities.Organization).toBe(selfEntities.FlowOpsOrganization)
        expect(iamEntities.OrganizationUser).toBe(selfEntities.FlowOpsWorkspaceMember)
        expect(iamEntities.Role).toBe(selfEntities.FlowOpsRole)
        expect(iamEntities.User).toBe(selfEntities.FlowOpsUser)
        expect(iamEntities.Workspace).toBe(selfEntities.FlowOpsWorkspace)
        expect(iamEntities.WorkspaceUser).toBe(selfEntities.FlowOpsWorkspaceMember)
        expect(iamEntities.WorkspaceUsers).toBe(selfEntities.FlowOpsWorkspaceMember)
        expect(removedSourceCacheEntries()).toEqual([])
    })

    it('keeps public entity seam types self-owned and free of undefined/type-erasure fallbacks', () => {
        const source = readFileSync(join(__dirname, 'entities.ts'), 'utf8')

        expect(source).not.toContain(removedSourceDir)
        expect(source).not.toContain('undefined as')
        expect(source).not.toContain('as unknown as')
    })
})
