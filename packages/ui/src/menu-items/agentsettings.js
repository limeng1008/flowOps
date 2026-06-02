// assets
import {
    IconTrash,
    IconFileUpload,
    IconFileExport,
    IconCopy,
    IconMessage,
    IconAdjustmentsHorizontal,
    IconUsers,
    IconTemplate
} from '@tabler/icons-react'

// constant
const icons = {
    IconTrash,
    IconFileUpload,
    IconFileExport,
    IconCopy,
    IconMessage,
    IconAdjustmentsHorizontal,
    IconUsers,
    IconTemplate
}

// ==============================|| SETTINGS MENU ITEMS (Agentflow) ||============================== //

// Factory: takes the i18n `t` so menu titles re-translate on language change.
const buildAgentSettings = (t) => ({
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
            permission: 'agentflows:config'
        },
        {
            id: 'saveAsTemplate',
            title: t('canvas.saveAsTemplate'),
            type: 'item',
            url: '',
            icon: icons.IconTemplate,
            permission: 'templates:flowexport'
        },
        {
            id: 'duplicateChatflow',
            title: t('canvas.duplicateFlow', { type: t('canvas.agents') }),
            type: 'item',
            url: '',
            icon: icons.IconCopy,
            permission: 'agentflows:duplicate'
        },
        {
            id: 'loadChatflow',
            title: t('canvas.loadFlow', { type: t('canvas.agents') }),
            type: 'item',
            url: '',
            icon: icons.IconFileUpload,
            permission: 'agentflows:import'
        },
        {
            id: 'exportChatflow',
            title: t('canvas.exportFlow', { type: t('canvas.agents') }),
            type: 'item',
            url: '',
            icon: icons.IconFileExport,
            permission: 'agentflows:export'
        },
        {
            id: 'deleteChatflow',
            title: t('canvas.deleteFlow', { type: t('canvas.agents') }),
            type: 'item',
            url: '',
            icon: icons.IconTrash,
            permission: 'agentflows:delete'
        }
    ]
})

export default buildAgentSettings
