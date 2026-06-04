import PropTypes from 'prop-types'
import { Box, Button, FormControl, ListItem, ListItemAvatar, ListItemText, MenuItem, Select, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useTheme } from '@mui/material/styles'

// Project Imports
import { StyledButton } from '@/ui-component/button/StyledButton'
import { SwitchInput } from '@/ui-component/switch/Switch'
import chatflowsApi from '@/api/chatflows'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction, SET_CHATFLOW } from '@/store/actions'
import useNotifier from '@/utils/useNotifier'
import anthropicIcon from '@/assets/images/anthropic.svg'
import azureOpenAiIcon from '@/assets/images/azure_openai.svg'
import mistralAiIcon from '@/assets/images/mistralai.svg'
import openAiIcon from '@/assets/images/openai.svg'
import groqIcon from '@/assets/images/groq.png'
import geminiIcon from '@/assets/images/gemini.png'
import ollamaIcon from '@/assets/images/ollama.svg'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import CredentialInputHandler from '@/views/canvas/CredentialInputHandler'
import { Input } from '@/ui-component/input/Input'
import { AsyncDropdown } from '@/ui-component/dropdown/AsyncDropdown'

// Icons
import { IconX } from '@tabler/icons-react'
import { Dropdown } from '@/ui-component/dropdown/Dropdown'
import { useTranslation } from 'react-i18next'

// update when adding new providers
const FollowUpPromptProviders = {
    ANTHROPIC: 'chatAnthropic',
    AZURE_OPENAI: 'azureChatOpenAI',
    GOOGLE_GENAI: 'chatGoogleGenerativeAI',
    GROQ: 'groqChat',
    MISTRALAI: 'chatMistralAI',
    OPENAI: 'chatOpenAI',
    OLLAMA: 'ollama'
}

const followUpPromptsOptions = {
    [FollowUpPromptProviders.ANTHROPIC]: {
        label: 'Anthropic Claude',
        name: FollowUpPromptProviders.ANTHROPIC,
        icon: anthropicIcon,
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['anthropicApi']
            },
            {
                labelKey: 'canvas.chatConfig.modelName',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels'
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.followUpPromptDescription',
                optional: true,
                defaultKey: 'canvas.chatConfig.followUpDefaultPrompt'
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                optional: true,
                default: 0.9
            }
        ]
    },
    [FollowUpPromptProviders.AZURE_OPENAI]: {
        label: 'Azure ChatOpenAI',
        name: FollowUpPromptProviders.AZURE_OPENAI,
        icon: azureOpenAiIcon,
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['azureOpenAIApi']
            },
            {
                labelKey: 'canvas.chatConfig.modelName',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels'
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.followUpPromptDescription',
                optional: true,
                defaultKey: 'canvas.chatConfig.followUpDefaultPrompt'
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                optional: true,
                default: 0.9
            }
        ]
    },
    [FollowUpPromptProviders.GOOGLE_GENAI]: {
        label: 'Google Gemini',
        name: FollowUpPromptProviders.GOOGLE_GENAI,
        icon: geminiIcon,
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['googleGenerativeAI']
            },
            {
                labelKey: 'canvas.chatConfig.modelName',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels'
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.followUpPromptDescription',
                optional: true,
                defaultKey: 'canvas.chatConfig.followUpDefaultPrompt'
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                optional: true,
                default: 0.9
            }
        ]
    },
    [FollowUpPromptProviders.GROQ]: {
        label: 'Groq',
        name: FollowUpPromptProviders.GROQ,
        icon: groqIcon,
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['groqApi']
            },
            {
                labelKey: 'canvas.chatConfig.modelName',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels'
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.followUpPromptDescription',
                optional: true,
                defaultKey: 'canvas.chatConfig.followUpDefaultPrompt'
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                optional: true,
                default: 0.9
            }
        ]
    },
    [FollowUpPromptProviders.MISTRALAI]: {
        label: 'Mistral AI',
        name: FollowUpPromptProviders.MISTRALAI,
        icon: mistralAiIcon,
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['mistralAIApi']
            },
            {
                labelKey: 'canvas.chatConfig.modelName',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels'
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.followUpPromptDescription',
                optional: true,
                defaultKey: 'canvas.chatConfig.followUpDefaultPrompt'
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                optional: true,
                default: 0.9
            }
        ]
    },
    [FollowUpPromptProviders.OPENAI]: {
        label: 'OpenAI',
        name: FollowUpPromptProviders.OPENAI,
        icon: openAiIcon,
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['openAIApi']
            },
            {
                labelKey: 'canvas.chatConfig.modelName',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels'
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.followUpPromptDescription',
                optional: true,
                defaultKey: 'canvas.chatConfig.followUpDefaultPrompt'
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                optional: true,
                default: 0.9
            }
        ]
    },
    [FollowUpPromptProviders.OLLAMA]: {
        label: 'Ollama',
        name: FollowUpPromptProviders.OLLAMA,
        icon: ollamaIcon,
        inputs: [
            {
                labelKey: 'canvas.chatConfig.baseUrl',
                name: 'baseUrl',
                type: 'string',
                placeholder: 'http://127.0.0.1:11434',
                descriptionKey: 'canvas.chatConfig.ollamaBaseUrlDescription',
                default: 'http://127.0.0.1:11434'
            },
            {
                labelKey: 'canvas.chatConfig.modelName',
                name: 'modelName',
                type: 'string',
                placeholder: 'llama2',
                descriptionKey: 'canvas.chatConfig.ollamaModelNameDescription',
                default: 'llama3.2-vision:latest'
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.followUpPromptDescription',
                optional: true,
                defaultKey: 'canvas.chatConfig.followUpDefaultPrompt'
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                optional: true,
                default: 0.7
            }
        ]
    }
}

