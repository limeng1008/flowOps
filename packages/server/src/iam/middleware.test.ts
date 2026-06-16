import { readFileSync } from 'fs'
import { join } from 'path'
import { NextFunction, Request, Response } from 'express'

const enterpriseCacheEntries = () => Object.keys(require.cache).filter((modulePath) => modulePath.includes('/src/enterprise/'))

const makeResponse = () => {
    const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
    return response as Response & { status: jest.Mock; json: jest.Mock }
}

describe('FlowOps IAM RBAC middleware seam', () => {
    const originalFlowOpsIam = process.env.FLOWOPS_IAM

    beforeEach(() => {
        jest.resetModules()
        process.env.FLOWOPS_IAM = 'self'
    })

    afterEach(() => {
        if (originalFlowOpsIam === undefined) delete process.env.FLOWOPS_IAM
        else process.env.FLOWOPS_IAM = originalFlowOpsIam
        jest.resetModules()
    })

    it('uses self permission checks in self mode without loading enterprise RBAC modules', () => {
        const { checkAnyPermission, checkPermission } = require('./middleware') as {
            checkPermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void
            checkAnyPermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void
        }
        const next = jest.fn() as NextFunction

        checkPermission('users:manage')({ user: { permissions: ['users:manage'] } } as Request, makeResponse(), next)
        checkAnyPermission('chatflows:delete, chatflows:update')(
            { user: { permissions: ['chatflows:update'] } } as Request,
            makeResponse(),
            next
        )

        expect(next).toHaveBeenCalledTimes(2)
        expect(enterpriseCacheEntries()).toEqual([])
    })

    it('does not keep RBAC type-erasure casts in the public IAM seam', () => {
        const source = readFileSync(join(__dirname, 'middleware.ts'), 'utf8')

        expect(source).not.toContain('as unknown as')
    })
})
