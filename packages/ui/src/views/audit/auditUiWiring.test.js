const fs = require('fs')
const path = require('path')

const uiRoot = path.resolve(__dirname, '../..')
const read = (relativePath) => fs.readFileSync(path.join(uiRoot, relativePath), 'utf8')

describe('audit UI wiring', () => {
    it('renders server-filtered audit rows, expandable metadata, pagination, and CSV export', () => {
        const source = read('views/audit/index.jsx')

        expect(source).toContain('auditApi.getAuditLogs')
        expect(source).toContain('auditApi.exportAuditLogs')
        expect(source).toContain('TablePagination')
        expect(source).toContain('AUDIT_ACTION_GROUPS')
        expect(source).toContain("type='datetime-local'")
        expect(source).toContain('normalizeAuditMetadata')
        expect(source).toContain('IconDownload')
    })

    it('gates the audit menu and route while redirecting the retired login activity URL', () => {
        const routes = read('routes/MainRoutes.jsx')
        const defaultRedirect = read('routes/DefaultRedirect.jsx')
        const menu = read('menu-items/dashboard.js')
        const api = read('api/audit.js')

        expect(routes).toContain("path: '/audit'")
        expect(routes).toContain("permission={'auditLogs:view'} display={'feat:audit'}")
        expect(routes).toContain("to='/audit?action=auth.*'")
        expect(routes).not.toContain('@/views/auth/loginActivity')

        expect(defaultRedirect).toContain("permission: 'auditLogs:view', display: 'feat:audit'")
        expect(defaultRedirect).not.toContain('LoginActivityPage')

        expect(menu).toContain("id: 'audit'")
        expect(menu).toContain("url: '/audit'")
        expect(menu).toContain("display: 'feat:audit'")
        expect(menu).toContain("permission: 'auditLogs:view'")
        expect(menu).not.toContain("id: 'login-activity'")

        expect(api).not.toContain('fetchLoginActivity')
        expect(fs.existsSync(path.join(uiRoot, 'views/auth/loginActivity.jsx'))).toBe(false)
    })
})
