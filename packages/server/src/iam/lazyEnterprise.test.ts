import fs from 'fs'
import path from 'path'

describe('IAM removed-source guard', () => {
    const serverSrcRoot = path.join(__dirname, '..')
    const removedSourceDir = ['enter', 'prise'].join('')
    const removedIdentityBoundary = ['Identity', 'Manager.ts'].join('')

    const removedSourceCacheEntries = () =>
        Object.keys(require.cache).filter(
            (modulePath) => modulePath.includes(`/src/${removedSourceDir}/`) || modulePath.endsWith(`/src/${removedIdentityBoundary}`)
        )

    const expectNoRemovedSourceCacheEntries = () => {
        expect(removedSourceCacheEntries()).toEqual([])
    }

    beforeEach(() => {
        jest.resetModules()
    })

    afterEach(() => {
        jest.dontMock('./self/secrets')
        jest.dontMock('./self/middleware')
        jest.dontMock('./self/auth/passport')
        jest.resetModules()
    })

    it('keeps the removed commercial source physically absent from the server tree', () => {
        expect(fs.existsSync(path.join(serverSrcRoot, removedSourceDir))).toBe(false)
        expect(fs.existsSync(path.join(serverSrcRoot, removedIdentityBoundary))).toBe(false)
    })

    it('evaluates IAM seams without removed source cache entries', () => {
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

        expectNoRemovedSourceCacheEntries()
    })

    it('exercises boot entrypoints through self implementations', async () => {
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
        expectNoRemovedSourceCacheEntries()
    })

    it('resolves platform IAM routers to self implementations', () => {
        const routes = require('./routes')
        const selfAuthRoutes = require('./self/auth/routes')
        const selfAuditRoutes = require('./self/audit/routes')
        const selfAdminRoutes = require('./self/admin/routes')

        expect(routes.accountRouter).toBe(selfAuthRoutes.accountRouter)
        expect(routes.authRouter).toBe(selfAuthRoutes.authRouter)
        expect(routes.loginMethodRouter).toBe(selfAuthRoutes.loginMethodRouter)
        expect(routes.auditRouter).toBe(selfAuditRoutes.auditRouter)
        expect(routes.organizationUserRoute).toBe(selfAdminRoutes.organizationUserRoute)
        expect(routes.organizationRouter).toBe(selfAdminRoutes.organizationRouter)
        expect(routes.roleRouter).toBe(selfAdminRoutes.roleRouter)
        expect(routes.userRouter).toBe(selfAdminRoutes.userRouter)
        expect(routes.workspaceUserRouter).toBe(selfAdminRoutes.workspaceUserRouter)
        expect(routes.workspaceRouter).toBe(selfAdminRoutes.workspaceRouter)
        expectNoRemovedSourceCacheEntries()
    })

    it('uses a self-owned empty SSO whitelist', () => {
        const source = fs.readFileSync(path.join(__dirname, 'sso.ts'), 'utf8')
        const { getSsoWhitelistUrls } = require('./sso')

        expect(source).toContain("from './self/sso'")
        expect(getSsoWhitelistUrls()).toEqual([])
        expectNoRemovedSourceCacheEntries()
    })

    it('constructs concrete self workspace services', () => {
        const source = fs.readFileSync(path.join(__dirname, 'services.ts'), 'utf8')
        const { WorkspaceService, WorkspaceUserService, WorkspaceUserErrorMessage } = require('./services')
        const { FlowOpsWorkspaceService, FlowOpsWorkspaceUserService } = require('./self/workspace/services')

        expect(source).toContain("from './self/workspace/services'")
        expect(source).not.toContain('class SelfWorkspaceService')
        expect(source).not.toMatch(/\b(stub|no-op)\b/i)
        expect(new WorkspaceService()).toBeInstanceOf(FlowOpsWorkspaceService)
        expect(new WorkspaceUserService()).toBeInstanceOf(FlowOpsWorkspaceUserService)
        expect(WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND).toBe('Workspace User Not Found')
        expectNoRemovedSourceCacheEntries()
    })

    it('keeps public IAM seams free of erased fallback patterns', () => {
        for (const filename of ['boot.ts', 'routes.ts', 'sso.ts', 'services.ts', 'identity.ts']) {
            const source = fs.readFileSync(path.join(__dirname, filename), 'utf8')
            expect(source).not.toContain('as unknown as')
            expect(source).not.toContain('undefined as')
            expect(source).not.toMatch(/\b(stub|no-op)\b/i)
            expect(source).not.toContain(removedSourceDir)
        }
    })

    it('uses the single self migration set', async () => {
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
        expectNoRemovedSourceCacheEntries()
    })

    it('maps IAM entity values to FlowOps entities', () => {
        const iamEntities = require('./entities')
        const selfEntities = require('./self/entities')

        expect(iamEntities.Workspace).toBe(selfEntities.FlowOpsWorkspace)
        expect(iamEntities.Organization).toBe(selfEntities.FlowOpsOrganization)
        expect(iamEntities.User).toBe(selfEntities.FlowOpsUser)
        expect(iamEntities.Role).toBe(selfEntities.FlowOpsRole)
        expect(iamEntities.WorkspaceUser).toBe(selfEntities.FlowOpsWorkspaceMember)
        expectNoRemovedSourceCacheEntries()
    })
})
