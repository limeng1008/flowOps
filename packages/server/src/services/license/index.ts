import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'
import { createHash, randomUUID, verify } from 'crypto'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

export type LicenseStatus = 'missing' | 'active' | 'grace' | 'expired' | 'invalid'
export type LicenseTier = 'free' | 'pro' | 'team' | 'enterprise'
export type FlowOpsLicenseModel = 'perpetual' | 'subscription'

export interface FlowOpsLicensePayload {
    customer: string
    edition: string
    modules: string[]
    seats: number
    concurrency: number
    issuedAt: string
    expireAt: string
    machineFingerprint: string[]
    licenseId: string
    tier?: LicenseTier
    model?: FlowOpsLicenseModel
    creditsTotal?: number
    notes?: string
}

export interface LicenseVerificationResult {
    valid: boolean
    status: LicenseStatus
    readOnly: boolean
    reason?: string
    payload?: FlowOpsLicensePayload
    tier?: LicenseTier
    model?: FlowOpsLicenseModel
    customer?: string
    licenseId?: string
    seats?: number
    concurrency?: number
    issuedAt?: Date
    expireAt?: Date
    features: string[]
    machineFingerprint: string[]
    currentFingerprint?: string
    graceDaysRemaining?: number
    graceUntil?: Date
}

export interface LicenseServiceOptions {
    publicKey?: string
    storagePath?: string
    graceDays?: number
    now?: () => Date
    fingerprintProvider?: () => string
}

interface LicenseTokenHeader {
    alg?: string
    typ?: string
}

