import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import { cloneDeep } from 'lodash'

import { Box, Button, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Stack, OutlinedInput } from '@mui/material'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { Grid } from '@/ui-component/grid/Grid'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import { GridActionsCellItem } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import { CodeEditor } from '@/ui-component/editor/CodeEditor'
import HowToUseFunctionDialog from './HowToUseFunctionDialog'
import { PermissionButton, StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import { Available } from '@/ui-component/rbac/available'
import ExportAsTemplateDialog from '@/ui-component/dialog/ExportAsTemplateDialog'
import PasteJSONDialog from './PasteJSONDialog'

// Icons
import { IconX, IconFileDownload, IconPlus, IconTemplate, IconCode } from '@tabler/icons-react'

// API
import toolsApi from '@/api/tools'

// Hooks
import useConfirm from '@/hooks/useConfirm'
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'
import { generateRandomGradient, formatDataGridRows } from '@/utils/genericHelper'
import { HIDE_CANVAS_DIALOG, SHOW_CANVAS_DIALOG } from '@/store/actions'

const getExampleAPIFunc = (t) => `/*
* ${t('pages.tools.exampleCommentLibraries')}
* ${t('pages.tools.exampleCommentSchemaVariables')}
* ${t('pages.tools.exampleCommentFlowConfig')}
* ${t('pages.tools.exampleCommentCustomVariables')}
* ${t('pages.tools.exampleCommentReturnString')}
*/

const fetch = require('node-fetch');
const url = 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true';
const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};
try {
    const response = await fetch(url, options);
    const text = await response.text();
    return text;
} catch (error) {
    console.error(error);
    return '';
}`

const ToolDialog = ({ show, dialogProps, onUseTemplate, onCancel, onConfirm, setError }) => {
    const { t } = useTranslation()
    const portalElement = document.getElementById('portal')

    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()

    // ==============================|| Snackbar ||============================== //

    useNotifier()
    const { confirm } = useConfirm()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const getSpecificToolApi = useApi(toolsApi.getSpecificTool)

    const [toolId, setToolId] = useState('')
    const [toolName, setToolName] = useState('')
    const [toolDesc, setToolDesc] = useState('')
    const [toolIcon, setToolIcon] = useState('')
    const [toolSchema, setToolSchema] = useState([])
    const [toolFunc, setToolFunc] = useState('')
    const [showHowToDialog, setShowHowToDialog] = useState(false)

    const [exportAsTemplateDialogOpen, setExportAsTemplateDialogOpen] = useState(false)
    const [exportAsTemplateDialogProps, setExportAsTemplateDialogProps] = useState({})

    const [showPasteJSONDialog, setShowPasteJSONDialog] = useState(false)

    const deleteItem = useCallback(
        (id) => () => {
            setTimeout(() => {
                setToolSchema((prevRows) => prevRows.filter((row) => row.id !== id))
            })
        },
        []
    )

    const addNewRow = () => {
        setTimeout(() => {
            setToolSchema((prevRows) => {
                let allRows = [...cloneDeep(prevRows)]
                const lastRowId = allRows.length ? allRows[allRows.length - 1].id + 1 : 1
                allRows.push({
                    id: lastRowId,
                    property: '',
                    description: '',
                    type: '',
                    required: false
                })
                return allRows
            })
        })
    }

    const onSaveAsTemplate = () => {
        setExportAsTemplateDialogProps({
            title: t('pages.tools.saveAsTemplate'),
            tool: {
                name: toolName,
                description: toolDesc,
                iconSrc: toolIcon,
                schema: toolSchema,
                func: toolFunc
            }
        })
        setExportAsTemplateDialogOpen(true)
    }

    const onRowUpdate = (newRow) => {
        setTimeout(() => {
            setToolSchema((prevRows) => {
                let allRows = [...cloneDeep(prevRows)]
                const indexToUpdate = allRows.findIndex((row) => row.id === newRow.id)
                if (indexToUpdate >= 0) {
                    allRows[indexToUpdate] = { ...newRow }
                }
                return allRows
            })
        })
    }

    const renderEditableSchemaCell = useCallback((params, placeholder, cursor = 'text') => {
        const rawValue = params.value
        const hasValue = rawValue !== undefined && rawValue !== null && `${rawValue}`.trim() !== ''
        const displayValue = hasValue ? `${rawValue}` : placeholder

        return (
            <Box
                component='div'
                className={hasValue ? 'schema-editable-cell' : 'schema-empty-editable-cell'}
                title={displayValue}
                sx={(theme) => ({
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    width: '100%',
                    maxWidth: '100%',
                    height: 34,
                    minWidth: 0,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 1,
                    border: hasValue ? '1px solid transparent' : `1px dashed ${theme.palette.primary.main}`,
                    backgroundColor: hasValue ? 'transparent' : theme.palette.background.paper,
                    boxShadow: hasValue ? 'none' : `inset 0 0 0 1px ${theme.palette.action.hover}`,
                    color: hasValue ? 'inherit' : theme.palette.primary.main,
                    cursor,
                    fontWeight: hasValue ? 400 : 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
                        duration: theme.transitions.duration.shortest
                    }),
                    '.MuiDataGrid-row:hover &': {
                        borderColor: hasValue ? 'transparent' : theme.palette.primary.dark,
                        boxShadow: hasValue ? 'none' : `inset 0 0 0 1px ${theme.palette.primary.light}`
                    }
                })}
            >
                {displayValue}
            </Box>
        )
    }, [])

    const columns = useMemo(
        () => [
            {
                field: 'property',
                headerName: t('pages.tools.schemaProperty'),
                editable: true,
                flex: 1,
                renderCell: (params) => renderEditableSchemaCell(params, t('pages.tools.schemaPropertyPlaceholder'))
            },
            {
                field: 'type',
                headerName: t('pages.tools.schemaType'),
                type: 'singleSelect',
                valueOptions: ['string', 'number', 'boolean', 'date'],
                editable: true,
                width: 120,
                renderCell: (params) => renderEditableSchemaCell(params, t('pages.tools.schemaTypePlaceholder'), 'pointer')
            },
            {
                field: 'description',
                headerName: t('pages.tools.schemaDescription'),
                editable: true,
                flex: 1,
                renderCell: (params) => renderEditableSchemaCell(params, t('pages.tools.schemaDescriptionPlaceholder'))
            },
            { field: 'required', headerName: t('pages.tools.schemaRequired'), type: 'boolean', editable: true, width: 80 },
            {
                field: 'actions',
                type: 'actions',
                width: 80,
                getActions: (params) => [
                    <GridActionsCellItem key={'Delete'} icon={<DeleteIcon />} label={t('common.delete')} onClick={deleteItem(params.id)} />
                ]
            }
        ],
        [deleteItem, renderEditableSchemaCell, t]
    )

    useEffect(() => {
        if (show) dispatch({ type: SHOW_CANVAS_DIALOG })
        else dispatch({ type: HIDE_CANVAS_DIALOG })
        return () => dispatch({ type: HIDE_CANVAS_DIALOG })
    }, [show, dispatch])

    useEffect(() => {
        if (getSpecificToolApi.data) {
            setToolId(getSpecificToolApi.data.id)
            setToolName(getSpecificToolApi.data.name)
            setToolDesc(getSpecificToolApi.data.description)
            setToolSchema(formatDataGridRows(getSpecificToolApi.data.schema))
            if (getSpecificToolApi.data.func) setToolFunc(getSpecificToolApi.data.func)
            else setToolFunc('')
        }
    }, [getSpecificToolApi.data])

    useEffect(() => {
        if (getSpecificToolApi.error && setError) {
            setError(getSpecificToolApi.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificToolApi.error])

    useEffect(() => {
        if (dialogProps.type === 'EDIT' && dialogProps.data) {
            // When tool dialog is opened from Tools dashboard
            setToolId(dialogProps.data.id)
            setToolName(dialogProps.data.name)
            setToolDesc(dialogProps.data.description)
            setToolIcon(dialogProps.data.iconSrc)
            setToolSchema(formatDataGridRows(dialogProps.data.schema))
            if (dialogProps.data.func) setToolFunc(dialogProps.data.func)
            else setToolFunc('')
        } else if (dialogProps.type === 'EDIT' && dialogProps.toolId) {
            // When tool dialog is opened from CustomTool node in canvas
            getSpecificToolApi.request(dialogProps.toolId)
        } else if (dialogProps.type === 'IMPORT' && dialogProps.data) {
            // When tool dialog is to import existing tool
            setToolName(dialogProps.data.name)
            setToolDesc(dialogProps.data.description)
            setToolIcon(dialogProps.data.iconSrc)
            setToolSchema(formatDataGridRows(dialogProps.data.schema))
            if (dialogProps.data.func) setToolFunc(dialogProps.data.func)
            else setToolFunc('')
        } else if (dialogProps.type === 'TEMPLATE' && dialogProps.data) {
            // When tool dialog is a template
            setToolName(dialogProps.data.name)
            setToolDesc(dialogProps.data.description)
            setToolIcon(dialogProps.data.iconSrc)
            setToolSchema(formatDataGridRows(dialogProps.data.schema))
            if (dialogProps.data.func) setToolFunc(dialogProps.data.func)
            else setToolFunc('')
        } else if (dialogProps.type === 'ADD') {
            // When tool dialog is to add a new tool
            setToolId('')
            setToolName('')
            setToolDesc('')
            setToolIcon('')
            setToolSchema([])
            setToolFunc('')
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogProps])

    const useToolTemplate = () => {
        onUseTemplate(dialogProps.data)
    }

    const exportTool = async () => {
        try {
            const toolResp = await toolsApi.getSpecificTool(toolId)
            if (toolResp.data) {
                const toolData = toolResp.data
                delete toolData.id
                delete toolData.createdDate
                delete toolData.updatedDate
                let dataStr = JSON.stringify(toolData, null, 2)
                //let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
                const blob = new Blob([dataStr], { type: 'application/json' })
                const dataUri = URL.createObjectURL(blob)

                let exportFileDefaultName = `${toolName}-CustomTool.json`

                let linkElement = document.createElement('a')
                linkElement.setAttribute('href', dataUri)
                linkElement.setAttribute('download', exportFileDefaultName)
                linkElement.click()
            }
        } catch (error) {
            enqueueSnackbar({
                message: `Failed to export Tool: ${
                    typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }`,
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
            onCancel()
        }
    }

    const addNewTool = async () => {
        try {
            const obj = {
                name: toolName,
                description: toolDesc,
                color: generateRandomGradient(),
                schema: JSON.stringify(toolSchema),
                func: toolFunc,
                iconSrc: toolIcon
            }
            const createResp = await toolsApi.createNewTool(obj)
            if (createResp.data) {
                enqueueSnackbar({
                    message: t('common.toolAdded'),
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
                onConfirm(createResp.data.id)
            }
        } catch (error) {
            enqueueSnackbar({
                message: `Failed to add new Tool: ${
                    typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }`,
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
            onCancel()
        }
    }

    const saveTool = async () => {
        try {
            const saveResp = await toolsApi.updateTool(toolId, {
                name: toolName,
                description: toolDesc,
                schema: JSON.stringify(toolSchema),
                func: toolFunc,
                iconSrc: toolIcon
            })
            if (saveResp.data) {
                enqueueSnackbar({
                    message: t('common.toolSaved'),
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
                onConfirm(saveResp.data.id)
            }
        } catch (error) {
            enqueueSnackbar({
                message: `Failed to save Tool: ${
                    typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }`,
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
            onCancel()
        }
    }

    const deleteTool = async () => {
        const confirmPayload = {
            title: t('pages.tools.deleteTitle'),
            description: t('pages.tools.deleteConfirm', { name: toolName }),
            confirmButtonName: t('common.delete'),
            cancelButtonName: t('common.cancel')
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const delResp = await toolsApi.deleteTool(toolId)
                if (delResp.data) {
                    enqueueSnackbar({
                        message: t('common.toolDeleted'),
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
                    onConfirm()
                }
            } catch (error) {
                enqueueSnackbar({
                    message: `Failed to delete Tool: ${
                        typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                    }`,
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
                onCancel()
            }
        }
    }

    const handlePastedJSON = (formattedData) => {
        setToolSchema(formattedData)
        setShowPasteJSONDialog(false)
    }

    const component = show ? (
        <Dialog
            fullWidth
            maxWidth='md'
            open={show}
            onClose={onCancel}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem', p: 3, pb: 0 }} id='alert-dialog-title'>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    {dialogProps.title}
                    <Box>
                        {dialogProps.type === 'EDIT' && (
                            <>
                                <PermissionButton
                                    permissionId={'templates:toolexport'}
                                    style={{ marginRight: '10px' }}
                                    variant='outlined'
                                    onClick={() => onSaveAsTemplate()}
                                    startIcon={<IconTemplate />}
                                    color='secondary'
                                >
                                    {t('pages.tools.saveAsTemplate')}
                                </PermissionButton>
                                <PermissionButton
                                    permissionId={'tools:export'}
                                    variant='outlined'
                                    onClick={() => exportTool()}
                                    startIcon={<IconFileDownload />}
                                >
                                    {t('pages.tools.export')}
                                </PermissionButton>
                            </>
                        )}
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '75vh', position: 'relative', px: 3, pb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <Box>
                        <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                            <Typography variant='overline'>
                                {t('pages.tools.toolName')}
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                            <TooltipWithParser title={t('pages.tools.toolNameHelp')} />
                        </Stack>
                        <OutlinedInput
                            id='toolName'
                            type='string'
                            fullWidth
                            disabled={dialogProps.type === 'TEMPLATE'}
                            placeholder={t('pages.tools.toolNamePlaceholder')}
                            value={toolName}
                            name='toolName'
                            onChange={(e) => setToolName(e.target.value)}
                        />
                    </Box>
                    <Box>
                        <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                            <Typography variant='overline'>
                                {t('pages.tools.toolDescription')}
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                            <TooltipWithParser title={t('pages.tools.toolDescriptionHelp')} />
                        </Stack>
                        <OutlinedInput
                            id='toolDesc'
                            type='string'
                            fullWidth
                            disabled={dialogProps.type === 'TEMPLATE'}
                            placeholder={t('pages.tools.toolDescriptionPlaceholder')}
                            multiline={true}
                            rows={3}
                            value={toolDesc}
                            name='toolDesc'
                            onChange={(e) => setToolDesc(e.target.value)}
                        />
                    </Box>
                    <Box>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>{t('pages.tools.toolIconSource')}</Typography>
                        </Stack>
                        <OutlinedInput
                            id='toolIcon'
                            type='string'
                            fullWidth
                            disabled={dialogProps.type === 'TEMPLATE'}
                            placeholder='https://raw.githubusercontent.com/gilbarbara/logos/main/logos/airtable.svg'
                            value={toolIcon}
                            name='toolIcon'
                            onChange={(e) => setToolIcon(e.target.value)}
                        />
                    </Box>
                    <Box>
                        <Stack sx={{ position: 'relative', justifyContent: 'space-between' }} direction='row'>
                            <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                                <Typography variant='overline'>{t('pages.tools.inputSchema')}</Typography>
                                <TooltipWithParser title={t('pages.tools.inputSchemaHelp')} />
                            </Stack>
                            {dialogProps.type !== 'TEMPLATE' && (
                                <Stack direction='row' spacing={1}>
                                    <Button variant='outlined' onClick={() => setShowPasteJSONDialog(true)} startIcon={<IconCode />}>
                                        {t('pages.tools.pasteJson')}
                                    </Button>
                                    <Button variant='outlined' onClick={addNewRow} startIcon={<IconPlus />}>
                                        {t('pages.tools.addItem')}
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                        <Grid
                            columns={columns}
                            rows={toolSchema}
                            disabled={dialogProps.type === 'TEMPLATE'}
                            localeText={{ noRowsLabel: t('pages.tools.noSchemaRows') }}
                            onRowUpdate={onRowUpdate}
                        />
                    </Box>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                                <Typography variant='overline'>{t('pages.tools.javascriptFunction')}</Typography>
                                <TooltipWithParser title={t('pages.tools.javascriptFunctionHelp')} />
                            </Stack>
                            <Stack direction='row'>
                                <Button
                                    style={{ marginBottom: 10, marginRight: 10 }}
                                    color='secondary'
                                    variant='text'
                                    onClick={() => setShowHowToDialog(true)}
                                >
                                    {t('pages.tools.howToUseFunction')}
                                </Button>
                                {dialogProps.type !== 'TEMPLATE' && (
                                    <Button
                                        style={{ marginBottom: 10 }}
                                        variant='outlined'
                                        onClick={() => setToolFunc(getExampleAPIFunc(t))}
                                    >
                                        {t('pages.tools.seeExample')}
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                        <CodeEditor
                            disabled={dialogProps.type === 'TEMPLATE'}
                            value={toolFunc}
                            theme={customization.isDarkMode ? 'dark' : 'light'}
                            lang={'js'}
                            placeholder={t('pages.tools.pasteJs')}
                            onValueChange={(code) => setToolFunc(code)}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                {dialogProps.type === 'EDIT' && (
                    <StyledPermissionButton permissionId={'tools:delete'} color='error' variant='contained' onClick={() => deleteTool()}>
                        {t('common.delete')}
                    </StyledPermissionButton>
                )}
                {dialogProps.type === 'TEMPLATE' && (
                    <Available permission={'tools:view,tools:create'}>
                        <StyledButton color='secondary' variant='contained' onClick={useToolTemplate}>
                            {t('pages.tools.useTemplate')}
                        </StyledButton>
                    </Available>
                )}
                {dialogProps.type !== 'TEMPLATE' && (
                    <StyledPermissionButton
                        permissionId={'tools:update,tools:create'}
                        disabled={!(toolName && toolDesc)}
                        variant='contained'
                        onClick={() => (dialogProps.type === 'ADD' || dialogProps.type === 'IMPORT' ? addNewTool() : saveTool())}
                    >
                        {dialogProps.confirmButtonName}
                    </StyledPermissionButton>
                )}
            </DialogActions>
            <ConfirmDialog />
            {exportAsTemplateDialogOpen && (
                <ExportAsTemplateDialog
                    show={exportAsTemplateDialogOpen}
                    dialogProps={exportAsTemplateDialogProps}
                    onCancel={() => setExportAsTemplateDialogOpen(false)}
                />
            )}

            <HowToUseFunctionDialog show={showHowToDialog} onCancel={() => setShowHowToDialog(false)} />

            {showPasteJSONDialog && (
                <PasteJSONDialog
                    show={showPasteJSONDialog}
                    onCancel={() => setShowPasteJSONDialog(false)}
                    onConfirm={handlePastedJSON}
                    customization={customization}
                />
            )}
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

ToolDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onUseTemplate: PropTypes.func,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func,
    setError: PropTypes.func
}

export default ToolDialog
