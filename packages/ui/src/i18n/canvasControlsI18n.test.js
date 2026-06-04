const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'canvas.addNode',
    'canvas.clearSearch',
    'canvas.syncNodes',
    'canvas.nodeInput.webhookSecretGenerated',
    'canvas.nodeInput.webhookSecretGenerateFailed',
    'canvas.nodeInput.webhookSecretRemoved',
    'canvas.nodeInput.webhookSecretRemoveFailed',
    'canvas.nodeInput.mandatoryFields',
    'canvas.nodeInput.selectKnowledgeBase',
    'canvas.nodeInput.docStoreDescriptionGenerated',
    'canvas.nodeInput.docStoreDescriptionGenerateFailed',
    'canvas.nodeInput.typeVariableHint',
    'canvas.nodeInput.generateKnowledgeDescription',
    'canvas.nodeInput.generateInstructions',
    'canvas.nodeInput.webhookUrlUnavailable',
    'canvas.nodeInput.copyUrl',
    'canvas.nodeInput.urlCopied',
    'canvas.nodeInput.urlCopyFailed',
    'canvas.nodeInput.webhookSecretRequired',
    'canvas.nodeInput.noSecretConfigured',
    'canvas.nodeInput.generateSecret',
    'canvas.nodeInput.copySecret',
    'canvas.nodeInput.secretCopied',
    'canvas.nodeInput.secretCopyFailed',
    'canvas.nodeInput.regenerateSecret',
    'canvas.nodeInput.removeSecret',
    'canvas.nodeInput.generatedInstructionSetFailed',
    'canvas.agentflowErrors.onlyOneStartNode',
    'canvas.agentflowErrors.nestedIterationUnsupported',
    'canvas.agentflowErrors.humanInputInsideIterationUnsupported'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('canvas controls and node input i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('routes NodeInputHandler snackbar and tooltip copy through i18n', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/canvas/NodeInputHandler.jsx'), 'utf8')

        expect(source).toContain("t('canvas.nodeInput.webhookSecretGenerated')")
        expect(source).toContain("t('canvas.nodeInput.docStoreDescriptionGenerated')")
        expect(source).toContain("title={t('canvas.nodeInput.typeVariableHint')}")
        expect(source).toContain("title={t('canvas.nodeInput.generateKnowledgeDescription')}")
        expect(source).toContain("t('canvas.nodeInput.generatedInstructionSetFailed')")
        expect(source).not.toContain('Webhook secret generated.')
        expect(source).not.toContain('Please select a knowledge base')
        expect(source).not.toContain('Type {{ to select variables')
        expect(source).not.toContain('Generate knowledge base description')
        expect(source).not.toContain('Error setting generated instruction')
    })

    it('routes canvas buttons and agentflow drop warnings through i18n', () => {
        const addNodesSource = fs.readFileSync(path.join(__dirname, '../views/canvas/AddNodes.jsx'), 'utf8')
        const canvasSource = fs.readFileSync(path.join(__dirname, '../views/canvas/index.jsx'), 'utf8')
        const agentflowCanvasSource = fs.readFileSync(path.join(__dirname, '../views/agentflowsv2/Canvas.jsx'), 'utf8')

        expect(addNodesSource).toContain("title={t('canvas.addNode')}")
        expect(addNodesSource).toContain("title={t('canvas.clearSearch')}")
        expect(canvasSource).toContain("title={t('canvas.syncNodes')}")
        expect(agentflowCanvasSource).toContain("title={t('canvas.syncNodes')}")
        expect(agentflowCanvasSource).toContain("t('canvas.agentflowErrors.onlyOneStartNode')")
        expect(agentflowCanvasSource).toContain("t('canvas.agentflowErrors.nestedIterationUnsupported')")
        expect(agentflowCanvasSource).toContain("t('canvas.agentflowErrors.humanInputInsideIterationUnsupported')")
        expect(addNodesSource).not.toContain("title='Add Node'")
        expect(addNodesSource).not.toContain("title='Clear Search'")
        expect(canvasSource).not.toContain("title='Sync Nodes'")
        expect(agentflowCanvasSource).not.toContain('Only one start node is allowed')
    })
})
