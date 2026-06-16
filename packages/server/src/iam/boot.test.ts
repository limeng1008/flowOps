describe('IAM boot seam', () => {
    const originalFlowOpsIam = process.env.FLOWOPS_IAM

    afterEach(() => {
        if (originalFlowOpsIam === undefined) delete process.env.FLOWOPS_IAM
        else process.env.FLOWOPS_IAM = originalFlowOpsIam
        jest.resetModules()
        jest.clearAllMocks()
    })

    it('calls the lazily loaded enterprise auth secret initializer', async () => {
        const enterpriseInitAuthSecrets = jest.fn()
        const authSecretsPath = require.resolve('../enterprise/utils/authSecrets')
        process.env.FLOWOPS_IAM = 'enterprise'

        jest.resetModules()
        jest.doMock('./provider', () => ({
            isSelfIamMode: () => false
        }))
        jest.doMock(authSecretsPath, () => ({
            initAuthSecrets: enterpriseInitAuthSecrets
        }))

        const { initAuthSecrets } = require('./boot') as { initAuthSecrets: () => Promise<void> }

        await initAuthSecrets()

        expect(enterpriseInitAuthSecrets).toHaveBeenCalledTimes(1)
    })
})
