import { describe, expect, it } from '@jest/globals'
import type { Request } from 'express'
import { toAuditRequestContext, toAuthenticatedAuditActor } from './context'

describe('audit request context', () => {
    it('builds anonymous request context from the explicit request', () => {
        const req = Object.assign({} as Request, {
            ip: '203.0.113.7',
            get: (name: string) => (name === 'user-agent' ? 'FlowOps test agent' : undefined)
        })

        expect(toAuditRequestContext(req)).toEqual({
            actorUserId: null,
            actorEmail: null,
            ip: '203.0.113.7',
            userAgent: 'FlowOps test agent'
        })
    })

    it('copies the authenticated actor from req.user and never from the request body', () => {
        const req = Object.assign({} as Request, {
            ip: '203.0.113.8',
            body: { actorUserId: 'forged-user', actorEmail: 'forged@example.com' },
            user: {
                id: 'real-user',
                email: 'real@example.com',
                activeOrganizationId: 'org-1'
            },
            get: (name: string) => (name === 'user-agent' ? 'FlowOps browser' : undefined)
        })

        expect(toAuthenticatedAuditActor(req)).toEqual(
            expect.objectContaining({
                id: 'real-user',
                email: 'real@example.com',
                actorUserId: 'real-user',
                actorEmail: 'real@example.com',
                ip: '203.0.113.8',
                userAgent: 'FlowOps browser'
            })
        )
    })

    it('returns null when authentication context is absent', () => {
        const req = Object.assign({} as Request, { ip: '203.0.113.9', get: () => undefined })
        expect(toAuthenticatedAuditActor(req)).toBeNull()
    })
})
