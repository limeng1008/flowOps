import { StatusCodes } from 'http-status-codes'
import { FindOptionsWhere } from 'typeorm'
import { SupportTicket } from '../../database/entities/SupportTicket'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

export enum SupportTicketStatus {
    OPEN = 'open',
    PENDING = 'pending',
    RESOLVED = 'resolved',
    CLOSED = 'closed'
}

export enum SupportTicketPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent'
}

export enum SupportTicketActorType {
    CUSTOMER = 'customer',
    SUPPORT = 'support'
}

export const SUPPORT_TICKET_ERROR_CODES = {
    SUPPORT_ADMIN_REQUIRED: 'SUPPORT_ADMIN_REQUIRED',
    TICKET_NOT_FOUND: 'SUPPORT_TICKET_NOT_FOUND',
    SUBJECT_REQUIRED: 'SUPPORT_TICKET_SUBJECT_REQUIRED',
    MESSAGE_REQUIRED: 'SUPPORT_TICKET_MESSAGE_REQUIRED',
    INVALID_STATUS: 'SUPPORT_TICKET_INVALID_STATUS',
    INVALID_PRIORITY: 'SUPPORT_TICKET_INVALID_PRIORITY'
} as const

export interface SupportTicketMessage {
    id: string
    actorType: SupportTicketActorType
    actorUserId?: string | null
    actorEmail?: string | null
    actorName?: string | null
    message: string
    createdDate: string
}

export interface CreateSupportTicketInput {
    subject?: string
    description?: string
    priority?: SupportTicketPriority | string
    category?: string | null
}

export interface UpdateSupportTicketInput {
    status?: SupportTicketStatus | string
    priority?: SupportTicketPriority | string
    assignedToEmail?: string | null
    category?: string | null
}

export interface ReplySupportTicketInput {
    message?: string
    status?: SupportTicketStatus | string
}

export interface ListSupportTicketFilters {
    organizationId?: string
    status?: SupportTicketStatus | string
}

const supportTicketStatuses = Object.values(SupportTicketStatus)
const supportTicketPriorities = Object.values(SupportTicketPriority)

export function assertSupportAdmin(user?: Express.User): void {
    if (!isSupportAdmin(user)) {
        throw new InternalFlowiseError(StatusCodes.FORBIDDEN, SUPPORT_TICKET_ERROR_CODES.SUPPORT_ADMIN_REQUIRED)
    }
}

export class SupportTicketService {
    static async createTicket(input: CreateSupportTicketInput, user: Express.User): Promise<SupportTicket> {
        const subject = normalizeRequiredText(input.subject, SUPPORT_TICKET_ERROR_CODES.SUBJECT_REQUIRED)
        const description = normalizeRequiredText(input.description, SUPPORT_TICKET_ERROR_CODES.MESSAGE_REQUIRED)
        const priority = normalizePriority(input.priority || SupportTicketPriority.NORMAL)
        const message = buildMessage(description, SupportTicketActorType.CUSTOMER, user)
        const repo = getTicketRepository()
        const entity = repo.create({
            organizationId: requireOrganizationId(user),
            workspaceId: user.activeWorkspaceId || null,
            requesterUserId: user.id,
            requesterEmail: user.email,
            requesterName: user.name || null,
            subject,
            category: normalizeOptionalText(input.category),
            status: SupportTicketStatus.OPEN,
            priority,
            messages: JSON.stringify([message]),
            lastMessage: description,
            lastMessageBy: SupportTicketActorType.CUSTOMER
        })
        return await repo.save(entity)
    }

    static async listMyTickets(organizationId: string, requesterUserId: string): Promise<SupportTicket[]> {
        return await getTicketRepository().find({
            where: { organizationId, requesterUserId },
            order: { updatedDate: 'DESC' }
        })
    }

    static async listAdminTickets(filters: ListSupportTicketFilters = {}, user?: Express.User): Promise<SupportTicket[]> {
        assertSupportAdmin(user)
        const where: FindOptionsWhere<SupportTicket> = {}
        if (filters.organizationId) where.organizationId = filters.organizationId
        if (filters.status) where.status = normalizeStatus(filters.status)
        return await getTicketRepository().find({
            where,
            order: { updatedDate: 'DESC' }
        })
    }

