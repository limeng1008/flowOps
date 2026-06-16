import { describe, expect, it, afterEach, beforeEach, jest } from '@jest/globals'

describe('iam WorkspaceService seam — self mode', () => {
    const original = process.env.FLOWOPS_IAM

    beforeEach(() => {
        jest.resetModules()
        process.env.FLOWOPS_IAM = 'self'
    })

    afterEach(() => {
        if (original === undefined) delete process.env.FLOWOPS_IAM
        else process.env.FLOWOPS_IAM = original
        jest.resetModules()
    })

    it('self 模式:getSharedItemsForWorkspace 返回空集(单组织无跨工作区共享,不查未注册的 WorkspaceShared)', async () => {
        const { WorkspaceService } = require('./services')
        const ws = new WorkspaceService()
        await expect(ws.getSharedItemsForWorkspace('ws-1', 'credential')).resolves.toEqual([])
    })
})
