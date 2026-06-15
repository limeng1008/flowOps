/**
 * FlowOps self 轨邮件模板(原创中文,内联 HTML)。
 * 不引用任何 enterprise/上游模板。用户提供的字段(姓名/工作区名/链接)统一转义后嵌入。
 */

const APP_NAME = 'FlowOps'
const PRIMARY = '#06b6d4'

const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string))

const layout = (heading: string, introHtml: string, buttonText: string, link: string, footer: string): string => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
  <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(heading)}</h1>
  <p style="font-size:14px;line-height:1.6;margin:0 0 20px">${introHtml}</p>
  <p style="margin:0 0 24px">
    <a href="${escapeHtml(
        link
    )}" style="display:inline-block;background:${PRIMARY};color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px">${escapeHtml(
    buttonText
)}</a>
  </p>
  <p style="font-size:12px;color:#6b7280;line-height:1.6;margin:0 0 8px">如果按钮无法点击,请复制以下链接到浏览器打开:</p>
  <p style="font-size:12px;color:#2563eb;word-break:break-all;margin:0 0 24px">${escapeHtml(link)}</p>
  <p style="font-size:12px;color:#9ca3af;margin:0">${escapeHtml(footer)}</p>
</div>`

export interface InviteEmailParams {
    inviteLink: string
    inviterName?: string | null
    workspaceName?: string | null
}

export const buildInviteEmail = ({ inviteLink, inviterName, workspaceName }: InviteEmailParams) => {
    const whoText = inviterName ? `${inviterName} ` : ''
    const whereText = workspaceName ? `「${workspaceName}」` : ''
    const subject = `邀请你加入 ${APP_NAME}`
    const introHtml = `${escapeHtml(whoText)}邀请你加入 ${APP_NAME}${escapeHtml(
        whereText
    )}。点击下方按钮完成注册并设置密码,链接 24 小时内有效。`
    const text =
        `${whoText}邀请你加入 ${APP_NAME}${whereText}。\n` +
        `打开以下链接完成注册(24 小时内有效):\n${inviteLink}\n\n` +
        `如果你并未预期收到此邀请,可忽略本邮件。`
    const html = layout(subject, introHtml, '接受邀请并注册', inviteLink, '如果你并未预期收到此邀请,可忽略本邮件。')
    return { subject, text, html }
}

export interface ResetEmailParams {
    resetLink: string
}

export const buildResetPasswordEmail = ({ resetLink }: ResetEmailParams) => {
    const subject = `重置你的 ${APP_NAME} 密码`
    const introHtml = `我们收到了重置你 ${APP_NAME} 账号密码的请求。点击下方按钮设置新密码,链接 24 小时内有效。`
    const text =
        `我们收到了重置你 ${APP_NAME} 账号密码的请求。\n` +
        `打开以下链接设置新密码(24 小时内有效):\n${resetLink}\n\n` +
        `如果这不是你本人操作,请忽略本邮件,你的密码不会改变。`
    const html = layout(subject, introHtml, '重置密码', resetLink, '如果这不是你本人操作,请忽略本邮件,你的密码不会改变。')
    return { subject, text, html }
}