    static async getTicketForUser(ticketId: string, user: Express.User): Promise<SupportTicket> {
        const ticket = await getTicketOrThrow(ticketId)
        if (isSupportAdmin(user)) return ticket
        if (ticket.organizationId !== user.activeOrganizationId || ticket.requesterUserId !== user.id) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, SUPPORT_TICKET_ERROR_CODES.TICKET_NOT_FOUND)
        }
        return ticket
    }

    static async updateTicket(ticketId: string, input: UpdateSupportTicketInput, user?: Express.User): Promise<SupportTicket> {
        assertSupportAdmin(user)
        const ticket = await getTicketOrThrow(ticketId)
        if (input.status !== undefined) applyStatus(ticket, normalizeStatus(input.status))
        if (input.priority !== undefined) ticket.priority = normalizePriority(input.priority)
        if (input.assignedToEmail !== undefined) ticket.assignedToEmail = normalizeOptionalText(input.assignedToEmail)
        if (input.category !== undefined) ticket.category = normalizeOptionalText(input.category)
        return await getTicketRepository().save(ticket)
    }

    static async replyToTicket(ticketId: string, input: ReplySupportTicketInput, user: Express.User): Promise<SupportTicket> {
        const ticket = await this.getTicketForUser(ticketId, user)
        const messageText = normalizeRequiredText(input.message, SUPPORT_TICKET_ERROR_CODES.MESSAGE_REQUIRED)
        const actorType = isSupportAdmin(user) ? SupportTicketActorType.SUPPORT : SupportTicketActorType.CUSTOMER
        const messages = parseMessages(ticket.messages)
        messages.push(buildMessage(messageText, actorType, user))
        ticket.messages = JSON.stringify(messages)
        ticket.lastMessage = messageText
        ticket.lastMessageBy = actorType

        if (actorType === SupportTicketActorType.CUSTOMER) {
            applyStatus(ticket, SupportTicketStatus.OPEN)
        } else {
            applyStatus(ticket, input.status ? normalizeStatus(input.status) : SupportTicketStatus.PENDING)
        }

        return await getTicketRepository().save(ticket)
    }
}

function getTicketRepository() {
    return getRunningExpressApp().AppDataSource.getRepository(SupportTicket)
}

async function getTicketOrThrow(ticketId: string): Promise<SupportTicket> {
    const ticket = await getTicketRepository().findOne({ where: { id: ticketId } })
    if (!ticket) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, SUPPORT_TICKET_ERROR_CODES.TICKET_NOT_FOUND)
    return ticket
}

function buildMessage(message: string, actorType: SupportTicketActorType, user: Express.User): SupportTicketMessage {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        actorType,
        actorUserId: user.id || null,
        actorEmail: user.email || null,
        actorName: user.name || null,
        message,
        createdDate: new Date().toISOString()
    }
}

function parseMessages(value: string | null | undefined): SupportTicketMessage[] {
    if (!value) return []
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function applyStatus(ticket: SupportTicket, status: SupportTicketStatus): void {
    ticket.status = status
    if (status === SupportTicketStatus.RESOLVED) {
        ticket.resolvedDate = ticket.resolvedDate || new Date()
        ticket.closedDate = null
    } else if (status === SupportTicketStatus.CLOSED) {
        ticket.closedDate = ticket.closedDate || new Date()
    } else {
        ticket.resolvedDate = null
        ticket.closedDate = null
    }
}

function normalizeRequiredText(value: unknown, errorCode: string): string {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, errorCode)
    return text
}

function normalizeOptionalText(value: unknown): string | null {
    const text = typeof value === 'string' ? value.trim() : ''
    return text || null
}

function normalizeStatus(value: unknown): SupportTicketStatus {
    if (typeof value === 'string' && supportTicketStatuses.includes(value as SupportTicketStatus)) return value as SupportTicketStatus
    throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, SUPPORT_TICKET_ERROR_CODES.INVALID_STATUS)
}

function normalizePriority(value: unknown): SupportTicketPriority {
    if (typeof value === 'string' && supportTicketPriorities.includes(value as SupportTicketPriority)) return value as SupportTicketPriority
    throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, SUPPORT_TICKET_ERROR_CODES.INVALID_PRIORITY)
}

function requireOrganizationId(user: Express.User): string {
    if (!user.activeOrganizationId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Organization ID is required')
    return user.activeOrganizationId
}

function isSupportAdmin(user?: Express.User): boolean {
    const email = user?.email?.toLowerCase()
    if (!email) return false
    return getAdminEmails().includes(email)
}

function getAdminEmails(): string[] {
    return `${process.env.SUPPORT_ADMIN_EMAILS || ''}`
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
}

export default SupportTicketService
