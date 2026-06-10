import express from 'express'
import licenseController from '../../controllers/license'

const router = express.Router()

router.get('/status', licenseController.getStatus)
router.get('/fingerprint', licenseController.getFingerprint)
router.post('/import', licenseController.importLicense)

export default router
