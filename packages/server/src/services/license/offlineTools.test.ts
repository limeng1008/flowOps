import { execFileSync } from 'child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs'
import os from 'os'
import path from 'path'
import { LicenseService } from '.'

const repoRoot = path.resolve(__dirname, '../../../../..')
const toolsDir = path.join(repoRoot, 'tools/flowops-license')
const generateKeypairScript = path.join(toolsDir, 'generate-keypair.js')
const mintLicenseScript = path.join(toolsDir, 'mint-license.js')
const fixedNow = new Date('2026-06-10T00:00:00.000Z')

const runNode = (script: string, args: string[], env: NodeJS.ProcessEnv = process.env): string =>
    execFileSync(process.execPath, [script, ...args], {
        cwd: repoRoot,
        env,
        encoding: 'utf8'
    }).trim()

describe('FlowOps offline license tools', () => {
    let tempDir: string
    let publicKeyPath: string
    let privateKeyPath: string
    let publicKey: string
    let privateKey: string

    beforeEach(() => {
        tempDir = mkdtempSync(path.join(os.tmpdir(), 'flowops-offline-tools-test-'))
        publicKeyPath = path.join(tempDir, 'flowops-license-public.pem')
        privateKeyPath = path.join(tempDir, 'flowops-license-private.pem')
    })

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true })
    })

    const generateKeypair = () => {
        const stdout = runNode(generateKeypairScript, ['--public-key', publicKeyPath, '--private-key', privateKeyPath])
        expect(stdout).toContain(publicKeyPath)
        expect(stdout).toContain(privateKeyPath)
        expect(existsSync(publicKeyPath)).toBe(true)
        expect(existsSync(privateKeyPath)).toBe(true)
        publicKey = readFileSync(publicKeyPath, 'utf8')
        privateKey = readFileSync(privateKeyPath, 'utf8')
        expect(publicKey).toContain('BEGIN PUBLIC KEY')
        expect(privateKey).toContain('BEGIN PRIVATE KEY')
    }

    const verifyLicense = (license: string, fingerprint = 'fp-local-node') =>
        new LicenseService({
            publicKey,
            storagePath: path.join(tempDir, 'license.lic'),
            fingerprintProvider: () => fingerprint,
            now: () => fixedNow
        }).verify(license)

    const mint = (overrides: string[] = [], env: NodeJS.ProcessEnv = process.env) => {
        const usesPrivateKeyOverride = overrides.includes('--private-key') || overrides.includes('--private-key-env')
        const usesFingerprintOverride = overrides.includes('--machine-fingerprint') || overrides.includes('--machine-fingerprints')

        return runNode(
            mintLicenseScript,
            [
                ...(usesPrivateKeyOverride ? [] : ['--private-key', privateKeyPath]),
                '--customer',
                'Acme Gov',
                '--tier',
                'team',
                '--model',
                'subscription',
                '--seats',
                '20',
                '--concurrency',
                '10',
                '--issued-at',
                '2026-06-01T00:00:00.000Z',
                '--expire-at',
                '2026-07-01T00:00:00.000Z',
                ...(usesFingerprintOverride ? [] : ['--machine-fingerprint', 'fp-local-node']),
                '--module',
                'feat:datasets',
                '--module',
                'feat:logs',
                '--license-id',
                'lic_tools_test_001',
                ...overrides
            ],
            env
        )
    }

    it('generates Ed25519 key files and mints a license that LicenseService verifies as active', async () => {
        generateKeypair()

        const license = mint()
        const result = await verifyLicense(license)

        expect(license.split('.')).toHaveLength(3)
        expect(result).toMatchObject({
            valid: true,
            status: 'active',
            readOnly: false,
            customer: 'Acme Gov',
            licenseId: 'lic_tools_test_001',
            tier: 'team',
            model: 'subscription',
            seats: 20,
            concurrency: 10
        })
        expect(result.features).toEqual(['feat:datasets', 'feat:logs'])
    })

    it('mints subscription licenses that verify as grace or expired based on expireAt', async () => {
        generateKeypair()

        await expect(verifyLicense(mint(['--expire-at', '2026-06-01T00:00:00.000Z']))).resolves.toMatchObject({
            valid: true,
            status: 'grace',
            readOnly: true,
            graceDaysRemaining: 6
        })
        await expect(verifyLicense(mint(['--expire-at', '2026-05-01T00:00:00.000Z']))).resolves.toMatchObject({
            valid: false,
            status: 'expired',
            readOnly: true,
            reason: 'LICENSE_EXPIRED'
        })
    })

    it('mints perpetual licenses that remain active after expireAt maintenance date', async () => {
        generateKeypair()

        await expect(verifyLicense(mint(['--model', 'perpetual', '--expire-at', '2026-05-01T00:00:00.000Z']))).resolves.toMatchObject({
            valid: true,
            status: 'active',
            readOnly: false,
            model: 'perpetual'
        })
    })

    it('mints machine-bound licenses and reports fingerprint mismatch through LicenseService', async () => {
        generateKeypair()

        const license = mint(['--machine-fingerprint', 'fp-other-node'])
        const result = await verifyLicense(license)

        expect(result).toMatchObject({
            valid: false,
            status: 'invalid',
            reason: 'FINGERPRINT_MISMATCH',
            machineFingerprint: ['fp-other-node'],
            currentFingerprint: 'fp-local-node'
        })
    })

    it('accepts the private key from an environment variable and can write the license to a file', async () => {
        generateKeypair()
        const outputPath = path.join(tempDir, 'customer.lic')
        const env = {
            ...process.env,
            FLOWOPS_LICENSE_PRIVATE_KEY: privateKey
        }

        const stdout = mint(['--private-key-env', 'FLOWOPS_LICENSE_PRIVATE_KEY', '--output', outputPath], env)
        const license = readFileSync(outputPath, 'utf8').trim()

        expect(stdout).toContain(outputPath)
        await expect(verifyLicense(license)).resolves.toMatchObject({ valid: true, status: 'active' })
    })
})
