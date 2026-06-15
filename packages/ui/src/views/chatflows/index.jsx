import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// material-ui
import { Box, ListItemIcon, ListItemText, Menu, MenuItem, Skeleton, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import WorkflowEmptySVG from '@/assets/images/workflow_empty.svg'
import ErrorBoundary from '@/ErrorBoundary'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import { gridSpacing } from '@/store/constant'
import { StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import ItemCard from '@/ui-component/cards/ItemCard'
import MainCard from '@/ui-component/cards/MainCard'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'
import { FlowListTable } from '@/ui-component/table/FlowListTable'
import { translateNodeLabel } from '@/i18n/nodeI18n'
import { getLiquidGlassControlSx } from '@/ui-component/utils/liquidGlassStyles'
import { createFeishuHandoffTemplateFlowData } from './feishuHandoffTemplate'

// API
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL } from '@/store/constant'
import { useError } from '@/store/context/ErrorContext'

// icons
import { IconChevronDown, IconLayoutGrid, IconList, IconPlus, IconRobot } from '@tabler/icons-react'

// ==============================|| CHATFLOWS ||============================== //

const Chatflows = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const { t, i18n } = useTranslation()
    const currentLang = i18n.resolvedLanguage || i18n.language

    const [isLoading, setLoading] = useState(true)
    const [images, setImages] = useState({})
    const [search, setSearch] = useState('')
    const [createMenuAnchor, setCreateMenuAnchor] = useState(null)
    const { error, setError } = useError()

    const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows)
    const [view, setView] = useState(localStorage.getItem('chatFlowDisplayStyle') || 'card')

    /* Table Pagination */
    const [currentPage, setCurrentPage] = useState(1)
    const [pageLimit, setPageLimit] = useState(() => Number(localStorage.getItem('chatFlowPageSize') || DEFAULT_ITEMS_PER_PAGE))
    const [total, setTotal] = useState(0)

    const onChange = (page, pageLimit) => {
        setCurrentPage(page)
        setPageLimit(pageLimit)
        localStorage.setItem('chatFlowPageSize', pageLimit)
        applyFilters(page, pageLimit)
    }

    const applyFilters = (page, limit) => {
        const params = {
            page: page || currentPage,
            limit: limit || pageLimit
        }
        getAllChatflowsApi.request(params)
    }

    const handleChange = (event, nextView) => {
        if (nextView === null) return
        localStorage.setItem('chatFlowDisplayStyle', nextView)
        setView(nextView)
    }

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    function filterFlows(data) {
        return (
            data?.name.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
            (data.category && data.category.toLowerCase().indexOf(search.toLowerCase()) > -1) ||
            data?.id.toLowerCase().indexOf(search.toLowerCase()) > -1
        )
    }

    const isCreateMenuOpen = Boolean(createMenuAnchor)

    const openCreateMenu = (event) => {
        setCreateMenuAnchor(event.currentTarget)
    }

    const closeCreateMenu = () => {
        setCreateMenuAnchor(null)
    }

    const addNew = () => {
        closeCreateMenu()
        navigate('/canvas')
    }

    const addFeishuHandoff = () => {
        closeCreateMenu()
        navigate('/canvas', { state: { templateFlowData: createFeishuHandoffTemplateFlowData() } })
    }

    const goToCanvas = (selectedChatflow) => {
        navigate(`/canvas/${selectedChatflow.id}`)
    }

    useEffect(() => {
        applyFilters(currentPage, pageLimit)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setLoading(getAllChatflowsApi.loading)
    }, [getAllChatflowsApi.loading])

    useEffect(() => {
        if (getAllChatflowsApi.data) {
            try {
                const chatflows = getAllChatflowsApi.data?.data
                const total = getAllChatflowsApi.data?.total
                setTotal(total)
                const images = {}
                for (let i = 0; i < chatflows.length; i += 1) {
                    const flowDataStr = chatflows[i].flowData
                    const flowData = JSON.parse(flowDataStr)
                    const nodes = flowData.nodes || []
                    images[chatflows[i].id] = []
                    for (let j = 0; j < nodes.length; j += 1) {
                        if (nodes[j].data.name === 'stickyNote' || nodes[j].data.name === 'stickyNoteAgentflow') continue
                        const imageSrc = `${baseURL}/api/v1/node-icon/${nodes[j].data.name}`
                        if (!images[chatflows[i].id].some((img) => img.imageSrc === imageSrc)) {
                            images[chatflows[i].id].push({
                                imageSrc,
                                label: translateNodeLabel(nodes[j].data.label, currentLang)
                            })
                        }
                    }
                }
                setImages(images)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllChatflowsApi.data, currentLang])

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader
                        onSearchChange={onSearchChange}
                        search={true}
                        searchPlaceholder={t('pages.chatflows.searchPlaceholder')}
                        title={t('pages.chatflows.title')}
                        description={t('pages.chatflows.description')}
                    >
                        <ToggleButtonGroup
                            sx={{
                                height: 44,
                                maxHeight: 44,
                                borderRadius: '18px',
                                overflow: 'hidden',
                                background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 34%), ${theme.palette.glass.control}`,
                                border: `1px solid ${theme.palette.glass.border}`,
                                boxShadow: 'none',
                                backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                                WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                                '& .MuiToggleButtonGroup-grouped': {
                                    width: 46,
                                    height: 42,
                                    border: 0,
                                    borderRadius: 0,
                                    margin: 0,
                                    color: theme.palette.text.secondary
                                },
                                '& .MuiToggleButtonGroup-grouped:not(:last-of-type)': {
                                    borderRight: `1px solid ${theme.palette.glass.border}`
                                }
                            }}
                            value={view}
                            color='primary'
                            disabled={total === 0}
                            exclusive
                            onChange={handleChange}
                        >
                            <ToggleButton
                                sx={{
                                    '&.Mui-selected': {
                                        color: theme.palette.glass.accentText
                                    }
                                }}
                                variant='contained'
                                value='card'
                                title={t('pages.marketplaces.cardView')}
                            >
                                <IconLayoutGrid />
                            </ToggleButton>
                            <ToggleButton
                                sx={{
                                    '&.Mui-selected': {
                                        color: theme.palette.glass.accentText
                                    }
                                }}
                                variant='contained'
                                value='list'
                                title={t('pages.marketplaces.listView')}
                            >
                                <IconList />
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <StyledPermissionButton
                            id='chatflow-create-button'
                            permissionId={'chatflows:create'}
                            variant='contained'
                            onClick={openCreateMenu}
                            startIcon={<IconPlus />}
                            endIcon={<IconChevronDown size={18} />}
                            aria-controls={isCreateMenuOpen ? 'chatflow-create-menu' : undefined}
                            aria-haspopup='menu'
                            aria-expanded={isCreateMenuOpen ? 'true' : undefined}
                            sx={{
                                ...getLiquidGlassControlSx(theme),
                                borderRadius: '18px',
                                height: 44,
                                minWidth: 112,
                                px: 2.25
                            }}
                        >
                            {t('common.addNew')}
                        </StyledPermissionButton>
                        <Menu
                            id='chatflow-create-menu'
                            anchorEl={createMenuAnchor}
                            open={isCreateMenuOpen}
                            onClose={closeCreateMenu}
                            MenuListProps={{ 'aria-labelledby': 'chatflow-create-button' }}
                            PaperProps={{
                                sx: {
                                    mt: 1,
                                    minWidth: 288,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.glass.border}`,
                                    background: theme.palette.glass.surfaceStrong,
                                    backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                                    WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                                    boxShadow: theme.palette.glass.shadow
                                }
                            }}
                        >
                            <MenuItem onClick={addNew}>
                                <ListItemIcon>
                                    <IconPlus size={20} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={t('pages.chatflows.create.blankChatflow')}
                                    secondary={t('pages.chatflows.create.blankChatflowDescription')}
                                />
                            </MenuItem>
                            <MenuItem onClick={addFeishuHandoff}>
                                <ListItemIcon>
                                    <IconRobot size={20} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={t('pages.chatflows.create.feishuHandoff')}
                                    secondary={t('pages.chatflows.create.feishuHandoffDescription')}
                                />
                            </MenuItem>
                        </Menu>
                    </ViewHeader>

                    {isLoading && (
                        <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
                            <Skeleton variant='rounded' height={160} />
                            <Skeleton variant='rounded' height={160} />
                            <Skeleton variant='rounded' height={160} />
                        </Box>
                    )}
                    {!isLoading && total > 0 && (
                        <>
                            {!view || view === 'card' ? (
                                <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
                                    {getAllChatflowsApi.data?.data?.filter(filterFlows).map((data, index) => (
                                        <ItemCard key={index} onClick={() => goToCanvas(data)} data={data} images={images[data.id]} />
                                    ))}
                                </Box>
                            ) : (
                                <FlowListTable
                                    data={getAllChatflowsApi.data?.data}
                                    images={images}
                                    isLoading={isLoading}
                                    filterFunction={filterFlows}
                                    updateFlowsApi={getAllChatflowsApi}
                                    setError={setError}
                                    currentPage={currentPage}
                                    pageLimit={pageLimit}
                                />
                            )}
                            {/* Pagination and Page Size Controls */}
                            <TablePagination currentPage={currentPage} limit={pageLimit} total={total} onChange={onChange} />
                        </>
                    )}
                    {!isLoading && (!getAllChatflowsApi.data?.data || getAllChatflowsApi.data?.data.length === 0) && (
                        <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                            <Box sx={{ p: 2, height: 'auto' }}>
                                <img
                                    style={{ objectFit: 'cover', height: '25vh', width: 'auto' }}
                                    src={WorkflowEmptySVG}
                                    alt='WorkflowEmptySVG'
                                />
                            </Box>
                            <div>{t('common.noChatflowsYet')}</div>
                        </Stack>
                    )}
                </Stack>
            )}
            <ConfirmDialog />
        </MainCard>
    )
}

export default Chatflows
