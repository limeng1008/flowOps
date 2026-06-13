import fs from 'fs'
import path from 'path'

const entityRoot = __dirname
const srcRoot = path.resolve(__dirname, '../../..')
const migrationTimestamp = '1778000000000'
const migrationClass = 'AddFlowOpsIamEntities1778000000000'
const rolePermissionMigrationTimestamp = '1778000100000'
const rolePermissionMigrationClass = 'BackfillFlowOpsRolePermissions1778000100000'
const workspaceFkDecoupleMigrationTimestamp = '1778000200000'
const workspaceFkDecoupleMigrationClass = 'DecoupleWorkspaceFkFromBusinessTables1778000200000'
const workspaceColumnMigrationTimestamp = '1778000300000'
const workspaceColumnMigrationClass = 'AddWorkspaceIdColumnsToBusinessTables1778000300000'
const businessWorkspaceConstraints = [
    ['apikey', 'fk_apikey_workspaceId'],
    ['assistant', 'fk_assistant_workspaceId'],
    ['chat_flow', 'fk_chat_flow_workspaceId'],
    ['credential', 'fk_credential_workspaceId'],
    ['custom_template', 'fk_custom_template_workspaceId'],
    ['dataset', 'fk_dataset_workspaceId'],
    ['document_store', 'fk_document_store_workspaceId'],
    ['evaluation', 'fk_evaluation_workspaceId'],
    ['evaluator', 'fk_evaluator_workspaceId'],
    ['execution', 'fk_execution_workspaceId'],
    ['tool', 'fk_tool_workspaceId'],
    ['variable', 'fk_variable_workspaceId']
] as const
const blockedEnterprisePeerTables = ['organization', 'role', 'user', 'workspace_shared', 'workspace_user', 'login_method'] as const
const businessWorkspaceTables = [
    'apikey',
    'assistant',
    'chat_flow',
    'credential',
    'custom_template',
    'custom_mcp_server',
    'dataset',
    'document_store',
    'evaluation',
    'evaluator',
    'execution',
    'tool',
    'variable'
] as const

const entities = [
    ['FlowOpsUser.ts', 'FlowOpsUser', 'flowops_user'],
    ['FlowOpsOrganization.ts', 'FlowOpsOrganization', 'flowops_organization'],
    ['FlowOpsWorkspace.ts', 'FlowOpsWorkspace', 'flowops_workspace'],
    ['FlowOpsWorkspaceMember.ts', 'FlowOpsWorkspaceMember', 'flowops_workspace_member'],
    ['FlowOpsRole.ts', 'FlowOpsRole', 'flowops_role'],
    ['FlowOpsLoginActivity.ts', 'FlowOpsLoginActivity', 'flowops_login_activity']
] as const

const read = (file: string) => fs.readFileSync(file, 'utf8')

