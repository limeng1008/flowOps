/* eslint-disable react/display-name, react/prop-types */
import { createTheme, ThemeProvider } from '@mui/material/styles'
// Babel's test transform uses the classic JSX runtime.
// eslint-disable-next-line unused-imports/no-unused-imports
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

import AuditLog, { AuditDetails } from './index'

global.React = React

jest.mock('@/api/audit', () => ({
    __esModule: true,
    default: {
        getAuditLogs: jest.fn(),
        exportAuditLogs: jest.fn()
    }
}))

jest.mock('@/hooks/useApi', () => () => ({
    data: {
        data: [
            {
                id: 'audit-1',
                createdDate: '2026-06-18T10:00:00.000Z',
                actorUserId: 'user-1',
                actorEmail: 'owner@example.com',
                action: 'role.update',
                targetType: 'role',
                targetId: 'role-1',
                targetName: 'operator',
                status: 'success',
                ip: '127.0.0.1',
                userAgent: 'jest',
                metadata: { before: { name: 'viewer' }, after: { name: 'operator' } }
            }
        ],
        count: 1,
        currentPage: 1,
        pageSize: 12
    },
    loading: false,
    error: null,
    request: jest.fn()
}))

jest.mock('@/store/context/ErrorContext', () => ({
    useError: () => ({ error: null, handleError: jest.fn() })
}))

jest.mock('@/layout/MainLayout/ViewHeader', () => ({ title, children }) => (
    <header>
        <h1>{title}</h1>
        {children}
    </header>
))

jest.mock('@/ui-component/cards/MainCard', () => ({ children }) => <main>{children}</main>)

jest.mock('@/ErrorBoundary', () => ({ error }) => <div>{String(error)}</div>)

jest.mock('react-redux', () => ({
    useSelector: () => ({ isDarkMode: false })
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
        i18n: { language: 'en', resolvedLanguage: 'en' }
    })
}))

jest.mock('@/ui-component/pagination/TablePagination', () => ({
    __esModule: true,
    DEFAULT_ITEMS_PER_PAGE: 12,
    default: ({ currentPage, limit, total }) => <div>{`pagination:${currentPage}:${limit}:${total}`}</div>
}))

const auditRow = {
    id: 'audit-1',
    ip: '127.0.0.1',
    userAgent: 'jest',
    metadata: { before: { name: 'viewer' }, after: { name: 'operator' } }
}

describe('audit page rendering', () => {
    let consoleError

    beforeAll(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterAll(() => {
        consoleError.mockRestore()
    })

    it('server-renders the redirected auth filter, audit row, paging, and export controls', () => {
        const theme = createTheme({ palette: { glass: { border: '#d8dde5', surface: '#f7f8fa' } } })
        const html = renderToStaticMarkup(
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={['/audit?action=auth.*']}>
                    <AuditLog />
                </MemoryRouter>
            </ThemeProvider>
        )

        expect(html).toContain('pages.audit.title')
        expect(html).toContain('pages.audit.exportCsv')
        expect(html).toContain('auth.*')
        expect(html).toContain('owner@example.com')
        expect(html).toContain('role.update')
        expect(html).toContain('pagination:1:12:1')
    })

    it('server-renders before and after details without exposing raw HTML', () => {
        const html = renderToStaticMarkup(<AuditDetails row={auditRow} t={(key) => key} />)

        expect(html).toContain('pages.audit.details.before')
        expect(html).toContain('pages.audit.details.after')
        expect(html).toContain('viewer')
        expect(html).toContain('operator')
        expect(html).toContain('127.0.0.1')
        expect(html).toContain('jest')
    })
})
