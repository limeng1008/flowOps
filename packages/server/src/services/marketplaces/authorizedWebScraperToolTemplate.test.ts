import fs from 'fs'
import path from 'path'

const templatePath = path.join(__dirname, '../../../marketplaces/tools/授权网页抓取.json')

describe('Authorized Web Scraper marketplace tool template', () => {
    it('adds a marketplace tool for authorized webpage scraping', () => {
        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
        const schema = JSON.parse(template.schema)

        expect(template.name).toBe('authorized_web_scraper')
        expect(template.description).toContain('Cookie')
        expect(template.description).toContain('Authorization')
        expect(template.description).toContain('不会绕过')
        expect(template.badge).toBe('NEW')
        expect(template.usecases).toEqual(expect.arrayContaining(['Web Scraping', 'Research']))
        expect(schema).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ property: 'url', required: true }),
                expect.objectContaining({ property: 'cookie', required: false }),
                expect.objectContaining({ property: 'authorization', required: false }),
                expect.objectContaining({ property: 'headersJson', required: false }),
                expect.objectContaining({ property: 'mode', required: false })
            ])
        )
        expect(template.func).toContain('CONFIG_COOKIE')
        expect(template.func).toContain('CONFIG_AUTHORIZATION')
        expect(template.func).toContain('SPIDER_API_KEY')
        expect(template.func).toContain('页面需要登录')
        expect(template.func).toContain('不会绕过未授权访问')
    })
})
