import PropTypes from 'prop-types'
import { Box, Link, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import FlowOpsLogoWhite from '@/assets/images/flowops_white.svg'
import { getLiquidGlassPanelSx } from '@/ui-component/utils/liquidGlassStyles'
import { LanguageSwitch, getLinkProps } from './shared'

const HomeFooter = ({ copy, languages, currentLang, handleChangeLanguage }) => {
    const theme = useTheme()

    return (
        <Box
            component='footer'
            className='public-section'
            sx={{
                px: { xs: 2, sm: 3, md: 6 },
                py: { xs: 5, md: 6 },
                color: '#f8fbff',
                backgroundColor: '#06101e',
                borderTop: `1px solid ${theme.palette.glass.border}`
            }}
        >
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '0.88fr 1.12fr' },
                        gap: { xs: 4, md: 6 },
                        alignItems: 'start'
                    }}
                >
                    <Box
                        className='public-reveal'
                        sx={getLiquidGlassPanelSx(theme, { p: 3, borderRadius: '8px', background: 'rgba(15,23,42,0.58)' })}
                    >
                        <Box component='img' src={FlowOpsLogoWhite} alt='FlowOps' sx={{ width: 156, height: 'auto' }} />
                        <Typography sx={{ mt: 2, color: 'rgba(248,251,255,0.72)', lineHeight: 1.75 }}>{copy.description}</Typography>
                        <Box sx={{ mt: 2.5 }}>
                            <LanguageSwitch
                                languages={languages}
                                currentLang={currentLang}
                                onChange={handleChangeLanguage}
                                compact={false}
                                dark
                            />
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                            gap: 2
                        }}
                    >
                        {copy.columns.map((column) => (
                            <Box key={column.title} className='public-reveal'>
                                <Typography sx={{ color: '#f8fbff', fontWeight: 950, mb: 1.4 }}>{column.title}</Typography>
                                <Stack spacing={1}>
                                    {column.links.map(([label, href]) => (
                                        <Link
                                            key={`${column.title}-${label}`}
                                            {...getLinkProps(href)}
                                            underline='hover'
                                            sx={{ color: 'rgba(248,251,255,0.66)', fontWeight: 700 }}
                                        >
                                            {label}
                                        </Link>
                                    ))}
                                </Stack>
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Typography
                    className='public-reveal'
                    sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.12)', color: 'rgba(248,251,255,0.56)' }}
                >
                    {copy.copyright}
                </Typography>
            </Box>
        </Box>
    )
}

HomeFooter.propTypes = {
    copy: PropTypes.object.isRequired,
    languages: PropTypes.array.isRequired,
    currentLang: PropTypes.string,
    handleChangeLanguage: PropTypes.func.isRequired
}

export default HomeFooter
