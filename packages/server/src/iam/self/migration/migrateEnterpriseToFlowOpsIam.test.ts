const {
    mapEnterpriseSnapshotToFlowOpsRows,
    stableWorkspaceMemberId,
    verifyCounts
} = require('../../../../scripts/migrate-enterprise-to-flowops-iam.js')

describe('migrate-enterprise-to-flowops-iam mapping', () => {
    it('preserves entity ids while mapping built-in role memberships to seeded FlowOps roles', () => {
        const migrated = mapEnterpriseSnapshotToFlowOpsRows({
            source: {
                users: [
                    {
                        id: 'user-owner',
                        email: 'owner@example.com',
                        name: 'Owner',
                        credential: '$2a$10$hash',
                        status: 'active',
                        createdDate: '2026-01-01T00:00:00.000Z',
                        updatedDate: '2026-01-02T00:00:00.000Z'
                    },
                    {
                        id: 'user-member',
                        email: 'member@example.com',
                        name: 'Member',
                        credential: '$2a$10$hash2',
                        status: 'active',
                        createdDate: '2026-01-03T00:00:00.000Z',
                        updatedDate: '2026-01-04T00:00:00.000Z'
                    }
                ],
                organizations: [
                    {
                        id: 'org-1',
                        name: 'Default Organization',
                        createdBy: 'user-owner',
                        createdDate: '2026-01-01T00:00:00.000Z',
                        updatedDate: '2026-01-02T00:00:00.000Z'
                    }
                ],
                workspaces: [
                    {
                        id: 'workspace-default',
                        name: 'Default Workspace',
                        description: null,
                        organizationId: 'org-1',
                        createdDate: '2026-01-01T00:00:00.000Z',
                        updatedDate: '2026-01-02T00:00:00.000Z'
                    }
                ],
                roles: [
                    { id: 'role-enterprise-owner', name: 'owner', description: 'legacy owner', permissions: '["organization"]' },
                    { id: 'role-enterprise-member', name: 'member', description: 'legacy member', permissions: '[]' },
                    { id: 'role-custom-viewer', name: 'viewer', description: 'custom viewer', permissions: '["chatflows:view"]' }
                ],
                workspaceUsers: [
                    {
                        workspaceId: 'workspace-default',
                        userId: 'user-owner',
                        roleId: 'role-enterprise-owner',
                        lastLogin: '2026-01-05T00:00:00.000Z',
                        createdDate: '2026-01-01T00:00:00.000Z',
                        updatedDate: '2026-01-02T00:00:00.000Z'
                    },
                    {
                        workspaceId: 'workspace-default',
                        userId: 'user-member',
                        roleId: 'role-custom-viewer',
                        lastLogin: '2026-01-06T00:00:00.000Z',
                        createdDate: '2026-01-03T00:00:00.000Z',
                        updatedDate: '2026-01-04T00:00:00.000Z'
                    }
                ],
                loginActivities: [
                    {
                        id: 'activity-1',
                        username: 'owner@example.com',
                        activity_code: 0,
                        message: 'Login Successful',
                        attemptedDateTime: '2026-01-05T00:00:00.000Z'
                    }
                ]
            },
            targetBuiltinRoles: {
                owner: { id: 'flowops-owner', permissions: '["*"]' },
                admin: { id: 'flowops-admin', permissions: '["chatflows:view"]' },
                member: { id: 'flowops-member', permissions: '["chatflows:view"]' }
            }
        })

        expect(migrated.users).toContainEqual(
            expect.objectContaining({
                id: 'user-owner',
                email: 'owner@example.com',
                credential: '$2a$10$hash',
                lastLogin: '2026-01-05T00:00:00.000Z'
            })
        )
        expect(migrated.organizations).toContainEqual(expect.objectContaining({ id: 'org-1', ownerUserId: 'user-owner' }))
        expect(migrated.workspaces).toContainEqual(expect.objectContaining({ id: 'workspace-default', organizationId: 'org-1' }))
        expect(migrated.roles).toEqual([expect.objectContaining({ id: 'role-custom-viewer', name: 'viewer', isBuiltin: false })])
        expect(migrated.workspaceMembers).toContainEqual(
            expect.objectContaining({
                id: stableWorkspaceMemberId('workspace-default', 'user-owner'),
                workspaceId: 'workspace-default',
                userId: 'user-owner',
                roleId: 'flowops-owner'
            })
        )
        expect(migrated.workspaceMembers).toContainEqual(
            expect.objectContaining({
                workspaceId: 'workspace-default',
                userId: 'user-member',
                roleId: 'role-custom-viewer'
            })
        )
        expect(migrated.loginActivities).toEqual([
            expect.objectContaining({
                id: 'activity-1',
                userId: 'user-owner',
                activityCode: '0',
                message: 'Login Successful'
            })
        ])
        expect(migrated.counts).toMatchObject({
            users: 2,
            organizations: 1,
            workspaces: 1,
            customRoles: 1,
            workspaceMembers: 2,
            loginActivities: 1
        })
    })

    it('verifies pg query count results from the rows property', async () => {
        const client = {
            query: jest.fn(async (sql: string) => {
                if (sql.includes('WHERE "isBuiltin" = true')) return { rows: [{ count: 3 }] }
                if (sql.includes('FROM "flowops_role"')) return { rows: [{ count: 3 }] }
                return { rows: [{ count: 1 }] }
            })
        }
        const migrated = {
            users: [{}],
            organizations: [{}],
            workspaces: [{}],
            workspaceMembers: [{}],
            loginActivities: [{}],
            roles: []
        }
        const report = [
            { table: 'flowops_user', inserted: 1, expected: 1 },
            { table: 'flowops_organization', inserted: 1, expected: 1 }
        ]

        await expect(verifyCounts(client, migrated, report)).resolves.toEqual([])
    })

    it('reports mismatches when inserted or persisted counts differ from the migration plan', async () => {
        const client = {
            query: jest.fn(async (sql: string) => {
                if (sql.includes('WHERE "isBuiltin" = true')) return { rows: [{ count: 3 }] }
                if (sql.includes('FROM "flowops_user"')) return { rows: [{ count: 2 }] }
                if (sql.includes('FROM "flowops_role"')) return { rows: [{ count: 4 }] }
                return { rows: [{ count: 1 }] }
            })
        }
        const migrated = {
            users: [{}],
            organizations: [{}],
            workspaces: [{}],
            workspaceMembers: [{}],
            loginActivities: [{}],
            roles: []
        }
        const report = [{ table: 'flowops_user', inserted: 0, expected: 1 }]

        await expect(verifyCounts(client, migrated, report)).resolves.toEqual([
            { table: 'flowops_user', expected: 1, actual: 2 },
            { table: 'flowops_role', expected: 3, actual: 4 },
            { table: 'flowops_user', expected: 1, actual: 0 }
        ])
    })
})
