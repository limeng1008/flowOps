import { useEffect, useState } from 'react'
import * as PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

// material-ui
import { styled } from '@mui/material/styles'
import { tableCellClasses } from '@mui/material/TableCell'
import {
    Box,
    Drawer,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography,
    useTheme
} from '@mui/material'

// project imports
import ErrorBoundary from '@/ErrorBoundary'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import { PermissionIconButton } from '@/ui-component/button/RBACButtons'
import MainCard from '@/ui-component/cards/MainCard'

// API
import roleApi from '@/api/role'
import userApi from '@/api/user'

// Hooks
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'
import { getFlowOpsRoleDescription, getFlowOpsRoleLabel } from '@/utils/flowOpsRoles'

// Icons
import roles_emptySVG from '@/assets/images/roles_empty.svg'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

import { useError } from '@/store/context/ErrorContext'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.palette.grey[900] + 25,

    [`&.${tableCellClasses.head}`]: {
        color: theme.palette.grey[900]
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        height: 48
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))

function AssignedUsersDrawer({ open, onClose, roleId }) {
    const { t } = useTranslation()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const [assignedUsers, setAssignedUsers] = useState([])
    const [order, setOrder] = useState('asc')
    const [orderBy, setOrderBy] = useState('workspace')
    const getAllUsersByRoleIdApi = useApi(userApi.getUserByRoleId)

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc'
        setOrder(isAsc ? 'desc' : 'asc')
        setOrderBy(property)
    }

    const sortedAssignedUsers = [...assignedUsers].sort((a, b) => {
        const userA = (a.user?.name || a.user?.email || '').toLowerCase()
        const userB = (b.user?.name || b.user?.email || '').toLowerCase()
        const workspaceA = (a.workspace?.name || '').toLowerCase()
        const workspaceB = (b.workspace?.name || '').toLowerCase()
        const comparison =
            orderBy === 'user'
                ? userA.localeCompare(userB) || workspaceA.localeCompare(workspaceB)
                : workspaceA.localeCompare(workspaceB) || userA.localeCompare(userB)

        return order === 'asc' ? comparison : -comparison
    })

    useEffect(() => {
        if (open && roleId) {
            getAllUsersByRoleIdApi.request(roleId)
        } else {
            setAssignedUsers([])
            setOrder('asc')
            setOrderBy('workspace')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, roleId])

    useEffect(() => {
        if (getAllUsersByRoleIdApi.data) {
            setAssignedUsers(getAllUsersByRoleIdApi.data)
        }
    }, [getAllUsersByRoleIdApi.data])

    return (
        <Drawer anchor='right' open={open} onClose={onClose} sx={{ minWidth: 320 }}>
            <Box sx={{ p: 4, height: 'auto', width: 650 }}>
                <Typography sx={{ textAlign: 'left', mb: 2 }} variant='h2'>
                    {t('pages.roles.assignedUsers')}
                </Typography>
                <TableContainer
                    style={{ display: 'flex', flexDirection: 'row' }}
                    sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}
                    component={Paper}
                >
                    <Table aria-label='assigned users table'>
                        <TableHead
                            sx={{
                                backgroundColor: customization.isDarkMode ? theme.palette.common.black : theme.palette.grey[100],
                                height: 56
                            }}
                        >
                            <TableRow>
                                <StyledTableCell sx={{ width: '50%' }}>
                                    <TableSortLabel
                                        active={orderBy === 'user'}
                                        direction={orderBy === 'user' ? order : 'asc'}
                                        onClick={() => handleRequestSort('user')}
                                    >
                                        {t('profile.user')}
                                    </TableSortLabel>
                                </StyledTableCell>
                                <StyledTableCell sx={{ width: '50%' }}>
                                    <TableSortLabel
                                        active={orderBy === 'workspace'}
                                        direction={orderBy === 'workspace' ? order : 'asc'}
                                        onClick={() => handleRequestSort('workspace')}
                                    >
                                        {t('permissions.categories.workspace')}
                                    </TableSortLabel>
                                </StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedAssignedUsers.map((item, index) => (
                                <TableRow key={index}>
                                    <StyledTableCell>{item.user.name || item.user.email}</StyledTableCell>
                                    <StyledTableCell>{item.workspace.name}</StyledTableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Drawer>
    )
}

AssignedUsersDrawer.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    roleId: PropTypes.string
}

