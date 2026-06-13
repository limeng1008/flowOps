import PropTypes from 'prop-types'
import { ControlButton, Controls, useReactFlow, useStore, useStoreApi } from 'reactflow'
import { useTranslation } from 'react-i18next'
import { IconFocusCentered, IconLock, IconLockOpen, IconMinus, IconPlus } from '@tabler/icons-react'

const interactiveSelector = (state) => ({
    isInteractive: state.nodesDraggable || state.nodesConnectable || state.elementsSelectable,
    minZoomReached: state.transform[2] <= state.minZoom,
    maxZoomReached: state.transform[2] >= state.maxZoom
})

const LocalizedControls = ({ children, className, fitViewOptions, onFitView, onInteractiveChange, onZoomIn, onZoomOut, style }) => {
    const { t } = useTranslation()
    const store = useStoreApi()
    const { fitView, zoomIn, zoomOut } = useReactFlow()
    const { isInteractive, minZoomReached, maxZoomReached } = useStore(interactiveSelector)

    const handleZoomIn = () => {
        zoomIn()
        onZoomIn?.()
    }

    const handleZoomOut = () => {
        zoomOut()
        onZoomOut?.()
    }

    const handleFitView = () => {
        fitView(fitViewOptions)
        onFitView?.()
    }

    const handleToggleInteractivity = () => {
        const nextInteractive = !isInteractive
        store.setState({
            nodesDraggable: nextInteractive,
            nodesConnectable: nextInteractive,
            elementsSelectable: nextInteractive
        })
        onInteractiveChange?.(nextInteractive)
    }

    return (
        <Controls className={className} showFitView={false} showInteractive={false} showZoom={false} style={style}>
            <ControlButton
                className='react-flow__controls-zoomin'
                disabled={maxZoomReached}
                onClick={handleZoomIn}
                title={t('canvas.controls.zoomIn')}
                aria-label={t('canvas.controls.zoomIn')}
            >
                <IconPlus />
            </ControlButton>
            <ControlButton
                className='react-flow__controls-zoomout'
                disabled={minZoomReached}
                onClick={handleZoomOut}
                title={t('canvas.controls.zoomOut')}
                aria-label={t('canvas.controls.zoomOut')}
            >
                <IconMinus />
            </ControlButton>
            <ControlButton
                className='react-flow__controls-fitview'
                onClick={handleFitView}
                title={t('canvas.controls.fitView')}
                aria-label={t('canvas.controls.fitView')}
            >
                <IconFocusCentered />
            </ControlButton>
            <ControlButton
                className='react-flow__controls-interactive'
                onClick={handleToggleInteractivity}
                title={t('canvas.controls.toggleInteractivity')}
                aria-label={t('canvas.controls.toggleInteractivity')}
            >
                {isInteractive ? <IconLockOpen /> : <IconLock />}
            </ControlButton>
            {children}
        </Controls>
    )
}

LocalizedControls.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    fitViewOptions: PropTypes.object,
    onFitView: PropTypes.func,
    onInteractiveChange: PropTypes.func,
    onZoomIn: PropTypes.func,
    onZoomOut: PropTypes.func,
    style: PropTypes.object
}

export default LocalizedControls
