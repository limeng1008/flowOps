import fs from 'fs'
import path from 'path'

const templatePath = path.join(__dirname, '../../../marketplaces/agentflowsv2/PPT Deck Agent.json')

describe('PPT Deck Agent marketplace template', () => {
    it('ships an AgentflowV2 template for generating presentation deck plans', () => {
        expect(fs.existsSync(templatePath)).toBe(true)

        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))

        expect(template.description).toBe(
            'Generate a structured presentation deck plan with slide content, speaker notes, and visual direction'
        )
        expect(template.usecases).toEqual(['Agent', 'Presentation'])
        expect(template.nodes.map((node: any) => node.data.name)).toEqual(['startAgentflow', 'llmAgentflow', 'stickyNoteAgentflow'])
        expect(template.edges).toHaveLength(1)

        const startNode = template.nodes.find((node: any) => node.id === 'startAgentflow_0')
        expect(startNode.data.inputs.startInputType).toBe('formInput')
        expect(startNode.data.inputs.formTitle).toBe('PPT Deck Agent')
        expect(startNode.data.inputs.formInputTypes.map((input: any) => input.name)).toEqual([
            'topic',
            'audience',
            'slideCount',
            'tone',
            'materials'
        ])

        const llmNode = template.nodes.find((node: any) => node.id === 'llmAgentflow_0')
        expect(llmNode.data.label).toBe('PPT Deck Planner')
        expect(llmNode.data.inputs.llmReturnResponseAs).toBe('userMessage')
        expect(llmNode.data.inputs.llmMessages[0].content).toContain('presentation deck strategist')
        expect(llmNode.data.inputs.llmStructuredOutput.map((field: any) => field.key)).toEqual([
            'deckTitle',
            'executiveSummary',
            'targetAudience',
            'narrativeArc',
            'slides',
            'designDirection',
            'deliveryTips'
        ])

        const stickyNote = template.nodes.find((node: any) => node.id === 'stickyNoteAgentflow_0')
        expect(stickyNote.type).toBe('stickyNote')
        expect(stickyNote.data.inputs.note).toContain('not a downloadable .pptx')
    })
})
