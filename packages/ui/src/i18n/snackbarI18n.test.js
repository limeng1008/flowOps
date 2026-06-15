const { translateSnackbarMessage } = require('./snackbarI18n')

const zh = {
    'snackbar.chatflowSaved': '对话流已保存',
    'snackbar.agentflowSaved': '智能体流已保存',
    'snackbar.scheduleEnabled': '定时任务已启用',
    'snackbar.scheduleDisabled': '定时任务已停用',
    'snackbar.scheduleToggleFailed': '切换定时任务失败',
    'snackbar.mandatoryFields': '请填写以下必填字段：{{fields}}',
    'snackbar.failedActionTarget': '{{action}}{{target}}失败：{{message}}',
    'snackbar.failedActionOnly': '{{action}}失败：{{message}}',
    'snackbar.failedWithMessage': '失败：{{message}}',
    'snackbar.ttsFailed': 'TTS 失败：{{message}}',
    'snackbar.ttsRequestFailed': 'TTS 请求失败：{{status}}',
    'snackbar.httpStatusError': 'HTTP 错误！状态码：{{status}}',
    'snackbar.actions.addNew': '新增',
    'snackbar.actions.save': '保存',
    'snackbar.actions.delete': '删除',
    'snackbar.actions.update': '更新',
    'snackbar.actions.refresh': '刷新',
    'snackbar.actions.export': '导出',
    'snackbar.actions.retrieve': '获取',
    'snackbar.actions.previewChunks': '预览分块',
    'snackbar.actions.processChunking': '处理分块',
    'snackbar.targets.apiKey': 'API 密钥',
    'snackbar.targets.documentStore': '文档库',
    'snackbar.targets.documentLoader': '文档加载器',
    'snackbar.targets.tool': '工具',
    'snackbar.targets.variable': '变量',
    'snackbar.targets.vectorStoreConfig': '向量库配置',
    'snackbar.targets.chunk': '分块'
}

const en = {
    'snackbar.chatflowSaved': 'Chatflow saved',
    'snackbar.agentflowSaved': 'Agentflow saved',
    'snackbar.scheduleEnabled': 'Schedule enabled successfully',
    'snackbar.scheduleDisabled': 'Schedule disabled successfully',
    'snackbar.scheduleToggleFailed': 'Failed to toggle schedule',
    'snackbar.mandatoryFields': 'Please fill in the following mandatory fields: {{fields}}',
    'snackbar.failedActionTarget': 'Failed to {{action}} {{target}}: {{message}}',
    'snackbar.failedActionOnly': 'Failed to {{action}}: {{message}}',
    'snackbar.failedWithMessage': 'Failed: {{message}}',
    'snackbar.ttsFailed': 'TTS failed: {{message}}',
    'snackbar.ttsRequestFailed': 'TTS request failed: {{status}}',
    'snackbar.httpStatusError': 'HTTP error! status: {{status}}',
    'snackbar.actions.addNew': 'add new',
    'snackbar.actions.save': 'save',
    'snackbar.actions.delete': 'delete',
    'snackbar.actions.update': 'update',
    'snackbar.actions.refresh': 'refresh',
    'snackbar.actions.export': 'export',
    'snackbar.actions.retrieve': 'retrieve',
    'snackbar.actions.previewChunks': 'preview chunks',
    'snackbar.actions.processChunking': 'process chunking',
    'snackbar.targets.apiKey': 'API key',
    'snackbar.targets.documentStore': 'Document Store',
    'snackbar.targets.documentLoader': 'Document Loader',
    'snackbar.targets.tool': 'Tool',
    'snackbar.targets.variable': 'Variable',
    'snackbar.targets.vectorStoreConfig': 'vector store config',
    'snackbar.targets.chunk': 'chunk'
}

const makeT =
    (dict) =>
    (key, values = {}) => {
        let result = dict[key] || key
        Object.entries(values).forEach(([name, value]) => {
            result = result.replace(`{{${name}}}`, value)
        })
        return result
    }

describe('snackbar i18n', () => {
    it('translates global success, warning, and error snackbar messages', () => {
        const t = makeT(zh)

        expect(translateSnackbarMessage('Chatflow saved', t)).toBe('对话流已保存')
        expect(translateSnackbarMessage('Agentflow saved', t)).toBe('智能体流已保存')
        expect(translateSnackbarMessage('Schedule enabled successfully', t)).toBe('定时任务已启用')
        expect(translateSnackbarMessage('Schedule disabled successfully', t)).toBe('定时任务已停用')
        expect(translateSnackbarMessage('Failed to toggle schedule', t)).toBe('切换定时任务失败')
        expect(translateSnackbarMessage('Please fill in the following mandatory fields: name, URL', t)).toBe(
            '请填写以下必填字段：name, URL'
        )
        expect(translateSnackbarMessage('Failed to delete Tool: permission denied', t)).toBe('删除工具失败：permission denied')
        expect(translateSnackbarMessage('Failed to add new API key: duplicate name', t)).toBe('新增API 密钥失败：duplicate name')
        expect(translateSnackbarMessage('Failed to update vector store config: bad request', t)).toBe('更新向量库配置失败：bad request')
        expect(translateSnackbarMessage('Failed to preview chunks: missing file', t)).toBe('预览分块失败：missing file')
        expect(translateSnackbarMessage('TTS failed: no audio returned', t)).toBe('TTS 失败：no audio returned')
        expect(translateSnackbarMessage('HTTP error! status: 500', t)).toBe('HTTP 错误！状态码：500')
    })

    it('keeps English and unmapped backend detail readable', () => {
        expect(translateSnackbarMessage('Chatflow saved', makeT(en))).toBe('Chatflow saved')
        expect(translateSnackbarMessage('Failed to delete Tool: permission denied', makeT(en))).toBe(
            'Failed to delete Tool: permission denied'
        )
        expect(translateSnackbarMessage('Unmapped backend detail', makeT(zh))).toBe('Unmapped backend detail')
        expect(translateSnackbarMessage({ label: 'Custom node' }, makeT(zh))).toEqual({ label: 'Custom node' })
    })
})
