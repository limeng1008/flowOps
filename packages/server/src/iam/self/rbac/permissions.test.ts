import { describe, expect, it, jest } from '@jest/globals'
import { NextFunction, Request, Response } from 'express'
import { checkAnyPermission, checkPermission } from '../middleware'
import {
    ADMIN_SELF_PERMISSIONS,
    ALL_SELF_PERMISSIONS,
    BUILTIN_SELF_ROLE_PERMISSIONS,
    MEMBER_SELF_PERMISSIONS,
    SELF_PERMISSION_GROUPS
} from './permissions'

const UI_DERIVED_PERMISSIONS = [
    'agentflows:config',
    'agentflows:create',
    'agentflows:delete',
    'agentflows:domains',
    'agentflows:duplicate',
    'agentflows:export',
    'agentflows:import',
    'agentflows:update',
    'agentflows:view',
    'apikeys:create',
    'apikeys:delete',
    'apikeys:update',
    'apikeys:view',
    'assistants:create',
    'assistants:delete',
    'assistants:update',
    'assistants:view',
    'chatflows:config',
    'chatflows:create',
    'chatflows:delete',
    'chatflows:domains',
    'chatflows:duplicate',
    'chatflows:export',
    'chatflows:import',
    'chatflows:update',
    'chatflows:view',
    'credentials:create',
    'credentials:delete',
    'credentials:share',
    'credentials:update',
    'credentials:view',
    'datasets:create',
    'datasets:delete',
    'datasets:update',
    'datasets:view',
    'documentStores:add-loader',
    'documentStores:create',
    'documentStores:delete',
    'documentStores:delete-loader',
    'documentStores:preview-process',
    'documentStores:update',
    'documentStores:upsert-config',
    'documentStores:view',
    'evaluations:create',
    'evaluations:delete',
    'evaluations:run',
    'evaluations:view',
    'evaluators:create',
    'evaluators:delete',
    'evaluators:update',
    'evaluators:view',
    'executions:delete',
    'executions:view',
    'loginActivity:view',
    'logs:view',
    'roles:manage',
    'sso:manage',
    'templates:custom',
    'templates:custom-delete',
    'templates:custom-share',
    'templates:flowexport',
    'templates:marketplace',
    'templates:toolexport',
    'tools:create',
    'tools:delete',
    'tools:export',
    'tools:update',
    'tools:view',
    'users:manage',
    'variables:create',
    'variables:delete',
    'variables:update',
    'variables:view',
    'workspace:add-user',
    'workspace:create',
    'workspace:delete',
    'workspace:export',
    'workspace:import',
    'workspace:unlink-user',
    'workspace:update',
    'workspace:view'
]

const makeResponse = () => {
    const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
    return response as unknown as Response & { status: jest.Mock; json: jest.Mock }
}

describe('FlowOps self permissions', () => {
    it('keeps the permission universe equal to the UI-derived permission ids', () => {
        expect(ALL_SELF_PERMISSIONS).toEqual(UI_DERIVED_PERMISSIONS)
        expect(new Set(ALL_SELF_PERMISSIONS).size).toBe(81)
        expect(Object.keys(SELF_PERMISSION_GROUPS).sort()).toEqual([
            'agentflows',
            'apikeys',
            'assistants',
            'chatflows',
            'credentials',
            'datasets',
            'documentStores',
            'evaluations',
            'evaluators',
            'executions',
            'loginActivity',
            'logs',
            'roles',
            'sso',
            'templates',
            'tools',
            'users',
            'variables',
            'workspace'
        ])
    })

    it('defines owner/admin/member builtin role permission differences', () => {
        expect(BUILTIN_SELF_ROLE_PERMISSIONS.owner).toEqual(ALL_SELF_PERMISSIONS)

        expect(ADMIN_SELF_PERMISSIONS).toContain('users:manage')
        expect(ADMIN_SELF_PERMISSIONS).toContain('workspace:create')
        expect(ADMIN_SELF_PERMISSIONS).toContain('roles:manage')
        expect(ADMIN_SELF_PERMISSIONS).not.toContain('sso:manage')
        expect(ADMIN_SELF_PERMISSIONS).not.toContain('logs:view')

        expect(MEMBER_SELF_PERMISSIONS).toContain('chatflows:view')
        expect(MEMBER_SELF_PERMISSIONS).toContain('chatflows:create')
        expect(MEMBER_SELF_PERMISSIONS).toContain('agentflows:update')
        expect(MEMBER_SELF_PERMISSIONS).not.toContain('users:manage')
        expect(MEMBER_SELF_PERMISSIONS).not.toContain('roles:manage')
        expect(MEMBER_SELF_PERMISSIONS).not.toContain('workspace:create')
        expect(MEMBER_SELF_PERMISSIONS).not.toContain('chatflows:delete')
    })

    it('checks exact and any permissions from req.user.permissions', () => {
        const next = jest.fn() as unknown as NextFunction

        checkPermission('users:manage')({ user: { permissions: ADMIN_SELF_PERMISSIONS } } as unknown as Request, makeResponse(), next)
        expect(next).toHaveBeenCalledTimes(1)

        const forbiddenResponse = makeResponse()
        checkPermission('roles:manage')(
            { user: { permissions: MEMBER_SELF_PERMISSIONS } } as unknown as Request,
            forbiddenResponse,
            jest.fn() as unknown as NextFunction
        )
        expect(forbiddenResponse.status).toHaveBeenCalledWith(403)

        const anyNext = jest.fn() as unknown as NextFunction
        checkAnyPermission('chatflows:delete,chatflows:update')(
            { user: { permissions: MEMBER_SELF_PERMISSIONS } } as unknown as Request,
            makeResponse(),
            anyNext
        )
        expect(anyNext).toHaveBeenCalledTimes(1)
    })
})
