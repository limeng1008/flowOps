import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

export function requireEnv(name: string, providerLabel: string): string {
    const value = process.env[name]
    if (!value) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `未配置${providerLabel}支付，请在环境变量中填入商户信息：${name}`)
    return normalizePem(value)
}

export function getEnv(name: string, fallback: string): string {
    return process.env[name] || fallback
}

export function normalizePem(value: string): string {
    return value.replace(/\\n/g, '\n').trim()
}

export function centsToYuan(amountCents: number): string {
    assertIntegerCents(amountCents)
    const sign = amountCents < 0 ? '-' : ''
    const absolute = Math.abs(amountCents)
    const yuan = Math.floor(absolute / 100)
    const cents = `${absolute % 100}`.padStart(2, '0')
    return `${sign}${yuan}.${cents}`
}

export function yuanToCents(value: string): number {
    const trimmed = String(value || '').trim()
    const match = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/)
    if (!match) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Invalid payment amount')
    const yuan = Number(match[1])
    const cents = Number((match[2] || '').padEnd(2, '0'))
    const amount = yuan * 100 + cents
    assertIntegerCents(amount)
    return amount
}

export function assertIntegerCents(value: number): void {
    if (!Number.isInteger(value)) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Payment amount must be integer cents')
}

export function signRsaSha256(content: string, privateKey: string): string {
    return crypto.createSign('RSA-SHA256').update(content, 'utf8').sign(privateKey, 'base64')
}

export function verifyRsaSha256(content: string, signature: string, publicKey: string): boolean {
    try {
        return crypto.createVerify('RSA-SHA256').update(content, 'utf8').verify(publicKey, signature, 'base64')
    } catch {
        return false
    }
}

export function randomNonce(size = 16): string {
    return crypto.randomBytes(size).toString('hex')
}

export function currentAlipayTimestamp(date = new Date()): string {
    const pad = (value: number) => `${value}`.padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
        date.getMinutes()
    )}:${pad(date.getSeconds())}`
}

export function readHeader(headers: Record<string, unknown>, name: string): string {
    const lower = name.toLowerCase()
    const match = Object.entries(headers).find(([key]) => key.toLowerCase() === lower)?.[1]
    if (Array.isArray(match)) return String(match[0] || '')
    return match == null ? '' : String(match)
}