const FollowUpPrompts = ({ dialogProps }) => {
    const { t } = useTranslation()
    const dispatch = useDispatch()

    useNotifier()
    const theme = useTheme()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [followUpPromptsConfig, setFollowUpPromptsConfig] = useState({})
    const [chatbotConfig, setChatbotConfig] = useState({})
    const [selectedProvider, setSelectedProvider] = useState('none')

    const handleChange = (key, value) => {
        setFollowUpPromptsConfig({
            ...followUpPromptsConfig,
            [key]: value
        })
    }

    const handleSelectedProviderChange = (event) => {
        const selectedProvider = event.target.value
        setSelectedProvider(selectedProvider)
        handleChange('selectedProvider', selectedProvider)
    }

    const setValue = (value, providerName, inputParamName) => {
        let newVal = {}
        if (!Object.prototype.hasOwnProperty.call(followUpPromptsConfig, providerName)) {
            newVal = { ...followUpPromptsConfig, [providerName]: {} }
        } else {
            newVal = { ...followUpPromptsConfig }
        }

        newVal[providerName][inputParamName] = value
        if (inputParamName === 'status' && value === true) {
            // ensure that the others are turned off
            Object.keys(followUpPromptsOptions).forEach((key) => {
                const provider = followUpPromptsOptions[key]
                if (provider.name !== providerName) {
                    newVal[provider.name] = { ...followUpPromptsConfig[provider.name], status: false }
                }
            })
        }
        setFollowUpPromptsConfig(newVal)
        return newVal
    }

    const getLocalizedDefault = (inputParam) => {
        if (inputParam.defaultKey === 'canvas.chatConfig.followUpDefaultPrompt') return t('canvas.chatConfig.followUpDefaultPrompt')
        if (inputParam.defaultKey) return t(inputParam.defaultKey)
        return inputParam.default
    }

    const localizeInputParam = (inputParam) => ({
        ...inputParam,
        label: inputParam.labelKey ? t(inputParam.labelKey) : inputParam.label,
        description: inputParam.descriptionKey ? t(inputParam.descriptionKey) : inputParam.description,
        default: getLocalizedDefault(inputParam),
        options: inputParam.options?.map((option) => ({
            ...option,
            label: option.labelKey ? t(option.labelKey) : option.label
        }))
    })

    const onSave = async () => {
        // TODO: saving without changing the prompt will not save the prompt
        try {
            let value = {
                followUpPrompts: { status: followUpPromptsConfig.status }
            }
            chatbotConfig.followUpPrompts = value.followUpPrompts

            // if the prompt is not set, save the default prompt
            const selectedProvider = followUpPromptsConfig.selectedProvider

            if (selectedProvider && followUpPromptsConfig[selectedProvider] && followUpPromptsOptions[selectedProvider]) {
                const localizedInputs = followUpPromptsOptions[selectedProvider].inputs.map(localizeInputParam)

                if (!followUpPromptsConfig[selectedProvider].prompt) {
                    followUpPromptsConfig[selectedProvider].prompt = localizedInputs.find((input) => input.name === 'prompt')?.default
                }

                if (!followUpPromptsConfig[selectedProvider].temperature) {
                    followUpPromptsConfig[selectedProvider].temperature = localizedInputs.find(
                        (input) => input.name === 'temperature'
                    )?.default
                }
            }

            const saveResp = await chatflowsApi.updateChatflow(dialogProps.chatflow.id, {
                chatbotConfig: JSON.stringify(chatbotConfig),
                followUpPrompts: JSON.stringify(followUpPromptsConfig)
            })
            if (saveResp.data) {
                enqueueSnackbar({
                    message: t('canvas.chatConfig.followUpPromptsSaved'),
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                dispatch({ type: SET_CHATFLOW, chatflow: saveResp.data })
            }
        } catch (error) {
            const errorData = error.response.data || `${error.response.status}: ${error.response.statusText}`
            enqueueSnackbar({
                message: t('canvas.chatConfig.followUpPromptsSaveFailed', { message: errorData }),
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    useEffect(() => {
        if (!dialogProps.chatflow) return
        // Load chatbotConfig unconditionally — otherwise saving follow-up prompts
        // writes an empty object and wipes starterPrompts/leads/allowedOrigins/etc.
        if (dialogProps.chatflow.chatbotConfig) {
            try {
                setChatbotConfig(JSON.parse(dialogProps.chatflow.chatbotConfig) || {})
            } catch {
                setChatbotConfig({})
            }
        }
        if (dialogProps.chatflow.followUpPrompts) {
            try {
                const followUpPromptsConfig = JSON.parse(dialogProps.chatflow.followUpPrompts)
                if (followUpPromptsConfig) {
                    setFollowUpPromptsConfig(followUpPromptsConfig)
                    setSelectedProvider(followUpPromptsConfig.selectedProvider)
                }
            } catch {
                // ignore malformed stored config
            }
        }

        return () => {}
    }, [dialogProps])

    const checkDisabled = () => {
        if (followUpPromptsConfig && followUpPromptsConfig.status) {
            if (selectedProvider === 'none') {
                return true
            }
            const provider = followUpPromptsOptions[selectedProvider]
            for (let inputParam of provider.inputs) {
                if (!inputParam.optional) {
                    const param = inputParam.name === 'credential' ? 'credentialId' : inputParam.name
                    if (
                        !followUpPromptsConfig[selectedProvider] ||
                        !followUpPromptsConfig[selectedProvider][param] ||
                        followUpPromptsConfig[selectedProvider][param] === ''
                    ) {
                        return true
                    }
                }
            }
        }
        return false
    }

    return (
        <>
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'start',
                    justifyContent: 'start',
                    gap: 3,
                    mb: 2
                }}
            >
                <SwitchInput
                    label={t('canvas.chatConfig.enableFollowUpPrompts')}
                    onChange={(value) => handleChange('status', value)}
                    value={followUpPromptsConfig.status}
                />
                {followUpPromptsConfig && followUpPromptsConfig.status && (
                    <>
                        <Typography variant='h5'>{t('canvas.chatConfig.providers')}</Typography>
                        <FormControl fullWidth>
                            <Select
                                size='small'
                                value={selectedProvider}
                                onChange={handleSelectedProviderChange}
                                sx={{
                                    '& .MuiSvgIcon-root': {
                                        color: theme?.customization?.isDarkMode ? '#fff' : 'inherit'
                                    }
                                }}
                            >
                                {Object.values(followUpPromptsOptions).map((provider) => (
                                    <MenuItem key={provider.name} value={provider.name}>
                                        {provider.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selectedProvider !== 'none' && (
                            <>
                                <ListItem sx={{ p: 0 }} alignItems='center'>
                                    <ListItemAvatar>
                                        <div
                                            style={{
                                                width: 50,
                                                height: 50,
                                                borderRadius: '50%',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <img
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    padding: 10,
                                                    objectFit: 'contain'
                                                }}
                                                alt='AI'
                                                src={followUpPromptsOptions[selectedProvider].icon}
                                            />
                                        </div>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={followUpPromptsOptions[selectedProvider].label}
                                        secondary={
                                            <a target='_blank' rel='noreferrer' href={followUpPromptsOptions[selectedProvider].url}>
                                                {followUpPromptsOptions[selectedProvider].url}
                                            </a>
                                        }
                                    />
                                </ListItem>
                                {followUpPromptsOptions[selectedProvider].inputs.map((inputParam, index) => {
                                    const localizedInputParam = localizeInputParam(inputParam)
                                    return (
                                        <Box key={index} sx={{ px: 2, width: '100%' }}>
                                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                                                <Typography>
                                                    {localizedInputParam.label}
                                                    {!localizedInputParam.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                                                    {localizedInputParam.description && (
                                                        <TooltipWithParser
                                                            style={{ marginLeft: 10 }}
                                                            title={localizedInputParam.description}
                                                        />
                                                    )}
                                                </Typography>
                                            </div>
                                            {localizedInputParam.type === 'credential' && (
                                                <CredentialInputHandler
                                                    key={`${selectedProvider}-${localizedInputParam.name}`}
                                                    data={
                                                        followUpPromptsConfig[selectedProvider]?.credentialId
                                                            ? { credential: followUpPromptsConfig[selectedProvider].credentialId }
                                                            : {}
                                                    }
                                                    inputParam={localizedInputParam}
                                                    onSelect={(newValue) => setValue(newValue, selectedProvider, 'credentialId')}
                                                />
                                            )}

                                            {(localizedInputParam.type === 'string' ||
                                                localizedInputParam.type === 'password' ||
                                                localizedInputParam.type === 'number') && (
                                                <Input
                                                    key={`${selectedProvider}-${localizedInputParam.name}`}
                                                    inputParam={localizedInputParam}
                                                    onChange={(newValue) => setValue(newValue, selectedProvider, localizedInputParam.name)}
                                                    value={
                                                        followUpPromptsConfig[selectedProvider] &&
                                                        followUpPromptsConfig[selectedProvider][localizedInputParam.name]
                                                            ? followUpPromptsConfig[selectedProvider][localizedInputParam.name]
                                                            : localizedInputParam.default ?? ''
                                                    }
                                                />
                                            )}

                                            {localizedInputParam.type === 'asyncOptions' && (
                                                <>
                                                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                                                        <AsyncDropdown
                                                            key={`${selectedProvider}-${localizedInputParam.name}`}
                                                            name={localizedInputParam.name}
                                                            nodeData={{
                                                                name: followUpPromptsOptions[selectedProvider].name,
                                                                inputParams:
                                                                    followUpPromptsOptions[selectedProvider].inputs.map(localizeInputParam)
                                                            }}
                                                            value={
                                                                followUpPromptsConfig[selectedProvider] &&
                                                                followUpPromptsConfig[selectedProvider][localizedInputParam.name]
                                                                    ? followUpPromptsConfig[selectedProvider][localizedInputParam.name]
                                                                    : localizedInputParam.default ?? t('common.chooseOption')
                                                            }
                                                            onSelect={(newValue) =>
                                                                setValue(newValue, selectedProvider, localizedInputParam.name)
                                                            }
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {localizedInputParam.type === 'options' && (
                                                <Dropdown
                                                    name={localizedInputParam.name}
                                                    options={localizedInputParam.options}
                                                    onSelect={(newValue) => setValue(newValue, selectedProvider, localizedInputParam.name)}
                                                    value={
                                                        followUpPromptsConfig[selectedProvider] &&
                                                        followUpPromptsConfig[selectedProvider][localizedInputParam.name]
                                                            ? followUpPromptsConfig[selectedProvider][localizedInputParam.name]
                                                            : localizedInputParam.default ?? t('common.chooseOption')
                                                    }
                                                />
                                            )}
                                        </Box>
                                    )
                                })}
                            </>
                        )}
                    </>
                )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mt: 2 }}>
                <StyledButton disabled={checkDisabled()} variant='contained' onClick={onSave} sx={{ minWidth: 100 }}>
                    {t('common.save')}
                </StyledButton>
            </Box>
        </>
    )
}

FollowUpPrompts.propTypes = {
    dialogProps: PropTypes.object
}

export default FollowUpPrompts
