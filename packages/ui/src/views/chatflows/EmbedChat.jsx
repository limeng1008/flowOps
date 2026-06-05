import { useState } from 'react'
import PropTypes from 'prop-types'

import { Tabs, Tab, Box } from '@mui/material'
import { CopyBlock, atomOneDark } from 'react-code-blocks'
import { useTranslation } from 'react-i18next'

// Project import
import { CheckboxInput } from '@/ui-component/checkbox/Checkbox'

// Const
import { baseURL } from '@/store/constant'

function TabPanel(props) {
    const { children, value, index, ...other } = props
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`attachment-tabpanel-${index}`}
            aria-labelledby={`attachment-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

function a11yProps(index) {
    return {
        id: `attachment-tab-${index}`,
        'aria-controls': `attachment-tabpanel-${index}`
    }
}

const embedPopupHtmlCode = (chatflowid) => {
    return `<script type="module">
    import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"
    Chatbot.init({
        chatflowid: "${chatflowid}",
        apiHost: "${baseURL}",
    })
</script>`
}

const embedPopupReactCode = (chatflowid) => {
    return `import { BubbleChat } from 'flowise-embed-react'

const App = () => {
    return (
        <BubbleChat
            chatflowid="${chatflowid}"
            apiHost="${baseURL}"
        />
    );
};`
}

const embedFullpageHtmlCode = (chatflowid) => {
    return `<flowise-fullchatbot></flowise-fullchatbot>
<script type="module">
    import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"
    Chatbot.initFull({
        chatflowid: "${chatflowid}",
        apiHost: "${baseURL}",
    })
</script>`
}

const embedFullpageReactCode = (chatflowid) => {
    return `import { FullPageChat } from "flowise-embed-react"

const App = () => {
    return (
        <FullPageChat
            chatflowid="${chatflowid}"
            apiHost="${baseURL}"
        />
    );
};`
}

const getDefaultThemeConfig = (t) => ({
    button: {
        backgroundColor: '#7C3AED',
        right: 20,
        bottom: 20,
        size: 48,
        dragAndDrop: true,
        iconColor: 'white',
        customIconSrc: '/flowops-icon.svg',
        autoWindowOpen: {
            autoOpen: true,
            openDelay: 2,
            autoOpenOnMobile: false
        }
    },
    tooltip: {
        showTooltip: true,
        tooltipMessage: t('pages.chatflows.embedTheme.tooltipMessage'),
        tooltipBackgroundColor: 'black',
        tooltipTextColor: 'white',
        tooltipFontSize: 16
    },
    disclaimer: {
        title: t('pages.chatflows.embedTheme.disclaimerTitle'),
        message: t('pages.chatflows.embedTheme.disclaimerMessage'),
        textColor: 'black',
        buttonColor: '#7C3AED',
        buttonText: t('pages.chatflows.embedTheme.startChatting'),
        buttonTextColor: 'white',
        blurredBackgroundColor: 'rgba(0, 0, 0, 0.4)',
        backgroundColor: 'white'
    },
    customCSS: ``,
    chatWindow: {
        showTitle: true,
        showAgentMessages: true,
        title: 'FlowOps Bot',
        titleAvatarSrc: '/flowops-icon.svg',
        welcomeMessage: t('pages.chatflows.embedTheme.welcomeMessage'),
        errorMessage: t('pages.chatflows.embedTheme.errorMessage'),
        backgroundColor: '#ffffff',
        backgroundImage: t('pages.chatflows.embedTheme.backgroundImage'),
        height: 700,
        width: 400,
        fontSize: 16,
        starterPrompts: [t('pages.chatflows.embedTheme.starterPromptBot'), t('pages.chatflows.embedTheme.starterPromptWho')],
        starterPromptFontSize: 15,
        clearChatOnReload: false,
        sourceDocsTitle: t('pages.chatflows.embedTheme.sources'),
        renderHTML: true,
        botMessage: {
            backgroundColor: '#f7f8ff',
            textColor: '#303235',
            showAvatar: true,
            avatarSrc: '/flowops-icon.svg'
        },
        userMessage: {
            backgroundColor: '#7C3AED',
            textColor: '#ffffff',
            showAvatar: true,
            avatarSrc: 'https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/usericon.png'
        },
        textInput: {
            placeholder: t('pages.chatflows.embedTheme.inputPlaceholder'),
            backgroundColor: '#ffffff',
            textColor: '#303235',
            sendButtonColor: '#7C3AED',
            maxChars: 50,
            maxCharsWarningMessage: t('pages.chatflows.embedTheme.maxCharsWarning'),
            autoFocus: true,
            sendMessageSound: true,
            sendSoundLocation: 'send_message.mp3',
            receiveMessageSound: true,
            receiveSoundLocation: 'receive_message.mp3'
        },
        feedback: {
            color: '#303235'
        },
        dateTimeToggle: {
            date: true,
            time: true
        },
        footer: {
            textColor: '#303235',
            text: t('pages.chatflows.embedTheme.poweredBy'),
            company: 'FlowOps',
            companyLink: '/'
        }
    }
})

const customStringify = (obj) => {
    let stringified = JSON.stringify(obj, null, 4)
        .replace(/"([^"]+)":/g, '$1:')
        .replace(/: "([^"]+)"/g, (match, value) => (value.includes('<') ? `: "${value}"` : `: '${value}'`))
        .replace(/: "(true|false|\d+)"/g, ': $1')
        .replace(/customCSS: ""/g, 'customCSS: ``')
    return stringified
        .split('\n')
        .map((line, index) => {
            if (index === 0) return line
            return ' '.repeat(8) + line
        })
        .join('\n')
}

const embedPopupHtmlCodeCustomization = (chatflowid, themeConfig) => {
    return `<script type="module">
    import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"
    Chatbot.init({
        chatflowid: "${chatflowid}",
        apiHost: "${baseURL}",
        chatflowConfig: {
            /* Chatflow Config */
        },
        observersConfig: {
            /* Observers Config */
        },
        theme: ${customStringify(themeConfig)}
    })
</script>`
}

const embedPopupReactCodeCustomization = (chatflowid, themeConfig) => {
    return `import { BubbleChat } from 'flowise-embed-react'

const App = () => {
    return (
        <BubbleChat
            chatflowid="${chatflowid}"
            apiHost="${baseURL}"
            chatflowConfig={{
                /* Chatflow Config */
            }}
            observersConfig={{
                /* Observers Config */
            }}
            theme={{${customStringify(themeConfig)
                .substring(1)
                .split('\n')
                .map((line) => ' '.repeat(4) + line)
                .join('\n')}
        />
    )
}`
}

const getFullPageThemeConfig = (themeConfig) => {
    return {
        ...themeConfig,
        chatWindow: {
            ...themeConfig.chatWindow,
            height: '100%',
            width: '100%'
        }
    }
}

const embedFullpageHtmlCodeCustomization = (chatflowid, themeConfig) => {
    return `<flowise-fullchatbot></flowise-fullchatbot>
<script type="module">
    import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"
    Chatbot.initFull({
        chatflowid: "${chatflowid}",
        apiHost: "${baseURL}",
        chatflowConfig: {
            /* Chatflow Config */
        },
        observersConfig: {
            /* Observers Config */
        },
        theme: ${customStringify(getFullPageThemeConfig(themeConfig))}
    })
</script>`
}

const embedFullpageReactCodeCustomization = (chatflowid, themeConfig) => {
    return `import { FullPageChat } from 'flowise-embed-react'

const App = () => {
    return (
        <FullPageChat
            chatflowid="${chatflowid}"
            apiHost="${baseURL}"
            chatflowConfig={{
                /* Chatflow Config */
            }}
            observersConfig={{
                /* Observers Config */
            }}
            theme={{${customStringify(getFullPageThemeConfig(themeConfig))
                .substring(1)
                .split('\n')
                .map((line) => ' '.repeat(4) + line)
                .join('\n')}
        />
    )
}`
}

const EmbedChat = ({ chatflowid }) => {
    const { t } = useTranslation()
    const themeConfig = getDefaultThemeConfig(t)
    const codes = [
        { value: 'popupHtml', label: t('pages.chatflows.embed.popupHtml') },
        { value: 'fullpageHtml', label: t('pages.chatflows.embed.fullpageHtml') },
        { value: 'popupReact', label: t('pages.chatflows.embed.popupReact') },
        { value: 'fullpageReact', label: t('pages.chatflows.embed.fullpageReact') }
    ]
    const [value, setValue] = useState(0)
    const [embedChatCheckboxVal, setEmbedChatCheckbox] = useState(false)

    const onCheckBoxEmbedChatChanged = (newVal) => {
        setEmbedChatCheckbox(newVal)
    }

    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

    const getCode = (codeType) => {
        switch (codeType) {
            case 'popupHtml':
                return embedPopupHtmlCode(chatflowid)
            case 'fullpageHtml':
                return embedFullpageHtmlCode(chatflowid)
            case 'popupReact':
                return embedPopupReactCode(chatflowid)
            case 'fullpageReact':
                return embedFullpageReactCode(chatflowid)
            default:
                return ''
        }
    }

    const getCodeCustomization = (codeType) => {
        switch (codeType) {
            case 'popupHtml':
                return embedPopupHtmlCodeCustomization(chatflowid, themeConfig)
            case 'fullpageHtml':
                return embedFullpageHtmlCodeCustomization(chatflowid, themeConfig)
            case 'popupReact':
                return embedPopupReactCodeCustomization(chatflowid, themeConfig)
            case 'fullpageReact':
                return embedFullpageReactCodeCustomization(chatflowid, themeConfig)
            default:
                return embedPopupHtmlCodeCustomization(chatflowid, themeConfig)
        }
    }

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <div style={{ flex: 80 }}>
                    <Tabs value={value} onChange={handleChange} aria-label='tabs'>
                        {codes.map((code, index) => (
                            <Tab key={code.value} label={code.label} {...a11yProps(index)}></Tab>
                        ))}
                    </Tabs>
                </div>
            </div>
            <div style={{ marginTop: 10 }}></div>
            {codes.map((code, index) => (
                <TabPanel key={code.value} value={value} index={index}>
                    {(value === 0 || value === 1) && (
                        <>
                            <span>
                                {t('pages.chatflows.embed.pasteInBody')}
                                <p>
                                    {t('pages.chatflows.embed.versionHelpPrefix')}&nbsp;
                                    <a
                                        rel='noreferrer'
                                        target='_blank'
                                        href='https://www.npmjs.com/package/flowise-embed?activeTab=versions'
                                    >
                                        {t('pages.chatflows.embed.version')}
                                    </a>
                                    :&nbsp;<code>{`https://cdn.jsdelivr.net/npm/flowise-embed@<version>/dist/web.js`}</code>
                                </p>
                            </span>
                            <div style={{ height: 10 }}></div>
                        </>
                    )}
                    <CopyBlock theme={atomOneDark} text={getCode(code.value)} language='javascript' showLineNumbers={false} wrapLines />

                    <CheckboxInput
                        label={t('pages.chatflows.embed.showConfig')}
                        value={embedChatCheckboxVal}
                        onChange={onCheckBoxEmbedChatChanged}
                    />

                    {embedChatCheckboxVal && (
                        <CopyBlock
                            theme={atomOneDark}
                            text={getCodeCustomization(code.value)}
                            language='javascript'
                            showLineNumbers={false}
                            wrapLines
                        />
                    )}
                </TabPanel>
            ))}
        </>
    )
}

EmbedChat.propTypes = {
    chatflowid: PropTypes.string
}

export default EmbedChat
