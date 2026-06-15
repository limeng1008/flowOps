import fs from 'fs'
import path from 'path'

describe('self IAM auth routes source', () => {
    const readRoutes = () => fs.readFileSync(path.join(__dirname, 'routes.ts'), 'utf8')

    it('exposes only a boolean open-registration flag from the public default login method endpoint', () => {
        const source = readRoutes()

        expect(source).toContain("loginMethodRouter.get('/default', async")
        expect(source).toContain('allowOpenRegistration')
        expect(source).toContain('isFirstAdminSetup')
        expect(source).not.toContain('userCount')
    })
})
