import { useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction, SET_CHATFLOW } from '@/store/actions'

// material-ui
import { Typography, Box, Button, FormControl, ListItem, ListItemAvatar, ListItemText, MenuItem, Select } from '@mui/material'
import { IconX } from '@tabler/icons-react'
import { useTheme } from '@mui/material/styles'

// Project import
import CredentialInputHandler from '@/views/canvas/CredentialInputHandler'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import { SwitchInput } from '@/ui-component/switch/Switch'
import { Input } from '@/ui-component/input/Input'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { Dropdown } from '@/ui-component/dropdown/Dropdown'
import openAISVG from '@/assets/images/openai.svg'
import assemblyAIPng from '@/assets/images/assemblyai.png'
import localAiPng from '@/assets/images/localai.png'
import azureSvg from '@/assets/images/azure_openai.svg'
import groqPng from '@/assets/images/groq.png'

// store
import useNotifier from '@/utils/useNotifier'

// API
import chatflowsApi from '@/api/chatflows'
import { useTranslation } from 'react-i18next'

// If implementing a new provider, this must be updated in
// components/src/speechToText.ts as well
const SpeechToTextType = {
    OPENAI_WHISPER: 'openAIWhisper',
    ASSEMBLYAI_TRANSCRIBE: 'assemblyAiTranscribe',
    LOCALAI_STT: 'localAISTT',
    AZURE_COGNITIVE: 'azureCognitive',
    GROQ_WHISPER: 'groqWhisper'
}

// Weird quirk - the key must match the name property value.
const speechToTextProviders = {
    [SpeechToTextType.OPENAI_WHISPER]: {
        label: 'OpenAI Whisper',
        name: SpeechToTextType.OPENAI_WHISPER,
        icon: openAISVG,
        url: 'https://platform.openai.com/docs/guides/speech-to-text',
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['openAIApi']
            },
            {
                labelKey: 'canvas.chatConfig.language',
                name: 'language',
                type: 'string',
                descriptionKey: 'canvas.chatConfig.languageDescription',
                placeholder: 'en',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.sttPromptDescription',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                descriptionKey: 'canvas.chatConfig.temperatureDescription',
                optional: true
            }
        ]
    },
    [SpeechToTextType.ASSEMBLYAI_TRANSCRIBE]: {
        label: 'Assembly AI',
        name: SpeechToTextType.ASSEMBLYAI_TRANSCRIBE,
        icon: assemblyAIPng,
        url: 'https://www.assemblyai.com/',
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['assemblyAIApi']
            }
        ]
    },
    [SpeechToTextType.LOCALAI_STT]: {
        label: 'LocalAi STT',
        name: SpeechToTextType.LOCALAI_STT,
        icon: localAiPng,
        url: 'https://localai.io/features/audio-to-text/',
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['localAIApi']
            },
            {
                labelKey: 'canvas.chatConfig.baseUrl',
                name: 'baseUrl',
                type: 'string',
                descriptionKey: 'canvas.chatConfig.localAiBaseUrlDescription'
            },
            {
                labelKey: 'canvas.chatConfig.language',
                name: 'language',
                type: 'string',
                descriptionKey: 'canvas.chatConfig.languageDescription',
                placeholder: 'en',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.model',
                name: 'model',
                type: 'string',
                descriptionKey: 'canvas.chatConfig.sttModelDescription',
                placeholder: 'whisper-1',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.prompt',
                name: 'prompt',
                type: 'string',
                rows: 4,
                descriptionKey: 'canvas.chatConfig.sttPromptDescription',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                descriptionKey: 'canvas.chatConfig.temperatureDescription',
                optional: true
            }
        ]
    },
    [SpeechToTextType.AZURE_COGNITIVE]: {
        label: 'Azure Cognitive Services',
        name: SpeechToTextType.AZURE_COGNITIVE,
        icon: azureSvg,
        url: 'https://azure.microsoft.com/en-us/products/cognitive-services/speech-services',
        inputs: [
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['azureCognitiveServices']
            },
            {
                labelKey: 'canvas.chatConfig.language',
                name: 'language',
                type: 'string',
                descriptionKey: 'canvas.chatConfig.recognitionLanguageDescription',
                placeholder: 'en-US',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.profanityFilterMode',
                name: 'profanityFilterMode',
                type: 'options',
                descriptionKey: 'canvas.chatConfig.profanityFilterModeDescription',
                options: [
                    {
                        labelKey: 'canvas.chatConfig.profanityNone',
                        name: 'None'
                    },
                    {
                        labelKey: 'canvas.chatConfig.profanityMasked',
                        name: 'Masked'
                    },
                    {
                        labelKey: 'canvas.chatConfig.profanityRemoved',
                        name: 'Removed'
                    }
                ],
                default: 'Masked',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.audioChannels',
                name: 'channels',
                type: 'string',
                descriptionKey: 'canvas.chatConfig.audioChannelsDescription',
                placeholder: '0,1',
                default: '0,1'
            }
        ]
    },
    [SpeechToTextType.GROQ_WHISPER]: {
        label: 'Groq Whisper',
        name: SpeechToTextType.GROQ_WHISPER,
        icon: groqPng,
        url: 'https://console.groq.com/',
        inputs: [
            {
                labelKey: 'canvas.chatConfig.model',
                name: 'model',
                type: 'string',
                descriptionKey: 'canvas.chatConfig.groqSttModelDescription',
                placeholder: 'whisper-large-v3',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.connectCredential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['groqApi']
            },
            {
                labelKey: 'canvas.chatConfig.language',
                name: 'language',
                type: 'string',
                descriptionKey: 'canvas.chatConfig.languageDescription',
                placeholder: 'en',
                optional: true
            },
            {
                labelKey: 'canvas.chatConfig.temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                descriptionKey: 'canvas.chatConfig.temperatureDescription',
                optional: true
            }
        ]
    }
}

