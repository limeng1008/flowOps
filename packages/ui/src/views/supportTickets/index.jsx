import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import { IconMessage, IconPlus, IconRefresh } from '@tabler/icons-react'

import supportTicketsApi from '@/api/supportTickets'
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

const defaultTicketForm = {
    subject: '',
    description: '',
    category: '',
    priority: 'normal'
}

const defaultUpdateForm = {
    status: 'open',
    priority: 'normal',
    assignedToEmail: '',
    category: ''
}

const statusColors = {
    open: 'info',
    pending: 'warning',
    resolved: 'success',
    closed: 'default'
}

const priorityColors = {
    low: 'default',
    normal: 'info',
    high: 'warning',
    urgent: 'error'
}

const SupportTickets = () => {
    const { t, i18n } = useTranslation()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const dateLocale = i18n.resolvedLanguage?.startsWith('zh') || i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US'

    const [activeTab, setActiveTab] = useState('mine')
    const [tickets, setTickets] = useState([])
    const [adminTickets, setAdminTickets] = useState([])
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [openCreateDialog, setOpenCreateDialog] = useState(false)
    const [ticketForm, setTicketForm] = useState(defaultTicketForm)
    const [updateForm, setUpdateForm] = useState(defaultUpdateForm)
    const [replyMessage, setReplyMessage] = useState('')

    const getMyTicketsApi = useApi(supportTicketsApi.getMyTickets)
    const getAdminTicketsApi = useApi(supportTicketsApi.getAdminTickets)
    const createTicketApi = useApi(supportTicketsApi.createTicket)
    const updateTicketApi = useApi(supportTicketsApi.updateTicket)
    const replyToTicketApi = useApi(supportTicketsApi.replyToTicket)

    const isAdminTab = activeTab === 'admin'
    const rows = isAdminTab ? adminTickets : tickets
    const isLoading = isAdminTab ? getAdminTicketsApi.loading : getMyTicketsApi.loading
    const isSaving = createTicketApi.loading || updateTicketApi.loading || replyToTicketApi.loading

    const messages = useMemo(() => parseMessages(selectedTicket?.messages), [selectedTicket?.messages])

    const reload = () => {
        if (isAdminTab) getAdminTicketsApi.request()
        else getMyTicketsApi.request()
    }

    useEffect(() => {
        getMyTicketsApi.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (activeTab === 'admin') getAdminTicketsApi.request()
        if (activeTab === 'mine') getMyTicketsApi.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    useEffect(() => {
        if (getMyTicketsApi.data) setTickets(getMyTicketsApi.data)
    }, [getMyTicketsApi.data])

    useEffect(() => {
        if (getAdminTicketsApi.data) setAdminTickets(getAdminTicketsApi.data)
    }, [getAdminTicketsApi.data])

    useEffect(() => {
        if (createTicketApi.data) {
            setOpenCreateDialog(false)
            setTicketForm(defaultTicketForm)
            setSelectedTicket(createTicketApi.data)
            getMyTicketsApi.request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createTicketApi.data])

    useEffect(() => {
        if (updateTicketApi.data) {
            setSelectedTicket(updateTicketApi.data)
            reload()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateTicketApi.data])

    useEffect(() => {
        if (replyToTicketApi.data) {
            setSelectedTicket(replyToTicketApi.data)
            setReplyMessage('')
            reload()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [replyToTicketApi.data])

    const selectTicket = (ticket) => {
        setSelectedTicket(ticket)
        setUpdateForm({
            status: ticket.status || 'open',
            priority: ticket.priority || 'normal',
            assignedToEmail: ticket.assignedToEmail || '',
            category: ticket.category || ''
        })
    }

    const createTicket = () => {
        createTicketApi.request({
            subject: ticketForm.subject,
            description: ticketForm.description,
            category: ticketForm.category || null,
            priority: ticketForm.priority
        })
    }

    const updateTicket = () => {
        if (!selectedTicket) return
        updateTicketApi.request(selectedTicket.id, {
            status: updateForm.status,
            priority: updateForm.priority,
            assignedToEmail: updateForm.assignedToEmail || null,
            category: updateForm.category || null
        })
    }

    const replyToTicket = () => {
        if (!selectedTicket || !replyMessage.trim()) return
        replyToTicketApi.request(selectedTicket.id, { message: replyMessage })
    }

    const formatDate = (value) => (value ? new Date(value).toLocaleString(dateLocale) : '-')
    const labelStatus = (value) => t(`pages.supportTickets.${value || 'open'}`)
    const labelPriority = (value) => t(`pages.supportTickets.${value || 'normal'}`)

    return (
        <MainCard>
            <Stack sx={{ gap: 3 }}>
                <ViewHeader title={t('pages.supportTickets.title')}>
                    <Stack direction='row' sx={{ gap: 1, flexWrap: 'wrap' }}>
                        <StyledButton variant='outlined' startIcon={<IconRefresh />} onClick={reload}>
                            {t('common.refresh')}
                        </StyledButton>
                        <StyledButton variant='contained' startIcon={<IconPlus />} onClick={() => setOpenCreateDialog(true)}>
                            {t('pages.supportTickets.newTicket')}
                        </StyledButton>
                    </Stack>
                </ViewHeader>

                <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} aria-label='support ticket tabs'>
                    <Tab value='mine' label={t('pages.supportTickets.myTickets')} />
                    <Tab value='admin' label={t('pages.supportTickets.adminQueue')} />
                </Tabs>

                <Grid container spacing={2}>
                    <Grid item xs={12} lg={7}>
                        <TableContainer
                            component={Paper}
                            sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2, overflowX: 'auto' }}
                        >
                            <Table sx={{ minWidth: 760 }} aria-label='support tickets table'>
                                <TableHead
                                    sx={{
                                        backgroundColor: customization.isDarkMode ? theme.palette.common.black : theme.palette.grey[100]
                                    }}
                                >
                                    <TableRow>
                                        <StyledTableCell>{t('pages.supportTickets.subject')}</StyledTableCell>
                                        <StyledTableCell>{t('pages.supportTickets.status')}</StyledTableCell>
                                        <StyledTableCell>{t('pages.supportTickets.priority')}</StyledTableCell>
                                        {isAdminTab && <StyledTableCell>{t('pages.supportTickets.requester')}</StyledTableCell>}
                                        <StyledTableCell>{t('pages.supportTickets.updatedAt')}</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        [1, 2, 3].map((item) => (
                                            <StyledTableRow key={item}>
                                                {[1, 2, 3, 4, 5].map((cell) => (
                                                    <StyledTableCell key={cell}>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                ))}
                                            </StyledTableRow>
                                        ))
                                    ) : rows.length ? (
                                        rows.map((ticket) => (
                                            <StyledTableRow
                                                key={ticket.id}
                                                hover
                                                selected={selectedTicket?.id === ticket.id}
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() => selectTicket(ticket)}
                                            >
                                                <StyledTableCell>
                                                    <Typography variant='subtitle2' noWrap sx={{ maxWidth: 260 }}>
                                                        {ticket.subject}
                                                    </Typography>
                                                    {ticket.category && (
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {ticket.category}
                                                        </Typography>
                                                    )}
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <Chip
                                                        size='small'
                                                        color={statusColors[ticket.status] || 'default'}
                                                        label={labelStatus(ticket.status)}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <Chip
                                                        size='small'
                                                        color={priorityColors[ticket.priority] || 'default'}
                                                        label={labelPriority(ticket.priority)}
                                                        variant='outlined'
                                                    />
                                                </StyledTableCell>
                                                {isAdminTab && <StyledTableCell>{ticket.requesterEmail}</StyledTableCell>}
                                                <StyledTableCell>{formatDate(ticket.updatedDate || ticket.createdDate)}</StyledTableCell>
                                            </StyledTableRow>
                                        ))
                                    ) : (
                                        <StyledTableRow>
                                            <StyledTableCell colSpan={isAdminTab ? 5 : 4} align='center'>
                                                {t('pages.supportTickets.noTickets')}
                                            </StyledTableCell>
                                        </StyledTableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <Paper sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2, p: 2, minHeight: 420 }}>
                            {selectedTicket ? (
                                <Stack sx={{ gap: 2 }}>
                                    <Stack sx={{ gap: 0.5 }}>
                                        <Typography variant='h4'>{selectedTicket.subject}</Typography>
                                        <Stack direction='row' sx={{ gap: 1, flexWrap: 'wrap' }}>
                                            <Chip
                                                size='small'
                                                color={statusColors[selectedTicket.status] || 'default'}
                                                label={labelStatus(selectedTicket.status)}
                                            />
                                            <Chip
                                                size='small'
                                                color={priorityColors[selectedTicket.priority] || 'default'}
                                                label={labelPriority(selectedTicket.priority)}
                                                variant='outlined'
                                            />
                                        </Stack>
                                    </Stack>

                                    {isAdminTab && (
                                        <Stack sx={{ gap: 1.5 }}>
                                            <Grid container spacing={1}>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size='small'>
                                                        <InputLabel>{t('pages.supportTickets.status')}</InputLabel>
                                                        <Select
                                                            label={t('pages.supportTickets.status')}
                                                            value={updateForm.status}
                                                            onChange={(event) =>
                                                                setUpdateForm({ ...updateForm, status: event.target.value })
                                                            }
                                                        >
                                                            {['open', 'pending', 'resolved', 'closed'].map((status) => (
                                                                <MenuItem key={status} value={status}>
                                                                    {labelStatus(status)}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size='small'>
                                                        <InputLabel>{t('pages.supportTickets.priority')}</InputLabel>
                                                        <Select
                                                            label={t('pages.supportTickets.priority')}
                                                            value={updateForm.priority}
                                                            onChange={(event) =>
                                                                setUpdateForm({ ...updateForm, priority: event.target.value })
                                                            }
                                                        >
                                                            {['low', 'normal', 'high', 'urgent'].map((priority) => (
                                                                <MenuItem key={priority} value={priority}>
                                                                    {labelPriority(priority)}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                            </Grid>
                                            <TextField
                                                size='small'
                                                label={t('pages.supportTickets.assignee')}
                                                value={updateForm.assignedToEmail}
                                                onChange={(event) => setUpdateForm({ ...updateForm, assignedToEmail: event.target.value })}
                                            />
                                            <TextField
                                                size='small'
                                                label={t('pages.supportTickets.category')}
                                                value={updateForm.category}
                                                onChange={(event) => setUpdateForm({ ...updateForm, category: event.target.value })}
                                            />
                                            <Button variant='outlined' onClick={updateTicket} disabled={isSaving}>
                                                {t('common.save')}
                                            </Button>
                                        </Stack>
                                    )}

                                    <Divider />
                                    <Stack sx={{ gap: 1.5, maxHeight: 360, overflowY: 'auto', pr: 1 }}>
                                        {messages.map((message) => (
                                            <Box
                                                key={message.id || `${message.createdDate}-${message.message}`}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor:
                                                        message.actorType === 'support'
                                                            ? theme.palette.primary.light
                                                            : customization.isDarkMode
                                                            ? theme.palette.grey[900]
                                                            : theme.palette.grey[50]
                                                }}
                                            >
                                                <Typography variant='caption' color='text.secondary'>
                                                    {message.actorEmail || message.actorName || message.actorType} ·{' '}
                                                    {formatDate(message.createdDate)}
                                                </Typography>
                                                <Typography variant='body2' sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                                    {message.message}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                    <TextField
                                        multiline
                                        minRows={3}
                                        label={t('pages.supportTickets.replyPlaceholder')}
                                        value={replyMessage}
                                        onChange={(event) => setReplyMessage(event.target.value)}
                                    />
                                    <Button
                                        variant='contained'
                                        startIcon={<IconMessage />}
                                        onClick={replyToTicket}
                                        disabled={isSaving || !replyMessage.trim()}
                                    >
                                        {t('pages.supportTickets.reply')}
                                    </Button>
                                </Stack>
                            ) : (
                                <Stack alignItems='center' justifyContent='center' sx={{ minHeight: 380, color: 'text.secondary' }}>
                                    <Typography>{t('pages.supportTickets.noTickets')}</Typography>
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Stack>

            <Dialog fullWidth maxWidth='sm' open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
                <DialogTitle>{t('pages.supportTickets.newTicket')}</DialogTitle>
                <DialogContent>
                    <Stack sx={{ gap: 2, mt: 1 }}>
                        <TextField
                            label={t('pages.supportTickets.subject')}
                            value={ticketForm.subject}
                            onChange={(event) => setTicketForm({ ...ticketForm, subject: event.target.value })}
                            fullWidth
                        />
                        <TextField
                            label={t('pages.supportTickets.description')}
                            value={ticketForm.description}
                            onChange={(event) => setTicketForm({ ...ticketForm, description: event.target.value })}
                            multiline
                            minRows={4}
                            fullWidth
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={t('pages.supportTickets.category')}
                                    value={ticketForm.category}
                                    onChange={(event) => setTicketForm({ ...ticketForm, category: event.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('pages.supportTickets.priority')}</InputLabel>
                                    <Select
                                        label={t('pages.supportTickets.priority')}
                                        value={ticketForm.priority}
                                        onChange={(event) => setTicketForm({ ...ticketForm, priority: event.target.value })}
                                    >
                                        {['low', 'normal', 'high', 'urgent'].map((priority) => (
                                            <MenuItem key={priority} value={priority}>
                                                {labelPriority(priority)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateDialog(false)}>{t('common.cancel')}</Button>
                    <Button
                        variant='contained'
                        onClick={createTicket}
                        disabled={isSaving || !ticketForm.subject.trim() || !ticketForm.description.trim()}
                    >
                        {t('common.submit')}
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    )
}

function parseMessages(value) {
    if (!value) return []
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export default SupportTickets
