import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Button, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/i18n'

// ==============================|| AUTH LAYOUT (FlowOps shell) ||============================== //

const BG = '#08111f'

const AuthLayout = () => {
    const { i18n } = useTranslation()
    const [currentLang, setCurrentLang] = useState(i18n.resolvedLanguage || i18n.language)

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
                backgroundColor: BG,
                backgroundImage:
                    'linear-gradient(135deg, rgba(20,184,166,0.18) 0%, rgba(8,17,31,0) 32%), linear-gradient(315deg, rgba(37,99,235,0.16) 0%, rgba(8,17,31,0) 36%)'
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
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
                    backgroundColor: 'rgba(8,17,31,0.72)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)'
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
                                color: active ? '#042f2e' : '#e5e7eb',
                                backgroundColor: active ? '#5eead4' : 'transparent',
                                '&:hover': { backgroundColor: active ? '#5eead4' : 'rgba(255,255,255,0.10)' }
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
