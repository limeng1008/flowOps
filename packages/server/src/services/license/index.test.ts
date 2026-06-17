import { mkdtempSync, rmSync } from 'fs'
import os from 'os'
import path from 'path'
import { KeyObject, generateKeyPairSync, sign } from 'crypto'
import { FLOWOPS_ENTITLEMENT_FEATURES } from '../entitlement'
import { LicenseService } from '.'

const fixedNow = new Date('2026-06-10T00:00:00.000Z')

const base64UrlJson = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')

const createSignedLicense = (payload: Record<string, unknown>, privateKey: KeyObject) => {
    const header = { alg: 'EdDSA', typ: 'FLOWOPS-LICENSE' }
    const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`
    const signature = sign(null, Buffer.from(signingInput), privateKey).toString('base64url')
    return `${signingInput}.${signature}`
}

describe('LicenseService Ed25519 verification', () => {
    const keyPair = generateKeyPairSync('ed25519')
    const publicKey = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString()
    const fingerprint = 'fp-local-node'
    let tempDir: string

    const payload = (overrides: Record<string, unknown> = {}) => ({
        customer: 'Acme Gov',
        edition: 'enterprise',
        modules: [FLOWOPS_ENTITLEMENT_FEATURES.privateOfflineLicense, FLOWOPS_ENTITLEMENT_FEATURES.ssoAuditLogs],
        seats: 50,
        concurrency: 8,
        issuedAt: '2026-06-01T00:00:00.000Z',
        expireAt: '2026-07-01T00:00:00.000Z',
        machineFingerprint: [fingerprint],
        licenseId: 'lic_test_001',
        ...overrides
    })

    beforeEach(() => {
        tempDir = mkdtempSync(path.join(os.tmpdir(), 'flowops-license-test-'))
    })

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true })
    })

    const service = () =>
        new LicenseService({
            publicKey,
            storagePath: path.join(tempDir, 'license.lic'),
            fingerprintProvider: () => fingerprint,
            now: () => fixedNow
        })

    it('verifies a signed license and returns active license metadata', async () => {
        const license = createSignedLicense(payload(), keyPair.privateKey)

        const result = await service().verify(license)

        expect(result).toMatchObject({
            valid: true,
            status: 'active',
            readOnly: false,
            customer: 'Acme Gov',
            licenseId: 'lic_test_001',
            seats: 50,
            concurrency: 8,
            model: 'subscription'
        })
        expect(result.features).toContain(FLOWOPS_ENTITLEMENT_FEATURES.ssoAuditLogs)
    })

    it('keeps perpetual licenses active after the maintenance period expires', async () => {
        const license = createSignedLicense(payload({ model: 'perpetual', expireAt: '2026-05-01T00:00:00.000Z' }), keyPair.privateKey)

        const result = await service().verify(license)

        expect(result).toMatchObject({
            valid: true,
            status: 'active',
            readOnly: false,
            model: 'perpetual',
            expireAt: new Date('2026-05-01T00:00:00.000Z')
        })
        expect(result.reason).toBeUndefined()
        expect(result.graceDaysRemaining).toBeUndefined()
    })

    it('rejects a tampered license signature', async () => {
        const license = createSignedLicense(payload(), keyPair.privateKey)
        const [header, originalPayload, signature] = license.split('.')
        const decodedPayload = JSON.parse(Buffer.from(originalPayload, 'base64url').toString('utf8'))
        const tampered = `${header}.${base64UrlJson({ ...decodedPayload, customer: 'Other Gov' })}.${signature}`

        const result = await service().verify(tampered)

        expect(result).toMatchObject({
            valid: false,
            status: 'invalid',
            reason: 'SIGNATURE_INVALID'
        })
    })

    it('rejects a license that is not issued for the local machine fingerprint', async () => {
        const license = createSignedLicense(payload({ machineFingerprint: ['fp-other-node'] }), keyPair.privateKey)

        const result = await service().verify(license)

        expect(result).toMatchObject({
            valid: false,
            status: 'invalid',
            reason: 'FINGERPRINT_MISMATCH'
        })
    })

    it('keeps an expired license in read-only grace instead of hard-disconnecting', async () => {
        const license = createSignedLicense(payload({ expireAt: '2026-06-01T00:00:00.000Z' }), keyPair.privateKey)

        const result = await service().verify(license)

        expect(result).toMatchObject({
            valid: true,
            status: 'grace',
            readOnly: true,
            graceDaysRemaining: 6
        })
    })

    it('marks licenses outside the grace window as expired and read-only', async () => {
        const license = createSignedLicense(payload({ expireAt: '2026-05-01T00:00:00.000Z' }), keyPair.privateKey)

        const result = await service().verify(license)

        expect(result).toMatchObject({
            valid: false,
            status: 'expired',
            readOnly: true,
            reason: 'LICENSE_EXPIRED',
            graceDaysRemaining: 0
        })
    })

    it('accepts JSON-wrapped license text from upload or paste flows', async () => {
        const license = createSignedLicense(payload(), keyPair.privateKey)

        await expect(service().verify(JSON.stringify({ license }))).resolves.toMatchObject({
            valid: true,
            status: 'active',
            licenseId: 'lic_test_001'
        })
    })

    it('imports a verified license and reads it back as the active license', async () => {
        const license = createSignedLicense(payload(), keyPair.privateKey)
        const licenseService = service()

        await expect(licenseService.importLicense(license)).resolves.toMatchObject({ valid: true, status: 'active' })
        await expect(licenseService.getActiveLicense()).resolves.toMatchObject({
            valid: true,
            status: 'active',
            licenseId: 'lic_test_001'
        })
    })
})
