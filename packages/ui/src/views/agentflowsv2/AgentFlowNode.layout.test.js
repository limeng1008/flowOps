const fs = require('fs')
const path = require('path')

describe('AgentFlowNode layout guards', () => {
    const source = fs.readFileSync(path.join(__dirname, 'AgentFlowNode.jsx'), 'utf8')

    it('keeps agent flow output handles from being clipped by the node card', () => {
        expect(source).toContain("overflow: 'visible'")
        expect(source).toContain("minWidth: data.name === 'startAgentflow' ? undefined : 280")
        expect(source).toContain('pr: getOutputAnchors().length ? 2.5 : 0')
    })
})
