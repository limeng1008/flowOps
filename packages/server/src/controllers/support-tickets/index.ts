import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import SupportTicketService, { assertSupportAdmin } from '../../services/support-tickets'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

const createTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthenticated')
        return res.status(StatusCodes.CREATED).json(await SupportTicketService.createTicket(req.body, req.user))
    } catch (error) {
        next(error)
    }
}

const listMyTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.activeOrganizationId
        const userId = req.user?.id
        if (!organizationId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Organization ID is required')
        if (!userId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'User ID is required')
        return res.status(StatusCodes.OK).json(await SupportTicketService.listMyTickets(organizationId, userId))
    } catch (error) {
        next(error)
    }
}

const listAdminTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        assertSupportAdmin(req.user)
        return res.status(StatusCodes.OK).json(
            await SupportTicketService.listAdminTickets(
                {
                    organizationId: typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined,
                    status: typeof req.query.status === 'string' ? req.query.status : undefined
                },
                req.user
            )
        )
    } catch (error) {
        next(error)
    }
}

const getTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthenticated')
        return res.status(StatusCodes.OK).json(await SupportTicketService.getTicketForUser(req.params.id, req.user))
    } catch (error) {
        next(error)
    }
}

const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        return res.status(StatusCodes.OK).json(await SupportTicketService.updateTicket(req.params.id, req.body, req.user))
    } catch (error) {
        next(error)
    }
}

const replyToTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthenticated')
        return res.status(StatusCodes.OK).json(await SupportTicketService.replyToTicket(req.params.id, req.body, req.user))
    } catch (error) {
        next(error)
    }
}

export default {
    createTicket,
    listMyTickets,
    listAdminTickets,
    getTicket,
    updateTicket,
    replyToTicket
}
