import PropTypes from 'prop-types'
import {
    CardContent,
    Card,
    Box,
    SwipeableDrawer,
    Stack,
    Button,
    Chip,
    Divider,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableBody
} from '@mui/material'
import { IconHierarchy, IconUsersGroup, IconRobot } from '@tabler/icons-react'

import { useSelector } from 'react-redux'
import { evaluators as evaluatorsOptions, getEvaluatorOptionLabel, numericOperators } from '../evaluators/evaluatorConstant'
import TableCell from '@mui/material/TableCell'
import { Close } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

const getEvaluationMetricValue = (t, value) => (value || value === 0 ? value : t('pages.evaluations.notAvailable'))

const getEvaluationMetricLabel = (t, key, value) =>
    t(key, {
        value: getEvaluationMetricValue(t, value)
    })

const getEvaluationResultLabel = (t, result) => {
    switch (result) {
        case 'Pass':
            return t('pages.evaluations.pass')
        case 'Fail':
            return t('pages.evaluations.fail')
        case 'Error':
            return t('pages.evaluations.statusError')
        default:
            return result
    }
}

const EvaluationResultSideDrawer = ({ show, dialogProps, onClickFunction }) => {
    const { t } = useTranslation()
    const onOpen = () => {}
    const customization = useSelector((state) => state.customization)

    const getEvaluatorValue = (evaluator) => {
        if (evaluator.type === 'text') {
            return '"' + evaluator.value + '"'
        } else if (evaluator.name === 'json') {
            return ''
        } else if (evaluator.type === 'numeric') {
            return evaluator.value
        }
        return ''
    }

    const getFlowIcon = (index) => {
        if (index === undefined) {
            return <IconHierarchy size={24} />
        }
        if (dialogProps.additionalConfig.chatflowTypes) {
            switch (dialogProps.additionalConfig.chatflowTypes[index]) {
                case 'Chatflow':
                    return <IconHierarchy size={20} />
                case 'Custom Assistant':
                    return <IconRobot size={20} />
                case 'Agentflow v2':
                    return <IconUsersGroup size={20} />
            }
        }
        return <IconHierarchy />
    }

    return (
        <SwipeableDrawer sx={{ zIndex: 2000 }} anchor='right' open={show} onClose={() => onClickFunction()} onOpen={onOpen}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc' }}>
                <Typography variant='overline' sx={{ margin: 1, fontWeight: 'bold' }}>
                    {t('pages.evaluations.details')}
                </Typography>
                <Button endIcon={<Close />} onClick={() => onClickFunction()} />
            </div>
            <Box sx={{ width: 600, p: 2 }} role='presentation'>
                <Box>
                    <Typography variant='overline' sx={{ fontWeight: 'bold' }}>
                        {t('pages.evaluations.evaluationId')}
                    </Typography>
                    <Typography variant='body2'>{dialogProps.data.evaluationId}</Typography>
                </Box>

                <br />
                <Divider />

                <Box>
                    <br />
                    <Typography variant='overline' sx={{ fontWeight: 'bold' }}>
                        {t('pages.evaluations.input')}
                    </Typography>
                    <Typography variant='body2'>{dialogProps.data.input}</Typography>
                </Box>

                <br />
                <Divider />

                <Box>
                    <br />
                    <Typography variant='overline' sx={{ fontWeight: 'bold' }}>
                        {t('pages.evaluations.expectedOutput')}
                    </Typography>
                    <Typography variant='body2'>{dialogProps.data.expectedOutput}</Typography>
                </Box>

                {dialogProps.data &&
                    dialogProps.data.actualOutput?.length > 0 &&
                    dialogProps.data.actualOutput.map((output, index) => (
                        <Card key={indexedDB} sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: `15px` }}>
                            <CardContent>
                                {dialogProps.evaluationChatflows?.length > 0 && (
                                    <>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'start',
                                                alignItems: 'center',
                                                marginBottom: 5
                                            }}
                                        >
                                            {getFlowIcon(index)}
                                            <Typography variant='overline' sx={{ fontWeight: 'bold', fontSize: '1.1rem', marginLeft: 1 }}>
                                                {dialogProps.evaluationChatflows[index]}
                                            </Typography>
                                        </div>
                                        <Divider />
                                    </>
                                )}
                                <Box>
                                    <br />
                                    <Typography variant='overline' sx={{ fontWeight: 'bold' }}>
                                        {dialogProps.data.errors[index] === '' ? t('pages.evaluations.actualOutput') : t('common.error')}
                                    </Typography>
                                    <Typography variant='body2'>
                                        {dialogProps.data.errors[index] === '' ? (
                                            dialogProps.data.actualOutput[index]
                                        ) : (
                                            <Chip
                                                sx={{
                                                    height: 'auto',
                                                    backgroundColor: customization.isDarkMode ? '#4a1c1c' : '#ffebee',
                                                    color: customization.isDarkMode ? '#ffdbd3' : '#d32f2f',
                                                    '& .MuiChip-label': {
                                                        display: 'block',
                                                        whiteSpace: 'normal'
                                                    },
                                                    p: 1,
                                                    border: 'none'
                                                }}
                                                variant='outlined'
                                                size='small'
                                                label={dialogProps.data.errors[index]}
                                            />
                                        )}
                                    </Typography>
                                </Box>
                                <br />
                                <Divider />
                                <Box>
                                    <br />
                                    <Typography variant='overline' style={{ fontWeight: 'bold' }}>
                                        {t('pages.evaluations.latencyMetrics')}
                                    </Typography>
                                    <Typography variant='body2'>
                                        <Stack sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }} flexDirection='row' gap={1}>
                                            <Chip
                                                variant='outlined'
                                                size='small'
                                                label={getEvaluationMetricLabel(
                                                    t,
                                                    'pages.evaluations.apiMetric',
                                                    dialogProps.data.metrics[index]?.apiLatency
                                                )}
                                            />
                                            {dialogProps.data.metrics[index]?.chain && (
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.chainMetric',
                                                        dialogProps.data.metrics[index]?.chain
                                                    )}
                                                />
                                            )}
                                            {dialogProps.data.metrics[index]?.retriever && (
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.retrieverMetric',
                                                        dialogProps.data.metrics[index]?.retriever
                                                    )}
                                                />
                                            )}
                                            {dialogProps.data.metrics[index]?.tool && (
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.toolMetric',
                                                        dialogProps.data.metrics[index]?.tool
                                                    )}
                                                />
                                            )}
                                            <Chip
                                                variant='outlined'
                                                size='small'
                                                label={getEvaluationMetricLabel(
                                                    t,
                                                    'pages.evaluations.llmMetric',
                                                    dialogProps.data.metrics[index]?.llm
                                                )}
                                            />
                                        </Stack>
                                    </Typography>
                                </Box>
                                <br />
                                <Divider />
                                <br />
                                {dialogProps.data.metrics[index]?.nested_metrics ? (
                                    <Box>
                                        <Typography variant='overline' style={{ fontWeight: 'bold' }}>
                                            {t('pages.evaluations.tokens')}
                                        </Typography>
                                        <Table size='small' style={{ border: '1px solid #ccc' }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align='left' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {t('pages.evaluations.node')}
                                                    </TableCell>
                                                    <TableCell align='left' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {t('pages.evaluations.providerModel')}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold', width: '15%' }}>
                                                        {t('pages.evaluations.input')}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold', width: '15%' }}>
                                                        {t('common.output')}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold', width: '15%' }}>
                                                        {t('pages.evaluations.total')}
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody style={{ fontSize: '8px' }}>
                                                {dialogProps.data.metrics[index]?.nested_metrics?.map((metric, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell component='th' scope='row' style={{ fontSize: '11px' }}>
                                                            {metric.nodeLabel}
                                                        </TableCell>
                                                        <TableCell component='th' scope='row' style={{ fontSize: '11px' }}>
                                                            {metric.provider}
                                                            <br />
                                                            {metric.model}
                                                        </TableCell>
                                                        <TableCell align='right' style={{ fontSize: '11px' }}>
                                                            {metric.promptTokens}
                                                        </TableCell>
                                                        <TableCell align='right' style={{ fontSize: '11px' }}>
                                                            {metric.completionTokens}
                                                        </TableCell>
                                                        <TableCell align='right' style={{ fontSize: '11px' }}>
                                                            {metric.totalTokens}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow key={index}>
                                                    <TableCell
                                                        align='right'
                                                        style={{ fontSize: '11px', fontWeight: 'bold' }}
                                                        component='th'
                                                        scope='row'
                                                        colspan={2}
                                                    >
                                                        {t('pages.evaluations.total')}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {dialogProps.data.metrics[index].promptTokens}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {dialogProps.data.metrics[index].completionTokens}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {dialogProps.data.metrics[index].totalTokens}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Typography variant='overline' style={{ fontWeight: 'bold' }}>
                                            {t('pages.evaluations.tokens')}
                                        </Typography>
                                        <Typography variant='body2'>
                                            <Stack sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }} flexDirection='row' gap={1}>
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.totalMetric',
                                                        dialogProps.data.metrics[index]?.totalTokens
                                                    )}
                                                />
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.promptMetric',
                                                        dialogProps.data.metrics[index]?.promptTokens
                                                    )}
                                                />
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.completionMetric',
                                                        dialogProps.data.metrics[index]?.completionTokens
                                                    )}
                                                />
                                            </Stack>
                                        </Typography>
                                    </Box>
                                )}
                                <br />
                                {dialogProps.data.metrics[index]?.nested_metrics ? (
                                    <Box>
                                        <Typography variant='overline' style={{ fontWeight: 'bold' }}>
                                            {t('pages.evaluations.cost')}
                                        </Typography>
                                        <Table size='small' style={{ border: '1px solid #ccc' }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align='left' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {t('pages.evaluations.node')}
                                                    </TableCell>
                                                    <TableCell align='left' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {t('pages.evaluations.providerModel')}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', width: '15%', fontWeight: 'bold' }}>
                                                        {t('pages.evaluations.input')}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', width: '15%', fontWeight: 'bold' }}>
                                                        {t('common.output')}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', width: '15%', fontWeight: 'bold' }}>
                                                        {t('pages.evaluations.total')}
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody style={{ fontSize: '8px' }}>
                                                {dialogProps.data.metrics[index]?.nested_metrics?.map((metric, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell component='th' scope='row' style={{ fontSize: '11px' }}>
                                                            {metric.nodeLabel}
                                                        </TableCell>
                                                        <TableCell component='th' scope='row' style={{ fontSize: '11px' }}>
                                                            {metric.provider} <br />
                                                            {metric.model}
                                                        </TableCell>
                                                        <TableCell align='right' style={{ fontSize: '11px' }}>
                                                            {metric.promptCost}
                                                        </TableCell>
                                                        <TableCell align='right' style={{ fontSize: '11px' }}>
                                                            {metric.completionCost}
                                                        </TableCell>
                                                        <TableCell align='right' style={{ fontSize: '11px' }}>
                                                            {metric.totalCost}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow key={index}>
                                                    <TableCell
                                                        align='right'
                                                        style={{ fontSize: '11px', fontWeight: 'bold' }}
                                                        component='th'
                                                        scope='row'
                                                        colspan={2}
                                                    >
                                                        {t('pages.evaluations.total')}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {dialogProps.data.metrics[index].promptCost}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {dialogProps.data.metrics[index].completionCost}
                                                    </TableCell>
                                                    <TableCell align='right' style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                                        {dialogProps.data.metrics[index].totalCost}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Typography variant='overline' style={{ fontWeight: 'bold' }}>
                                            {t('pages.evaluations.cost')}
                                        </Typography>
                                        <Typography variant='body2'>
                                            <Stack sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }} flexDirection='row' gap={1}>
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.totalMetric',
                                                        dialogProps.data.metrics[index]?.totalCost
                                                    )}
                                                />
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.promptMetric',
                                                        dialogProps.data.metrics[index]?.promptCost
                                                    )}
                                                />
                                                <Chip
                                                    variant='outlined'
                                                    size='small'
                                                    label={getEvaluationMetricLabel(
                                                        t,
                                                        'pages.evaluations.completionMetric',
                                                        dialogProps.data.metrics[index]?.completionCost
                                                    )}
                                                />
                                            </Stack>
                                        </Typography>
                                    </Box>
                                )}
                                <br />
                                <Divider />
                                <br />
                                {dialogProps.data?.customEvals &&
                                    dialogProps.data?.customEvals[index] &&
                                    dialogProps.data.customEvals[index].length > 0 && (
                                        <Box>
                                            <Typography variant='overline' style={{ fontWeight: 'bold' }}>
                                                {t('pages.evaluations.customEvaluators')}
                                            </Typography>
                                            <Box>
                                                {dialogProps.data.customEvals[index] &&
                                                    dialogProps.data.customEvals[index].map((evaluator, index) => (
                                                        <Stack
                                                            key={index}
                                                            sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}
                                                            flexDirection='row'
                                                            gap={1}
                                                        >
                                                            <Chip
                                                                variant='contained'
                                                                sx={{
                                                                    width: 'max-content',
                                                                    color: 'white',
                                                                    backgroundColor: evaluator.result === 'Pass' ? '#00c853' : '#ff1744'
                                                                }}
                                                                size='small'
                                                                label={getEvaluationResultLabel(t, evaluator.result)}
                                                            />
                                                            <Chip
                                                                sx={{ width: 'max-content' }}
                                                                variant='outlined'
                                                                size='small'
                                                                label={t('pages.evaluations.evaluatorLabel', { name: evaluator.name })}
                                                            ></Chip>
                                                            <Chip
                                                                sx={{ width: 'max-content' }}
                                                                variant='outlined'
                                                                size='small'
                                                                label={`${getEvaluatorOptionLabel(
                                                                    [...evaluatorsOptions, ...numericOperators],
                                                                    evaluator.measure,
                                                                    t,
                                                                    t('pages.evaluators.actualOutput')
                                                                )} ${getEvaluatorOptionLabel(
                                                                    [...evaluatorsOptions, ...numericOperators],
                                                                    evaluator.operator,
                                                                    t,
                                                                    t('pages.evaluators.none')
                                                                ).toLowerCase()} ${getEvaluatorValue(evaluator)}`}
                                                            ></Chip>
                                                        </Stack>
                                                    ))}
                                            </Box>
                                        </Box>
                                    )}
                                {dialogProps?.evaluationType === 'llm' && (
                                    <>
                                        <br />
                                        <Divider />
                                        <Box>
                                            <br />
                                            <Typography variant='overline' sx={{ fontWeight: 'bold' }}>
                                                {t('pages.evaluations.llmGraded')}
                                            </Typography>
                                            <Stack flexDirection='row' gap={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                                {Object.entries(dialogProps.data.llmEvaluators[index]).map(([key, value], index) => (
                                                    <Chip
                                                        key={index}
                                                        variant='outlined'
                                                        size='small'
                                                        color={'primary'}
                                                        sx={{
                                                            height: 'auto',
                                                            '& .MuiChip-label': {
                                                                display: 'block',
                                                                whiteSpace: 'normal'
                                                            },
                                                            p: 0.5
                                                        }}
                                                        label={
                                                            <span>
                                                                <b>{key}</b>: {value}
                                                            </span>
                                                        }
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
            </Box>
        </SwipeableDrawer>
    )
}

EvaluationResultSideDrawer.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onClickFunction: PropTypes.func
}

export default EvaluationResultSideDrawer
