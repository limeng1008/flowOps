import { alpha, styled } from '@mui/material/styles'
import { Fab } from '@mui/material'

const getTint = (theme, color, opacity, fallback) => {
    const source = theme.palette[color]?.main || theme.palette.glass?.accent || theme.palette.primary.main

    try {
        return alpha(source, opacity)
    } catch {
        return fallback
    }
}

export const StyledFab = styled(Fab)(({ theme, color = 'primary' }) => ({
    color:
        theme.palette.mode === 'dark'
            ? theme.palette.glass?.accentText || theme.palette.common.white
            : theme.palette[color]?.dark || theme.palette.glass?.accentText || theme.palette.primary.dark,
    border: `1px solid ${theme.palette.glass?.border || 'rgba(255,255,255,0.68)'}`,
    background: `linear-gradient(145deg, ${
        theme.palette.glass?.highlight || 'rgba(255,255,255,0.88)'
    }, transparent 34%), linear-gradient(135deg, ${getTint(
        theme,
        color,
        0.16,
        theme.palette.glass?.accentSoft || 'rgba(10,132,255,0.16)'
    )}, rgba(255,255,255,0.10)), ${theme.palette.glass?.control || 'rgba(255,255,255,0.56)'}`,
    boxShadow: theme.palette.glass?.controlShadow || '0 18px 44px rgba(15, 23, 42, 0.12)',
    backdropFilter: `blur(${theme.palette.glass?.blur || '24px'}) saturate(1.45)`,
    WebkitBackdropFilter: `blur(${theme.palette.glass?.blur || '24px'}) saturate(1.45)`,
    transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease',
    '&:hover': {
        borderColor: getTint(theme, color, 0.32, theme.palette.glass?.accentStrong || 'rgba(10,132,255,0.28)'),
        background: `linear-gradient(145deg, ${
            theme.palette.glass?.highlight || 'rgba(255,255,255,0.88)'
        }, transparent 28%), linear-gradient(135deg, ${getTint(
            theme,
            color,
            0.26,
            theme.palette.glass?.accentStrong || 'rgba(10,132,255,0.28)'
        )}, rgba(255,255,255,0.16)), ${theme.palette.glass?.controlHover || 'rgba(255,255,255,0.74)'}`,
        boxShadow: theme.palette.glass?.controlShadow || '0 18px 44px rgba(15, 23, 42, 0.12)'
    },
    '&:active': {
        transform: 'scale(0.98)'
    }
}))
