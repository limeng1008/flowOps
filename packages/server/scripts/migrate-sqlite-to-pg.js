/* SQLite → PostgreSQL 全量数据迁移(FlowOps 私有化交付工具)
 *
 * 前提:
 *   1. packages/server 已 build(本脚本复用 dist 里的 PG migrations 建表)
 *   2. 目标 PG 库已创建(空库即可)
 * 用法:
 *   node scripts/migrate-sqlite-to-pg.js [sqlite路径]
 *   连接参数走环境变量 PG_HOST/PG_PORT/PG_USER/PG_PASSWORD/PG_DATABASE,默认本地开发值
 * 行为:
 *   PG 上跑全部 migrations 建表 → 关闭 FK 触发器 → 清种子数据 → 按两库表交集逐表搬运 → 行数核对
 */
'use strict'
const path = require('path')
const os = require('os')
const { DataSource } = require('typeorm')
const { postgresMigrations } = require('../dist/database/migrations/postgres')

const SQLITE_PATH = process.argv[2] || path.join(os.homedir(), '.flowise', 'database.sqlite')
const PG = {
    host: process.env.PG_HOST || '127.0.0.1',
    port: +(process.env.PG_PORT || 5432),
    username: process.env.PG_USER || 'flowise',
    password: process.env.PG_PASSWORD || 'flowise',
    database: process.env.PG_DATABASE || 'flowise'
}

async function main() {
    console.log(`源库: ${SQLITE_PATH}`)
    console.log(`目标: postgres://${PG.username}@${PG.host}:${PG.port}/${PG.database}`)

    const source = new DataSource({ type: 'sqlite', database: SQLITE_PATH, entities: [] })
    const target = new DataSource({ type: 'postgres', ...PG, entities: [], migrations: postgresMigrations })
    await source.initialize()
    await target.initialize()

    console.log('[1/4] PG 执行 migrations 建表 ...')
    // 上游 Init migration 依赖 uuid_generate_v4(),空库先装扩展(需 superuser 或库 owner 有权限)
    await target.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    const ran = await target.runMigrations({ transaction: 'each' })
    console.log(`      执行了 ${ran.length} 个 migration`)

    const sqliteTables = (
        await source.query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name <> 'migrations'`)
    ).map((r) => r.name)
    const pgTables = (await target.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'migrations'`)).map(
        (r) => r.tablename
    )
    const common = sqliteTables.filter((t) => pgTables.includes(t))
    const sqliteOnly = sqliteTables.filter((t) => !pgTables.includes(t))
    const pgOnly = pgTables.filter((t) => !sqliteTables.includes(t))
    if (sqliteOnly.length) console.warn(`      ⚠️ 仅 sqlite 有(不搬): ${sqliteOnly.join(', ')}`)
    if (pgOnly.length) console.warn(`      ⚠️ 仅 PG 有(保持空表): ${pgOnly.join(', ')}`)

    // 单连接会话内关闭 FK 触发器,搬运期间无视外键依赖顺序(需 superuser)
    const qr = target.createQueryRunner()
    await qr.connect()
    await qr.query('SET session_replication_role = replica')

    console.log(`[2/4] 逐表搬运(共 ${common.length} 张)...`)
    const report = []
    for (const table of common) {
        const rows = await source.query(`SELECT * FROM "${table}"`)
        const pgCols = (
            await qr.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [table])
        ).map((r) => r.column_name)
        await qr.query(`DELETE FROM "${table}"`) // 清掉 migration 种子,保证与源库一致
        let inserted = 0
        for (const row of rows) {
            const cols = Object.keys(row).filter((c) => pgCols.includes(c))
            const skipped = Object.keys(row).filter((c) => !pgCols.includes(c))
            if (skipped.length && inserted === 0) console.warn(`      ⚠️ ${table} 丢弃 PG 无的列: ${skipped.join(', ')}`)
            const params = cols.map((c) => (row[c] === undefined ? null : row[c]))
            const colSql = cols.map((c) => `"${c}"`).join(', ')
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
            await qr.query(`INSERT INTO "${table}" (${colSql}) VALUES (${placeholders})`, params)
            inserted++
        }
        report.push({ table, src: rows.length, dst: inserted })
    }
    await qr.query('SET session_replication_role = DEFAULT')

    console.log('[3/4] 行数核对 ...')
    let bad = 0
    for (const r of report) {
        const [{ count }] = await qr.query(`SELECT count(*)::int AS count FROM "${r.table}"`)
        const ok = count === r.src
        if (!ok) bad++
        if (!ok || r.src > 0) console.log(`      ${ok ? '✓' : '✗'} ${r.table}: sqlite=${r.src} pg=${count}`)
    }

    await qr.release()
    await source.destroy()
    await target.destroy()
    if (bad > 0) {
        console.error(`[4/4] ❌ ${bad} 张表行数不一致,请检查`)
        process.exit(1)
    }
    console.log('[4/4] ✅ 全部表行数一致,迁移完成')
}

main().catch((e) => {
    console.error('迁移失败:', e)
    process.exit(1)
})
