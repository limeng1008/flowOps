import type { QueryRunner } from 'typeorm'

export const FLOWOPS_AUDIT_LOG_PERMISSION = 'auditLogs:view'

type IdentifierQuote = '"' | '`'
type StoredRolePermission = { id: string; permissions: string }

const quoteIdentifier = (identifier: string, quote: IdentifierQuote): string => `${quote}${identifier}${quote}`
const quoteLiteral = (value: string): string => `'${value.replace(/'/g, "''")}'`

const parsePermissions = (value: string): string[] | null => {
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) && parsed.every((permission) => typeof permission === 'string') ? parsed : null
    } catch {
        return null
    }
}

export const updateBuiltinAuditLogPermission = async (
    queryRunner: QueryRunner,
    operation: 'grant' | 'revoke',
    quote: IdentifierQuote
): Promise<void> => {
    const table = quoteIdentifier('flowops_role', quote)
    const id = quoteIdentifier('id', quote)
    const name = quoteIdentifier('name', quote)
    const permissionsColumn = quoteIdentifier('permissions', quote)
    const isBuiltin = quoteIdentifier('isBuiltin', quote)
    const updatedDate = quoteIdentifier('updatedDate', quote)
    const rows = (await queryRunner.query(
        `SELECT ${id}, ${permissionsColumn} FROM ${table} WHERE ${isBuiltin} = TRUE AND ${name} IN ('owner', 'admin')`
    )) as StoredRolePermission[]

    for (const row of rows) {
        const permissions = parsePermissions(row.permissions)
        if (!permissions) continue

        const nextPermissions =
            operation === 'grant'
                ? permissions.includes(FLOWOPS_AUDIT_LOG_PERMISSION)
                    ? permissions
                    : [...permissions, FLOWOPS_AUDIT_LOG_PERMISSION]
                : permissions.filter((permission) => permission !== FLOWOPS_AUDIT_LOG_PERMISSION)

        if (JSON.stringify(nextPermissions) === JSON.stringify(permissions)) continue
        await queryRunner.query(
            `UPDATE ${table} SET ${permissionsColumn} = ${quoteLiteral(JSON.stringify(nextPermissions))}, ` +
                `${updatedDate} = CURRENT_TIMESTAMP WHERE ${id} = ${quoteLiteral(row.id)}`
        )
    }
}
