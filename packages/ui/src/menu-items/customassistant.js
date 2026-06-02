// assets
import { IconTrash, IconMessage, IconAdjustmentsHorizontal, IconUsers } from '@tabler/icons-react'

// constant
const icons = {
    IconTrash,
    IconMessage,
    IconAdjustmentsHorizontal,
    IconUsers
}

// ==============================|| SETTINGS MENU ITEMS (Custom Assistant) ||============================== //

// Factory: takes the i18n `t` so menu titles re-translate on language change.
const buildCustomAssistantSettings = (t) => ({
    id: 'settings',
    title: '',
    type: 'group',
    children: [
        {
            id: 'viewMessages',
            title: t('canvas.viewMessages'),
            type: 'item',
            url: '',
            icon: icons.IconMessage
        },
        {
            id: 'viewLeads',
            title: t('canvas.viewLeads'),
            type: 'item',
            url: '',
            icon: icons.IconUsers
        },
        {
            id: 'chatflowConfiguration',
            title: t('canvas.configuration'),
            type: 'item',
            url: '',
            icon: icons.IconAdjustmentsHorizontal,
            permission: 'assistants:update'
        },
        {
            id: 'deleteAssistant',
            title: t('canvas.deleteAssistant'),
            type: 'item',
            url: '',
            icon: icons.IconTrash,
            permission: 'assistants:delete'
        }
    ]
})

export default buildCustomAssistantSettings