describe('FlowOps IAM self data layer', () => {
    it('defines six flowops_ entities with driver-normalized date metadata', () => {
        for (const [fileName, className, tableName] of entities) {
            const source = read(path.join(entityRoot, fileName))

            expect(source).toContain(`@Entity('${tableName}')`)
            expect(source).toContain(`export class ${className}`)
            expect(source).toContain("@PrimaryGeneratedColumn('uuid')")
            expect(source).toContain('@CreateDateColumn({ type: Date })')
            expect(source).toContain('@UpdateDateColumn({ type: Date })')
            expect(source).not.toContain("type: 'timestamp'")
            expect(source).not.toContain('type: "timestamp"')
            expect(source).not.toContain("type: 'datetime'")
            expect(source).not.toContain('type: "datetime"')
        }

        const userSource = read(path.join(entityRoot, 'FlowOpsUser.ts'))
        expect(userSource).toContain('@Column({ nullable: true, type: Date })\n    tokenExpiry?: Date | null')
        expect(userSource).toContain('@Column({ nullable: true, type: Date })\n    lastLogin?: Date | null')
    })

    it('registers FlowOps IAM entities in the server entity catalog', () => {
        const source = read(path.join(srcRoot, 'database/entities/index.ts'))

        for (const [, className] of entities) {
            expect(source).toContain(className)
        }
        expect(source).toContain("from '../../iam/self/entities'")
    })

    it('registers the four database migrations and seeds builtin roles', () => {
        for (const driver of ['postgres', 'mysql', 'mariadb', 'sqlite']) {
            const migrationPath = path.join(srcRoot, `database/migrations/${driver}/${migrationTimestamp}-AddFlowOpsIamEntities.ts`)
            const migrationSource = read(migrationPath)
            const indexSource = read(path.join(srcRoot, `database/migrations/${driver}/index.ts`))

            expect(indexSource).toContain(`import { ${migrationClass} } from './${migrationTimestamp}-AddFlowOpsIamEntities'`)
            expect(indexSource).toContain(migrationClass)
            for (const [, , tableName] of entities) {
                expect(migrationSource).toContain(tableName)
            }
            for (const roleName of ['owner', 'admin', 'member']) {
                expect(migrationSource).toContain(roleName)
            }
        }
    })

    it('registers the four role permission backfill migrations', () => {
        const helperSource = read(path.join(srcRoot, 'database/migrations/flowOpsIamRolePermissions.ts'))
        expect(helperSource).toContain('FLOWOPS_OWNER_ROLE_PERMISSIONS')
        expect(helperSource).toContain('chatflows:create')
        expect(helperSource).toContain('users:manage')
        expect(helperSource).toContain('workspace:add-user')

        for (const driver of ['postgres', 'mysql', 'mariadb', 'sqlite']) {
            const migrationPath = path.join(
                srcRoot,
                `database/migrations/${driver}/${rolePermissionMigrationTimestamp}-BackfillFlowOpsRolePermissions.ts`
            )
            const migrationSource = read(migrationPath)
            const indexSource = read(path.join(srcRoot, `database/migrations/${driver}/index.ts`))

            expect(indexSource).toContain(
                `import { ${rolePermissionMigrationClass} } from './${rolePermissionMigrationTimestamp}-BackfillFlowOpsRolePermissions'`
            )
            expect(indexSource).toContain(rolePermissionMigrationClass)
            expect(migrationSource).toContain('FLOWOPS_BUILTIN_ROLE_PERMISSION_ROWS')
            expect(migrationSource).toContain('flowops_role')
        }
    })

    it('registers the four business workspace FK decoupling migrations without touching enterprise peer tables', () => {
        for (const driver of ['postgres', 'mysql', 'mariadb', 'sqlite']) {
            const migrationPath = path.join(
                srcRoot,
                `database/migrations/${driver}/${workspaceFkDecoupleMigrationTimestamp}-DecoupleWorkspaceFkFromBusinessTables.ts`
            )
            const migrationSource = read(migrationPath)
            const indexSource = read(path.join(srcRoot, `database/migrations/${driver}/index.ts`))

            expect(indexSource).toContain(
                `import { ${workspaceFkDecoupleMigrationClass} } from './${workspaceFkDecoupleMigrationTimestamp}-DecoupleWorkspaceFkFromBusinessTables'`
            )
            expect(indexSource).toContain(workspaceFkDecoupleMigrationClass)

            if (driver === 'sqlite') {
                expect(migrationSource).toContain('SQLite never had these late-added workspace foreign keys')
                continue
            }

            for (const [tableName, constraintName] of businessWorkspaceConstraints) {
                expect(migrationSource).toContain(tableName)
                expect(migrationSource).toContain(constraintName)
            }
            for (const tableName of blockedEnterprisePeerTables) {
                expect(migrationSource).not.toContain(`'${tableName}'`)
                expect(migrationSource).not.toContain(`"${tableName}"`)
            }
        }
    })

    it('registers the four business workspaceId column migrations in full and ship migration sets', () => {
        for (const driver of ['postgres', 'mysql', 'mariadb', 'sqlite']) {
            const migrationPath = path.join(
                srcRoot,
                `database/migrations/${driver}/${workspaceColumnMigrationTimestamp}-AddWorkspaceIdColumnsToBusinessTables.ts`
            )
            const migrationSource = read(migrationPath)
            const indexSource = read(path.join(srcRoot, `database/migrations/${driver}/index.ts`))
            const shipIndexSource = read(path.join(srcRoot, `database/migrations/${driver}/index.ship.ts`))

            expect(indexSource).toContain(
                `import { ${workspaceColumnMigrationClass} } from './${workspaceColumnMigrationTimestamp}-AddWorkspaceIdColumnsToBusinessTables'`
            )
            expect(indexSource).toContain(workspaceColumnMigrationClass)
            expect(shipIndexSource).toContain(
                `import { ${workspaceColumnMigrationClass} } from './${workspaceColumnMigrationTimestamp}-AddWorkspaceIdColumnsToBusinessTables'`
            )
            expect(shipIndexSource).toContain(workspaceColumnMigrationClass)
            expect(migrationSource).toContain('workspaceId')
            expect(migrationSource).toContain('hasColumn')
            for (const tableName of businessWorkspaceTables) {
                expect(migrationSource).toContain(tableName)
            }
        }
    })
})
