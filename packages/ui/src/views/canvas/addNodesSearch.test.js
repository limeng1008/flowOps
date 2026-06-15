import { scoreAndSortNodesBySearch } from './addNodesSearch'

describe('scoreAndSortNodesBySearch', () => {
    const nodes = [
        {
            name: 'conversationChain',
            label: 'Conversation Chain',
            category: 'Chains',
            description: 'Chat models specific conversational chain with memory'
        },
        {
            name: 'calculator',
            label: 'Calculator',
            category: 'Tools',
            description: 'Perform calculations'
        }
    ]

    it('matches translated Chinese node labels', () => {
        const result = scoreAndSortNodesBySearch(nodes, '对话', 'zh')

        expect(result.map((node) => node.name)).toEqual(['conversationChain'])
    })

    it('matches translated Chinese node descriptions', () => {
        const result = scoreAndSortNodesBySearch(nodes, '记忆', 'zh')

        expect(result.map((node) => node.name)).toEqual(['conversationChain'])
    })

    it('keeps English node search behavior', () => {
        const result = scoreAndSortNodesBySearch(nodes, 'calc', 'zh')

        expect(result.map((node) => node.name)).toEqual(['calculator'])
    })
})