const SpeechToText = ({ dialogProps, onConfirm }) => {
    const { t } = useTranslation()
    const dispatch = useDispatch()

    useNotifier()
    const theme = useTheme()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [speechToText, setSpeechToText] = useState({})
    const [selectedProvider, setSelectedProvider] = useState('none')

    const onSave = async () => {
        const speechToText = setValue(true, selectedProvider, 'status')
        try {
            const saveResp = await chatflowsApi.updateChatflow(dialogProps.chatflow.id, {
                speechToText: JSON.stringify(speechToText)
            })
            if (saveResp.data) {
                enqueueSnackbar({
                    message: t('canvas.chatConfig.speechToTextSaved'),
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
                onConfirm?.()
            }
        } catch (error) {
            enqueueSnackbar({
                message: t('canvas.chatConfig.speechToTextSaveFailed', {
                    message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }),
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

    const setValue = (value, providerName, inputParamName) => {
        let newVal = {}
        if (!Object.prototype.hasOwnProperty.call(speechToText, providerName)) {
            newVal = { ...speechToText, [providerName]: {} }
        } else {
            newVal = { ...speechToText }
        }

        newVal[providerName][inputParamName] = value
        if (inputParamName === 'status' && value === true) {
            // ensure that the others are turned off
            Object.keys(speechToTextProviders).forEach((key) => {
                const provider = speechToTextProviders[key]
                if (provider.name !== providerName) {
                    newVal[provider.name] = { ...speechToText[provider.name], status: false }
                }
            })
            if (providerName !== 'none' && newVal['none']) {
                newVal['none'].status = false
            }
        }
        setSpeechToText(newVal)
        return newVal
    }

    const handleProviderChange = (event) => {
        setSelectedProvider(event.target.value)
    }

    const localizeInputParam = (inputParam) => ({
        ...inputParam,
        label: inputParam.labelKey ? t(inputParam.labelKey) : inputParam.label,
        description: inputParam.descriptionKey ? t(inputParam.descriptionKey) : inputParam.description,
        options: inputParam.options?.map((option) => ({
            ...option,
            label: option.labelKey ? t(option.labelKey) : option.label
        }))
    })

    useEffect(() => {
        if (dialogProps.chatflow && dialogProps.chatflow.speechToText) {
            try {
                const speechToText = JSON.parse(dialogProps.chatflow.speechToText)
                let selectedProvider = 'none'
                Object.keys(speechToTextProviders).forEach((key) => {
                    const providerConfig = speechToText[key]
                    if (providerConfig && providerConfig.status) {
                        selectedProvider = key
                    }
                })
                setSelectedProvider(selectedProvider)
                setSpeechToText(speechToText)
            } catch (e) {
                setSpeechToText({})
                setSelectedProvider('none')
                console.error(e)
            }
        }

        return () => {
            setSpeechToText({})
            setSelectedProvider('none')
        }
    }, [dialogProps])

    return (
        <>
            <Box fullWidth sx={{ mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>{t('canvas.chatConfig.providers')}</Typography>
                <FormControl fullWidth>
                    <Select
                        size='small'
                        value={selectedProvider}
                        onChange={handleProviderChange}
                        sx={{
                            '& .MuiSvgIcon-root': {
                                color: theme?.customization?.isDarkMode ? '#fff' : 'inherit'
                            }
                        }}
                    >
                        <MenuItem value='none'>{t('common.none')}</MenuItem>
                        {Object.values(speechToTextProviders).map((provider) => (
                            <MenuItem key={provider.name} value={provider.name}>
                                {provider.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            {selectedProvider !== 'none' && (
                <>
                    <ListItem sx={{ mt: 3 }} alignItems='center'>
                        <ListItemAvatar>
                            <div
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
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
                                    src={speechToTextProviders[selectedProvider].icon}
                                />
                            </div>
                        </ListItemAvatar>
                        <ListItemText
                            sx={{ ml: 1 }}
                            primary={speechToTextProviders[selectedProvider].label}
                            secondary={
                                <a
                                    target='_blank'
                                    rel='noreferrer'
                                    href={speechToTextProviders[selectedProvider].url}
                                    style={{
                                        color: theme?.customization?.isDarkMode ? '#90caf9' : '#1976d2',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {speechToTextProviders[selectedProvider].url}
                                </a>
                            }
                        />
                    </ListItem>
                    {speechToTextProviders[selectedProvider].inputs.map((inputParam, index) => {
                        const localizedInputParam = localizeInputParam(inputParam)
                        return (
                            <Box key={index} sx={{ p: 2 }}>
                                <div style={{ display: 'flex', flexDirection: 'row' }}>
                                    <Typography>
                                        {localizedInputParam.label}
                                        {!localizedInputParam.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                                        {localizedInputParam.description && (
                                            <TooltipWithParser style={{ marginLeft: 10 }} title={localizedInputParam.description} />
                                        )}
                                    </Typography>
                                </div>
                                {localizedInputParam.type === 'credential' && (
                                    <CredentialInputHandler
                                        key={speechToText[selectedProvider]?.credentialId}
                                        data={
                                            speechToText[selectedProvider]?.credentialId
                                                ? { credential: speechToText[selectedProvider].credentialId }
                                                : {}
                                        }
                                        inputParam={localizedInputParam}
                                        onSelect={(newValue) => setValue(newValue, selectedProvider, 'credentialId')}
                                    />
                                )}
                                {localizedInputParam.type === 'boolean' && (
                                    <SwitchInput
                                        onChange={(newValue) => setValue(newValue, selectedProvider, localizedInputParam.name)}
                                        value={
                                            speechToText[selectedProvider]
                                                ? speechToText[selectedProvider][localizedInputParam.name]
                                                : localizedInputParam.default ?? false
                                        }
                                    />
                                )}
                                {(localizedInputParam.type === 'string' ||
                                    localizedInputParam.type === 'password' ||
                                    localizedInputParam.type === 'number') && (
                                    <Input
                                        inputParam={localizedInputParam}
                                        onChange={(newValue) => setValue(newValue, selectedProvider, localizedInputParam.name)}
                                        value={
                                            speechToText[selectedProvider]
                                                ? speechToText[selectedProvider][localizedInputParam.name]
                                                : localizedInputParam.default ?? ''
                                        }
                                    />
                                )}

                                {localizedInputParam.type === 'options' && (
                                    <Dropdown
                                        name={localizedInputParam.name}
                                        options={localizedInputParam.options}
                                        onSelect={(newValue) => setValue(newValue, selectedProvider, localizedInputParam.name)}
                                        value={
                                            speechToText[selectedProvider]
                                                ? speechToText[selectedProvider][localizedInputParam.name]
                                                : localizedInputParam.default ?? t('common.chooseOption')
                                        }
                                    />
                                )}
                            </Box>
                        )
                    })}
                </>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mt: 2 }}>
                <StyledButton
                    disabled={selectedProvider !== 'none' && !speechToText[selectedProvider]?.credentialId}
                    variant='contained'
                    onClick={onSave}
                    sx={{ minWidth: 100 }}
                >
                    {t('common.save')}
                </StyledButton>
            </Box>
        </>
    )
}

SpeechToText.propTypes = {
    dialogProps: PropTypes.object,
    onConfirm: PropTypes.func
}

export default SpeechToText
