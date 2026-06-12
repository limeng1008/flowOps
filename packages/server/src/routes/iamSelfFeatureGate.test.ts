import fs from 'fs'
import path from 'path'

describe('self IAM feature gates', () => {
    it('does not put the self role router behind the enterprise role feature gate', () => {
        const source = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8')

        expect(source).toContain("router.use('/role', requireFeatureUnlessSelfIam('feat:roles'), roleRouter)")
        expect(source).toContain('return checkFeatureByPlan(feature)(req, res, next)')
        expect(source).not.toContain('IdentityManager.checkFeatureByPlan')
    })

    it('switches platform IAM routers to self implementations when FLOWOPS_IAM=self', () => {
        const source = fs.readFileSync(path.join(__dirname, '../iam/routes.ts'), 'utf8')

        expect(source).toContain('auditRouter = isSelfIamMode() ? selfAuditRouter : enterpriseAuditRouter')
        expect(source).toContain('organizationRouter = isSelfIamMode() ? selfOrganizationRouter : enterpriseOrganizationRouter')
        expect(source).toContain('loginMethodRouter = isSelfIamMode() ? selfLoginMethodRouter : enterpriseLoginMethodRouter')
    })

    it('keeps identity provider selection behind the T4.1 factory seam', () => {
        const source = fs.readFileSync(path.join(__dirname, '../iam/identity.ts'), 'utf8')

        expect(source).toContain('export const getIdentityManager')
        expect(source).toContain('export const checkFeatureByPlan')
        expect(source).not.toContain('FlowOpsIdentityManager')
        expect(source).not.toContain('export { IdentityManager }')
        expect(source).not.toContain('export const IdentityManager')
    })
})
