import fs from 'fs'
import path from 'path'

describe('App license enforcement wiring', () => {
    it('runs global license enforcement before API key auth and the /api/v1 business router', () => {
        const source = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8')
        const enforcementIndex = source.indexOf('createLicenseEnforcementMiddleware(() => this.licenseState)')
        const apiKeyIndex = source.indexOf('const { isValid, apiKey } = await validateAPIKey(req)')
        const businessRouterIndex = source.indexOf("this.app.use('/api/v1', flowiseApiV1Router)")

        expect(enforcementIndex).toBeGreaterThan(-1)
        expect(apiKeyIndex).toBeGreaterThan(enforcementIndex)
        expect(businessRouterIndex).toBeGreaterThan(enforcementIndex)
    })
})
