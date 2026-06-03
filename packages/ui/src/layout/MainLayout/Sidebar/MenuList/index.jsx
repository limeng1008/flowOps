// material-ui
import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

// project imports
import NavGroup from './NavGroup'
import { menuItems } from '@/menu-items'

// ==============================|| SIDEBAR MENU LIST ||============================== //

const MenuList = () => {
    const { t } = useTranslation()

    const navItems = menuItems.items.map((item) => {
        switch (item.type) {
            case 'group':
                return <NavGroup key={item.id} item={item} />
            default:
                return (
                    <Typography key={item.id} variant='h6' color='error' align='center'>
                        {t('layout.menuItemsError')}
                    </Typography>
                )
        }
    })

    return <Box>{navItems}</Box>
}

export default MenuList
