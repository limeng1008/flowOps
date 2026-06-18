import PropTypes from 'prop-types'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import {
    Box,
    Button,
    Chip,
    Collapse,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    ListSubheader,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { IconChevronDown, IconChevronUp, IconDownload, IconFilter, IconRefresh } from '@tabler/icons-react'

import auditApi from '@/api/audit'
import ErrorBoundary from '@/ErrorBoundary'
import useApi from '@/hooks/useApi'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import { useError } from '@/store/context/ErrorContext'
import MainCard from '@/ui-component/cards/MainCard'
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'
import { StyledTableCell, StyledTableRow } from '@/ui-component/table/TableStyles'

import { AUDIT_ACTION_GROUPS, AUDIT_TARGET_TYPES, buildAuditParams, createAuditFilters, normalizeAuditMetadata } from './auditUtils'

const statusColors = { success: 'success', failure: 'error' }

const JsonValue = ({ label, value }) => (
    <Box sx={{ minWidth: 0 }}>
        <Typography variant='caption' color='text.secondary'>
            {label}
        </Typography>
        <Box
            component='pre'
            sx={{ m: 0, mt: 0.5, p: 1.5, overflow: 'auto', bgcolor: 'action.hover', borderRadius: 1, fontSize: 12, lineHeight: 1.5 }}
        >
            {JSON.stringify(value, null, 2)}
        </Box>
    </Box>
)

JsonValue.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any
}

export const AuditDetails = ({ row, t }) => {
    const metadata = normalizeAuditMetadata(row.metadata)
    const { before, after, ...rest } = metadata
    const hasRest = Object.keys(rest).length > 0

    return (
        <Stack sx={{ gap: 2, py: 1 }}>
            <Grid container spacing={2}>
                {before !== undefined && (
                    <Grid item xs={12} md={6}>
                        <JsonValue label={t('pages.audit.details.before')} value={before} />
                    </Grid>
                )}
                {after !== undefined && (
                    <Grid item xs={12} md={6}>
                        <JsonValue label={t('pages.audit.details.after')} value={after} />
                    </Grid>
                )}
                {hasRest && (
                    <Grid item xs={12}>
                        <JsonValue label={t('pages.audit.details.metadata')} value={rest} />
                    </Grid>
                )}
            </Grid>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 3 }}>
                <Typography variant='body2'>
                    <b>{t('pages.audit.details.ip')}:</b> {row.ip || '-'}
                </Typography>
                <Typography variant='body2' sx={{ overflowWrap: 'anywhere' }}>
                    <b>{t('pages.audit.details.userAgent')}:</b> {row.userAgent || '-'}
                </Typography>
            </Stack>
        </Stack>
    )
}

AuditDetails.propTypes = {
    row: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
}