const DEFAULT_LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAR4jJvAfPv98aNRvqxV2MfHfAOHwC7cIQUVjCqOi2H/I=
-----END PUBLIC KEY-----`

const DEFAULT_GRACE_DAYS = 15
const DAY_MS = 24 * 60 * 60 * 1000

export class LicenseService {
    constructor(private readonly options: LicenseServiceOptions = {}) {}

    async verify(licenseFile: string): Promise<LicenseVerificationResult> {
        const license = normalizeLicenseText(licenseFile)
        if (!license) return invalidResult('MALFORMED_LICENSE')

        const parts = license.split('.')
        if (parts.length !== 3) return invalidResult('MALFORMED_LICENSE')

        const [encodedHeader, encodedPayload, encodedSignature] = parts
        const header = decodeBase64UrlJson(encodedHeader) as LicenseTokenHeader | undefined
        const payload = decodeBase64UrlJson(encodedPayload) as Partial<FlowOpsLicensePayload> | undefined
        if (!header || header.alg !== 'EdDSA' || header.typ !== 'FLOWOPS-LICENSE' || !payload) {
            return invalidResult('MALFORMED_LICENSE')
        }

        const signatureValid = verify(
            null,
            Buffer.from(`${encodedHeader}.${encodedPayload}`),
            this.getPublicKey(),
            Buffer.from(encodedSignature, 'base64url')
        )
        if (!signatureValid) return invalidResult('SIGNATURE_INVALID')

        const normalizedPayload = normalizePayload(payload)
        if (!normalizedPayload) return invalidResult('INVALID_PAYLOAD')

        const currentFingerprint = this.getCurrentFingerprint()
        if (!isFingerprintAllowed(normalizedPayload.machineFingerprint, currentFingerprint)) {
            return {
                ...invalidResult('FINGERPRINT_MISMATCH'),
                currentFingerprint,
                machineFingerprint: normalizedPayload.machineFingerprint
            }
        }

        return this.buildTimeAwareResult(normalizedPayload, currentFingerprint)
    }

    async importLicense(licenseFile: string): Promise<LicenseVerificationResult> {
        const result = await this.verify(licenseFile)
        if (!result.valid) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, result.reason || 'INVALID_LICENSE')
        }

        const storagePath = this.getStoragePath()
        mkdirSync(path.dirname(storagePath), { recursive: true })
        writeFileSync(storagePath, normalizeLicenseText(licenseFile), 'utf8')
        return result
    }

    async getActiveLicense(): Promise<LicenseVerificationResult> {
        const storagePath = this.getStoragePath()
        if (!existsSync(storagePath)) {
            return {
                valid: false,
                status: 'missing',
                readOnly: false,
                reason: 'LICENSE_NOT_IMPORTED',
                features: [],
                machineFingerprint: [],
                currentFingerprint: this.getCurrentFingerprint()
            }
        }

        return this.verify(readFileSync(storagePath, 'utf8'))
    }

    getCurrentFingerprint(): string {
        return this.options.fingerprintProvider?.() ?? collectMachineFingerprint(this.getLicenseHomePath())
    }

    getStoragePath(): string {
        return this.options.storagePath ?? process.env.FLOWOPS_LICENSE_PATH ?? path.join(this.getLicenseHomePath(), 'flowops-license.lic')
    }

    private getPublicKey(): string {
        return this.options.publicKey || process.env.FLOWOPS_LICENSE_PUBLIC_KEY || DEFAULT_LICENSE_PUBLIC_KEY
    }

    private getGraceDays(): number {
        const configured = Number(process.env.FLOWOPS_LICENSE_GRACE_DAYS ?? this.options.graceDays ?? DEFAULT_GRACE_DAYS)
        return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_GRACE_DAYS
    }

    private getNow(): Date {
        return this.options.now?.() ?? new Date()
    }

    private getLicenseHomePath(): string {
        return process.env.SECRETKEY_PATH || process.env.DATABASE_PATH || path.join(os.homedir(), '.flowise')
    }

    private buildTimeAwareResult(payload: FlowOpsLicensePayload, currentFingerprint: string): LicenseVerificationResult {
        const issuedAt = new Date(payload.issuedAt)
        const expireAt = new Date(payload.expireAt)
        const now = this.getNow()
        const graceUntil = new Date(expireAt.getTime() + this.getGraceDays() * DAY_MS)
        const tier = normalizeTier(payload.tier || payload.edition)
        const model = payload.model ?? 'subscription'
        const common = {
            payload,
            tier,
            model,
            customer: payload.customer,
            licenseId: payload.licenseId,
            seats: payload.seats,
            concurrency: payload.concurrency,
            issuedAt,
            expireAt,
            features: payload.modules,
            machineFingerprint: payload.machineFingerprint,
            currentFingerprint,
            graceUntil
        }

        if (model === 'perpetual') {
            return {
                ...common,
                valid: true,
                status: 'active',
                readOnly: false
            }
        }

        if (now.getTime() <= expireAt.getTime()) {
            return {
                ...common,
                valid: true,
                status: 'active',
                readOnly: false
            }
        }

        if (now.getTime() <= graceUntil.getTime()) {
            return {
                ...common,
                valid: true,
                status: 'grace',
                readOnly: true,
                graceDaysRemaining: Math.ceil((graceUntil.getTime() - now.getTime()) / DAY_MS)
            }
        }

        return {
            ...common,
            valid: false,
            status: 'expired',
            readOnly: true,
            reason: 'LICENSE_EXPIRED',
            graceDaysRemaining: 0
        }
    }
}

export const collectMachineFingerprint = (homePath?: string): string => {
    const deploymentId = getOrCreateDeploymentId(homePath)
    const cpuModel = os.cpus()[0]?.model || 'unknown-cpu'
    const macAddresses = Object.values(os.networkInterfaces())
        .flat()
        .filter((details) => details && !details.internal && details.mac && details.mac !== '00:00:00:00:00:00')
        .map((details) => details!.mac)
        .sort()
    const machineIds = ['/etc/machine-id', '/var/lib/dbus/machine-id', '/sys/class/dmi/id/product_uuid']
        .map((filePath) => safeRead(filePath))
        .filter(Boolean)

    return createHash('sha256')
        .update(JSON.stringify([deploymentId, cpuModel, macAddresses, machineIds]))
        .digest('hex')
}

function getOrCreateDeploymentId(homePath?: string): string {
    if (process.env.FLOWOPS_DEPLOYMENT_ID) return process.env.FLOWOPS_DEPLOYMENT_ID

    const basePath = homePath || path.join(os.homedir(), '.flowise')
    const deploymentIdPath = path.join(basePath, 'flowops-deployment-id')
    try {
        mkdirSync(basePath, { recursive: true })
        if (existsSync(deploymentIdPath)) return readFileSync(deploymentIdPath, 'utf8').trim()
        const deploymentId = randomUUID()
        writeFileSync(deploymentIdPath, deploymentId, 'utf8')
        return deploymentId
    } catch {
        return os.hostname()
    }
}

function safeRead(filePath: string): string {
    try {
        return readFileSync(filePath, 'utf8').trim()
    } catch {
        return ''
    }
}

function normalizeLicenseText(licenseFile: string): string {
    const value = `${licenseFile || ''}`.trim()
    if (!value) return ''

    try {
        const parsed = JSON.parse(value)
        if (typeof parsed === 'string') return parsed.trim()
        if (parsed && typeof parsed.license === 'string') return parsed.license.trim()
    } catch {
        return value
    }

    return value
}

function decodeBase64UrlJson(value: string): unknown | undefined {
    try {
        return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    } catch {
        return undefined
    }
}

function normalizePayload(payload: Partial<FlowOpsLicensePayload>): FlowOpsLicensePayload | undefined {
    const modules = Array.isArray(payload.modules) ? payload.modules.filter((item) => typeof item === 'string') : []
    const machineFingerprint = Array.isArray(payload.machineFingerprint)
        ? payload.machineFingerprint.filter((item) => typeof item === 'string')
        : []

    if (
        typeof payload.customer !== 'string' ||
        typeof payload.edition !== 'string' ||
        typeof payload.issuedAt !== 'string' ||
        typeof payload.expireAt !== 'string' ||
        typeof payload.licenseId !== 'string' ||
        typeof payload.seats !== 'number' ||
        typeof payload.concurrency !== 'number' ||
        Number.isNaN(Date.parse(payload.issuedAt)) ||
        Number.isNaN(Date.parse(payload.expireAt))
    ) {
        return undefined
    }

    return {
        customer: payload.customer,
        edition: payload.edition,
        modules,
        seats: payload.seats,
        concurrency: payload.concurrency,
        issuedAt: payload.issuedAt,
        expireAt: payload.expireAt,
        machineFingerprint,
        licenseId: payload.licenseId,
        tier: payload.tier,
        // Licenses minted before P5 L1 did not carry a model; keep them
        // subscription-shaped so their existing expireAt behavior is unchanged.
        model: normalizeLicenseModel(payload.model),
        creditsTotal: typeof payload.creditsTotal === 'number' ? payload.creditsTotal : undefined,
        notes: typeof payload.notes === 'string' ? payload.notes : undefined
    }
}

function normalizeTier(value: string): LicenseTier {
    if (value === 'free' || value === 'pro' || value === 'team' || value === 'enterprise') return value
    return 'enterprise'
}

function normalizeLicenseModel(value: unknown): FlowOpsLicenseModel {
    if (value === 'perpetual') return 'perpetual'
    return 'subscription'
}

function isFingerprintAllowed(allowedFingerprints: string[], currentFingerprint: string): boolean {
    return allowedFingerprints.length === 0 || allowedFingerprints.includes('*') || allowedFingerprints.includes(currentFingerprint)
}

function invalidResult(reason: string): LicenseVerificationResult {
    return {
        valid: false,
        status: 'invalid',
        readOnly: false,
        reason,
        features: [],
        machineFingerprint: []
    }
}

export default new LicenseService()
