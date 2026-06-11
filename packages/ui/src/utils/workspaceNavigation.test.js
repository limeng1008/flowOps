import { getWorkspaceSwitchReloadPath } from './workspaceNavigation'

describe('workspace switch navigation', () => {
    it('keeps the current business page after switching workspace', () => {
        expect(
            getWorkspaceSwitchReloadPath({
                pathname: '/chatflows',
                search: '',
                hash: ''
            })
        ).toBe('/chatflows')
    })

    it('preserves query string and hash when reloading after workspace switch', () => {
        expect(
            getWorkspaceSwitchReloadPath({
                pathname: '/v2/agentcanvas/flow-1',
                search: '?tab=debug',
                hash: '#node-1'
            })
        ).toBe('/v2/agentcanvas/flow-1?tab=debug#node-1')
    })

    it('falls back to root when no path is available', () => {
        expect(getWorkspaceSwitchReloadPath({})).toBe('/')
    })
})
