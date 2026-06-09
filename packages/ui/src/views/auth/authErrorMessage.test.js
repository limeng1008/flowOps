import en from '@/i18n/locales/en.json'
import zh from '@/i18n/locales/zh.json'
import { translateAuthErrorMessage } from './authErrorMessage'

const tFrom = (locale) => (key, fallback) =>
    key.split('.').reduce((value, part) => (value && value[part] !== undefined ? value[part] : undefined), locale) || fallback

describe('auth error message translation', () => {
    it('translates backend login failures in Chinese', () => {
        expect(translateAuthErrorMessage('Incorrect Email or Password', tFrom(zh))).toBe('邮箱或密码错误')
    })

    it('translates open source organization setup failures in Chinese', () => {
        expect(translateAuthErrorMessage('You can only have one organization', tFrom(zh))).toBe(
            '系统中已存在组织，请直接登录或联系管理员。'
        )
    })

    it('keeps backend login failures readable in English', () => {
        expect(translateAuthErrorMessage('Incorrect Email or Password', tFrom(en))).toBe('Incorrect email or password')
    })

    it('falls back to the original message when no translation mapping exists', () => {
        expect(translateAuthErrorMessage('Something unexpected', tFrom(zh))).toBe('Something unexpected')
    })
})
