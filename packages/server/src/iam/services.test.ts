import { describe, expect, it, afterEach, beforeEach, jest } from '@jest/globals'

describe('iam service seams', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    afterEach(() => {
        jest.resetModules()
    })

    it('getSharedItemsForWorkspace 返回空集(单组织无跨工作区共享)', async () => {
        const { WorkspaceService } = require('./services')
        const ws = new WorkspaceService()
        await expect(ws.getSharedItemsForWorkspace('ws-1', 'credential')).resolves.toEqual([])
    })

    it('WorkspaceUserService 从 flowops_workspace_member 读用户工作区', async () => {
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
