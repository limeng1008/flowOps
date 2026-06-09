import fs from 'fs'
import path from 'path'

describe('server .env.example', () => {
    it('enables APP_URL by default so invite links can be generated after copying the file', () => {
        const envExample = fs.readFileSync(path.join(__dirname, '..', '..', '..', '.env.example'), 'utf8')

        expect(envExample).toMatch(/^APP_URL=http:\/\/localhost:3000$/m)
    })
})
