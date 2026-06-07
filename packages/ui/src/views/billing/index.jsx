import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

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
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import { QRCodeSVG } from 'qrcode.react'
import { IconCopy, IconCreditCard, IconExternalLink, IconPlus, IconRefresh, IconSettings, IconX } from '@tabler/icons-react'

import billingApi from '@/api/billing'
import useApi from '@/hooks/useApi'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import { useError } from '@/store/context/ErrorContext'
import { StyledButton } from '@/ui-component/button/StyledButton'
import MainCard from '@/ui-component/cards/MainCard'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.palette.grey[900] + 25,
    whiteSpace: 'nowrap'
}))

const StyledTableRow = styled(TableRow)(() => ({
    '&:last-child td, &:last-child th': { border: 0 }
}))

const defaultPlanForm = {
    code: '',
    name: '',
    monthlyPriceCents: 0,
    tokens: 100000,
    bots: 3,
    seats: 3
}

const defaultSubscriptionForm = {
    organizationId: '',
    planId: '',
    currentPeriodEnd: '',
    tokens: '',
    bots: '',
    seats: ''
}

const BillingAdmin = () => {
    const { t, i18n } = useTranslation()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const currentUser = useSelector((state) => state.auth.user)
    const { handleError } = useError()
    const dateLocale = i18n.resolvedLanguage?.startsWith('zh') || i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US'

    const [plans, setPlans] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [openPlanDialog, setOpenPlanDialog] = useState(false)
    const [openSubscriptionDialog, setOpenSubscriptionDialog] = useState(false)
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
    const [planForm, setPlanForm] = useState(defaultPlanForm)
    const [subscriptionForm, setSubscriptionForm] = useState(defaultSubscriptionForm)
    const [paymentForm, setPaymentForm] = useState({ planCode: '', provider: 'alipay' })
    const [paymentOrder, setPaymentOrder] = useState(null)
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [paymentCopied, setPaymentCopied] = useState(false)

    const getPlansApi = useApi(billingApi.getPlans)
    const getOrganizationsApi = useApi(billingApi.getOrganizations)
    const upsertPlanApi = useApi(billingApi.upsertPlan)
    const setSubscriptionApi = useApi(billingApi.setOrganizationSubscription)
    const cancelSubscriptionApi = useApi(billingApi.cancelOrganizationSubscription)

    const isLoading = getPlansApi.loading || getOrganizationsApi.loading

    const planOptions = useMemo(() => plans.map((plan) => ({ value: plan.id, label: `${plan.name} (${plan.code})` })), [plans])
    const paymentPlanOptions = useMemo(
        () => plans.filter((plan) => plan.isActive !== false).map((plan) => ({ value: plan.code, label: `${plan.name} (${plan.code})` })),
        [plans]
    )
    const paymentUrl = paymentOrder?.qrCodeUrl || paymentOrder?.payUrl || ''
    const isPaymentTerminal = ['paid', 'failed', 'closed'].includes(paymentOrder?.status)

    const reload = () => {
        getPlansApi.request()
        getOrganizationsApi.request()
    }

    useEffect(() => {
        reload()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getPlansApi.data) setPlans(getPlansApi.data)
    }, [getPlansApi.data])

    useEffect(() => {
        if (!paymentForm.planCode && paymentPlanOptions.length) {
            setPaymentForm((prev) => ({ ...prev, planCode: paymentPlanOptions[0].value }))
        }
    }, [paymentForm.planCode, paymentPlanOptions])

    useEffect(() => {
        if (getOrganizationsApi.data) setOrganizations(getOrganizationsApi.data)
    }, [getOrganizationsApi.data])

    useEffect(() => {
        if (upsertPlanApi.data || setSubscriptionApi.data || cancelSubscriptionApi.data) {
            setOpenPlanDialog(false)
            setOpenSubscriptionDialog(false)
            setPlanForm(defaultPlanForm)
            setSubscriptionForm(defaultSubscriptionForm)
            reload()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [upsertPlanApi.data, setSubscriptionApi.data, cancelSubscriptionApi.data])

    useEffect(() => {
        if (!openPaymentDialog || !paymentOrder?.orderNo || isPaymentTerminal) return undefined
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
    }, [openPaymentDialog, paymentOrder?.orderNo, paymentOrder?.status, isPaymentTerminal])

    const formatQuota = (value) => (value === -1 ? t('pages.account.unlimited') : Number(value || 0).toLocaleString())
    const formatDate = (value) => (value ? new Date(value).toLocaleDateString(dateLocale) : t('pages.billing.noExpiry'))
    const usageText = (org, key) => `${formatQuota(org.usage?.[key])} / ${formatQuota(org.quotas?.[key])}`
    const usageColor = (org, key) => (org.exceeded?.[key] ? theme.palette.error.main : 'text.secondary')

    const openSubscription = (org) => {
        setSubscriptionForm({
            organizationId: org.organizationId,
            planId: org.subscription?.planId || plans.find((plan) => plan.code === org.plan?.code)?.id || '',
            currentPeriodEnd: org.subscription?.currentPeriodEnd ? org.subscription.currentPeriodEnd.slice(0, 10) : '',
            tokens: '',
            bots: '',
            seats: ''
        })
        setOpenSubscriptionDialog(true)
    }

    const savePlan = () => {
        upsertPlanApi.request({
            code: planForm.code,
            name: planForm.name,
            monthlyPriceCents: Number(planForm.monthlyPriceCents || 0),
            quotas: {
                tokens: Number(planForm.tokens),
                bots: Number(planForm.bots),
                seats: Number(planForm.seats)
            }
        })
    }

    const saveSubscription = () => {
        const quotaOverrides = {}
        ;['tokens', 'bots', 'seats'].forEach((key) => {
            if (subscriptionForm[key] !== '') quotaOverrides[key] = Number(subscriptionForm[key])
        })
        setSubscriptionApi.request({
            organizationId: subscriptionForm.organizationId,
            planId: subscriptionForm.planId,
            currentPeriodEnd: subscriptionForm.currentPeriodEnd || null,
            quotaOverrides: Object.keys(quotaOverrides).length ? quotaOverrides : null
        })
    }

    const cancelSubscription = (organizationId) => {
        cancelSubscriptionApi.request({ organizationId })
    }

    const openPayment = () => {
        setPaymentOrder(null)
        setPaymentCopied(false)
        setPaymentForm((prev) => ({ ...prev, planCode: prev.planCode || paymentPlanOptions[0]?.value || '' }))
        setOpenPaymentDialog(true)
    }

    const startPayment = async () => {
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
                <ViewHeader title={t('pages.billing.title')}>
                    <Stack direction='row' sx={{ gap: 1 }}>
                        <StyledButton variant='outlined' startIcon={<IconRefresh />} onClick={reload}>
                            {t('common.refresh')}
                        </StyledButton>
                        <StyledButton
                            variant='outlined'
                            startIcon={<IconCreditCard />}
                            onClick={openPayment}
                            disabled={!currentUser?.activeOrganizationId || !paymentPlanOptions.length}
                        >
                            {t('pages.billing.purchasePlan')}
                        </StyledButton>
                        <StyledButton variant='contained' startIcon={<IconPlus />} onClick={() => setOpenPlanDialog(true)}>
                            {t('pages.billing.addPlan')}
                        </StyledButton>
                    </Stack>
                </ViewHeader>
                <TableContainer
                    component={Paper}
                    sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2, overflowX: 'auto' }}
                >
                    <Table sx={{ minWidth: 960 }} aria-label='billing organizations table'>
                        <TableHead
                            sx={{ backgroundColor: customization.isDarkMode ? theme.palette.common.black : theme.palette.grey[100] }}
                        >
                            <TableRow>
                                <StyledTableCell>{t('pages.billing.organization')}</StyledTableCell>
                                <StyledTableCell>{t('pages.billing.plan')}</StyledTableCell>
                                <StyledTableCell>{t('pages.billing.tokens')}</StyledTableCell>
                                <StyledTableCell>{t('pages.billing.bots')}</StyledTableCell>
                                <StyledTableCell>{t('pages.billing.seats')}</StyledTableCell>
                                <StyledTableCell>{t('pages.billing.periodEnd')}</StyledTableCell>
                                <StyledTableCell align='right'>{t('common.actions')}</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3].map((item) => (
                                    <StyledTableRow key={item}>
                                        {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                                            <StyledTableCell key={cell}>
                                                <Skeleton variant='text' />
                                            </StyledTableCell>
                                        ))}
                                    </StyledTableRow>
                                ))
                            ) : organizations.length ? (
                                organizations.map((org) => (
                                    <StyledTableRow key={org.organizationId} hover>
                                        <StyledTableCell>{org.organizationName}</StyledTableCell>
                                        <StyledTableCell>{org.plan?.name || t('pages.account.notActivated')}</StyledTableCell>
                                        <StyledTableCell>
                                            <Typography variant='body2' color={usageColor(org, 'tokens')}>
                                                {usageText(org, 'tokens')}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography variant='body2' color={usageColor(org, 'bots')}>
                                                {usageText(org, 'bots')}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography variant='body2' color={usageColor(org, 'seats')}>
                                                {usageText(org, 'seats')}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>{formatDate(org.subscription?.currentPeriodEnd)}</StyledTableCell>
                                        <StyledTableCell align='right'>
                                            <Stack direction='row' sx={{ gap: 1, justifyContent: 'flex-end' }}>
                                                <Button size='small' startIcon={<IconSettings />} onClick={() => openSubscription(org)}>
                                                    {t('pages.billing.configure')}
                                                </Button>
                                                <Button
                                                    size='small'
                                                    color='error'
                                                    startIcon={<IconX />}
                                                    onClick={() => cancelSubscription(org.organizationId)}
                                                >
                                                    {t('pages.billing.deactivate')}
                                                </Button>
                                            </Stack>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))
                            ) : (
                                <StyledTableRow>
                                    <StyledTableCell colSpan={7} align='center'>
                                        {t('pages.billing.noOrganizations')}
                                    </StyledTableCell>
                                </StyledTableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
            <Dialog open={openPlanDialog} onClose={() => setOpenPlanDialog(false)} maxWidth='sm' fullWidth>
                <DialogTitle>{t('pages.billing.addPlan')}</DialogTitle>
                <DialogContent>
                    <Stack sx={{ gap: 2, mt: 1 }}>
                        <TextField
                            label={t('pages.billing.planCode')}
                            value={planForm.code}
                            onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
                        />
                        <TextField
                            label={t('pages.billing.planName')}
                            value={planForm.name}
                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        />
                        <TextField
                            label={t('pages.billing.monthlyPriceCents')}
                            type='number'
                            value={planForm.monthlyPriceCents}
                            onChange={(e) => setPlanForm({ ...planForm, monthlyPriceCents: e.target.value })}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
                            <TextField
                                label={t('pages.billing.tokens')}
                                type='number'
                                value={planForm.tokens}
                                onChange={(e) => setPlanForm({ ...planForm, tokens: e.target.value })}
                            />
                            <TextField
                                label={t('pages.billing.bots')}
                                type='number'
                                value={planForm.bots}
                                onChange={(e) => setPlanForm({ ...planForm, bots: e.target.value })}
                            />
                            <TextField
                                label={t('pages.billing.seats')}
                                type='number'
                                value={planForm.seats}
                                onChange={(e) => setPlanForm({ ...planForm, seats: e.target.value })}
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPlanDialog(false)}>{t('common.cancel')}</Button>
                    <Button variant='contained' onClick={savePlan} disabled={!planForm.code || !planForm.name || upsertPlanApi.loading}>
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openSubscriptionDialog} onClose={() => setOpenSubscriptionDialog(false)} maxWidth='sm' fullWidth>
                <DialogTitle>{t('pages.billing.configureSubscription')}</DialogTitle>
                <DialogContent>
                    <Stack sx={{ gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>{t('pages.billing.plan')}</InputLabel>
                            <Select
                                label={t('pages.billing.plan')}
                                value={subscriptionForm.planId}
                                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, planId: e.target.value })}
                            >
                                {planOptions.map((plan) => (
                                    <MenuItem key={plan.value} value={plan.value}>
                                        {plan.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('pages.billing.periodEnd')}
                            type='date'
                            value={subscriptionForm.currentPeriodEnd}
                            onChange={(e) => setSubscriptionForm({ ...subscriptionForm, currentPeriodEnd: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                            <TextField
                                label={t('pages.billing.tokensOverride')}
                                type='number'
                                value={subscriptionForm.tokens}
                                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, tokens: e.target.value })}
                            />
                            <TextField
                                label={t('pages.billing.botsOverride')}
                                type='number'
                                value={subscriptionForm.bots}
                                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, bots: e.target.value })}
                            />
                            <TextField
                                label={t('pages.billing.seatsOverride')}
                                type='number'
                                value={subscriptionForm.seats}
                                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, seats: e.target.value })}
                            />
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSubscriptionDialog(false)}>{t('common.cancel')}</Button>
                    <Button
                        variant='contained'
                        onClick={saveSubscription}
                        disabled={!subscriptionForm.planId || setSubscriptionApi.loading}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth='sm' fullWidth>
                <DialogTitle>{t('pages.billing.purchasePlan')}</DialogTitle>
                <DialogContent>
                    <Stack sx={{ gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>{t('pages.billing.plan')}</InputLabel>
                            <Select
                                label={t('pages.billing.plan')}
                                value={paymentForm.planCode}
                                onChange={(e) => setPaymentForm({ ...paymentForm, planCode: e.target.value })}
                            >
                                {paymentPlanOptions.map((plan) => (
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
                                onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                            >
                                <MenuItem value='alipay'>{t('pages.billing.alipay')}</MenuItem>
                                <MenuItem value='wechat'>{t('pages.billing.wechat')}</MenuItem>
                            </Select>
                        </FormControl>
                        <Button variant='contained' onClick={startPayment} disabled={!paymentForm.planCode || paymentLoading}>
                            {t('pages.billing.startPayment')}
                        </Button>
                        {paymentOrder && (
                            <Paper sx={{ p: 2, border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}>
                                <Stack sx={{ gap: 2, alignItems: 'center' }}>
                                    <Stack direction='row' sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant='subtitle2'>{paymentOrder.orderNo}</Typography>
                                        <Chip size='small' label={t(`pages.billing.paymentStatus.${paymentOrder.status}`)} />
                                    </Stack>
                                    {paymentOrder.status === 'paid' && (
                                        <Alert severity='success'>{t('pages.billing.paymentSuccess')}</Alert>
                                    )}
                                    {paymentOrder.status === 'closed' && (
                                        <Alert severity='warning'>{t('pages.billing.paymentClosed')}</Alert>
                                    )}
                                    {paymentOrder.status === 'failed' && <Alert severity='error'>{t('pages.billing.paymentFailed')}</Alert>}
                                    {paymentUrl && paymentOrder.status === 'pending' && (
                                        <>
                                            <Box
                                                sx={{
                                                    width: 208,
                                                    height: 208,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    bgcolor: 'background.paper',
                                                    borderRadius: 2
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
        </MainCard>
    )
}

export default BillingAdmin
