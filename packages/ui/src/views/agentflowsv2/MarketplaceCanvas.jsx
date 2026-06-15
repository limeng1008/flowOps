import { useEffect, useState, useCallback, useRef, useContext } from 'react'
import ReactFlow, { Background, ControlButton, useNodesState, useEdgesState } from 'reactflow'
import 'reactflow/dist/style.css'
import '@/views/canvas/index.css'

import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

// material-ui
import { Toolbar, Box, AppBar } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import AgentFlowNode from './AgentFlowNode'
import AgentFlowEdge from './AgentFlowEdge'
import IterationNode from './IterationNode'
import MarketplaceCanvasHeader from '@/views/marketplaces/MarketplaceCanvasHeader'
import StickyNote from './StickyNote'
import EditNodeDialog from '@/views/agentflowsv2/EditNodeDialog'
import LocalizedControls from '@/ui-component/canvas/LocalizedControls'
import { flowContext } from '@/store/context/ReactFlowContext'

// icons
import { IconMagnetFilled, IconMagnetOff, IconArtboard, IconArtboardOff } from '@tabler/icons-react'

const nodeTypes = { agentFlow: AgentFlowNode, stickyNote: StickyNote, iteration: IterationNode }
const edgeTypes = { agentFlow: AgentFlowEdge }

// ==============================|| CANVAS ||============================== //

const MarketplaceCanvasV2 = () => {
    const { t } = useTranslation()
    const theme = useTheme()
    const navigate = useNavigate()
    const customization = useSelector((state) => state.customization)

    const { state } = useLocation()
    const { flowData, name } = state

    // ==============================|| ReactFlow ||============================== //

    const [nodes, setNodes, onNodesChange] = useNodesState()
    const [edges, setEdges, onEdgesChange] = useEdgesState()
    const [editNodeDialogOpen, setEditNodeDialogOpen] = useState(false)
    const [editNodeDialogProps, setEditNodeDialogProps] = useState({})
    const [isSnappingEnabled, setIsSnappingEnabled] = useState(false)
    const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(true)

    const reactFlowWrapper = useRef(null)
    const { setReactFlowInstance } = useContext(flowContext)

    // ==============================|| useEffect ||============================== //

    useEffect(() => {
        if (flowData) {
            const initialFlow = JSON.parse(flowData)
            setNodes(initialFlow.nodes || [])
            setEdges(initialFlow.edges || [])
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowData])

    const onChatflowCopy = (flowData) => {
        const templateFlowData = JSON.stringify(flowData)
        navigate('/v2/agentcanvas', { state: { templateFlowData } })
    }

    // eslint-disable-next-line
    const onNodeDoubleClick = useCallback((event, node) => {
        if (!node || !node.data) return
        if (node.data.name === 'stickyNoteAgentflow') {
            // dont show dialog
        } else {
            const dialogProps = {
                data: node.data,
                inputParams: node.data.inputParams.filter((inputParam) => !inputParam.hidden),
                disabled: true
            }

            setEditNodeDialogProps(dialogProps)
            setEditNodeDialogOpen(true)
        }
    })

    return (
        <>
            <Box>
                <AppBar
                    enableColorOnDark
                    position='fixed'
                    color='inherit'
                    elevation={1}
                    sx={{
                        background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 32%), ${theme.palette.glass.surfaceStrong}`,
                        borderBottom: '1px solid',
                        borderColor: theme.palette.glass.border,
                        boxShadow: 'none',
                        backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                        WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`
                    }}
                >
                    <Toolbar>
                        <MarketplaceCanvasHeader
                            flowName={name}
                            flowData={JSON.parse(flowData)}
                            onChatflowCopy={(flowData) => onChatflowCopy(flowData)}
                        />
                    </Toolbar>
                </AppBar>
                <Box sx={{ pt: '70px', height: '100vh', width: '100%' }}>
                    <div className='reactflow-parent-wrapper'>
                        <div className='reactflow-wrapper' ref={reactFlowWrapper}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onNodeDoubleClick={onNodeDoubleClick}
                                onInit={setReactFlowInstance}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                fitView
                                minZoom={0.1}
                                snapGrid={[25, 25]}
                                snapToGrid={isSnappingEnabled}
                            >
                                <LocalizedControls
                                    className={customization.isDarkMode ? 'dark-mode-controls' : ''}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <ControlButton
                                        className='react-flow__controls-interactive'
                                        onClick={() => {
                                            setIsSnappingEnabled((isEnabled) => !isEnabled)
                                        }}
                                        title={t('canvas.toggleSnapping')}
                                        aria-label={t('canvas.toggleSnapping')}
                                    >
                                        {isSnappingEnabled ? <IconMagnetFilled /> : <IconMagnetOff />}
                                    </ControlButton>
                                    <ControlButton
                                        className='react-flow__controls-interactive'
                                        onClick={() => {
                                            setIsBackgroundEnabled((isEnabled) => !isEnabled)
                                        }}
                                        title={t('canvas.toggleBackground')}
                                        aria-label={t('canvas.toggleBackground')}
                                    >
                                        {isBackgroundEnabled ? <IconArtboard /> : <IconArtboardOff />}
                                    </ControlButton>
                                </LocalizedControls>
                                {isBackgroundEnabled && <Background color='#aaa' gap={16} />}
                                <EditNodeDialog
                                    show={editNodeDialogOpen}
                                    dialogProps={editNodeDialogProps}
                                    onCancel={() => setEditNodeDialogOpen(false)}
                                />
                            </ReactFlow>
                        </div>
                    </div>
                </Box>
            </Box>
        </>
    )
}

export default MarketplaceCanvasV2
