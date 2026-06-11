import fs from 'fs'
import path from 'path'

const entityRoot = __dirname
const srcRoot = path.resolve(__dirname, '../../..')
const migrationTimestamp = '1778000000000'
const migrationClass = 'AddFlowOpsIamEntities1778000000000'

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
})
