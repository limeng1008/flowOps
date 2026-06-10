import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

import { Alert, Box, Button, Chip, Divider, Grid, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconClipboardText, IconCopy, IconRefresh, IconUpload } from '@tabler/icons-react'

import licenseApi from '@/api/license'
import useApi from '@/hooks/useApi'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import { useError } from '@/store/context/ErrorContext'
import { StyledButton } from '@/ui-component/button/StyledButton'
import MainCard from '@/ui-component/cards/MainCard'

const statusColors = {
    active: 'success',
    grace: 'warning',
    expired: 'error',
    invalid: 'error',
    missing: 'default'
}

const LicenseManagement = () => {
    const { t, i18n } = useTranslation()
    const theme = useTheme()
    const { handleError } = useError()
    const fileInputRef = useRef(null)
    const dateLocale = i18n.resolvedLanguage?.startsWith('zh') || i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US'

    const [licenseText, setLicenseText] = useState('')
    const [copied, setCopied] = useState(false)
    const [imported, setImported] = useState(false)

    const getStatusApi = useApi(licenseApi.getStatus)
    const getFingerprintApi = useApi(licenseApi.getFingerprint)
    const importLicenseApi = useApi(licenseApi.importLicense)

    const license = importLicenseApi.data || getStatusApi.data
    const fingerprint = getFingerprintApi.data?.fingerprint || license?.currentFingerprint
    const features = useMemo(() => license?.features || [], [license?.features])
    const isImportDisabled = importLicenseApi.loading || !licenseText.trim()

    const reload = () => {
        getStatusApi.request()
        getFingerprintApi.request()
    }

    useEffect(() => {
        reload()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (importLicenseApi.data) {
            setImported(true)
            setLicenseText('')
            getStatusApi.request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importLicenseApi.data])

    const formatDate = (value) => (value ? new Date(value).toLocaleDateString(dateLocale) : '-')
    const formatQuota = (value) => {
        if (value === undefined || value === null) return '-'
        return value === -1 ? t('pages.account.unlimited') : Number(value || 0).toLocaleString()
    }
    const statusLabel = (value) => t(`pages.license.status.${value || 'missing'}`)

    const importLicense = () => {
        setImported(false)
        importLicenseApi.request({ license: licenseText })
    }

    const copyFingerprint = async () => {
        if (!fingerprint) return
        try {
            await navigator.clipboard.writeText(fingerprint)
            setCopied(true)
        } catch (error) {
            handleError(error)
        }
    }

    const handleFile = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        setLicenseText(await file.text())
        event.target.value = ''
    }

    return (
        <MainCard>
            <Stack sx={{ gap: 3 }}>
                <ViewHeader title={t('pages.license.title')}>
                    <StyledButton variant='outlined' startIcon={<IconRefresh />} onClick={reload}>
                        {t('common.refresh')}
                    </StyledButton>
                </ViewHeader>

                {imported && <Alert severity='success'>{t('pages.license.imported')}</Alert>}
                {license?.readOnly && <Alert severity='warning'>{t('pages.license.readOnlyGrace')}</Alert>}
                {license?.reason && <Alert severity='error'>{t(`pages.license.reason.${license.reason}`, license.reason)}</Alert>}

                <Grid container spacing={2}>
                    <Grid item xs={12} lg={7}>
                        <Paper sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 1, p: 2 }}>
                            <Stack sx={{ gap: 2 }}>
                                <Stack
                                    direction='row'
                                    sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}
                                >
                                    <Box>
                                        <Typography variant='h4'>{t('pages.license.currentLicense')}</Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            {license?.customer || t('pages.license.noCustomer')}
                                        </Typography>
                                    </Box>
                                    {getStatusApi.loading ? (
                                        <Skeleton width={96} height={32} />
                                    ) : (
                                        <Chip color={statusColors[license?.status] || 'default'} label={statusLabel(license?.status)} />
                                    )}
                                </Stack>

                                <Divider />

                                <Grid container spacing={2}>
                                    <Grid item xs={6} md={4}>
                                        <Metric label={t('pages.license.licenseId')} value={license?.licenseId || '-'} />
                                    </Grid>
                                    <Grid item xs={6} md={4}>
                                        <Metric label={t('pages.license.tier')} value={license?.tier || '-'} />
                                    </Grid>
                                    <Grid item xs={6} md={4}>
                                        <Metric label={t('pages.license.expireAt')} value={formatDate(license?.expireAt)} />
                                    </Grid>
                                    <Grid item xs={6} md={4}>
                                        <Metric label={t('pages.license.seats')} value={formatQuota(license?.seats)} />
                                    </Grid>
                                    <Grid item xs={6} md={4}>
                                        <Metric label={t('pages.license.concurrency')} value={formatQuota(license?.concurrency)} />
                                    </Grid>
                                    <Grid item xs={6} md={4}>
                                        <Metric label={t('pages.license.graceDaysRemaining')} value={license?.graceDaysRemaining ?? '-'} />
                                    </Grid>
                                </Grid>

                                <Divider />

                                <Stack sx={{ gap: 1 }}>
                                    <Typography variant='subtitle1'>{t('pages.license.modules')}</Typography>
                                    <Stack direction='row' sx={{ gap: 1, flexWrap: 'wrap' }}>
                                        {features.length ? (
                                            features.map((feature) => <Chip key={feature} size='small' label={feature} />)
                                        ) : (
                                            <Typography variant='body2' color='text.secondary'>
                                                {t('pages.license.noModules')}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Stack>

                                <Divider />

                                <Stack sx={{ gap: 1 }}>
                                    <Typography variant='subtitle1'>{t('pages.license.machineFingerprint')}</Typography>
                                    <TextField value={fingerprint || ''} fullWidth multiline minRows={2} InputProps={{ readOnly: true }} />
                                    <Box>
                                        <Button
                                            variant='outlined'
                                            startIcon={<IconCopy />}
                                            onClick={copyFingerprint}
                                            disabled={!fingerprint}
                                        >
                                            {copied ? t('pages.license.copied') : t('pages.license.copyFingerprint')}
                                        </Button>
                                    </Box>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <Paper sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 1, p: 2 }}>
                            <Stack sx={{ gap: 2 }}>
                                <Stack direction='row' sx={{ alignItems: 'center', gap: 1 }}>
                                    <IconClipboardText size={22} />
                                    <Typography variant='h4'>{t('pages.license.importLicense')}</Typography>
                                </Stack>
                                <TextField
                                    label={t('pages.license.licenseText')}
                                    value={licenseText}
                                    onChange={(event) => setLicenseText(event.target.value)}
                                    fullWidth
                                    multiline
                                    minRows={10}
                                />
                                <input ref={fileInputRef} type='file' accept='.lic,.txt,.json' hidden onChange={handleFile} />
                                <Stack direction='row' sx={{ gap: 1, flexWrap: 'wrap' }}>
                                    <Button variant='outlined' startIcon={<IconUpload />} onClick={() => fileInputRef.current?.click()}>
                                        {t('pages.license.uploadFile')}
                                    </Button>
                                    <StyledButton variant='contained' onClick={importLicense} disabled={isImportDisabled}>
                                        {importLicenseApi.loading ? t('pages.license.activating') : t('pages.license.activate')}
                                    </StyledButton>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Stack>
        </MainCard>
    )
}

const Metric = ({ label, value }) => (
    <Stack sx={{ gap: 0.5 }}>
        <Typography variant='caption' color='text.secondary'>
            {label}
        </Typography>
        <Typography variant='subtitle1' sx={{ wordBreak: 'break-word' }}>
            {value}
        </Typography>
    </Stack>
)

Metric.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
}

export default LicenseManagement
