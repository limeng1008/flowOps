import fs from 'fs'
import path from 'path'

const entityDirs = [path.join(__dirname), path.join(__dirname, '../../enterprise/database/entities')]

const readEntityFiles = (dir: string): Array<{ file: string; source: string }> =>
    fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts') && file !== 'index.ts')
        .map((file) => ({
            file: path.relative(process.cwd(), path.join(dir, file)),
            source: fs.readFileSync(path.join(dir, file), 'utf8')
        }))

describe('entity date column metadata', () => {
    it('declares an explicit database type for nullable Date union columns', () => {
        const offenders = entityDirs.flatMap(readEntityFiles).flatMap(({ file, source }) => {
            const matches = source.matchAll(/@Column\(\{\s*nullable:\s*true\s*\}\)\s*\n\s*(\w+)\??:\s*Date\s*\|\s*null/g)
            return Array.from(matches, (match) => `${file}:${match[1]}`)
        })

        expect(offenders).toEqual([])
    })
})
