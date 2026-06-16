import bcrypt from 'bcryptjs'

const enterpriseCacheEntries = () =>
    Object.keys(require.cache).filter(
        (modulePath) => modulePath.includes('/src/enterprise/') || modulePath.endsWith('/src/IdentityManager.ts')
    )

describe('FlowOps IAM security seam', () => {
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

    it('hashes passwords in self mode without loading enterprise modules', () => {
        const { getHash } = require('./security') as { getHash: (value: string) => string }

        const hash = getHash('Valid1!Password')

        expect(hash).not.toBe('Valid1!Password')
        expect(bcrypt.compareSync('Valid1!Password', hash)).toBe(true)
        expect(enterpriseCacheEntries()).toEqual([])
    })

    it('validates the self password policy without loading enterprise modules', () => {
        const { validatePasswordOrThrow } = require('./security') as { validatePasswordOrThrow: (password: string) => void }

        expect(() => validatePasswordOrThrow('Valid1!Password')).not.toThrow()
        expect(() => validatePasswordOrThrow('short')).toThrow('Password must be at least 8 characters')
        expect(() => validatePasswordOrThrow('a'.repeat(129))).toThrow('Password must not be more than 128 characters')
        expect(() => validatePasswordOrThrow('NOLOWERCASE1!')).toThrow('Password must contain at least one lowercase letter')
        expect(() => validatePasswordOrThrow('nouppercase1!')).toThrow('Password must contain at least one uppercase letter')
        expect(() => validatePasswordOrThrow('NoDigit!')).toThrow('Password must contain at least one digit')
        expect(() => validatePasswordOrThrow('NoSpecial1')).toThrow('Password must contain at least one special character')
        expect(enterpriseCacheEntries()).toEqual([])
    })
})
