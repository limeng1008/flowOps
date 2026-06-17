import LicenseService, { LicenseVerificationResult } from '.'

const missingLicenseState: LicenseVerificationResult = {
    valid: false,
    status: 'missing',
    readOnly: false,
    reason: 'LICENSE_NOT_IMPORTED',
    features: [],
    machineFingerprint: [],
    currentFingerprint: ''
}

type LicenseStateListener = (state: LicenseVerificationResult) => void

let licenseState: LicenseVerificationResult = missingLicenseState
const listeners = new Set<LicenseStateListener>()

export const getLicenseState = (): LicenseVerificationResult => licenseState

export const setLicenseState = (state: LicenseVerificationResult): LicenseVerificationResult => {
    licenseState = state
    for (const listener of listeners) listener(state)
    return licenseState
}

export const refreshLicenseState = async (): Promise<LicenseVerificationResult> => setLicenseState(await LicenseService.getActiveLicense())

export const subscribeLicenseState = (listener: LicenseStateListener): (() => void) => {
    listeners.add(listener)
    listener(licenseState)
    return () => listeners.delete(listener)
}
