const fs = require('fs')
const path = require('path')

describe('self IAM register bootstrap source guard', () => {
    const readRegister = () => fs.readFileSync(path.join(__dirname, 'register.jsx'), 'utf8')

    it('uses the self open-registration flag to bypass invite-token registration only for first-admin bootstrap', () => {
        const source = readRegister()

        expect(source).toContain('getDefaultProvidersApi.data?.allowOpenRegistration === true')
        expect(source).toContain('const isInviteRegistrationRequired = isEnterpriseLicensed && !allowOpenRegistration')
        expect(source).toContain('if (isInviteRegistrationRequired)')
        expect(source).toContain('} else if (isCloud || allowOpenRegistration) {')
        expect(source).toContain('{isInviteRegistrationRequired && (')
    })
})
