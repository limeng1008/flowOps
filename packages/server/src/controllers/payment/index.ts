import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import PaymentService from '../../services/payment'
import { PaymentOrderProvider } from '../../database/entities/PaymentOrder'

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.activeOrganizationId
        const { planCode, provider } = req.body || {}
        if (!organizationId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Organization ID is required')
        if (!planCode) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Plan code is required')
        if (!provider) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Payment provider is required')
        return res.status(StatusCodes.CREATED).json(await PaymentService.createOrder({ planCode, provider, organizationId }))
    } catch (error) {
        next(error)
    }
}

const getOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.activeOrganizationId
        if (!organizationId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Organization ID is required')
        return res.status(StatusCodes.OK).json(await PaymentService.getOrderStatus(req.params.orderNo, organizationId))
    } catch (error) {
        next(error)
    }
}

const alipayNotify = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ack = await PaymentService.handleNotification(PaymentOrderProvider.ALIPAY, req.headers, readRawBody(req))
        return res.status(StatusCodes.OK).send(ack)
    } catch (error) {
        next(error)
    }
}

const wechatNotify = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ack = await PaymentService.handleNotification(PaymentOrderProvider.WECHAT, req.headers, readRawBody(req))
        return res.status(StatusCodes.OK).json(ack)
    } catch (error) {
        next(error)
    }
}

function readRawBody(req: Request): Buffer {
    const rawBody = (req as any).rawBody
    if (Buffer.isBuffer(rawBody)) return rawBody
    if (typeof rawBody === 'string') return Buffer.from(rawBody)
    return Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}))
}

export default {
    createOrder,
    getOrderStatus,
    alipayNotify,
    wechatNotify
}
