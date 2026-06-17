import express from 'express'
import request from 'supertest'
import { createLicenseEnforcementMiddleware } from './enforcement'
import { LicenseVerificationResult } from '.'

const makeState = (
    status: LicenseVerificationResult['status'],
    overrides: Partial<LicenseVerificationResult> = {}
): LicenseVerificationResult => ({
    valid: status === 'active' || status === 'grace',
    status,
    readOnly: status === 'grace' || status === 'expired',
    reason: status === 'missing' ? 'LICENSE_NOT_IMPORTED' : undefined,
    features: [],
    machineFingerprint: [],
    currentFingerprint: 'fp-test',
    ...overrides
})

const buildApp = (state: LicenseVerificationResult) => {
    const app = express()
    app.use(express.json())
    app.use(createLicenseEnforcementMiddleware(() => state))
    app.use((req, res) => res.json({ ok: true, method: req.method, path: req.path }))
    return app
}

describe('license enforcement middleware', () => {
    const originalFlowOpsEdition = process.env.FLOWOPS_EDITION
    const originalEdition = process.env.EDITION
    const originalLocalCommercial = process.env.FLOWOPS_LOCAL_COMMERCIAL

    beforeEach(() => {
        delete process.env.FLOWOPS_EDITION
        delete process.env.EDITION
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
    })

    afterAll(() => {
        if (originalFlowOpsEdition === undefined) delete process.env.FLOWOPS_EDITION
        else process.env.FLOWOPS_EDITION = originalFlowOpsEdition
        if (originalEdition === undefined) delete process.env.EDITION
        else process.env.EDITION = originalEdition
        if (originalLocalCommercial === undefined) delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        else process.env.FLOWOPS_LOCAL_COMMERCIAL = originalLocalCommercial
    })

    it.each(['missing', 'active'] as const)('allows all API methods when license status is %s', async (status) => {
        const app = buildApp(makeState(status))

        await expect(request(app).post('/api/v1/chatflows').send({ name: 'ok' })).resolves.toMatchObject({ status: 200 })
        await expect(request(app).delete('/api/v1/credentials/cred_1')).resolves.toMatchObject({ status: 200 })
    })

    it('allows all API methods in cloud and local commercial modes', async () => {
        process.env.FLOWOPS_EDITION = 'cloud'
        await expect(
            request(buildApp(makeState('expired')))
                .post('/api/v1/chatflows')
                .send({})
        ).resolves.toMatchObject({ status: 200 })

        delete process.env.FLOWOPS_EDITION
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
        await expect(request(buildApp(makeState('invalid'))).delete('/api/v1/users/user_1')).resolves.toMatchObject({ status: 200 })
    })

    it('keeps grace licenses read-only while allowing reads, license recovery, settings, and prediction runs', async () => {
        const app = buildApp(makeState('grace', { readOnly: true }))

        await expect(request(app).get('/api/v1/chatflows')).resolves.toMatchObject({ status: 200 })
        await expect(request(app).post('/api/v1/license/import').send({ license: 'new-license' })).resolves.toMatchObject({ status: 200 })
        await expect(request(app).get('/api/v1/settings')).resolves.toMatchObject({ status: 200 })
        await expect(request(app).post('/api/v1/prediction/chatflow_1').send({ question: 'run' })).resolves.toMatchObject({ status: 200 })
        await expect(request(app).post('/api/v1/internal-prediction/chatflow_1').send({ question: 'run' })).resolves.toMatchObject({
            status: 200
        })

        const blocked = await request(app).post('/api/v1/chatflows').send({ name: 'blocked' })
        expect(blocked.status).toBe(402)
        expect(blocked.body.message).toBe('授权宽限期,只读,请续费')
    })

    it('hard blocks expired licenses except auth, license recovery, and settings paths', async () => {
        const app = buildApp(makeState('expired', { valid: false, readOnly: true }))

        await expect(request(app).post('/api/v1/auth/login').send({ email: 'a@example.com' })).resolves.toMatchObject({ status: 200 })
        await expect(request(app).post('/api/v1/auth/refreshToken')).resolves.toMatchObject({ status: 200 })
        await expect(request(app).get('/api/v1/auth/me')).resolves.toMatchObject({ status: 200 })
        await expect(request(app).post('/api/v1/license/import').send({ license: 'new-license' })).resolves.toMatchObject({ status: 200 })
        await expect(request(app).get('/api/v1/settings')).resolves.toMatchObject({ status: 200 })

        const blockedRead = await request(app).get('/api/v1/chatflows')
        expect(blockedRead.status).toBe(402)
        expect(blockedRead.body.message).toBe('授权已失效,请导入有效授权')

        const blockedRun = await request(app).post('/api/v1/prediction/chatflow_1').send({ question: 'run' })
        expect(blockedRun.status).toBe(402)
        expect(blockedRun.body.message).toBe('授权已失效,请导入有效授权')
    })

    it('uses a machine-binding message for fingerprint mismatch invalid licenses', async () => {
        const app = buildApp(makeState('invalid', { valid: false, reason: 'FINGERPRINT_MISMATCH' }))

        const response = await request(app).get('/api/v1/chatflows')

        expect(response.status).toBe(402)
        expect(response.body.message).toBe('授权绑定的机器不匹配,请重新申请授权')
        expect(response.body.reason).toBe('FINGERPRINT_MISMATCH')
    })
})