function ShowRoleRow({ role }) {
    const { t } = useTranslation()
    const [openAssignedUsersDrawer, setOpenAssignedUsersDrawer] = useState(false)

    return (
        <>
            <StyledTableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <StyledTableCell>{getFlowOpsRoleLabel(role.name, t)}</StyledTableCell>
                <StyledTableCell>{getFlowOpsRoleDescription(role.name, t, role.description)}</StyledTableCell>
                <StyledTableCell sx={{ textAlign: 'center' }}>
                    {role.userCount}
                    {role.userCount > 0 && (
                        <PermissionIconButton
                            permissionId={'roles:manage'}
                            aria-label='expand row'
                            size='small'
                            color='inherit'
                            onClick={() => setOpenAssignedUsersDrawer(true)}
                        >
                            {openAssignedUsersDrawer ? <IconEyeOff /> : <IconEye />}
                        </PermissionIconButton>
                    )}
                </StyledTableCell>
            </StyledTableRow>
            <AssignedUsersDrawer open={openAssignedUsersDrawer} onClose={() => setOpenAssignedUsersDrawer(false)} roleId={role.id} />
        </>
    )
}

ShowRoleRow.propTypes = {
    role: PropTypes.any
}

const Roles = () => {
    const { t } = useTranslation()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    useNotifier()
    const { error, setError } = useError()

    const [isLoading, setLoading] = useState(true)
    const currentUser = useSelector((state) => state.auth.user)

    const getAllRolesByOrganizationIdApi = useApi(roleApi.getAllRolesByOrganizationId)

    const [roles, setRoles] = useState([])
    const [search, setSearch] = useState('')

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    function filterRoles(data) {
        const label = getFlowOpsRoleLabel(data.name, t)
        const description = getFlowOpsRoleDescription(data.name, t, data.description)
        return label.toLowerCase().indexOf(search.toLowerCase()) > -1 || description.toLowerCase().indexOf(search.toLowerCase()) > -1
    }

    useEffect(() => {
        getAllRolesByOrganizationIdApi.request(currentUser.activeOrganizationId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setLoading(getAllRolesByOrganizationIdApi.loading)
    }, [getAllRolesByOrganizationIdApi.loading])

    useEffect(() => {
        if (getAllRolesByOrganizationIdApi.error) {
            setError(getAllRolesByOrganizationIdApi.error)
        }
    }, [getAllRolesByOrganizationIdApi.error, setError])

    useEffect(() => {
        if (getAllRolesByOrganizationIdApi.data) {
            setRoles(getAllRolesByOrganizationIdApi.data)
        }
    }, [getAllRolesByOrganizationIdApi.data])

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader
                        onSearchChange={onSearchChange}
                        search={true}
                        searchPlaceholder={t('pages.roles.searchPlaceholder')}
                        title={t('pages.roles.title')}
                        description={t('pages.roles.simplifiedDescription')}
                    />
                    {!isLoading && roles.length === 0 ? (
                        <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                            <Box sx={{ p: 2, height: 'auto' }}>
                                <img
                                    style={{ objectFit: 'cover', height: '20vh', width: 'auto' }}
                                    src={roles_emptySVG}
                                    alt='roles_emptySVG'
                                />
                            </Box>
                            <div>{t('pages.roles.noRoles')}</div>
                        </Stack>
                    ) : (
                        <Stack flexDirection='row'>
                            <Box sx={{ p: 2, height: 'auto', width: '100%' }}>
                                <TableContainer
                                    style={{ display: 'flex', flexDirection: 'row' }}
                                    sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}
                                    component={Paper}
                                >
                                    <Table sx={{ minWidth: 650 }} aria-label='roles table'>
                                        <TableHead
                                            sx={{
                                                backgroundColor: customization.isDarkMode
                                                    ? theme.palette.common.black
                                                    : theme.palette.grey[100],
                                                height: 56
                                            }}
                                        >
                                            <TableRow>
                                                <StyledTableCell>{t('common.name')}</StyledTableCell>
                                                <StyledTableCell>{t('common.description')}</StyledTableCell>
                                                <StyledTableCell>{t('pages.roles.assignedUsers')}</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {isLoading ? (
                                                <>
                                                    <StyledTableRow>
                                                        <StyledTableCell>
                                                            <Skeleton variant='text' />
                                                        </StyledTableCell>
                                                        <StyledTableCell>
                                                            <Skeleton variant='text' />
                                                        </StyledTableCell>
                                                        <StyledTableCell>
                                                            <Skeleton variant='text' />
                                                        </StyledTableCell>
                                                    </StyledTableRow>
                                                    <StyledTableRow>
                                                        <StyledTableCell>
                                                            <Skeleton variant='text' />
                                                        </StyledTableCell>
                                                        <StyledTableCell>
                                                            <Skeleton variant='text' />
                                                        </StyledTableCell>
                                                        <StyledTableCell>
                                                            <Skeleton variant='text' />
                                                        </StyledTableCell>
                                                    </StyledTableRow>
                                                </>
                                            ) : (
                                                <>
                                                    {roles.filter(filterRoles).map((role) => (
                                                        <ShowRoleRow role={role} key={role.id} />
                                                    ))}
                                                </>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Stack>
                    )}
                </Stack>
            )}
        </MainCard>
    )
}

export default Roles
