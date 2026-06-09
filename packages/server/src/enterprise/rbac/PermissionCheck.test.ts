import { describe, expect, it, jest } from '@jest/globals'
import { NextFunction, Request, Response } from 'express'
import { ErrorMessage } from '../Interface.Enterprise'
import { checkPermission } from './PermissionCheck'

const makeResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
    return res as unknown as Response & { status: jest.Mock; json: jest.Mock }
}

describe('PermissionCheck', () => {
    it('keeps backend permission enforcement active when a simplified viewer attempts workspace management', () => {
        const req = {
            user: {
                isOrganizationAdmin: false,
                permissions: ['chatflows:view']
            }
        } as unknown as Request
        const res = makeResponse()
        const next = jest.fn() as NextFunction

        checkPermission('workspace:add-user')(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ message: ErrorMessage.FORBIDDEN })
    })

    it('keeps global user management limited to platform admins', () => {
        const req = {
            user: {
                isOrganizationAdmin: false,
                permissions: ['workspace:add-user', 'workspace:delete']
            }
        } as unknown as Request
        const res = makeResponse()
        const next = jest.fn() as NextFunction

        checkPermission('users:manage')(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ message: ErrorMessage.FORBIDDEN })
    })
})
