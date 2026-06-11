import fs from 'fs'
import path from 'path'

const entityRoots = [path.resolve(__dirname), path.resolve(__dirname, '../../../enterprise/database/entities')]

const readEntityFiles = (dir: string): Array<{ file: string; source: string }> => {
    if (!fs.existsSync(dir)) return []

    return fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
        .map((file) => ({
            file: path.join(dir, file),
            source: fs.readFileSync(path.join(dir, file), 'utf8')
        }))
}

describe('Cross-database entity date columns', () => {
    // 字符串类型跨库不兼容：'timestamp' 炸 SQLite，'datetime' 炸 PostgreSQL。
    // 统一用 type: Date，由 TypeORM 驱动归一化（PG→timestamp，MySQL/MariaDB/SQLite→datetime）。
    it('does not use timestamp or datetime string column metadata in server entities', () => {
        const offenders = entityRoots
            .flatMap(readEntityFiles)
            .filter(
                ({ source }) =>
                    source.includes("type: 'timestamp'") ||
                    source.includes('type: "timestamp"') ||
                    source.includes("type: 'datetime'") ||
                    source.includes('type: "datetime"')
            )
            .map(({ file }) => path.relative(path.resolve(__dirname, '../../..'), file))

        expect(offenders).toEqual([])
    })

    it('uses driver-normalized Date metadata for nullable date fields that include null', () => {
        const assertColumn = (relativePath: string, field: string) => {
            const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8')
            expect(source).toContain(`@Column({ nullable: true, type: Date })\n    ${field}`)
        }

        assertColumn('PaymentOrder.ts', 'paidAt?: Date | null')
        assertColumn('PaymentOrder.ts', 'expireAt?: Date | null')
        assertColumn('SupportTicket.ts', 'resolvedDate?: Date | null')
        assertColumn('SupportTicket.ts', 'closedDate?: Date | null')
    })
})
