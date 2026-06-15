import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'

const mockSendMail = jest.fn()
const mockCreateTransport = jest.fn((..._args: unknown[]) => ({ sendMail: mockSendMail }))

jest.mock('nodemailer', () => ({
    __esModule: true,
    default: { createTransport: (...args: unknown[]) => mockCreateTransport(...args) }
}))

import { isSelfSmtpConfigured, sendSelfMail } from './mailer'

describe('self IAM mailer', () => {
    const savedEnv = { ...process.env }

    beforeEach(() => {
        mockSendMail.mockReset()
        mockCreateTransport.mockClear()
    })

    afterEach(() => {
        process.env = { ...savedEnv }
    })

    it('isSelfSmtpConfigured: 缺任一关键项 / 端口非数字 → false;齐全 → true', () => {
        delete process.env.SMTP_HOST
        delete process.env.SMTP_USER
        delete process.env.SMTP_PASSWORD
        delete process.env.SMTP_PORT
        expect(isSelfSmtpConfigured()).toBe(false)

        process.env.SMTP_HOST = 'smtp.example.com'
        process.env.SMTP_USER = 'noreply@example.com'
        process.env.SMTP_PASSWORD = 'app-secret'
        process.env.SMTP_PORT = '465'
        expect(isSelfSmtpConfigured()).toBe(true)

        process.env.SMTP_PORT = 'not-a-number'
        expect(isSelfSmtpConfigured()).toBe(false)
    })

    it('sendSelfMail: 按 env 构造 transport 并发信(465 → secure:true)', async () => {
        process.env.SMTP_HOST = 'smtp.exmail.qq.com'
        process.env.SMTP_PORT = '465'
        process.env.SMTP_SECURE = 'true'
        process.env.SMTP_USER = 'noreply@flowops.test'
        process.env.SMTP_PASSWORD = 'app-secret'
        process.env.SENDER_EMAIL = 'noreply@flowops.test'

        await sendSelfMail({ to: 'invitee@example.com', subject: '邀请你加入 FlowOps', html: '<b>hi</b>', text: 'hi' })

        expect(mockCreateTransport).toHaveBeenCalledWith(
            expect.objectContaining({
                host: 'smtp.exmail.qq.com',
                port: 465,
                secure: true,
                auth: { user: 'noreply@flowops.test', pass: 'app-secret' }
            })
        )
        expect(mockSendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                from: 'noreply@flowops.test',
                to: 'invitee@example.com',
                subject: '邀请你加入 FlowOps',
                html: '<b>hi</b>',
                text: 'hi'
            })
        )
    })

    it('SMTP_SECURE=false → secure:false(587 STARTTLS);SENDER_EMAIL 缺省回退 SMTP_USER', async () => {
        process.env.SMTP_HOST = 'smtp.example.com'
        process.env.SMTP_PORT = '587'
        process.env.SMTP_SECURE = 'false'
        process.env.SMTP_USER = 'u@example.com'
        process.env.SMTP_PASSWORD = 'p'
        delete process.env.SENDER_EMAIL

        await sendSelfMail({ to: 'x@example.com', subject: 's', html: 'h', text: 't' })

        expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 587, secure: false }))
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ from: 'u@example.com' }))
    })
})
