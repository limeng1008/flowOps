import fs from 'fs'
import path from 'path'

describe('IAM enterprise lazy loading', () => {
    const originalFlowOpsIam = process.env.FLOWOPS_IAM

    const enterpriseCacheEntries = () =>
        Object.keys(require.cache).filter(
            (modulePath) => modulePath.includes('/src/enterprise/') || modulePath.endsWith('/src/IdentityManager.ts')
        )

    const expectNoEnterpriseCacheEntries = () => {
        expect(enterpriseCacheEntries()).toEqual([])
    }

    beforeEach(() => {
        jest.resetModules()
        process.env.FLOWOPS_IAM = 'self'
    })

    afterEach(() => {
        jest.dontMock('./self/secrets')
        jest.dontMock('./self/middleware')
        jest.dontMock('./self/auth/passport')
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

        expectNoEnterpriseCacheEntries()
    })

    it('does not load enterprise modules while exercising self-mode boot entrypoints', async () => {
        const initSelfAuthSecrets = jest.fn()
        const verifyToken = jest.fn()
        const verifyTokenForBullMQDashboard = jest.fn()
        const initialize = jest.fn()
        const configureSelfLocalStrategy = jest.fn(() => ({ initialize }))

        jest.doMock('./self/secrets', () => ({ initSelfAuthSecrets }))
        jest.doMock('./self/middleware', () => ({ verifyToken, verifyTokenForBullMQDashboard }))
        jest.doMock('./self/auth/passport', () => ({ configureSelfLocalStrategy }))

        const boot = require('./boot')
        const app = { use: jest.fn() }
        const req = {}
        const res = {}
        const next = jest.fn()

        await boot.initAuthSecrets()
        await boot.initializeJwtCookieMiddleware(app, {})
        boot.verifyToken(req, res, next)
        boot.verifyTokenForBullMQDashboard(req, res, next)

        expect(initSelfAuthSecrets).toHaveBeenCalledTimes(1)
        expect(configureSelfLocalStrategy).toHaveBeenCalledTimes(1)
        expect(initialize).toHaveBeenCalledTimes(1)
        expect(app.use).toHaveBeenCalledWith(initialize.mock.results[0].value)
        expect(verifyToken).toHaveBeenCalledWith(req, res, next)
        expect(verifyTokenForBullMQDashboard).toHaveBeenCalledWith(req, res, next)
        expectNoEnterpriseCacheEntries()
    })

    it('does not load enterprise modules while resolving self-mode IAM routers', () => {
        const routes = require('./routes')
        const selfAuthRoutes = require('./self/auth/routes')
        const selfAdminRoutes = require('./self/admin/routes')

        expect(routes.accountRouter).toBe(selfAuthRoutes.accountRouter)
        expect(routes.authRouter).toBe(selfAuthRoutes.authRouter)
        expect(routes.loginMethodRouter).toBe(selfAuthRoutes.loginMethodRouter)
        expect(routes.auditRouter).toBe(selfAdminRoutes.auditRouter)
        expect(routes.organizationUserRoute).toBe(selfAdminRoutes.organizationUserRoute)
        expect(routes.organizationRouter).toBe(selfAdminRoutes.organizationRouter)
        expect(routes.roleRouter).toBe(selfAdminRoutes.roleRouter)
        expect(routes.userRouter).toBe(selfAdminRoutes.userRouter)
        expect(routes.workspaceUserRouter).toBe(selfAdminRoutes.workspaceUserRouter)
        expect(routes.workspaceRouter).toBe(selfAdminRoutes.workspaceRouter)
        expectNoEnterpriseCacheEntries()
    })

    it('uses a self-owned empty SSO whitelist without loading enterprise providers', () => {
        const source = fs.readFileSync(path.join(__dirname, 'sso.ts'), 'utf8')
        const { getSsoWhitelistUrls } = require('./sso')

        expect(source).toContain("from './self/sso'")
        expect(getSsoWhitelistUrls()).toEqual([])
        expectNoEnterpriseCacheEntries()
    })

    it('constructs concrete self workspace services without loading enterprise services', () => {
        const source = fs.readFileSync(path.join(__dirname, 'services.ts'), 'utf8')
        const { WorkspaceService, WorkspaceUserService, WorkspaceUserErrorMessage } = require('./services')
        const { FlowOpsWorkspaceService, FlowOpsWorkspaceUserService } = require('./self/workspace/services')

        expect(source).toContain("from './self/workspace/services'")
        expect(source).not.toContain('class SelfWorkspaceService')
        expect(source).not.toMatch(/\b(stub|no-op)\b/i)
        expect(new WorkspaceService()).toBeInstanceOf(FlowOpsWorkspaceService)
        expect(new WorkspaceUserService()).toBeInstanceOf(FlowOpsWorkspaceUserService)
        expect(WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND).toBe('Workspace User Not Found')
        expectNoEnterpriseCacheEntries()
    })

    it('keeps Phase C seams free of type-erasure and undefined fallbacks outside identity', () => {
        for (const filename of ['boot.ts', 'routes.ts', 'sso.ts', 'services.ts']) {
            const source = fs.readFileSync(path.join(__dirname, filename), 'utf8')
            expect(source).not.toContain('as unknown as')
            expect(source).not.toContain('undefined as')
            expect(source).not.toMatch(/\b(stub|no-op)\b/i)
        }
    })

    it('uses the ship migration set without loading enterprise migrations in self mode', async () => {
        process.env.DATABASE_TYPE = 'postgres'

        const { getMigrations } = require('../DataSource')
        const migrationNamesByDatabase = ['postgres', 'mysql', 'mariadb', 'sqlite'].map((databaseType) =>
            getMigrations(databaseType).map((migration: Function) => migration.name)
        )

        for (const migrationNames of migrationNamesByDatabase) {
            expect(migrationNames).toContain('AddFlowOpsIamEntities1778000000000')
            expect(migrationNames).toContain('AddApiKeyPermission1765360298674')
            expect(migrationNames).not.toContain('AddAuthTables1720230151482')
        }
        expectNoEnterpriseCacheEntries()
    })

    it('maps legacy IAM entity values to FlowOps entities in self mode', () => {
        const iamEntities = require('./entities')
        const selfEntities = require('./self/entities')

        expect(iamEntities.Workspace).toBe(selfEntities.FlowOpsWorkspace)
        expect(iamEntities.Organization).toBe(selfEntities.FlowOpsOrganization)
        expect(iamEntities.User).toBe(selfEntities.FlowOpsUser)
        expect(iamEntities.Role).toBe(selfEntities.FlowOpsRole)
        expect(iamEntities.WorkspaceUser).toBe(selfEntities.FlowOpsWorkspaceMember)
        expectNoEnterpriseCacheEntries()
    })
})
