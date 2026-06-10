import client from '@/api/client'

const getStatus = () => client.get('/license/status')
const getFingerprint = () => client.get('/license/fingerprint')
const importLicense = (body) => client.post('/license/import', body)

export default {
    getStatus,
    getFingerprint,
    importLicense
}
