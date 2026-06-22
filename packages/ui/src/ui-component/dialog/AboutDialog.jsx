import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Dialog, DialogContent, DialogTitle, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material'
import moment from 'moment'
import axios from 'axios'
import { baseURL } from '@/store/constant'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/store/context/ConfigContext'

// 由品牌仓库 URL 推导 GitHub API 地址;非 github 仓库返回空(不检查最新版本)
const toGithubApiRepo = (url) => {
    const m = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url || '')
    return m ? `https://api.github.com/repos/${m[1]}/${m[2]}` : ''
}

const AboutDialog = ({ show, onCancel }) => {
    const { t, i18n } = useTranslation()
    const { brand } = useConfig()
    const portalElement = document.getElementById('portal')
    const currentLang = i18n.resolvedLanguage || i18n.language
    const momentLocale = currentLang?.startsWith('zh') ? 'zh-cn' : 'en'

    const [data, setData] = useState({})
    const hasLatest = Boolean(data?.name)

    useEffect(() => {
        if (show) {
            const currentVersionReq = axios.get(`${baseURL}/api/v1/version`, {
                withCredentials: true,
                headers: { 'Content-type': 'application/json', 'x-request-from': 'internal' }
            })
            // 白标:仅当部署方配置了品牌仓库时才检查最新版本,默认不向上游公共仓库请求
            const apiRepo = toGithubApiRepo(brand?.repoUrl)
            const latestReleaseReq = apiRepo ? axios.get(`${apiRepo}/releases/latest`) : Promise.resolve({ data: {} })

            Promise.all([latestReleaseReq, currentVersionReq])
                .then(([latestReleaseData, currentVersionData]) => {
                    setData({
                        ...latestReleaseData.data,
                        currentVersion: currentVersionData.data.version
                    })
                })
                .catch((error) => {
                    console.error('Error fetching data:', error)
                })
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show])

    const component = show ? (
        <Dialog
            onClose={onCancel}
            open={show}
            fullWidth
            maxWidth='sm'
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='alert-dialog-title'>
                {brand?.name || 'FlowOps'} {t('profile.version')}
            </DialogTitle>
            <DialogContent>
                {data && (
                    <TableContainer component={Paper}>
                        <Table aria-label='simple table'>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('profile.currentVersion')}</TableCell>
                                    {hasLatest && (
                                        <>
                                            <TableCell>{t('profile.latestVersion')}</TableCell>
                                            <TableCell>{t('profile.publishedAt')}</TableCell>
                                        </>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component='th' scope='row'>
                                        {data.currentVersion}
                                    </TableCell>
                                    {hasLatest && (
                                        <>
                                            <TableCell component='th' scope='row'>
                                                <a target='_blank' rel='noreferrer' href={data.html_url}>
                                                    {data.name}
                                                </a>
                                            </TableCell>
                                            <TableCell>{moment(data.published_at).locale(momentLocale).fromNow()}</TableCell>
                                        </>
                                    )}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

AboutDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func
}

export default AboutDialog