const AuditLog = () => {
    const { t, i18n } = useTranslation()
    const { error, handleError } = useError()
    const [searchParams, setSearchParams] = useSearchParams()
    const initialFilters = useMemo(() => createAuditFilters(searchParams.get('action') || ''), [searchParams])
    const [draftFilters, setDraftFilters] = useState(initialFilters)
    const [appliedFilters, setAppliedFilters] = useState(initialFilters)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_ITEMS_PER_PAGE)
    const [expandedRow, setExpandedRow] = useState(null)
    const [exporting, setExporting] = useState(false)
    const auditLogsApi = useApi(auditApi.getAuditLogs)
    const dateLocale = i18n.resolvedLanguage?.startsWith('zh') || i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US'

    const loadLogs = (filters, pageNo, size) => auditLogsApi.request(buildAuditParams(filters, pageNo, size))

    useEffect(() => {
        loadLogs(initialFilters, 1, DEFAULT_ITEMS_PER_PAGE)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const result = auditLogsApi.data || { data: [], count: 0, currentPage, pageSize }
    const rows = Array.isArray(result.data) ? result.data : []

    const updateFilter = (key) => (event) => setDraftFilters((current) => ({ ...current, [key]: event.target.value }))

    const applyFilters = () => {
        setAppliedFilters(draftFilters)
        setCurrentPage(1)
        setExpandedRow(null)
        setSearchParams(draftFilters.action ? { action: draftFilters.action } : {})
        loadLogs(draftFilters, 1, pageSize)
    }

    const clearFilters = () => {
        const cleared = createAuditFilters()
        setDraftFilters(cleared)
        setAppliedFilters(cleared)
        setCurrentPage(1)
        setExpandedRow(null)
        setSearchParams({})
        loadLogs(cleared, 1, pageSize)
    }

    const changePage = (pageNo, size) => {
        setCurrentPage(pageNo)
        setPageSize(size)
        setExpandedRow(null)
        loadLogs(appliedFilters, pageNo, size)
    }

    const exportCsv = async () => {
        setExporting(true)
        try {
            const response = await auditApi.exportAuditLogs(buildAuditParams(appliedFilters))
            const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'text/csv;charset=utf-8' })
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = 'flowops-audit-logs.csv'
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(downloadUrl)
        } catch (exportError) {
            handleError(exportError)
        } finally {
            setExporting(false)
        }
    }

    const formatDate = (value) => (value ? new Date(value).toLocaleString(dateLocale) : '-')

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack sx={{ gap: 2.5 }}>
                    <ViewHeader title={t('pages.audit.title')}>
                        <Button variant='outlined' startIcon={<IconDownload size={18} />} onClick={exportCsv} disabled={exporting}>
                            {t('pages.audit.exportCsv')}
                        </Button>
                    </ViewHeader>

                    <Box sx={{ pb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                        <Grid container spacing={2} alignItems='center'>
                            <Grid item xs={12} sm={6} lg={3}>
                                <TextField
                                    fullWidth
                                    size='small'
                                    label={t('pages.audit.filters.actorUserId')}
                                    value={draftFilters.actorUserId}
                                    onChange={updateFilter('actorUserId')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='audit-action-label'>{t('pages.audit.filters.action')}</InputLabel>
                                    <Select
                                        labelId='audit-action-label'
                                        value={draftFilters.action}
                                        label={t('pages.audit.filters.action')}
                                        onChange={updateFilter('action')}
                                    >
                                        <MenuItem value=''>{t('pages.audit.filters.all')}</MenuItem>
                                        {AUDIT_ACTION_GROUPS.flatMap((group) => [
                                            <ListSubheader key={`${group.labelKey}-header`}>{t(group.labelKey)}</ListSubheader>,
                                            ...group.actions.map((action) => (
                                                <MenuItem key={action.value} value={action.value}>
                                                    {action.value}
                                                </MenuItem>
                                            ))
                                        ])}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='audit-target-type-label'>{t('pages.audit.filters.targetType')}</InputLabel>
                                    <Select
                                        labelId='audit-target-type-label'
                                        value={draftFilters.targetType}
                                        label={t('pages.audit.filters.targetType')}
                                        onChange={updateFilter('targetType')}
                                    >
                                        <MenuItem value=''>{t('pages.audit.filters.all')}</MenuItem>
                                        {AUDIT_TARGET_TYPES.map((targetType) => (
                                            <MenuItem key={targetType} value={targetType}>
                                                {t(`pages.audit.targetTypes.${targetType}`)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <TextField
                                    fullWidth
                                    size='small'
                                    label={t('pages.audit.filters.workspaceId')}
                                    value={draftFilters.workspaceId}
                                    onChange={updateFilter('workspaceId')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <TextField
                                    fullWidth
                                    size='small'
                                    type='datetime-local'
                                    label={t('pages.audit.filters.dateFrom')}
                                    value={draftFilters.dateFrom}
                                    onChange={updateFilter('dateFrom')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <TextField
                                    fullWidth
                                    size='small'
                                    type='datetime-local'
                                    label={t('pages.audit.filters.dateTo')}
                                    value={draftFilters.dateTo}
                                    onChange={updateFilter('dateTo')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} lg={6}>
                                <Stack direction='row' sx={{ gap: 1, justifyContent: { xs: 'flex-start', lg: 'flex-end' } }}>
                                    <Button variant='outlined' startIcon={<IconRefresh size={18} />} onClick={clearFilters}>
                                        {t('pages.audit.filters.clear')}
                                    </Button>
                                    <Button variant='contained' startIcon={<IconFilter size={18} />} onClick={applyFilters}>
                                        {t('pages.audit.filters.apply')}
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>

                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 980 }} aria-label={t('pages.audit.title')}>
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell sx={{ width: 180 }}>{t('pages.audit.columns.time')}</StyledTableCell>
                                    <StyledTableCell sx={{ minWidth: 200 }}>{t('pages.audit.columns.actor')}</StyledTableCell>
                                    <StyledTableCell sx={{ minWidth: 180 }}>{t('pages.audit.columns.action')}</StyledTableCell>
                                    <StyledTableCell sx={{ minWidth: 220 }}>{t('pages.audit.columns.target')}</StyledTableCell>
                                    <StyledTableCell sx={{ width: 110 }}>{t('pages.audit.columns.status')}</StyledTableCell>
                                    <StyledTableCell align='center' sx={{ width: 72 }}>
                                        {t('pages.audit.columns.details')}
                                    </StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {auditLogsApi.loading ? (
                                    Array.from({ length: 6 }).map((_, index) => (
                                        <StyledTableRow key={index}>
                                            <StyledTableCell colSpan={6}>
                                                <Skeleton height={34} />
                                            </StyledTableCell>
                                        </StyledTableRow>
                                    ))
                                ) : rows.length === 0 ? (
                                    <StyledTableRow>
                                        <StyledTableCell colSpan={6} align='center' sx={{ py: 6 }}>
                                            <Typography color='text.secondary'>{t('pages.audit.noResults')}</Typography>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ) : (
                                    rows.map((row) => {
                                        const expanded = expandedRow === row.id
                                        return (
                                            <Fragment key={row.id}>
                                                <StyledTableRow hover>
                                                    <StyledTableCell>{formatDate(row.createdDate)}</StyledTableCell>
                                                    <StyledTableCell>
                                                        <Typography variant='body2'>{row.actorEmail || row.targetName || '-'}</Typography>
                                                        <Typography
                                                            variant='caption'
                                                            color='text.secondary'
                                                            sx={{ overflowWrap: 'anywhere' }}
                                                        >
                                                            {row.actorUserId || '-'}
                                                        </Typography>
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                                                            {row.action}
                                                        </Typography>
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Typography variant='body2'>{row.targetName || '-'}</Typography>
                                                        <Typography
                                                            variant='caption'
                                                            color='text.secondary'
                                                            sx={{ overflowWrap: 'anywhere' }}
                                                        >
                                                            {[row.targetType, row.targetId].filter(Boolean).join(' · ') || '-'}
                                                        </Typography>
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Chip
                                                            size='small'
                                                            color={statusColors[row.status] || 'default'}
                                                            label={t(`pages.audit.status.${row.status}`, row.status)}
                                                        />
                                                    </StyledTableCell>
                                                    <StyledTableCell align='center'>
                                                        <Tooltip title={t('pages.audit.columns.details')}>
                                                            <IconButton
                                                                size='small'
                                                                onClick={() => setExpandedRow(expanded ? null : row.id)}
                                                                aria-label={t('pages.audit.columns.details')}
                                                                aria-expanded={expanded}
                                                            >
                                                                {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                                <TableRow>
                                                    <StyledTableCell colSpan={6} sx={{ py: 0, bgcolor: 'action.hover' }}>
                                                        <Collapse in={expanded} timeout='auto' unmountOnExit>
                                                            <AuditDetails row={row} t={t} />
                                                        </Collapse>
                                                    </StyledTableCell>
                                                </TableRow>
                                            </Fragment>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        currentPage={Number(result.currentPage || currentPage)}
                        limit={Number(result.pageSize || pageSize)}
                        total={Number(result.count || 0)}
                        onChange={changePage}
                    />
                </Stack>
            )}
        </MainCard>
    )
}

export default AuditLog
