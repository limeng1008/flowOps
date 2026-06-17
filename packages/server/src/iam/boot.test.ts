describe('IAM boot seam', () => {
    afterEach(() => {
        jest.dontMock('./self/secrets')
        jest.dontMock('./self/auth/passport')
        jest.resetModules()
        jest.clearAllMocks()
    })

    it('calls the self auth secret initializer and local passport strategy', async () => {
        const initSelfAuthSecrets = jest.fn()
        const initialize = jest.fn()
        const configureSelfLocalStrategy = jest.fn(() => ({ initialize }))

        jest.resetModules()
        jest.doMock('./self/secrets', () => ({ initSelfAuthSecrets }))
        jest.doMock('./self/auth/passport', () => ({ configureSelfLocalStrategy }))

        const { initAuthSecrets, initializeJwtCookieMiddleware } = require('./boot') as {
            initAuthSecrets: () => Promise<void>
            initializeJwtCookieMiddleware: (app: { use: jest.Mock }, identityManager: unknown) => Promise<void>
        }
        const app = { use: jest.fn() }

        await initAuthSecrets()
        await initializeJwtCookieMiddleware(app, {})

        expect(initSelfAuthSecrets).toHaveBeenCalledTimes(1)
        expect(configureSelfLocalStrategy).toHaveBeenCalledTimes(1)
        expect(app.use).toHaveBeenCalledWith(initialize.mock.results[0].value)
    })
})
