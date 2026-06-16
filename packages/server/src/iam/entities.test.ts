import { readFileSync } from 'fs'
import { join } from 'path'

const enterpriseCacheEntries = () =>
    Object.keys(require.cache).filter(
        (modulePath) => modulePath.includes('/src/enterprise/') || modulePath.endsWith('/src/IdentityManager.ts')
    )

describe('FlowOps IAM entity seam', () => {
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

    it('maps self-mode IAM entity exports to flowops_ entities without loading enterprise modules', () => {
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
        expect(enterpriseCacheEntries()).toEqual([])
    })

    it('keeps public entity seam types self-owned and free of undefined/type-erasure fallbacks', () => {
        const source = readFileSync(join(__dirname, 'entities.ts'), 'utf8')

        expect(source).not.toContain('../enterprise/Interface.Enterprise')
        expect(source).not.toContain('undefined as')
        expect(source).not.toContain('as unknown as')
    })
})
