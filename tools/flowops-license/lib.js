const { generateKeyPairSync, randomUUID, sign } = require('crypto')
const { mkdirSync, readFileSync, writeFileSync } = require('fs')
const path = require('path')

const LICENSE_HEADER = { alg: 'EdDSA', typ: 'FLOWOPS-LICENSE' }
const LICENSE_TIERS = new Set(['free', 'pro', 'team', 'enterprise'])
const LICENSE_MODELS = new Set(['perpetual', 'subscription'])

function parseArgs(argv) {
    const args = {}
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index]
        if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`)

        const equalsIndex = token.indexOf('=')
        const key = token.slice(2, equalsIndex === -1 ? undefined : equalsIndex)
        const inlineValue = equalsIndex === -1 ? undefined : token.slice(equalsIndex + 1)
        const next = argv[index + 1]
        const value = inlineValue ?? (next && !next.startsWith('--') ? argv[++index] : 'true')

        if (args[key] === undefined) {
            args[key] = value
        } else if (Array.isArray(args[key])) {
            args[key].push(value)
        } else {
            args[key] = [args[key], value]
        }
    }
    return args
}

function getLast(args, key) {
    const value = args[key]
    return Array.isArray(value) ? value[value.length - 1] : value
}

function getMany(args, singularKey, pluralKey) {
    const values = []
    for (const key of [pluralKey, singularKey]) {
        const raw = args[key]
        const rawValues = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]
        for (const value of rawValues) {
            values.push(
                ...String(value)
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
            )
        }
    }
    return values
}

function requireString(value, name) {
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`${name} is required`)
    return value.trim()
}

function parseInteger(value, name) {
    const parsed = Number(value)
    if (!Number.isInteger(parsed)) throw new Error(`${name} must be an integer`)
    return parsed
}

function normalizeDate(value, name) {
    const date = new Date(requireString(value, name))
    if (Number.isNaN(date.getTime())) throw new Error(`${name} must be a valid date`)
    return date.toISOString()
}

function base64UrlJson(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function writeFileEnsuringDir(filePath, contents, mode) {
    mkdirSync(path.dirname(filePath), { recursive: true })
    writeFileSync(filePath, contents, { encoding: 'utf8', mode })
}

function generateKeypair({ publicKeyPath, privateKeyPath, stdout = false }) {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString()
    const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()

    if (stdout) return { publicKey: publicPem, privateKey: privatePem }

    if (!publicKeyPath || !privateKeyPath) {
        throw new Error('Either pass --stdout or provide both --public-key and --private-key output paths')
    }

    writeFileEnsuringDir(publicKeyPath, publicPem, 0o644)
    writeFileEnsuringDir(privateKeyPath, privatePem, 0o600)
    return { publicKeyPath, privateKeyPath }
}

function readPrivateKey(args, env = process.env) {
    const privateKeyPath = getLast(args, 'private-key') || env.FLOWOPS_LICENSE_PRIVATE_KEY_PATH
    const privateKeyEnvName = getLast(args, 'private-key-env') || 'FLOWOPS_LICENSE_PRIVATE_KEY'

    if (privateKeyPath) return readFileSync(privateKeyPath, 'utf8')
    if (env[privateKeyEnvName]) return env[privateKeyEnvName]
    throw new Error('Private key is required via --private-key, FLOWOPS_LICENSE_PRIVATE_KEY_PATH, or FLOWOPS_LICENSE_PRIVATE_KEY')
}

function buildPayload(args) {
    const tier = requireString(getLast(args, 'tier'), 'tier')
    const model = requireString(getLast(args, 'model'), 'model')
    if (!LICENSE_TIERS.has(tier)) throw new Error('tier must be one of free, pro, team, enterprise')
    if (!LICENSE_MODELS.has(model)) throw new Error('model must be perpetual or subscription')

    const machineFingerprint = getMany(args, 'machine-fingerprint', 'machine-fingerprints')
    if (machineFingerprint.length === 0) throw new Error('At least one --machine-fingerprint is required; use * for wildcard')

    return {
        customer: requireString(getLast(args, 'customer'), 'customer'),
        edition: requireString(getLast(args, 'edition') || tier, 'edition'),
        modules: getMany(args, 'module', 'modules'),
        seats: parseInteger(requireString(getLast(args, 'seats'), 'seats'), 'seats'),
        concurrency: parseInteger(requireString(getLast(args, 'concurrency'), 'concurrency'), 'concurrency'),
        issuedAt: getLast(args, 'issued-at') ? normalizeDate(getLast(args, 'issued-at'), 'issuedAt') : new Date().toISOString(),
        expireAt: normalizeDate(getLast(args, 'expire-at'), 'expireAt'),
        machineFingerprint,
        licenseId: getLast(args, 'license-id') || randomUUID(),
        tier,
        model,
        creditsTotal:
            getLast(args, 'credits-total') === undefined ? undefined : parseInteger(getLast(args, 'credits-total'), 'creditsTotal'),
        notes: getLast(args, 'notes') || undefined
    }
}

function mintLicense(args, env = process.env) {
    const payload = buildPayload(args)
    const encodedHeader = base64UrlJson(LICENSE_HEADER)
    const encodedPayload = base64UrlJson(payload)
    const signingInput = `${encodedHeader}.${encodedPayload}`
    const signature = sign(null, Buffer.from(signingInput), readPrivateKey(args, env)).toString('base64url')
    return `${signingInput}.${signature}`
}

module.exports = {
    LICENSE_HEADER,
    buildPayload,
    generateKeypair,
    getLast,
    mintLicense,
    parseArgs
}
