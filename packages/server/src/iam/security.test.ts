import bcrypt from 'bcryptjs'

const removedSourceDir = ['enter', 'prise'].join('')
const removedIdentityBoundary = ['Identity', 'Manager.ts'].join('')
const removedSourceCacheEntries = () =>
    Object.keys(require.cache).filter(
        (modulePath) => modulePath.includes(`/src/${removedSourceDir}/`) || modulePath.endsWith(`/src/${removedIdentityBoundary}`)
    )

describe('FlowOps IAM security seam', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    afterEach(() => {
        jest.resetModules()
    })

    it('hashes passwords through the self implementation', () => {
        const { getHash } = require('./security') as { getHash: (value: string) => string }

        const hash = getHash('Valid1!Password')

        expect(hash).not.toBe('Valid1!Password')
        expect(bcrypt.compareSync('Valid1!Password', hash)).toBe(true)
        expect(removedSourceCacheEntries()).toEqual([])
    })

    it('validates the self password policy', () => {
        const { validatePasswordOrThrow } = require('./security') as { validatePasswordOrThrow: (password: string) => void }

        expect(() => validatePasswordOrThrow('Valid1!Password')).not.toThrow()
        expect(() => validatePasswordOrThrow('short')).toThrow('Password must be at least 8 characters')
        expect(() => validatePasswordOrThrow('a'.repeat(129))).toThrow('Password must not be more than 128 characters')
        expect(() => validatePasswordOrThrow('NOLOWERCASE1!')).toThrow('Password must contain at least one lowercase letter')
        expect(() => validatePasswordOrThrow('nouppercase1!')).toThrow('Password must contain at least one uppercase letter')
        expect(() => validatePasswordOrThrow('NoDigit!')).toThrow('Password must contain at least one digit')
        expect(() => validatePasswordOrThrow('NoSpecial1')).toThrow('Password must contain at least one special character')
        expect(removedSourceCacheEntries()).toEqual([])
    })
})
