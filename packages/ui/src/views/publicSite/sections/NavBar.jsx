import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconArrowRight, IconMenu2, IconX } from '@tabler/icons-react'

import FlowOpsLogo from '@/assets/images/flowops_dark.svg'
import { getLiquidGlassControlSx, getLiquidGlassPanelSx } from '@/ui-component/utils/liquidGlassStyles'
import { LanguageSwitch, SITE_COLORS, getLinkProps } from './shared'

const navLinks = (copy) => [
    { label: copy.product, href: '#capabilities' },
    { label: copy.solutions, href: '#solutions' },
    { label: copy.enterprise, href: '#enterprise' },
    { label: copy.docs, href: '/docs' },
    { label: copy.help, href: '/help' }
]

const HomeNavBar = ({ copy, languages, currentLang, handleChangeLanguage }) => {
    const [open, setOpen] = useState(false)
    const theme = useTheme()
    const links = navLinks(copy)

    return (
        <Box
            component='nav'
            className='public-nav'
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                px: { xs: 1.5, md: 4 },
                py: 1.2,
                background: 'linear-gradient(180deg, rgba(247,251,255,0.86), rgba(247,251,255,0.56))',
                backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                borderBottom: `1px solid ${theme.palette.glass.border}`
            }}
        >
            <Stack direction='row' spacing={1.5} sx={{ maxWidth: 1240, mx: 'auto', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box component={RouterLink} to='/' sx={{ display: 'inline-flex', alignItems: 'center', minWidth: 0 }}>
                    <Box component='img' src={FlowOpsLogo} alt='FlowOps' sx={{ width: { xs: 126, sm: 144, md: 158 }, height: 'auto' }} />
                </Box>

                <Stack
                    direction='row'
                    spacing={0.4}
                    sx={getLiquidGlassPanelSx(theme, {
                        display: { xs: 'none', lg: 'flex' },
                        p: 0.55,
                        borderRadius: '999px',
                        boxShadow: 'none'
                    })}
                >
                    {links.map((item) => (
                        <Button
                            key={item.label}
                            {...getLinkProps(item.href)}
                            sx={{
                                px: 1.45,
                                py: 0.8,
                                borderRadius: '999px',
                                color: SITE_COLORS.muted,
                                fontWeight: 800,
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                '&:hover': { color: theme.palette.glass.accentText, background: theme.palette.glass.control }
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Stack>

                <Stack direction='row' spacing={{ xs: 0.8, sm: 1 }} sx={{ alignItems: 'center', flexShrink: 0 }}>
                    <LanguageSwitch languages={languages} currentLang={currentLang} onChange={handleChangeLanguage} compact />
                    <Button
                        component={RouterLink}
                        to='/signin'
                        sx={{
                            display: { xs: 'none', sm: 'inline-flex' },
                            color: SITE_COLORS.muted,
                            fontWeight: 900,
                            textTransform: 'none',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {copy.login}
                    </Button>
                    <Button
                        component={RouterLink}
                        to='/signin'
                        endIcon={<IconArrowRight size={17} />}
                        sx={{
                            ...getLiquidGlassControlSx(theme, {
                                display: { xs: 'none', md: 'inline-flex' },
                                minHeight: 42,
                                borderRadius: '8px',
                                px: 2,
                                fontWeight: 950,
                                textTransform: 'none',
                                whiteSpace: 'nowrap'
                            })
                        }}
                    >
                        {copy.trial}
                    </Button>
                    <IconButton
                        aria-label={copy.menu}
                        onClick={() => setOpen(true)}
                        sx={{
                            ...getLiquidGlassControlSx(theme, {
                                display: { xs: 'inline-flex', lg: 'none' },
                                width: 42,
                                height: 42,
                                borderRadius: '8px',
                                p: 0
                            })
                        }}
                    >
                        <IconMenu2 size={20} />
                    </IconButton>
                </Stack>
            </Stack>

            <Drawer anchor='right' open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: { xs: 300, sm: 360 }, p: 2 } }}>
                <Box
                    sx={getLiquidGlassPanelSx(theme, {
                        minHeight: '100%',
                        borderRadius: '8px',
                        p: 2.2
                    })}
                >
                    <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Typography sx={{ color: SITE_COLORS.text, fontWeight: 950 }}>{copy.menu}</Typography>
                        <IconButton onClick={() => setOpen(false)} aria-label='Close menu'>
                            <IconX size={20} />
                        </IconButton>
                    </Stack>
                    <Stack spacing={1}>
                        {links.map((item) => (
                            <Button
                                key={item.label}
                                {...getLinkProps(item.href)}
                                onClick={() => setOpen(false)}
                                sx={{
                                    justifyContent: 'flex-start',
                                    minHeight: 46,
                                    borderRadius: '8px',
                                    color: SITE_COLORS.text,
                                    fontWeight: 900,
                                    textTransform: 'none'
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                        <Button
                            component={RouterLink}
                            to='/signin'
                            onClick={() => setOpen(false)}
                            sx={getLiquidGlassControlSx(theme, {
                                mt: 1,
                                minHeight: 46,
                                borderRadius: '8px',
                                fontWeight: 950,
                                textTransform: 'none'
                            })}
                        >
                            {copy.trial}
                        </Button>
                    </Stack>
                </Box>
            </Drawer>
        </Box>
    )
}

HomeNavBar.propTypes = {
    copy: PropTypes.object.isRequired,
    languages: PropTypes.array.isRequired,
    currentLang: PropTypes.string,
    handleChangeLanguage: PropTypes.func.isRequired
}

export default HomeNavBar
