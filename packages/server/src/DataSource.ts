import 'reflect-metadata'
import path from 'path'
import * as fs from 'fs'
import { DataSource } from 'typeorm'
import { getUserHome } from './utils'
import { entities } from './database/entities'
import logger from './utils/logger'

let appDataSource: DataSource

type MigrationList = Function[]

export const getMigrations = (databaseType?: string): MigrationList => {
    switch (databaseType) {
        case 'mysql':
            return require('./database/migrations/mysql').mysqlMigrations
        case 'mariadb':
            return require('./database/migrations/mariadb').mariadbMigrations
        case 'postgres':
            return require('./database/migrations/postgres').postgresMigrations
        case 'sqlite':
        default:
            return require('./database/migrations/sqlite').sqliteMigrations
    }
}

export const init = async (): Promise<void> => {
    let homePath
    let flowisePath = path.join(getUserHome(), '.flowise')
    if (!fs.existsSync(flowisePath)) {
        fs.mkdirSync(flowisePath)
    }
    switch (process.env.DATABASE_TYPE) {
        case 'sqlite':
            homePath = process.env.DATABASE_PATH ?? flowisePath
            appDataSource = new DataSource({
                type: 'sqlite',
                database: path.resolve(homePath, 'database.sqlite'),
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: getMigrations('sqlite')
            })
            break
        case 'mysql':
            appDataSource = new DataSource({
                type: 'mysql',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '3306'),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                charset: 'utf8mb4',
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: getMigrations('mysql'),
                ssl: getDatabaseSSLFromEnv()
            })
            break
        case 'mariadb':
            appDataSource = new DataSource({
                type: 'mariadb',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '3306'),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                charset: 'utf8mb4',
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: getMigrations('mariadb'),
                ssl: getDatabaseSSLFromEnv()
            })
            break
        case 'postgres':
            appDataSource = new DataSource({
                type: 'postgres',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '5432'),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                ssl: getDatabaseSSLFromEnv(),
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: getMigrations('postgres'),
                extra: {
                    idleTimeoutMillis: 120000
                },
                logging: ['error', 'warn', 'info', 'log'],
                logger: 'advanced-console',
                logNotifications: true,
                poolErrorHandler: (err) => {
                    logger.error(`Database pool error: ${JSON.stringify(err)}`)
                },
                applicationName: 'Flowise'
            })
            break
        default:
            homePath = process.env.DATABASE_PATH ?? flowisePath
            appDataSource = new DataSource({
                type: 'sqlite',
                database: path.resolve(homePath, 'database.sqlite'),
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: getMigrations('sqlite')
            })
            break
    }
}

export function getDataSource(): DataSource {
    if (appDataSource === undefined) {
        init()
    }
    return appDataSource
}

export const getDatabaseSSLFromEnv = () => {
    if (process.env.DATABASE_SSL_KEY_BASE64) {
        return {
            rejectUnauthorized: process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
            ca: Buffer.from(process.env.DATABASE_SSL_KEY_BASE64, 'base64')
        }
    } else if (process.env.DATABASE_SSL === 'true') {
        return true
    }
    return undefined
}
