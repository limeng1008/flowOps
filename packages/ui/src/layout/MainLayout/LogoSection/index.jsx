import { Link } from 'react-router-dom'

// material-ui
import { ButtonBase } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import config from '@/config'
import Logo from '@/ui-component/extended/Logo'
import { getLiquidGlassControlSx } from '@/ui-component/utils/liquidGlassStyles'

// ==============================|| MAIN LOGO ||============================== //

const LogoSection = () => {
    const theme = useTheme()

    return (
        <ButtonBase
            disableRipple
            component={Link}
            to={config.defaultPath}
            sx={{
                minHeight: 48,
                px: 1.25,
                py: 0.75,
                ml: { xs: 0, md: 1 },
                borderRadius: '18px',
                overflow: 'hidden',
                ...getLiquidGlassControlSx(theme)
            }}
        >
            <Logo />
        </ButtonBase>
    )
}

export default LogoSection
