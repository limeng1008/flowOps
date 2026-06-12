const fs = require('fs')
const path = require('path')

describe('AgentFlowNode layout guards', () => {
    const source = fs.readFileSync(path.join(__dirname, 'AgentFlowNode.jsx'), 'utf8')

    it('keeps agent flow nodes compact without clipping output handles', () => {
        expect(source).toContain("overflow: 'visible'")
        expect(source).toContain("minWidth: data.name === 'startAgentflow' ? undefined : 220")
        expect(source).toContain("maxWidth: data.name === 'startAgentflow' ? undefined : 300")
        expect(source).toContain('pr: getOutputAnchors().length ? 2.5 : 0')
        expect(source).toContain("textOverflow: 'ellipsis'")
    })
})
