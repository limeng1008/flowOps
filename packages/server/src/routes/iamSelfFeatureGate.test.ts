import fs from 'fs'
import path from 'path'

describe('self IAM feature gates', () => {
    it('keeps role routes on the self feature gate adapter', () => {
        const source = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8')

        expect(source).toContain("router.use('/role', requireFeature('feat:roles'), roleRouter)")
        expect(source).toContain('return checkFeatureByPlan(feature)(req, res, next)')
    })

    it('uses only self platform IAM routers', () => {
        const source = fs.readFileSync(path.join(__dirname, '../iam/routes.ts'), 'utf8')

        expect(source).toContain("from './self/auth/routes'")
        expect(source).toContain("from './self/admin/routes'")
        expect(source).not.toContain('load')
        expect(source).not.toContain(['enter', 'prise'].join(''))
    })

    it('keeps identity provider selection behind the self factory seam', () => {
        const source = fs.readFileSync(path.join(__dirname, '../iam/identity.ts'), 'utf8')

        expect(source).toContain('export const getFlowOpsIdentity')
        expect(source).toContain('export const checkFeatureByPlan')
    })
})
