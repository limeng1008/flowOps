import { alpha, styled } from '@mui/material/styles'
import { Button } from '@mui/material'
import MuiToggleButton from '@mui/material/ToggleButton'

const getTint = (theme, color, opacity, fallback) => {
    const source = theme.palette[color]?.main || theme.palette.glass?.accent || theme.palette.primary.main

    try {
        return alpha(source, opacity)
    } catch {
        return fallback
    }
}

export const StyledButton = styled(Button)(({ theme, color = 'primary' }) => ({
    color:
        theme.palette.mode === 'dark'
            ? theme.palette.glass?.accentText || theme.palette.common.white
            : theme.palette[color]?.dark || theme.palette.glass?.accentText || theme.palette.primary.dark,
    borderRadius: '18px',
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
    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
        color: 'inherit'
    },
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
    },
    '&.Mui-disabled': {
        boxShadow: 'none',
        background: theme.palette.glass?.surface || 'rgba(255,255,255,0.5)'
    }
}))

export const StyledToggleButton = styled(MuiToggleButton)(({ theme, color = 'primary' }) => ({
    borderColor: theme.palette.glass?.border || 'rgba(255,255,255,0.68)',
    background: `linear-gradient(145deg, ${theme.palette.glass?.highlight || 'rgba(255,255,255,0.88)'}, transparent 34%), ${
        theme.palette.glass?.control || 'rgba(255,255,255,0.56)'
    }`,
    backdropFilter: `blur(${theme.palette.glass?.blur || '24px'}) saturate(1.45)`,
    WebkitBackdropFilter: `blur(${theme.palette.glass?.blur || '24px'}) saturate(1.45)`,
    '&.Mui-selected, &.Mui-selected:hover': {
        color:
            theme.palette.mode === 'dark'
                ? theme.palette.glass?.accentText || theme.palette.common.white
                : theme.palette[color]?.dark || theme.palette.glass?.accentText || theme.palette.primary.dark,
        background: `linear-gradient(145deg, ${
            theme.palette.glass?.highlight || 'rgba(255,255,255,0.88)'
        }, transparent 28%), linear-gradient(135deg, ${getTint(
            theme,
            color,
            0.22,
            theme.palette.glass?.accentStrong || 'rgba(10,132,255,0.28)'
        )}, rgba(255,255,255,0.16)), ${theme.palette.glass?.controlHover || 'rgba(255,255,255,0.74)'}`,
        boxShadow: `inset 0 0 0 1px ${getTint(theme, color, 0.32, theme.palette.glass?.accentStrong || 'rgba(10,132,255,0.28)')}`
    }
}))
