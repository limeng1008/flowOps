export const getLiquidGlassControlSx = (theme, sx = {}) => ({
    color: theme.palette.glass.accentText,
    background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 34%), linear-gradient(135deg, ${theme.palette.glass.accentSoft}, rgba(255,255,255,0.10)), ${theme.palette.glass.control}`,
    border: `1px solid ${theme.palette.glass.border}`,
    boxShadow: theme.palette.glass.controlShadow,
    backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
    WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
    transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease',
    '&:hover': {
        color: theme.palette.glass.accentText,
        background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 28%), linear-gradient(135deg, ${theme.palette.glass.accentStrong}, rgba(255,255,255,0.16)), ${theme.palette.glass.controlHover}`,
        borderColor: theme.palette.glass.accentStrong,
        boxShadow: theme.palette.glass.controlShadow
    },
    '&:active': {
        transform: 'scale(0.98)'
    },
    ...sx
})

export const getLiquidGlassPanelSx = (theme, sx = {}) => ({
    background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 34%), ${theme.palette.glass.surfaceStrong}`,
    border: `1px solid ${theme.palette.glass.border}`,
    boxShadow: theme.palette.glass.shadow,
    backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
    WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
    ...sx
})
