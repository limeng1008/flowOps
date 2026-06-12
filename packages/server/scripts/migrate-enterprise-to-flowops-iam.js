/* Enterprise IAM -> FlowOps IAM data migration
 *
 * Moves the legacy IAM tables in the current PostgreSQL database into the
 * self-owned flowops_ tables. Existing business table workspaceId values do not
 * need rewriting because workspace ids are preserved.
 */
'use strict'

const crypto = require('crypto')
const { Client } = require('pg')

const PG = {
    host: process.env.PG_HOST || '127.0.0.1',
    port: +(process.env.PG_PORT || 5432),
    user: process.env.PG_USER || 'flowise',
    password: process.env.PG_PASSWORD || 'flowise',
    database: process.env.PG_DATABASE || 'flowise'
}

const BUILTIN_ROLE_NAMES = new Set(['owner', 'admin', 'member'])
const WORKSPACE_MEMBER_ID_PREFIX = 'flowops-workspace-member'

const quoteIdent = (name) => `"${String(name).replace(/"/g, '""')}"`

const stableWorkspaceMemberId = (workspaceId, userId) => {
    const hash = crypto.createHash('sha256').update(`${WORKSPACE_MEMBER_ID_PREFIX}:${workspaceId}:${userId}`).digest('hex')
    const chars = hash.slice(0, 32).split('')
    chars[12] = '4'
    chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16)
    const uuid = chars.join('')
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`
}

const roleKey = (name) =>
    String(name ?? '')
        .trim()
        .toLowerCase()
const keepDate = (value, fallback) => value ?? fallback ?? new Date()
const keepStatus = (value) => value ?? 'active'

const maxDate = (values) => {
    const dates = values
        .filter(Boolean)
        .map((value) => new Date(value))
        .filter((date) => Number.isFinite(date.getTime()))
    if (!dates.length) return null
    return dates.reduce((latest, date) => (date.getTime() > latest.getTime() ? date : latest)).toISOString()
}

const mapEnterpriseSnapshotToFlowOpsRows = ({ source, targetBuiltinRoles }) => {
    const users = source.users ?? []
    const organizations = source.organizations ?? []
    const workspaces = source.workspaces ?? []
    const workspaceUsers = source.workspaceUsers ?? []
    const roles = source.roles ?? []
    const loginActivities = source.loginActivities ?? []

    const usersById = new Map(users.map((user) => [user.id, user]))
    const usersByEmail = new Map(users.map((user) => [String(user.email).toLowerCase(), user]))
    const rolesById = new Map(roles.map((role) => [role.id, role]))
    const workspacesByOrg = new Map()
    for (const workspace of workspaces) {
        const list = workspacesByOrg.get(workspace.organizationId) ?? []
        list.push(workspace)
        workspacesByOrg.set(workspace.organizationId, list)
    }

    const roleIdMap = new Map()
    for (const role of roles) {
        const key = roleKey(role.name)
        if (BUILTIN_ROLE_NAMES.has(key) && targetBuiltinRoles[key]) roleIdMap.set(role.id, targetBuiltinRoles[key].id)
        else roleIdMap.set(role.id, role.id)
    }

    const migratedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        credential: user.credential ?? null,
        status: keepStatus(user.status),
        tempToken: user.tempToken ?? null,
        tokenExpiry: user.tokenExpiry ?? null,
        lastLogin: maxDate(workspaceUsers.filter((row) => row.userId === user.id).map((row) => row.lastLogin)),
        createdDate: keepDate(user.createdDate),
        updatedDate: keepDate(user.updatedDate, user.createdDate)
    }))

    const migratedOrganizations = organizations.map((organization) => {
        const orgWorkspaces = workspacesByOrg.get(organization.id) ?? []
        const orgWorkspaceIds = new Set(orgWorkspaces.map((workspace) => workspace.id))
        const ownerMembership = workspaceUsers.find((row) => {
            if (!orgWorkspaceIds.has(row.workspaceId)) return false
            return roleKey(rolesById.get(row.roleId)?.name) === 'owner'
        })
        const ownerUserId = organization.ownerUserId ?? organization.createdBy ?? ownerMembership?.userId ?? users[0]?.id
        return {
            id: organization.id,
            name: organization.name,
            ownerUserId,
            createdDate: keepDate(organization.createdDate),
            updatedDate: keepDate(organization.updatedDate, organization.createdDate)
        }
    })

    const migratedWorkspaces = workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description ?? null,
        organizationId: workspace.organizationId,
        createdDate: keepDate(workspace.createdDate),
        updatedDate: keepDate(workspace.updatedDate, workspace.createdDate)
    }))

    const migratedRoles = roles
        .filter((role) => !BUILTIN_ROLE_NAMES.has(roleKey(role.name)))
        .map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description ?? null,
            permissions: role.permissions ?? '[]',
            isBuiltin: false,
            createdDate: keepDate(role.createdDate),
            updatedDate: keepDate(role.updatedDate, role.createdDate)
        }))

    const migratedWorkspaceMembers = workspaceUsers.map((row) => ({
        id: stableWorkspaceMemberId(row.workspaceId, row.userId),
        workspaceId: row.workspaceId,
        userId: row.userId,
        roleId: roleIdMap.get(row.roleId),
        createdDate: keepDate(row.createdDate),
        updatedDate: keepDate(row.updatedDate, row.createdDate)
    }))

    const migratedLoginActivities = loginActivities.map((activity) => {
        const user = usersByEmail.get(String(activity.username ?? '').toLowerCase())
        const attemptedDateTime = activity.attemptedDateTime ?? activity.createdDate ?? activity.updatedDate
        return {
            id: activity.id,
            userId: user?.id ?? null,
            activityCode: String(activity.activity_code ?? activity.activityCode ?? ''),
            ip: activity.ip ?? null,
            message: activity.message ?? null,
            createdDate: keepDate(attemptedDateTime),
            updatedDate: keepDate(activity.updatedDate, attemptedDateTime)
        }
    })

    return {
        users: migratedUsers,
        organizations: migratedOrganizations,
        workspaces: migratedWorkspaces,
        roles: migratedRoles,
        workspaceMembers: migratedWorkspaceMembers,
        loginActivities: migratedLoginActivities,
        counts: {
            users: migratedUsers.length,
            organizations: migratedOrganizations.length,
            workspaces: migratedWorkspaces.length,
            customRoles: migratedRoles.length,
            workspaceMembers: migratedWorkspaceMembers.length,
            loginActivities: migratedLoginActivities.length
        }
    }
}

const queryAll = async (client, sql) => (await client.query(sql)).rows

const loadSourceSnapshot = async (client) => ({
    users: await queryAll(client, 'SELECT * FROM "user" ORDER BY "createdDate", id'),
    organizations: await queryAll(client, 'SELECT * FROM organization ORDER BY "createdDate", id'),
    workspaces: await queryAll(client, 'SELECT * FROM workspace ORDER BY "createdDate", id'),
    roles: await queryAll(client, 'SELECT * FROM role ORDER BY "createdDate", id'),
    workspaceUsers: await queryAll(client, 'SELECT * FROM workspace_user ORDER BY "createdDate", "workspaceId", "userId"'),
    loginActivities: await queryAll(client, 'SELECT * FROM login_activity ORDER BY "attemptedDateTime", id')
})

const loadTargetBuiltinRoles = async (client) => {
    const rows = await queryAll(client, "SELECT * FROM flowops_role WHERE name IN ('owner', 'admin', 'member')")
    const roles = Object.fromEntries(rows.map((row) => [roleKey(row.name), row]))
    for (const name of BUILTIN_ROLE_NAMES) {
        if (!roles[name]) throw new Error(`Missing built-in FlowOps role: ${name}`)
    }
    return roles
}

const insertRows = async (client, table, rows, columns) => {
    if (!rows.length) return 0
    const columnSql = columns.map(quoteIdent).join(', ')
    let inserted = 0
    for (const row of rows) {
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')
        const params = columns.map((column) => row[column])
        await client.query(`INSERT INTO ${quoteIdent(table)} (${columnSql}) VALUES (${placeholders})`, params)
        inserted++
    }
    return inserted
}

const writeMigratedRows = async (client, migrated) => {
    await client.query('BEGIN')
    try {
        await client.query('DELETE FROM flowops_login_activity')
        await client.query('DELETE FROM flowops_workspace_member')
        await client.query('DELETE FROM flowops_workspace')
        await client.query('DELETE FROM flowops_organization')
        await client.query('DELETE FROM flowops_user')
        await client.query('DELETE FROM flowops_role WHERE "isBuiltin" = false')

        const report = []
        report.push({
            table: 'flowops_user',
            inserted: await insertRows(client, 'flowops_user', migrated.users, [
                'id',
                'email',
                'name',
                'credential',
                'status',
                'tempToken',
                'tokenExpiry',
                'lastLogin',
                'createdDate',
                'updatedDate'
            ]),
            expected: migrated.users.length
        })
        report.push({
            table: 'flowops_organization',
            inserted: await insertRows(client, 'flowops_organization', migrated.organizations, [
                'id',
                'name',
                'ownerUserId',
                'createdDate',
                'updatedDate'
            ]),
            expected: migrated.organizations.length
        })
        report.push({
            table: 'flowops_workspace',
            inserted: await insertRows(client, 'flowops_workspace', migrated.workspaces, [
                'id',
                'name',
                'description',
                'organizationId',
                'createdDate',
                'updatedDate'
            ]),
            expected: migrated.workspaces.length
        })
        report.push({
            table: 'flowops_role(custom)',
            inserted: await insertRows(client, 'flowops_role', migrated.roles, [
                'id',
                'name',
                'description',
                'permissions',
                'isBuiltin',
                'createdDate',
                'updatedDate'
            ]),
            expected: migrated.roles.length
        })
        report.push({
            table: 'flowops_workspace_member',
            inserted: await insertRows(client, 'flowops_workspace_member', migrated.workspaceMembers, [
                'id',
                'workspaceId',
                'userId',
                'roleId',
                'createdDate',
                'updatedDate'
            ]),
            expected: migrated.workspaceMembers.length
        })
        report.push({
            table: 'flowops_login_activity',
            inserted: await insertRows(client, 'flowops_login_activity', migrated.loginActivities, [
                'id',
                'userId',
                'activityCode',
                'ip',
                'message',
                'createdDate',
                'updatedDate'
            ]),
            expected: migrated.loginActivities.length
        })

        await client.query('COMMIT')
        return report
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    }
}

const verifyCounts = async (client, migrated, report) => {
    const checks = [
        ['flowops_user', migrated.users.length],
        ['flowops_organization', migrated.organizations.length],
        ['flowops_workspace', migrated.workspaces.length],
        ['flowops_workspace_member', migrated.workspaceMembers.length],
        ['flowops_login_activity', migrated.loginActivities.length]
    ]
    const [{ count: builtinCount }] = (await client.query('SELECT COUNT(*)::int AS count FROM flowops_role WHERE "isBuiltin" = true')).rows
    checks.push(['flowops_role', Number(builtinCount) + migrated.roles.length])

    const mismatches = []
    for (const [table, expected] of checks) {
        const [{ count }] = (await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)}`)).rows
        if (Number(count) !== expected) mismatches.push({ table, expected, actual: Number(count) })
    }
    for (const item of report) {
        if (item.inserted !== item.expected) mismatches.push({ table: item.table, expected: item.expected, actual: item.inserted })
    }
    return mismatches
}

