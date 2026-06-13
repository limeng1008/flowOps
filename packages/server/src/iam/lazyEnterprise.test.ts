describe('IAM enterprise lazy loading', () => {
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

    it('does not load enterprise modules while evaluating self-mode IAM seams', () => {
        require('./boot')
        require('./entities')
        require('./identity')
        require('./middleware')
        require('./query')
        require('./routes')
        require('./security')
        require('./services')
        require('./sso')
        require('../database/entities')
        require('../utils/constants')

        const enterpriseCacheEntries = Object.keys(require.cache).filter(
            (modulePath) => modulePath.includes('/src/enterprise/') || modulePath.endsWith('/src/IdentityManager.ts')
        )

        expect(enterpriseCacheEntries).toEqual([])
    })

    it('uses the ship migration set without loading enterprise migrations in self mode', async () => {
        process.env.DATABASE_TYPE = 'postgres'

        const { getMigrations } = require('../DataSource')
        const migrationNamesByDatabase = ['postgres', 'mysql', 'mariadb', 'sqlite'].map((databaseType) =>
            getMigrations(databaseType).map((migration: Function) => migration.name)
        )
        const enterpriseCacheEntries = Object.keys(require.cache).filter(
            (modulePath) => modulePath.includes('/src/enterprise/') || modulePath.endsWith('/src/IdentityManager.ts')
        )

        for (const migrationNames of migrationNamesByDatabase) {
            expect(migrationNames).toContain('AddFlowOpsIamEntities1778000000000')
            expect(migrationNames).toContain('AddApiKeyPermission1765360298674')
            expect(migrationNames).not.toContain('AddAuthTables1720230151482')
        }
        expect(enterpriseCacheEntries).toEqual([])
    })

    it('maps legacy IAM entity values to FlowOps entities in self mode', () => {
        const iamEntities = require('./entities')
        const selfEntities = require('./self/entities')
        const enterpriseCacheEntries = Object.keys(require.cache).filter(
            (modulePath) => modulePath.includes('/src/enterprise/') || modulePath.endsWith('/src/IdentityManager.ts')
        )

        expect(iamEntities.Workspace).toBe(selfEntities.FlowOpsWorkspace)
        expect(iamEntities.Organization).toBe(selfEntities.FlowOpsOrganization)
        expect(iamEntities.User).toBe(selfEntities.FlowOpsUser)
        expect(iamEntities.Role).toBe(selfEntities.FlowOpsRole)
        expect(iamEntities.WorkspaceUser).toBe(selfEntities.FlowOpsWorkspaceMember)
        expect(enterpriseCacheEntries).toEqual([])
    })
})
