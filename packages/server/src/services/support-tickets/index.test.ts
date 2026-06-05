import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { StatusCodes } from 'http-status-codes'

const repos = new Map<unknown, any>()
const mockDataSource = {
    getRepository: jest.fn((entity: unknown) => repos.get(entity))
}

jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn(() => ({
        AppDataSource: mockDataSource
    }))
}))

import {
    SUPPORT_TICKET_ERROR_CODES,
    SupportTicketActorType,
    SupportTicketPriority,
    SupportTicketService,
    SupportTicketStatus,
    assertSupportAdmin
} from './index'
import { SupportTicket } from '../../database/entities/SupportTicket'

const makeRepo = (overrides: Record<string, unknown> = {}) => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn(async (value: unknown) => value),
    ...overrides
})

describe('support ticket service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        repos.clear()
        delete process.env.SUPPORT_ADMIN_EMAILS
        delete process.env.BILLING_ADMIN_EMAILS
    })

    it('creates an open ticket scoped to the requester organization and workspace', async () => {
        const ticketRepo = makeRepo({
            create: jest.fn((value: Record<string, unknown>) => ({ id: 'ticket-1', ...value })),
            save: jest.fn(async (value: unknown) => value)
        })
        repos.set(SupportTicket, ticketRepo)

        const ticket = await SupportTicketService.createTicket(
            {
                subject: '无法启动 Agentflow',
                description: '发布后执行失败',
                category: 'technical'
            },
            {
                id: 'user-1',
                email: 'user@example.com',
                name: 'User One',
                activeOrganizationId: 'org-1',
                activeWorkspaceId: 'ws-1'
            } as Express.User
        )

        expect(ticketRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId: 'org-1',
                workspaceId: 'ws-1',
                requesterUserId: 'user-1',
                requesterEmail: 'user@example.com',
                subject: '无法启动 Agentflow',
                status: SupportTicketStatus.OPEN,
                priority: SupportTicketPriority.NORMAL,
                category: 'technical',
                lastMessage: '发布后执行失败',
                lastMessageBy: SupportTicketActorType.CUSTOMER
            })
        )
        expect(JSON.parse(ticket.messages)).toEqual([
            expect.objectContaining({
                actorType: SupportTicketActorType.CUSTOMER,
                actorEmail: 'user@example.com',
                message: '发布后执行失败'
            })
        ])
    })

    it('lists only requester tickets for a non-admin user', async () => {
        const ticketRepo = makeRepo({ find: jest.fn(async () => []) })
        repos.set(SupportTicket, ticketRepo)

        await SupportTicketService.listMyTickets('org-1', 'user-1')

        expect(ticketRepo.find).toHaveBeenCalledWith({
            where: { organizationId: 'org-1', requesterUserId: 'user-1' },
            order: { updatedDate: 'DESC' }
        })
    })

    it('allows support admins to update status and priority', async () => {
        const ticket = {
            id: 'ticket-1',
            organizationId: 'org-1',
            requesterUserId: 'user-1',
            status: SupportTicketStatus.OPEN,
            priority: SupportTicketPriority.NORMAL,
            messages: '[]'
        }
        const ticketRepo = makeRepo({
            findOne: jest.fn(async () => ticket),
            save: jest.fn(async (value: unknown) => value)
        })
        repos.set(SupportTicket, ticketRepo)
        process.env.SUPPORT_ADMIN_EMAILS = 'support@example.com'

        const updated = await SupportTicketService.updateTicket(
            'ticket-1',
            { status: SupportTicketStatus.RESOLVED, priority: SupportTicketPriority.HIGH },
            { email: 'support@example.com' } as Express.User
        )

        expect(updated).toEqual(
            expect.objectContaining({
                status: SupportTicketStatus.RESOLVED,
                priority: SupportTicketPriority.HIGH,
                resolvedDate: expect.any(Date)
            })
        )
    })

    it('appends replies and reopens tickets when the customer responds', async () => {
        const ticket = {
            id: 'ticket-1',
            organizationId: 'org-1',
            requesterUserId: 'user-1',
            requesterEmail: 'user@example.com',
            status: SupportTicketStatus.RESOLVED,
            priority: SupportTicketPriority.NORMAL,
            messages: JSON.stringify([{ actorType: SupportTicketActorType.CUSTOMER, message: '初始问题' }])
        }
        const ticketRepo = makeRepo({
            findOne: jest.fn(async () => ticket),
            save: jest.fn(async (value: unknown) => value)
        })
        repos.set(SupportTicket, ticketRepo)

        const updated = await SupportTicketService.replyToTicket('ticket-1', { message: '我这里还是不行' }, {
            id: 'user-1',
            email: 'user@example.com',
            activeOrganizationId: 'org-1'
        } as Express.User)

        expect(updated.status).toBe(SupportTicketStatus.OPEN)
        expect(updated.lastMessage).toBe('我这里还是不行')
        expect(updated.lastMessageBy).toBe(SupportTicketActorType.CUSTOMER)
        expect(JSON.parse(updated.messages)).toHaveLength(2)
    })

    it('rejects access to tickets outside the requester organization', async () => {
        const ticketRepo = makeRepo({
            findOne: jest.fn(async () => ({
                id: 'ticket-1',
                organizationId: 'org-other',
                requesterUserId: 'user-2',
                messages: '[]'
            }))
        })
        repos.set(SupportTicket, ticketRepo)

        await expect(
            SupportTicketService.getTicketForUser('ticket-1', {
                id: 'user-1',
                email: 'user@example.com',
                activeOrganizationId: 'org-1'
            } as Express.User)
        ).rejects.toMatchObject({
            statusCode: StatusCodes.NOT_FOUND,
            message: SUPPORT_TICKET_ERROR_CODES.TICKET_NOT_FOUND
        })
    })

    it('allows SUPPORT_ADMIN_EMAILS and BILLING_ADMIN_EMAILS to manage tickets', () => {
        process.env.SUPPORT_ADMIN_EMAILS = 'support@example.com'
        process.env.BILLING_ADMIN_EMAILS = 'ops@example.com'

        expect(() => assertSupportAdmin({ email: 'support@example.com' } as Express.User)).not.toThrow()
        expect(() => assertSupportAdmin({ email: 'ops@example.com' } as Express.User)).not.toThrow()
        expect(() => assertSupportAdmin({ email: 'user@example.com' } as Express.User)).toThrow()
    })
})
