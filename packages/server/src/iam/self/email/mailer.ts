import nodemailer from 'nodemailer'

/**
 * FlowOps 自建 IAM(self 轨)的邮件发送工具。
 *
 * 完全自包含,不依赖已删除的商业 IAM 源码;self 轨必须自带 mailer。
 * 仅在 SMTP 配置齐全时发送;未配置时由调用方回退到"返回链接"。
 *
 * 读取的环境变量与 enterprise 同名,配置体验一致:
 * SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_SECURE / SENDER_EMAIL
 * (SMTP_SECURE 默认 true;465→SSL=true,587→STARTTLS=false。ALLOW_UNAUTHORIZED_CERTS 可放宽自签证书校验。)
 */

export const isSelfSmtpConfigured = (): boolean => {
    const port = Number.parseInt(process.env.SMTP_PORT ?? '', 10)
    return Boolean(
        process.env.SMTP_HOST?.trim() &&
            process.env.SMTP_USER?.trim() &&
            process.env.SMTP_PASSWORD?.trim() &&
            process.env.SMTP_PORT &&
            !Number.isNaN(port)
    )
}

const senderAddress = (): string => process.env.SENDER_EMAIL?.trim() || (process.env.SMTP_USER as string)

export interface SelfMailOptions {
    to: string
    subject: string
    html: string
    text: string
}

export const sendSelfMail = async ({ to, subject, html, text }: SelfMailOptions): Promise<void> => {
    // 惰性创建 transport(不在模块加载时创建,避免未配置 SMTP 时报错)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT ?? '', 10),
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        tls: process.env.ALLOW_UNAUTHORIZED_CERTS ? { rejectUnauthorized: false } : undefined
    })

    await transporter.sendMail({ from: senderAddress(), to, subject, text, html })
}
