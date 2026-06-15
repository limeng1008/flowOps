import { getLogoutRedirectPath } from './logoutRedirect'
const fs = require('fs')
const path = require('path')

describe('logout redirect helper', () => {
    it('uses backend-provided redirect target for legacy logout responses', () => {
        expect(getLogoutRedirectPath({ message: 'logged_out', redirectTo: '/signin' })).toBe('/signin')
    })

    it('falls back to login for the self-auth logout success response', () => {
        expect(getLogoutRedirectPath({ message: 'Logout Successful' })).toBe('/login')
    })

    it('ignores unrelated responses', () => {
        expect(getLogoutRedirectPath({ message: 'not logged out' })).toBeNull()
        expect(getLogoutRedirectPath(null)).toBeNull()
    })

    it('is used by every logout entry point', () => {
        const sourcePaths = [
            '../layout/MainLayout/Header/index.jsx',
            '../layout/MainLayout/Header/WorkspaceSwitcher/index.jsx',
            '../layout/MainLayout/Sidebar/CloudMenuList.jsx',
            '../views/account/index.jsx'
        ]

        for (const sourcePath of sourcePaths) {
            const source = fs.readFileSync(path.join(__dirname, sourcePath), 'utf8')
            expect(source).toContain('getLogoutRedirectPath(logoutApi.data)')
            expect(source).not.toContain("logoutApi.data.message === 'logged_out'")
        }
    })
})
