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
})
