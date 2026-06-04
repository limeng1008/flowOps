import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Button, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/i18n'

// ==============================|| AUTH LAYOUT (FlowOps shell) ||============================== //

const AuthLayout = () => {
    const theme = useTheme()
    const { i18n } = useTranslation()
    const [currentLang, setCurrentLang] = useState(i18n.resolvedLanguage || i18n.language)
    const isDark = theme.palette.mode === 'dark'

    const handleChangeLanguage = (lng) => {
        i18n.changeLanguage(lng)
        localStorage.setItem('language', lng)
        setCurrentLang(lng)
    }

    useEffect(() => {
        const onLanguageChanged = (lng) => setCurrentLang(lng)
        i18n.on('languageChanged', onLanguageChanged)
        return () => i18n.off('languageChanged', onLanguageChanged)
    }, [i18n])

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100vh',
                width: '100%',
                overflowX: 'hidden',
                backgroundColor: isDark ? '#07101d' : '#eef7ff',
                backgroundImage:
                    'radial-gradient(900px 520px at 12% 8%, rgba(9,124,255,0.20), transparent 58%), radial-gradient(820px 500px at 88% 16%, rgba(20,184,166,0.18), transparent 56%), linear-gradient(135deg, rgba(255,255,255,0.58), rgba(255,255,255,0.18))'
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
                    backgroundSize: '44px 44px',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.25))'
                }}
            />

            <Stack
                direction='row'
                spacing={1}
                sx={{
                    position: 'absolute',
                    top: 24,
                    right: 24,
                    zIndex: 2,
                    p: 0.5,
                    borderRadius: '999px',
                    background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 34%), ${theme.palette.glass.surfaceStrong}`,
                    border: `1px solid ${theme.palette.glass.border}`,
                    boxShadow: theme.palette.glass.shadow,
                    backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                    WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`
                }}
            >
                {SUPPORTED_LANGUAGES.map((lng) => {
                    const active = currentLang === lng.code || currentLang?.startsWith(`${lng.code}-`)
                    return (
                        <Button
                            key={lng.code}
                            size='small'
                            onClick={() => handleChangeLanguage(lng.code)}
                            sx={{
                                minWidth: 64,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '999px',
                                textTransform: 'none',
                                color: active ? '#042f2e' : theme.palette.text.primary,
                                backgroundColor: active ? theme.palette.secondary.main : 'transparent',
                                '&:hover': { backgroundColor: active ? theme.palette.secondary.main : theme.palette.glass.surface }
                            }}
                        >
                            {lng.label}
                        </Button>
                    )
                })}
            </Stack>

            {/* centered content */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    boxSizing: 'border-box'
                }}
            >
                <Outlet />
            </Box>
        </Box>
    )
}

export default AuthLayout
