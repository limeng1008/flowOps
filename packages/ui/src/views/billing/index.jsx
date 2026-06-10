import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { QRCodeSVG } from 'qrcode.react'
import { IconCopy, IconCreditCard, IconExternalLink, IconLicense, IconRefresh, IconShieldCheck, IconSparkles } from '@tabler/icons-react'

import billingApi from '@/api/billing'
import useApi from '@/hooks/useApi'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import { useConfig } from '@/store/context/ConfigContext'
import { useError } from '@/store/context/ErrorContext'
import { StyledButton } from '@/ui-component/button/StyledButton'
import MainCard from '@/ui-component/cards/MainCard'

import {
    buildResourceUsageRows,
    getEntitlementExpiryState,
    getPrimaryBillingAction,
    isCloudBillingEdition,
    resolveFlowOpsEdition
} from './billingCenter'

const formatDate = (value, dateLocale) => (value ? new Date(value).toLocaleDateString(dateLocale) : '-')

const BillingCenter = () => {
    const { t, i18n } = useTranslation()
    const theme = useTheme()
    const navigate = useNavigate()
    const { config } = useConfig()
    const { handleError } = useError()
    const dateLocale = i18n.resolvedLanguage?.startsWith('zh') || i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US'

    const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
    const [paymentForm, setPaymentForm] = useState({ planCode: 'pro', provider: 'alipay' })
    const [paymentOrder, setPaymentOrder] = useState(null)
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [paymentCopied, setPaymentCopied] = useState(false)

    const getOverviewApi = useApi(billingApi.getMyBillingOverview)

    const overview = getOverviewApi.data || {}
    const entitlement = overview.entitlement || {}
    const plans = useMemo(() => overview.plans || [], [overview.plans])
    const edition = resolveFlowOpsEdition(config, overview)
    const isCloudEdition = isCloudBillingEdition(config, overview)
    const primaryAction = getPrimaryBillingAction(edition)
    const expiryState = getEntitlementExpiryState(entitlement)
    const usageRows = buildResourceUsageRows(overview.resourceUsage, entitlement.creditsTotal)
    const usageActionLabels = useMemo(
        () => ({
            prediction: t('pages.billingCenter.usageActions.prediction'),
            retrieval: t('pages.billingCenter.usageActions.retrieval'),
            export: t('pages.billingCenter.usageActions.export'),
            workflow: t('pages.billingCenter.usageActions.workflow'),
            embedding: t('pages.billingCenter.usageActions.embedding'),
            other: t('pages.billingCenter.usageActions.other')
        }),
        [t]
    )
    const paymentUrl = paymentOrder?.qrCodeUrl || paymentOrder?.payUrl || ''
    const isPaymentTerminal = ['paid', 'failed', 'closed'].includes(paymentOrder?.status)
    const paidPlanOptions = useMemo(
        () =>
            plans
                .filter((plan) => plan.tier !== 'free' && plan.sourceOptions?.includes('subscription'))
                .map((plan) => ({ value: plan.tier, label: t(`pages.entitlement.tiers.${plan.tier}`) })),
        [plans, t]
    )

    const formatQuota = (value, enterpriseCustom = false) => {
        if (value === -1) return enterpriseCustom ? t('pages.billingCenter.custom') : t('pages.billingCenter.unlimited')
        if (value === undefined || value === null) return '-'
        return Number(value || 0).toLocaleString()
    }
    const formatPrivateDeployment = (value) => {
        if (value === 'optional') return t('pages.billingCenter.optional')
        if (value === 'available') return t('pages.billingCenter.available')
        return t('pages.billingCenter.notAvailable')
    }
    const formatSource = (source) => t(`pages.billingCenter.sources.${source}`, source)
    const creditPercent =
        entitlement.creditsTotal > 0 ? Math.min((Number(entitlement.creditsBalance || 0) / entitlement.creditsTotal) * 100, 100) : 0
    const usedCredits = overview.resourceUsage?.totalCredits || 0
    const usedPercent = entitlement.creditsTotal > 0 ? Math.min((usedCredits / entitlement.creditsTotal) * 100, 100) : 0
    const lowCredits = entitlement.creditsTotal > 0 && entitlement.creditsBalance / entitlement.creditsTotal <= 0.2

    const reload = () => getOverviewApi.request()

    useEffect(() => {
        reload()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!paymentForm.planCode && paidPlanOptions.length) {
            setPaymentForm((prev) => ({ ...prev, planCode: paidPlanOptions[0].value }))
        }
    }, [paidPlanOptions, paymentForm.planCode])

    useEffect(() => {
        if (!openPaymentDialog || !paymentOrder?.orderNo || isPaymentTerminal || !isCloudEdition) return undefined
        const interval = setInterval(async () => {
            try {
                const response = await billingApi.getPaymentOrder(paymentOrder.orderNo)
                setPaymentOrder((previous) => ({ ...previous, ...response.data }))
                if (response.data?.status === 'paid') reload()
            } catch (error) {
                handleError(error)
            }
        }, 3000)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openPaymentDialog, paymentOrder?.orderNo, paymentOrder?.status, isPaymentTerminal, isCloudEdition])

    const openPayment = () => {
        if (!isCloudEdition) return
        setPaymentOrder(null)
        setPaymentCopied(false)
        setPaymentForm((prev) => ({ ...prev, planCode: prev.planCode || paidPlanOptions[0]?.value || 'pro' }))
        setOpenPaymentDialog(true)
    }

    const startPayment = async () => {
        if (!isCloudEdition) return
        setPaymentLoading(true)
        setPaymentCopied(false)
        try {
            const response = await billingApi.createPaymentOrder(paymentForm)
            setPaymentOrder(response.data)
        } catch (error) {
            handleError(error)
        } finally {
            setPaymentLoading(false)
        }
    }

    const copyPaymentUrl = async () => {
        if (!paymentUrl) return
        await navigator.clipboard.writeText(paymentUrl)
        setPaymentCopied(true)
    }

    return (
        <MainCard>
            <Stack sx={{ gap: 3 }}>
                <ViewHeader title={t('pages.billingCenter.title')}>
                    <StyledButton variant='outlined' startIcon={<IconRefresh />} onClick={reload}>
                        {t('common.refresh')}
                    </StyledButton>
                </ViewHeader>
                <Typography variant='body2' color='text.secondary'>
                    {t('pages.billingCenter.subtitle')}
                </Typography>

                {lowCredits && <Alert severity='warning'>{t('pages.billingCenter.lowCreditsWarning')}</Alert>}
                {expiryState === 'grace' && <Alert severity='warning'>{t('pages.billingCenter.graceWarning')}</Alert>}
                {expiryState === 'expiringSoon' && <Alert severity='info'>{t('pages.billingCenter.expiringSoonWarning')}</Alert>}
                {primaryAction.showOnlinePayment ? (
                    <Alert severity='info'>{t('pages.billingCenter.cloudRechargeHint')}</Alert>
                ) : (
                    <Alert severity='info'>{t('pages.billingCenter.privateNoOnlineRecharge')}</Alert>
                )}

                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <MetricPanel
                            title={t('pages.billingCenter.currentPlan')}
                            icon={<IconShieldCheck size={22} />}
                            loading={getOverviewApi.loading}
                            value={t(`pages.entitlement.tiers.${entitlement.tier || 'free'}`)}
                            caption={
                                entitlement.expireAt
                                    ? t('pages.account.currentPeriodEnd', { date: formatDate(entitlement.expireAt, dateLocale) })
                                    : t('pages.billing.noExpiry')
                            }
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <MetricPanel
                            title={t('pages.billingCenter.resourceBalance')}
                            icon={<IconSparkles size={22} />}
                            loading={getOverviewApi.loading}
                            value={`${formatQuota(entitlement.creditsBalance)} / ${formatQuota(entitlement.creditsTotal)}`}
                            progress={creditPercent}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <MetricPanel
                            title={t('pages.billingCenter.monthlyUsage')}
                            icon={<IconCreditCard size={22} />}
                            loading={getOverviewApi.loading}
                            value={formatQuota(usedCredits)}
                            caption={overview.resourceUsage?.period || overview.period}
                            progress={usedPercent}
                        />
                    </Grid>
                </Grid>

                <Paper sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 1, p: 2 }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        sx={{ gap: 2, alignItems: { md: 'center' }, justifyContent: 'space-between' }}
                    >
                        <Box>
                            <Typography variant='h4'>{t('pages.billingCenter.resourceBalance')}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                {primaryAction.showOnlinePayment
                                    ? t('pages.billingCenter.cloudRechargeHint')
                                    : t('pages.billingCenter.privateNoOnlineRecharge')}
                            </Typography>
                        </Box>
                        {primaryAction.showOnlinePayment ? (
                            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
                                <StyledButton variant='contained' startIcon={<IconCreditCard />} onClick={openPayment}>
                                    {t('pages.billingCenter.recharge')}
                                </StyledButton>
                                <Button variant='outlined' startIcon={<IconSparkles />} onClick={openPayment}>
                                    {t('pages.billingCenter.upgrade')}
                                </Button>
                            </Stack>
                        ) : (
                            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
                                <StyledButton variant='contained' startIcon={<IconLicense />} onClick={() => navigate('/license')}>
                                    {t('pages.billingCenter.importLicense')}
                                </StyledButton>
                                <Button variant='outlined' href='mailto:sales@flowops.local'>
                                    {t('pages.billingCenter.contactSales')}
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </Paper>

                <Paper sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 1, p: 2 }}>
                    <Stack sx={{ gap: 2 }}>
                        <Typography variant='h4'>{t('pages.billingCenter.monthlyUsage')}</Typography>
                        {getOverviewApi.loading ? (
                            <>
                                <Skeleton variant='rounded' height={48} />
                                <Skeleton variant='rounded' height={48} />
                                <Skeleton variant='rounded' height={48} />
                            </>
                        ) : usageRows.length ? (
                            usageRows.map((row) => (
                                <Box key={row.action}>
                                    <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.75, gap: 2 }}>
                                        <Typography variant='body2'>{usageActionLabels[row.action] || t(row.labelKey)}</Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            {formatQuota(row.credits)}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress variant='determinate' value={row.percent} sx={{ height: 8, borderRadius: 1 }} />
                                </Box>
                            ))
                        ) : (
                            <Typography variant='body2' color='text.secondary'>
                                {t('pages.billingCenter.noUsage')}
                            </Typography>
                        )}
                    </Stack>
                </Paper>

                <Stack sx={{ gap: 1 }}>
                    <Typography variant='h4'>{t('pages.billingCenter.planComparison')}</Typography>
                    <Grid container spacing={2}>
                        {getOverviewApi.loading && !plans.length
                            ? [1, 2, 3, 4].map((item) => (
                                  <Grid item xs={12} md={6} lg={3} key={item}>
                                      <Skeleton variant='rounded' height={280} />
                                  </Grid>
                              ))
                            : plans.map((plan) => {
                                  const isCurrent = plan.tier === entitlement.tier
                                  return (
                                      <Grid item xs={12} md={6} lg={3} key={plan.tier}>
                                          <Paper
                                              sx={{
                                                  height: '100%',
                                                  border: 1,
                                                  borderColor: isCurrent ? 'primary.main' : theme.palette.grey[900] + 25,
                                                  borderRadius: 1,
                                                  p: 2
                                              }}
                                          >
                                              <Stack sx={{ gap: 1.5, height: '100%' }}>
                                                  <Stack
                                                      direction='row'
                                                      sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
                                                  >
                                                      <Typography variant='h4'>{t(`pages.entitlement.tiers.${plan.tier}`)}</Typography>
                                                      {isCurrent && (
                                                          <Chip color='primary' size='small' label={t('pages.billingCenter.currentTier')} />
                                                      )}
                                                  </Stack>
                                                  <PlanLine
                                                      label={t('pages.account.seats')}
                                                      value={formatQuota(plan.seats, plan.tier === 'enterprise')}
                                                  />
                                                  <PlanLine
                                                      label={t('pages.billingCenter.workspaces')}
                                                      value={formatQuota(plan.spaces, plan.tier === 'enterprise')}
                                                  />
                                                  <PlanLine
                                                      label={t('pages.billingCenter.includedCredits')}
                                                      value={formatQuota(plan.creditsTotal, plan.tier === 'enterprise')}
                                                  />
                                                  <PlanLine
                                                      label={t('pages.billingCenter.concurrency')}
                                                      value={formatQuota(plan.concurrency)}
                                                  />
                                                  <PlanLine
                                                      label={t('pages.billingCenter.privateDeployment')}
                                                      value={formatPrivateDeployment(plan.privateDeployment)}
                                                  />
                                                  <PlanLine
                                                      label={t('pages.billingCenter.source')}
                                                      value={(plan.sourceOptions || []).map(formatSource).join(' / ')}
                                                  />
                                                  <Stack direction='row' sx={{ gap: 0.75, flexWrap: 'wrap', mt: 'auto' }}>
                                                      {(plan.features || []).slice(0, 4).map((feature) => (
                                                          <Chip key={feature} size='small' label={feature} />
                                                      ))}
                                                  </Stack>
                                              </Stack>
                                          </Paper>
                                      </Grid>
                                  )
                              })}
                    </Grid>
                </Stack>
            </Stack>

            {openPaymentDialog && isCloudEdition && (
                <Dialog open={openPaymentDialog && isCloudEdition} onClose={() => setOpenPaymentDialog(false)} maxWidth='sm' fullWidth>
                    <DialogTitle>{t('pages.billing.purchasePlan')}</DialogTitle>
                    <DialogContent>
                        <Stack sx={{ gap: 2, mt: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('pages.billing.plan')}</InputLabel>
                                <Select
                                    label={t('pages.billing.plan')}
                                    value={paymentForm.planCode}
                                    onChange={(event) => setPaymentForm({ ...paymentForm, planCode: event.target.value })}
                                >
                                    {(paidPlanOptions.length
                                        ? paidPlanOptions
                                        : [{ value: 'pro', label: t('pages.entitlement.tiers.pro') }]
                                    ).map((plan) => (
                                        <MenuItem key={plan.value} value={plan.value}>
                                            {plan.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>{t('pages.billing.provider')}</InputLabel>
                                <Select
                                    label={t('pages.billing.provider')}
                                    value={paymentForm.provider}
                                    onChange={(event) => setPaymentForm({ ...paymentForm, provider: event.target.value })}
                                >
                                    <MenuItem value='alipay'>{t('pages.billing.alipay')}</MenuItem>
                                    <MenuItem value='wechat'>{t('pages.billing.wechat')}</MenuItem>
                                </Select>
                            </FormControl>
                            <Button variant='contained' onClick={startPayment} disabled={!paymentForm.planCode || paymentLoading}>
                                {t('pages.billing.startPayment')}
                            </Button>
                            {paymentOrder && (
                                <Paper sx={{ p: 2, border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 1 }}>
                                    <Stack sx={{ gap: 2, alignItems: 'center' }}>
                                        <Stack
                                            direction='row'
                                            sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            <Typography variant='subtitle2'>{paymentOrder.orderNo}</Typography>
                                            <Chip size='small' label={t(`pages.billing.paymentStatus.${paymentOrder.status}`)} />
                                        </Stack>
                                        {paymentOrder.status === 'paid' && (
                                            <Alert severity='success'>{t('pages.billing.paymentSuccess')}</Alert>
                                        )}
                                        {paymentOrder.status === 'closed' && (
                                            <Alert severity='warning'>{t('pages.billing.paymentClosed')}</Alert>
                                        )}
                                        {paymentOrder.status === 'failed' && (
                                            <Alert severity='error'>{t('pages.billing.paymentFailed')}</Alert>
                                        )}
                                        {paymentUrl && paymentOrder.status === 'pending' && (
                                            <>
                                                <Box
                                                    sx={{
                                                        width: 208,
                                                        height: 208,
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        bgcolor: 'background.paper',
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <QRCodeSVG value={paymentUrl} size={180} includeMargin />
                                                </Box>
                                                <TextField
                                                    label={t('pages.billing.payLink')}
                                                    value={paymentUrl}
                                                    fullWidth
                                                    InputProps={{ readOnly: true }}
                                                />
                                                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, width: '100%' }}>
                                                    <Button
                                                        variant='outlined'
                                                        startIcon={<IconExternalLink />}
                                                        onClick={() => window.open(paymentUrl, '_blank', 'noopener,noreferrer')}
                                                        fullWidth
                                                    >
                                                        {t('pages.billing.openPayLink')}
                                                    </Button>
                                                    <Button variant='outlined' startIcon={<IconCopy />} onClick={copyPaymentUrl} fullWidth>
                                                        {paymentCopied ? t('pages.billing.copied') : t('pages.billing.copyPayLink')}
                                                    </Button>
                                                </Stack>
                                            </>
                                        )}
                                        {paymentOrder.expireAt && (
                                            <Typography variant='caption' color='text.secondary'>
                                                {t('pages.billing.paymentExpireAt', {
                                                    date: new Date(paymentOrder.expireAt).toLocaleString(dateLocale)
                                                })}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Paper>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenPaymentDialog(false)}>{t('common.close')}</Button>
                    </DialogActions>
                </Dialog>
            )}
        </MainCard>
    )
}

const MetricPanel = ({ title, icon, loading, value, caption, progress }) => (
    <Paper sx={{ border: 1, borderColor: (theme) => theme.palette.grey[900] + 25, borderRadius: 1, p: 2, height: '100%' }}>
        <Stack sx={{ gap: 1.5 }}>
            <Stack direction='row' sx={{ alignItems: 'center', gap: 1 }}>
                {icon}
                <Typography variant='subtitle2' color='text.secondary'>
                    {title}
                </Typography>
            </Stack>
            {loading ? <Skeleton width='70%' height={36} /> : <Typography variant='h3'>{value}</Typography>}
            {caption && (
                <Typography variant='body2' color='text.secondary'>
                    {caption}
                </Typography>
            )}
            {progress !== undefined && <LinearProgress variant='determinate' value={progress} sx={{ height: 8, borderRadius: 1 }} />}
        </Stack>
    </Paper>
)

MetricPanel.propTypes = {
    title: PropTypes.string,
    icon: PropTypes.node,
    loading: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    caption: PropTypes.string,
    progress: PropTypes.number
}

const PlanLine = ({ label, value }) => (
    <Stack direction='row' sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Typography variant='body2' color='text.secondary'>
            {label}
        </Typography>
        <Typography variant='body2' sx={{ textAlign: 'right' }}>
            {value}
        </Typography>
    </Stack>
)

PlanLine.propTypes = {
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}

export default BillingCenter
