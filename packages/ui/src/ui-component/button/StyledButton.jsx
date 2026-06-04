import { styled } from '@mui/material/styles'
import { Button } from '@mui/material'
import MuiToggleButton from '@mui/material/ToggleButton'

export const StyledButton = styled(Button)(({ theme, color = 'primary' }) => ({
    color: 'white',
    borderRadius: '999px',
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

export const StyledToggleButton = styled(MuiToggleButton)(({ theme, color = 'primary' }) => ({
    '&.Mui-selected, &.Mui-selected:hover': {
        color: 'white',
        backgroundColor: theme.palette[color].main
    }
}))
