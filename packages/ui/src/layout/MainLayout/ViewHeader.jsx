import PropTypes from 'prop-types'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// material-ui
import { IconButton, Box, OutlinedInput, Toolbar, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { StyledFab } from '@/ui-component/button/StyledFab'

// icons
import { IconSearch, IconArrowLeft, IconEdit } from '@tabler/icons-react'

import useSearchShortcut from '@/hooks/useSearchShortcut'
import { getOS } from '@/utils/genericHelper'

const os = getOS()
const isMac = os === 'macos'
const isDesktop = isMac || os === 'windows' || os === 'linux'
const keyboardShortcut = isMac ? '[ ⌘ + F ]' : '[ Ctrl + F ]'

const ViewHeader = ({
    children,
    filters = null,
    onSearchChange,
    search,
    searchPlaceholder,
    title,
    description,
    isBackButton,
    onBack,
    isEditButton,
    onEdit
}) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const searchInputRef = useRef()
    useSearchShortcut(searchInputRef)
    const localizedSearchPlaceholder = searchPlaceholder || t('common.search')

    return (
        <Box sx={{ flexGrow: 1, py: 1.25, width: '100%' }}>
            <Toolbar
                disableGutters={true}
                sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: { xs: 2, md: 1 },
                    justifyContent: 'space-between',
                    width: '100%'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', width: { xs: '100%', md: 'auto' } }}>
                    {isBackButton && (
                        <StyledFab
                            sx={{ mr: 3 }}
                            size='small'
                            color='secondary'
                            aria-label='back'
                            title={t('common.back')}
                            onClick={onBack}
                        >
                            <IconArrowLeft />
                        </StyledFab>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'start', flexDirection: 'column' }}>
                        <Typography
                            sx={{
                                fontSize: '1.8rem',
                                fontWeight: 600,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                flex: 1,
                                maxWidth: { xs: '100%', md: 'calc(100vh - 100px)' }
                            }}
                            variant='h1'
                        >
                            {title}
                        </Typography>
                        {description && (
                            <Typography
                                sx={{
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    mt: 2,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 5,
                                    WebkitBoxOrient: 'vertical',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    flex: 1,
                                    maxWidth: { xs: '100%', md: 'calc(100vh - 100px)' }
                                }}
                            >
                                {description}
                            </Typography>
                        )}
                    </Box>
                    {isEditButton && (
                        <IconButton sx={{ ml: 3 }} color='secondary' title={t('common.edit')} onClick={onEdit}>
                            <IconEdit />
                        </IconButton>
                    )}
                </Box>
                <Box
                    sx={{
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: { xs: 'flex-start', md: 'flex-end' },
                        flexWrap: 'wrap',
                        gap: 1,
                        width: { xs: '100%', md: 'auto' }
                    }}
                >
                    {search && (
                        <OutlinedInput
                            inputRef={searchInputRef}
                            size='small'
                            sx={{
                                width: '325px',
                                height: 44,
                                display: { xs: 'none', sm: 'flex' },
                                borderRadius: '18px',

                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderRadius: '18px'
                                }
                            }}
                            variant='outlined'
                            placeholder={`${localizedSearchPlaceholder} ${isDesktop ? keyboardShortcut : ''}`}
                            onChange={onSearchChange}
                            startAdornment={
                                <Box
                                    sx={{
                                        color: theme.palette.grey[400],
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 1
                                    }}
                                >
                                    <IconSearch style={{ color: 'inherit', width: 16, height: 16 }} />
                                </Box>
                            }
                            type='search'
                        />
                    )}
                    {filters}
                    {children}
                </Box>
            </Toolbar>
        </Box>
    )
}

ViewHeader.propTypes = {
    children: PropTypes.node,
    filters: PropTypes.node,
    onSearchChange: PropTypes.func,
    search: PropTypes.bool,
    searchPlaceholder: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    isBackButton: PropTypes.bool,
    onBack: PropTypes.func,
    isEditButton: PropTypes.bool,
    onEdit: PropTypes.func
}

export default ViewHeader
