import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
    Box,
    Button,
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
import { IconPlus, IconRefresh, IconSettings, IconX } from '@tabler/icons-react'

import billingApi from '@/api/billing'
import useApi from '@/hooks/useApi'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
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
    const dateLocale = i18n.resolvedLanguage?.startsWith('zh') || i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US'

    const [plans, setPlans] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [openPlanDialog, setOpenPlanDialog] = useState(false)
    const [openSubscriptionDialog, setOpenSubscriptionDialog] = useState(false)
    const [planForm, setPlanForm] = useState(defaultPlanForm)
    const [subscriptionForm, setSubscriptionForm] = useState(defaultSubscriptionForm)

    const getPlansApi = useApi(billingApi.getPlans)
    const getOrganizationsApi = useApi(billingApi.getOrganizations)
    const upsertPlanApi = useApi(billingApi.upsertPlan)
    const setSubscriptionApi = useApi(billingApi.setOrganizationSubscription)
    const cancelSubscriptionApi = useApi(billingApi.cancelOrganizationSubscription)

    const isLoading = getPlansApi.loading || getOrganizationsApi.loading

    const planOptions = useMemo(() => plans.map((plan) => ({ value: plan.id, label: `${plan.name} (${plan.code})` })), [plans])

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

    return (
        <MainCard>
            <Stack sx={{ gap: 3 }}>
                <ViewHeader title={t('pages.billing.title')}>
                    <Stack direction='row' sx={{ gap: 1 }}>
                        <StyledButton variant='outlined' startIcon={<IconRefresh />} onClick={reload}>
                            {t('common.refresh')}
                        </StyledButton>
                        <StyledButton variant='contained' startIcon={<IconPlus />} onClick={() => setOpenPlanDialog(true)}>
                            {t('pages.billing.addPlan')}
                        </StyledButton>
                    </Stack>
                </ViewHeader>
                <Box
                    sx={{
                        border: 1,
                        borderColor: theme.palette.primary.main + 35,
                        borderRadius: 2,
                        px: 2,
                        py: 1.5,
                        backgroundColor: theme.palette.primary.main + 8
                    }}
                >
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {t('pages.billing.manualActivationNotice')}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                        {t('pages.billing.manualActivationDetail')}
                    </Typography>
                </Box>
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
        </MainCard>
    )
}

export default BillingAdmin
