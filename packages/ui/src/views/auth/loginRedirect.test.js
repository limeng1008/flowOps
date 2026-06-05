import config from '@/config'
import { getPostLoginRedirectPath } from './loginRedirect'

describe('post-login redirects', () => {
    it('uses the console default route when login has no requested path', () => {
        expect(getPostLoginRedirectPath()).toBe(config.defaultPath)
    })

    it('preserves the protected route that originally sent the user to login', () => {
        expect(getPostLoginRedirectPath({ path: '/tools' })).toBe('/tools')
    })
})
