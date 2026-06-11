import fs from 'fs'
import path from 'path'

describe('PaymentOrder cross-database metadata', () => {
    it('uses driver-normalized date column types (SQLite/MySQL/PostgreSQL)', () => {
        const source = fs.readFileSync(path.join(__dirname, 'PaymentOrder.ts'), 'utf8')

        expect(source).not.toContain("type: 'timestamp'")
        expect(source).not.toContain("type: 'datetime'")
        expect(source).toContain('@Column({ nullable: true, type: Date })\n    paidAt?: Date | null')
        expect(source).toContain('@Column({ nullable: true, type: Date })\n    expireAt?: Date | null')
    })
})
