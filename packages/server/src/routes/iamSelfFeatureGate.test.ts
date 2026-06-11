import fs from 'fs'
import path from 'path'

describe('self IAM feature gates', () => {
    it('does not put the self role router behind the enterprise role feature gate', () => {
        const source = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8')

        expect(source).toContain("router.use('/role', requireFeatureUnlessSelfIam('feat:roles'), roleRouter)")
    })
})
