import { describe, expect, it, afterEach, beforeEach, jest } from '@jest/globals'

describe('iam service seams — self mode', () => {
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

    it('self 模式:WorkspaceUserService 从 flowops_workspace_member 读用户工作区(不碰 enterprise WorkspaceUsers)', async () => {
        const { WorkspaceUserService } = require('./services')
        const findBy = jest.fn(async () => [{ workspaceId: 'ws-1' }, { workspaceId: 'ws-2' }])
        const queryRunner = { manager: { getRepository: () => ({ findBy }) } }
        const svc = new WorkspaceUserService()
        await expect(svc.readWorkspaceUserByUserId('user-1', queryRunner)).resolves.toEqual([
            { workspaceId: 'ws-1' },
            { workspaceId: 'ws-2' }
        ])
        expect(findBy).toHaveBeenCalledWith({ userId: 'user-1' })
    })
})
