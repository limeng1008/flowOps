import { translateNodeCategory, translateNodeDescription, translateNodeLabel } from '../../i18n/nodeI18n'

export const fuzzyNodeSearchScore = (searchTerm, text) => {
    const search = ((searchTerm ?? '') + '').trim().toLowerCase()
    if (!search) return 0
    const target = ((text ?? '') + '').toLowerCase()

    let score = 0
    let searchIndex = 0
    let firstMatchIndex = -1
    let lastMatchIndex = -1
    let consecutiveMatches = 0

    const exactMatchIndex = target.indexOf(search)
    if (exactMatchIndex !== -1) {
        score = 1000
        if (exactMatchIndex === 0) {
            score += 200
        } else if (target[exactMatchIndex - 1] === ' ' || target[exactMatchIndex - 1] === '-' || target[exactMatchIndex - 1] === '_') {
            score += 100
        }
        score -= exactMatchIndex * 2
        score -= (target.length - search.length) * 3
        return score
    }

    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
        if (target[i] === search[searchIndex]) {
            score += 10

            if (lastMatchIndex === i - 1) {
                consecutiveMatches++
                score += 5 + consecutiveMatches * 2
            } else {
                consecutiveMatches = 0
            }

            if (i === 0) {
                score += 20
            }

            if (i > 0 && (target[i - 1] === ' ' || target[i - 1] === '-' || target[i - 1] === '_')) {
                score += 15
            }

            if (firstMatchIndex === -1) firstMatchIndex = i
            lastMatchIndex = i
            searchIndex++
        }
    }

    if (searchIndex < search.length) {
        return 0
    }

    score -= Math.max(0, target.length - search.length) * 2
    const span = lastMatchIndex - firstMatchIndex + 1
    const gaps = Math.max(0, span - search.length)
    score -= gaps * 3

    return score
}

const translatedNodeFields = (node, lang) => [
    { value: node.name, weight: 1 },
    { value: node.label, weight: 1 },
    { value: translateNodeLabel(node.label, lang), weight: 1 },
    { value: node.category, weight: 0.5 },
    { value: translateNodeCategory(node.category, lang), weight: 0.5 },
    { value: node.description, weight: 0.35 },
    { value: translateNodeDescription(node.description, lang), weight: 0.35 }
]

export const scoreAndSortNodesBySearch = (nodes, searchValue, lang) => {
    if (!searchValue || searchValue.trim() === '') {
        return nodes
    }

    return nodes
        .map((node) => {
            const score = Math.max(
                ...translatedNodeFields(node, lang).map(({ value, weight }) => fuzzyNodeSearchScore(searchValue, value) * weight)
            )
            return { node, score }
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.node)
}