async function runMigration() {
    console.log(`目标: postgres://${PG.user}@${PG.host}:${PG.port}/${PG.database}`)
    const client = new Client(PG)
    await client.connect()
    try {
        console.log('[1/4] 读取 enterprise IAM 源数据 ...')
        const source = await loadSourceSnapshot(client)
        const targetBuiltinRoles = await loadTargetBuiltinRoles(client)
        const migrated = mapEnterpriseSnapshotToFlowOpsRows({ source, targetBuiltinRoles })

        console.log(
            `      user=${source.users.length}, organization=${source.organizations.length}, workspace=${source.workspaces.length}, workspace_user=${source.workspaceUsers.length}, role=${source.roles.length}, login_activity=${source.loginActivities.length}`
        )

        console.log('[2/4] 写入 flowops_ 目标表 ...')
        const report = await writeMigratedRows(client, migrated)
        for (const item of report) console.log(`      ${item.table}: ${item.inserted}/${item.expected}`)

        console.log('[3/4] 行数核对 ...')
        const mismatches = await verifyCounts(client, migrated, report)
        for (const mismatch of mismatches)
            console.error(`      ✗ ${mismatch.table}: expected=${mismatch.expected}, actual=${mismatch.actual}`)
        if (mismatches.length) {
            console.error(`[4/4] ❌ ${mismatches.length} 项行数不一致,迁移失败`)
            process.exitCode = 1
            return
        }
        console.log('[4/4] ✅ FlowOps IAM 数据迁移完成')
    } finally {
        await client.end()
    }
}

if (require.main === module) {
    runMigration().catch((error) => {
        console.error('迁移失败:', error)
        process.exit(1)
    })
}

module.exports = {
    mapEnterpriseSnapshotToFlowOpsRows,
    stableWorkspaceMemberId,
    verifyCounts,
    runMigration
}
