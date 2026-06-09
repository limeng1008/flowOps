import fs from 'fs'
import os from 'os'
import path from 'path'

import { NodesPool } from './NodesPool'
import logger from './utils/logger'

describe('NodesPool', () => {
    let tempDir: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flowise-nodes-'))
    })

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true })
        jest.restoreAllMocks()
    })

    it('does not require test helper files while loading runtime nodes', async () => {
        fs.writeFileSync(
            path.join(tempDir, 'GoodNode.js'),
            `
                class GoodNode {
                    constructor() {
                        this.name = 'goodNode'
                        this.label = 'Good Node'
                        this.category = 'Chains'
                        this.icon = ''
                        this.baseClasses = []
                    }
                }
                module.exports.nodeClass = GoodNode
            `
        )
        fs.writeFileSync(
            path.join(tempDir, 'cloudVectorNodeTestUtils.js'),
            `
                global.__FLOWISE_TEST_HELPER_REQUIRED__ = true
                jest.fn()
            `
        )
        const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined as any)

        const nodes = await new NodesPool().loadNodesFromDir(tempDir)

        expect(nodes.goodNode).toBeDefined()
        expect((globalThis as any).__FLOWISE_TEST_HELPER_REQUIRED__).toBeUndefined()
        expect(errorSpy).not.toHaveBeenCalled()
    })
})
