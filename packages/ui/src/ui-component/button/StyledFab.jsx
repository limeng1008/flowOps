import { styled } from '@mui/material/styles'
import { Fab } from '@mui/material'

export const StyledFab = styled(Fab)(({ theme, color = 'primary' }) => ({
    color: 'white',
    backgroundColor: theme.palette[color].main,
    backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.28), transparent 42%)',
    boxShadow: `0 14px 30px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.28)' : 'rgba(2,132,199,0.22)'}`,
    transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
    '&:hover': {
        backgroundColor: theme.palette[color].main,
        backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.34), rgba(0,0,0,0.08))',
        boxShadow: `0 18px 36px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.34)' : 'rgba(2,132,199,0.28)'}`
    },
    '&:active': {
        transform: 'scale(0.98)'
    }
}))
