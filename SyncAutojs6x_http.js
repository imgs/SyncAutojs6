/**
 * SyncClipboard Android 自动同步脚本 v3.1.1-2026.03.15 (SyncAutojs6.js)
 * Copyright (c) 2026 CGQA (https://github.com/imgs/SyncAutojs6). MIT License.
 * 
 * 此脚本由 SyncClipboard 项目 script 目录下的 SyncAutoxJs.js 文件衍生而来
 * 已实现无感同步剪贴板、文件、截图、通知等功能，支持 Android 16 等系统，安装 AutoJs6 后使用，无需 Root 权限
 *
 * 功能说明：
 * 0. 多服务器支持 - 可同时配置多个服务器地址，按顺序尝试，直到某个成功或全部失败
 * 1. 剪贴板文本同步 - 自动上传/下载文本剪贴板，与 SyncClipboard 服务器保持同步
 * 2. 文件同步 - 监控 Upload 目录，新文件自动上传后删除，同步下载的文件在 Download 目录，这两个目录默认在 /sdcard/SyncClipboard/中可以找到（可关闭 enableFileSync）
 * 3. 截图上传 - 监控截图目录，新截图自动上传（可关闭 enableScreenshotUpload）
 * 4. 通知上传 - 支持自定义通知上传白名单，例如将微信/短信等通知内容自动上传为剪贴板（可关闭 notificationUploadDefaultOn）
 * 5. 剪贴板文件同步 - 监听剪贴板，检测到复制文件和 content URI 时自动上传（可关闭 enableClipboardFileSync）
 * 6. Group 上传 - Upload 目录下的子文件夹会打包为 zip 并作为 Group 上传（可关闭 enableGroupUpload）
 * 
 * 设计说明：
 * - 适配 SyncClipboard v3.x API，遵循 Hash.md 以 hash 作为内容唯一标识
 * - 截图上传前等待元数据稳定，避免系统修改文件导致重复上传
 * - 脚本启动时已存在的截图不参与上传，仅同步运行期间新产生的截图
 * - 上传过的内容（hash）永久记录，避免重复上传及误下载
 *
 * 使用说明：
 * 1. 安装 [AutoJs6](https://github.com/SuperMonster003/AutoJs6)，并对AutoJs6授权和开启所有文件访问权限、剪贴板、悬浮窗、自启动、电池优化不受限等权限
 * 2. 在 AutoJs6 中安装本脚本，并配置 User Config
 * 3. 运行脚本，即可实现无感同步剪贴板、文件、截图、通知等功能
 * 4. 需要搭配 SyncClipboard 服务器使用，服务器搭建请参考 SyncClipboard 项目 README.md
 * 5. 息屏同步可能需要用到改版 [Shizuku](https://github.com/thedjchi/Shizuku)，如有root权限可尝试原版 [Shizuku](https://github.com/RikkaApps/Shizuku)，请自行安装测试
 * 
 * 测试环境：
 * Android 16（小米 HyperOS 3.0）和 HarmonyOS 3.0（华为平板）系统中测试正常，其他设备/系统未测试
 * 
 * 特别感谢：
 * SyncClipboard 作者：Jeric-X，项目采用 MIT License
 * 项目地址：https://github.com/Jeric-X/SyncClipboard
 * 
 * AutoJs6 作者：SuperMonster003，项目采用 MPL-2.0 License
 * 项目地址：https://github.com/SuperMonster003/AutoJs6
 * 
 */

// START User Config
// 多服务器配置：按顺序尝试，优先使用前面的地址。
// 若只配置一个地址，可简写为 serverUrls = ['https://192.168.1.5:5033']
const serverUrls = [
    'http://192.168.1.5:5033',   // 局域网地址（优先）
    'https://scb.yourdomain.com:55033', // 公网地址（备用，请改为实际公网地址）
]
const url = 'https://scb.yourdomain.com:55033' // 单服务器模式时使用（当 serverUrls 未配置时生效）
const username = 'admin' // 用户名，默认 admin
const token = 'admin' // 令牌，默认 admin
const intervalTime = 2 * 1000                           // 自动同步间隔时间，默认 2 秒，多服务器轮询尝试若时间较大时可能发起同步间隔延迟较大
const showToastNotification = true // 显示 Toast 通知，默认开启
const toastLang = 'zh'  // 提示语言，默认 'zh' 中文，可选 'en' English
const syncWhenScreenOff = false  // 熄屏时是否同步，默认 false: 仅亮屏时同步
const notificationUploadDefaultOn = true // 指定应用通知内容自动上传功能，默认开启
const notificationPackageWhitelist = [
    // 'com.tencent.mm',                    // WeChat
    'com.android.mms',                   // 短信应用
    'com.google.android.apps.messaging', // Google Messages 应用
] // 指定应用通知上传白名单，默认包含 WeChat、短信、Google Messages 应用
// File sync settings
const enableFileSync = true // 文件同步功能，默认开启
const uploadDir = '/sdcard/SyncClipboard/Upload/' // 文件上传目录，默认 /sdcard/SyncClipboard/Upload/
const downloadDir = '/sdcard/SyncClipboard/Download/' // 文件下载目录，默认 /sdcard/SyncClipboard/Download/
const enableScreenshotUpload = true // 截图同步功能，默认开启
const enableClipboardFileSync = true // 剪贴板文件同步：检测到复制文件或 content URI 时自动上传该文件
const screenshotDirs = [
    '/sdcard/Pictures/Screenshots',
    '/sdcard/DCIM/Screenshots',
    '/sdcard/DCIM/ScreenCapture',
    '/storage/emulated/0/Pictures/Screenshots',
    '/storage/emulated/0/DCIM/Screenshots',
    '/storage/emulated/0/DCIM/ScreenCapture'
] // 截图目录，默认包含 Pictures/Screenshots、DCIM/Screenshots、DCIM/ScreenCapture
const enableGroupUpload = true // Group 上传：Upload 目录下的子文件夹会打包为 zip 并作为 Group 上传
// END User Config

// 使用内置 http 模块替代 axios，兼容 AutoJs6 6.7.0+ 且无需额外依赖
// 采用同步方式（无 callback）确保上传/下载可靠执行
function httpRequest(options) {
    const method = (options.method || 'GET').toUpperCase();
    const opts = {
        method: method,
        headers: options.headers || {},
        timeout: options.timeout || 10000,
    };
    if (options.data) {
        opts.contentType = 'application/json';
        opts.body = JSON.stringify(options.data);
    }
    if (options.url && options.url.startsWith('https://')) {
        try { opts.isInsecure = true; } catch (e) {} // 自签名证书支持
    }
    try {
        const res = http.request(options.url, opts);
        let data = null;
        if (res && res.body) {
            const str = res.body.string();
            if (options.responseType === 'json' && str) {
                try { data = JSON.parse(str); } catch (e) { data = str; }
            } else {
                data = str;
            }
        }
        return Promise.resolve({
            status: res ? res.statusCode : 0,
            statusText: res ? (res.statusMessage || '') : '',
            data: data
        });
    } catch (e) {
        return Promise.reject(e);
    }
}

const authHeader = 'Basic ' + $base64.encode(`${username}:${token}`)

// 多服务器：构建 URL 配置列表
const urlConfigs = (typeof serverUrls !== 'undefined' && serverUrls && serverUrls.length > 0
    ? serverUrls
    : [url]
).map(u => {
    let u2 = String(u).trim()
    while (u2.endsWith('/')) u2 = u2.substring(0, u2.length - 1)
    return { apiUrl: u2 + '/SyncClipboard.json', fileApiBaseUrl: u2 + '/file/' }
})
let currentUrlConfig = urlConfigs[0] // 当前使用的服务器配置

function getApiUrl() { return currentUrlConfig.apiUrl }
function getFileApiBaseUrl() { return currentUrlConfig.fileApiBaseUrl }

// 按顺序尝试各服务器，直到某个成功或全部失败
function tryWithServers(doRequest) {
    let lastErr
    function attempt(i) {
        if (i >= urlConfigs.length) return Promise.reject(lastErr)
        currentUrlConfig = urlConfigs[i]
        return Promise.resolve(doRequest()).catch(err => {
            lastErr = err
            return attempt(i + 1)
        })
    }
    return attempt(0)
}

const settingsStorage = storages.create('SyncClipboardSettings')
let notificationUploadOn = settingsStorage.get('enableNotificationUpload', notificationUploadDefaultOn)

let running = false
let remoteCache;
let uploadedFileThisCycle = false
let lastUploadedClipboard;
let lastUploadedClipboardFile;
let lastUploadedNotification;
let lastDownloadedText;
let lastDownloadedProfileSignature;
// 按 dataName 记录刚上传的文件的 dataName，下载时跳过
let recentlyUploadedFiles = new Set();
// 按 fullPath 记录已上传文件路径，避免同名不同路径的文件被误跳过
let recentlyUploadedPaths = new Set();
// 按 dataName 记录刚上传的文件的 hash，避免重复上传相同文件
let lastUploadedFileHash = {};
// 按 hash 记录刚上传的文件的 hash，避免重复上传相同文件
let lastUploadedFileHashSet = new Set();
// 按 hash 记录刚下载的文件的 hash，避免重复下载相同文件
let lastDownloadedFileHashSet = new Set();
// 按 modified time 跟踪上传的文件，避免重复上传未修改的文件
let uploadedFileMTimeMap = {}
// 按路径记录截图的 last state，避免重复上传未修改的截图
let screenshotLastState = {}
// 脚本启动时已存在的截图路径，不参与上传
let screenshotInitFiles = new Set()
// 正在上传中的文件，防止同一文件被重复加入任务
let uploadingNow = new Set()
// 截图目录是否已校验过，避免重复校验
let screenshotDirsChecked = false
// 校验后选中的唯一有效截图目录，避免重复轮询多个等价路径
var activeScreenshotDir = null

function getActiveScreenshotDir() {
    if (activeScreenshotDir != null) {
        try {
            if (files.exists(activeScreenshotDir) && files.listDir(activeScreenshotDir) != null)
                return activeScreenshotDir
        } catch (e) {}
        activeScreenshotDir = null
    }
    for (var i = 0; i < screenshotDirs.length; i++) {
        var dir = screenshotDirs[i]
        try {
            if (files.exists(dir) && files.listDir(dir) != null) {
                activeScreenshotDir = dir
                return dir
            }
        } catch (e) {}
    }
    return null
}

const T = toastLang === 'en' ? {
    syncFailed: 'Sync failed: ',
    syncUpdated: 'Sync updated:\n',
    downloaded: 'Downloaded: ',
    uploadFailed: 'Upload failed: ',
    uploaded: 'Uploaded: ',
    textDownloadFailed: 'Text download failed: ',
    hashVerifyFailed: 'Hash verify failed: ',
    downloadFailed: 'Download failed: ',
    screenshotUploaded: 'Screenshot uploaded: ',
    groupUploaded: 'Group uploaded: ',
    screenshotDirNotFound: 'Screenshot dir not found',
    screenshotDirFound: 'Screenshot dir: '
} : {
    syncFailed: '同步失败: ',
    syncUpdated: '同步已更新:\n',
    downloaded: '已下载: ',
    uploadFailed: '文件上传失败: ',
    uploaded: '已上传: ',
    textDownloadFailed: '长文本下载失败: ',
    hashVerifyFailed: '下载校验失败: ',
    downloadFailed: '下载失败: ',
    screenshotUploaded: '截图已上传: ',
    groupUploaded: 'Group 已上传: ',
    screenshotDirNotFound: '未找到截图目录',
    screenshotDirFound: '截图目录: '
}

// 按 SyncClipboard Hash.md 计算 Group 的 hash（zip 字节）
function computeGroupHash(zipBytes) {
    try {
        var bis = new java.io.ByteArrayInputStream(zipBytes)
        var zis = new java.util.zip.ZipInputStream(bis)
        var entries = []
        var dirs = {}
        var entry
        var md = java.security.MessageDigest.getInstance('SHA-256')
        while ((entry = zis.getNextEntry()) != null) {
            var name = String(entry.getName())
            if (name.indexOf('\\') >= 0) name = name.replace(/\\/g, '/')
            if (name.indexOf('/') >= 0 && name.charAt(name.length - 1) !== '/') {
                var parts = name.split('/')
                for (var p = 0; p < parts.length - 1; p++) {
                    var dirPath = parts.slice(0, p + 1).join('/') + '/'
                    dirs[dirPath] = true
                }
            }
            if (name.length > 0 && name.charAt(name.length - 1) === '/') {
                entries.push({ name: name, isDir: true })
            } else if (!entry.isDirectory()) {
                var buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 8192)
                var out = new java.io.ByteArrayOutputStream()
                var n
                while ((n = zis.read(buf)) > 0) out.write(buf, 0, n)
                var content = out.toByteArray()
                var contentHashBytes = md.digest(content)
                var contentHashHex = toHex(contentHashBytes).toUpperCase()
                entries.push({ name: name, isDir: false, length: content.length, contentHash: contentHashHex })
            }
            zis.closeEntry()
        }
        zis.close()
        for (var d in dirs) entries.push({ name: d, isDir: true })
        entries.sort(function(a, b) {
            var na = a.name, nb = b.name
            var ba = new java.lang.String(na).getBytes('UTF-8')
            var bb = new java.lang.String(nb).getBytes('UTF-8')
            var len = Math.min(ba.length, bb.length)
            for (var i = 0; i < len; i++) {
                var c = (ba[i] & 0xff) - (bb[i] & 0xff)
                if (c !== 0) return c
            }
            return ba.length - bb.length
        })
        var seen = {}
        var unique = []
        for (var i = 0; i < entries.length; i++) {
            var k = entries[i].name
            if (!seen[k]) { seen[k] = true; unique.push(entries[i]) }
        }
        var sb = new java.lang.StringBuilder()
        for (var j = 0; j < unique.length; j++) {
            var e = unique[j]
            if (e.isDir) sb.append('D|').append(e.name).append('\0')
            else sb.append('F|').append(e.name).append('|').append(e.length).append('|').append(e.contentHash).append('\0')
        }
        var inputBytes = sb.toString().getBytes('UTF-8')
        md.reset()
        return toHex(md.digest(inputBytes)).toUpperCase()
    } catch (e) {
        return ''
    }
}

// 按 SyncClipboard Hash.md 计算 File/Image 的 hash
function computeFileHash(bytes, fileName) {
    try {
        const md = java.security.MessageDigest.getInstance('SHA-256')
        const contentHashBytes = md.digest(bytes)
        const contentHashHex = toHex(contentHashBytes).toUpperCase()
        const combined = fileName + '|' + contentHashHex
        const combinedBytes = new java.lang.String(combined).getBytes('UTF-8')
        md.reset()
        const hashBytes = md.digest(combinedBytes)
        return toHex(hashBytes).toUpperCase()
    } catch (e) {
        return ''
    }
}

function toHex(bytes) {
    const sb = new java.lang.StringBuilder()
    for (let i = 0; i < bytes.length; i++) {
        sb.append(java.lang.String.format('%02x', bytes[i] & 0xff))
    }
    return sb.toString()
}

function hashEqual(a, b) {
    return a && b && String(a).toUpperCase() === String(b).toUpperCase()
}

function loop() {
    if (!syncWhenScreenOff && !device.isScreenOn())
        return
    if (running)
        return
    running = true

    ensureDirectories()
    uploadedFileThisCycle = false
    tryWithServers(() =>
        uploadFiles()
            .then(() => uploadClipboardFile())
            .then(() => upload())
            .then(ifContinue => {
                // 本周期未上传剪贴板且未上传文件时再下载，避免「上传后马上又下载」
                if (ifContinue && !uploadedFileThisCycle) return download()
            })
    )
        .then(() => { running = false })
        .catch(error => {
            running = false;
            let errMsg = '';
            let source = '';
            try {
                if (error) {
                    if (error.source) {
                        source = error.source;
                    }
                    if (error.message) {
                        errMsg = error.message;
                    } else if (typeof error === 'string') {
                        errMsg = error;
                    } else if (error.stack) {
                        errMsg = error.stack;
                    } else {
                        errMsg = JSON.stringify(error);
                    }
                }
            } catch (e) {
                errMsg = String(error);
            }
            console.error((source ? source + ' error: ' : 'error: ') + errMsg);
            if (showToastNotification) toast(T.syncFailed + (errMsg.length > 50 ? errMsg.substring(0, 50) + '...' : errMsg))
        });
}

function download() {
    return httpRequest({
        method: 'get',
        url: getApiUrl(),
        responseType: 'json',
        headers: { 'authorization': authHeader },
    })
        .then(res => {
            if (res.status < 200 || res.status >= 300) {
                throw res.status + ' ' + res.statusText
            } else {
                var profile = res.data;
                if (!profile || !profile.type)
                    return

                var signature = JSON.stringify({ type: profile.type, text: profile.text || '', dataName: profile.dataName || '' })

                if (profile.type == 'Text') {
                    var text = null
                    if (profile.hasData === true && profile.dataName) {
                        // 长文本存储在单独的 .txt 文件中
                        return downloadTextFile(profile.dataName).then(fullText => {
                            if (fullText != null && fullText.length != 0 && fullText != remoteCache && fullText != lastDownloadedText) {
                                remoteCache = fullText
                                lastDownloadedText = fullText
                                lastDownloadedProfileSignature = signature
                                setClip(fullText)
                                if (showToastNotification) {
                                    let logText = fullText.length > 20 ? fullText.substring(0, 20) + "..." : fullText
                                    toast(T.syncUpdated + logText)
                                }
                            }
                        })
                    } else {
                        text = profile.text
                        if (text != null && text.length != 0 && text != remoteCache && text != lastDownloadedText) {
                            remoteCache = text
                            lastDownloadedText = text
                            lastDownloadedProfileSignature = signature
                            setClip(text)
                            if (showToastNotification) {
                                let logText = text.length > 20 ? text.substring(0, 20) + '...' : text
                                toast(T.syncUpdated + logText)
                            }
                        }
                    }
                } else if ((profile.type == 'Image' || profile.type == 'File' || profile.type == 'Group') && profile.dataName) {
                    if (!enableFileSync) return
                    if (signature === lastDownloadedProfileSignature) return
                    if (recentlyUploadedFiles.has(profile.dataName)) return
                    var myUploadHash = lastUploadedFileHash[profile.dataName]
                    if (profile.hash && myUploadHash && hashEqual(profile.hash, myUploadHash)) return
                    var ph = (profile.hash || '').toUpperCase()
                    if (ph && lastUploadedFileHashSet.has(ph)) return
                    if (ph && lastDownloadedFileHashSet.has(ph)) return
                    return downloadFile(profile.dataName, profile.hash, profile.type == 'Group')
                        .then(savedPath => {
                            if (savedPath) {
                                lastDownloadedProfileSignature = signature
                                if (profile.hash) lastDownloadedFileHashSet.add(ph)
                                if (showToastNotification) toast(T.downloaded + savedPath)
                            }
                        })
                }
            }
        })
        .catch(error => {
            let errMsg = '';
            try {
                if (error) {
                    if (typeof error === 'string') {
                        errMsg = error;
                    } else if (error.message) {
                        errMsg = error.message;
                    } else if (error.stack) {
                        errMsg = error.stack;
                    } else {
                        errMsg = JSON.stringify(error);
                    }
                }
            } catch (e) {
                errMsg = String(error);
            }
            throw { source: 'download', message: errMsg };
        })
}

// 监听剪贴板：检测到复制文件路径或 content URI 时自动上传
function uploadClipboardFile() {
    if (!enableFileSync || !enableClipboardFileSync) return Promise.resolve()
    var p = tryUploadClipboardPath()
    if (p) return p
    return tryUploadClipboardUri()
}

function tryUploadClipboardPath() {
    var text = getClip()
    if (text == null || text.length === 0) return null
    var path = String(text).trim()
    if (path.indexOf('\n') >= 0) return null
    if (!path.startsWith('/') && !path.startsWith('file://')) return null
    if (path.startsWith('file://')) path = path.substring(7)
    try {
        if (!files.exists(path) || !files.isFile(path)) return null
    } catch (e) { return null }
    var name = path.substring(path.lastIndexOf('/') + 1)
    if (!name || name.startsWith('.')) return null
    if (uploadingNow.has(name)) return null
    var mtime = 0
    try { mtime = files.getLastModified(path) } catch (e) {}
    var imgExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']
    var nameLower = name.toLowerCase()
    var isImg = false
    for (var i = 0; i < imgExt.length; i++) {
        if (nameLower.substring(nameLower.length - imgExt[i].length) === imgExt[i]) { isImg = true; break }
    }
    uploadingNow.add(name)
    return uploadFileItem(name, path, mtime, {
        profileType: isImg ? 'Image' : 'File',
        removeAfterUpload: false,
        isScreenshot: false
    }).finally(function() { uploadingNow.delete(name) }).then(function() {
        lastUploadedClipboardFile = text
        return Promise.resolve()
    })
}

function tryUploadClipboardUri() {
    try {
        var ctx = typeof context !== 'undefined' ? context : (typeof runtime !== 'undefined' && runtime.getContext ? runtime.getContext() : null)
        if (!ctx) return Promise.resolve()
        var cm = ctx.getSystemService(android.content.Context.CLIPBOARD_SERVICE)
        var clip = cm.getPrimaryClip()
        if (clip == null || clip.getItemCount() === 0) return Promise.resolve()
        var item = clip.getItemAt(0)
        var uri = item.getUri()
        if (uri == null) return Promise.resolve()
        var uriStr = String(uri.toString())
        if (!uriStr.startsWith('content://') && !uriStr.startsWith('file://')) return Promise.resolve()
        if (uriStr === lastUploadedClipboardFile) return Promise.resolve()
        var name = 'clipboard_' + Date.now() + '.png'
        var cursor = null
        try {
            cursor = ctx.getContentResolver().query(uri, null, null, null, null)
            if (cursor != null && cursor.moveToFirst()) {
                var idx = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (idx >= 0) {
                    var dn = cursor.getString(idx)
                    if (dn != null && dn.length > 0) name = dn.substring(dn.lastIndexOf('/') + 1) || name
                }
            }
        } catch (e) {}
        if (cursor != null) try { cursor.close() } catch (e2) {}
        var tempPath = files.join(files.cwd(), '.sync_clip_' + Date.now() + '_' + name)
        var is = null
        var fos = null
        try {
            is = ctx.getContentResolver().openInputStream(uri)
            if (is == null) return Promise.resolve()
            var buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 8192)
            fos = new java.io.FileOutputStream(tempPath)
            var n
            while ((n = is.read(buf)) > 0) fos.write(buf, 0, n)
        } catch (e) {
            console.log('clipboard uri read failed: ' + (e && e.message ? e.message : e))
            return Promise.resolve()
        } finally {
            try { if (is) is.close() } catch (e2) {}
            try { if (fos) fos.close() } catch (e2) {}
        }
        return uploadFileItem(name, tempPath, 0, {
            profileType: 'Image',
            removeAfterUpload: true,
            isScreenshot: false
        }).then(function() {
            lastUploadedClipboardFile = uriStr
            return Promise.resolve()
        }).finally(function() {
            try { if (files.exists(tempPath)) files.remove(tempPath) } catch (e2) {}
        })
    } catch (e) {
        return Promise.resolve()
    }
}

function upload() {
    let text = getClip()
    if (text == null || text.length === 0) return Promise.resolve(true)
    if (lastUploadedClipboardFile && (text === lastUploadedClipboardFile || text === 'file://' + lastUploadedClipboardFile)) return Promise.resolve(true)
    if (text != remoteCache && text != lastUploadedClipboard) {
        return httpRequest({
            method: 'put',
            url: getApiUrl(),
            headers: {
                'authorization': authHeader,
                'Content-Type': 'application/json',
            },
            data: {
                'type': 'Text',
                'text': text,
                'hasData': false
            }
        }).then(res => {
            if (res.status < 200 || res.status >= 300) {
                throw res.status + ' ' + res.statusText
            }
            remoteCache = text
            lastUploadedClipboard = text
            return false
        })
        .catch(error => {
            let errMsg = '';
            try {
                if (error) {
                    if (typeof error === 'string') {
                        errMsg = error;
                    } else if (error.message) {
                        errMsg = error.message;
                    } else if (error.stack) {
                        errMsg = error.stack;
                    } else {
                        errMsg = JSON.stringify(error);
                    }
                }
            } catch (e) {
                errMsg = String(error);
            }
            throw { source: 'upload', message: errMsg };
        })
    }
    return Promise.resolve(true);
}

setInterval(loop, intervalTime)
 
// 监听通知并自动上传完整通知文本（受设置保护）
events.observeNotification();
events.onNotification(notification => {
	const text = notification.getText();
	const pkg = notification.getPackageName && notification.getPackageName();
	const allowed = pkg && notificationPackageWhitelist.indexOf(String(pkg)) >= 0;
	if (notificationUploadOn && allowed && text != null && text.length != 0 && text != lastUploadedNotification && text != lastDownloadedText) {
		uploadNotificationContent(text);
	}
});

// 简单的设置切换 UI，通过控制台交互（点击打开设置）
// 禁用：运行此脚本，然后点击对话框切换设置。
function toggleNotificationUploadSetting() {
	try {
		let current = settingsStorage.get('enableNotificationUpload', notificationUploadDefaultOn)
		current = !current
		settingsStorage.put('enableNotificationUpload', current)
		notificationUploadOn = current
		console.log('Notification upload ' + (current ? 'enabled' : 'disabled'))
	} catch (e) {
		console.error('Failed to toggle setting: ' + e)
	}
}

// --------------- 文件同步辅助函数 ---------------

function ensureDirectories() {
    try {
        if (enableFileSync) {
            if (!files.exists(uploadDir)) files.ensureDir(uploadDir)
            if (!files.exists(downloadDir)) files.ensureDir(downloadDir)
        }
    } catch (e) {
        // ignore
    }
}

function uploadFiles() {
    if (!enableFileSync) return Promise.resolve()
    var tasks = []
    var ud = (uploadDir + '').replace(/\/+$/, '')
    var scrDir = getActiveScreenshotDir()
    var sd = scrDir ? (scrDir + '').replace(/\/+$/, '') : ''
    try {
        if (ud !== sd) {
            if (enableGroupUpload) {
                var dirNames = files.listDir(uploadDir) || []
                for (var di = 0; di < dirNames.length; di++) {
                    var dirName = dirNames[di]
                    if (dirName.startsWith('.')) continue
                    var dirPath = files.join(uploadDir, dirName)
                    if (!files.isDir(dirPath)) continue
                    var zipName = dirName + '.zip'
                    if (uploadingNow.has(zipName)) continue
                    try {
                        var zipBytes = zipFolder(dirPath)
                        if (!zipBytes || zipBytes.length === 0) continue
                        var groupHash = computeGroupHash(zipBytes)
                        var ghUpper = groupHash ? String(groupHash).toUpperCase() : ''
                        if (ghUpper && lastUploadedFileHashSet.has(ghUpper)) continue
                        uploadingNow.add(zipName)
                        tasks.push(uploadGroupItem(dirName, dirPath, zipName, zipBytes, groupHash)
                            .finally(function() { uploadingNow.delete(zipName) }))
                    } catch (e) { /* 跳过 */ }
                }
            }
            var names = files.listDir(uploadDir) || []
            names = names.filter(function(n) { return files.isFile(files.join(uploadDir, n)) })
            names = names.filter(function(n) { return !n.startsWith('.') })
            for (var i = 0; i < names.length; i++) {
                var name = names[i]
                var fullPath = files.join(uploadDir, name)
                var mtime = 0
                try { mtime = files.getLastModified(fullPath) } catch (e) { mtime = new Date().getTime() }
                if (uploadedFileMTimeMap[name] !== mtime && !uploadingNow.has(name)) {
                    try {
                        var preBytes = files.readBytes(fullPath)
                        var preHash = computeFileHash(preBytes, name)
                        var preHashUpper = preHash ? String(preHash).toUpperCase() : ''
                        if (preHashUpper && lastUploadedFileHashSet.has(preHashUpper)) {
                            uploadedFileMTimeMap[name] = mtime
                            continue
                        }
                    } catch (e) { /* 读取失败则继续走上传流程 */ }
                    ;(function(n, fp, mt) {
                        uploadingNow.add(n)
                        tasks.push(uploadFileItem(n, fp, mt, { profileType: 'File', removeAfterUpload: true, isScreenshot: false })
                            .finally(function() { uploadingNow.delete(n) }))
                    })(name, fullPath, mtime)
                }
            }
        }
        if (enableScreenshotUpload && scrDir && tasks.length === 0) {
            var imgExt = ['.png', '.jpg', '.jpeg', '.webp']
            if (!screenshotLastState[scrDir + '_init']) {
                var names0 = files.listDir(scrDir) || []
                for (var j0 = 0; j0 < names0.length; j0++) {
                    var fname0 = names0[j0]
                    var nameLower0 = fname0.toLowerCase()
                    var isImg0 = false
                    for (var k0 = 0; k0 < imgExt.length; k0++) {
                        if (nameLower0.substring(nameLower0.length - imgExt[k0].length) === imgExt[k0]) { isImg0 = true; break }
                    }
                    if (!isImg0) continue
                    var fullPath0 = files.join(scrDir, fname0)
                    if (!files.isFile(fullPath0)) continue
                    var mtime0 = 0
                    try { mtime0 = files.getLastModified(fullPath0) } catch (e) {}
                    screenshotLastState[fullPath0] = mtime0
                    screenshotInitFiles.add(fullPath0)
                }
                screenshotLastState[scrDir + '_init'] = true
                if (!screenshotDirsChecked && showToastNotification) {
                    screenshotDirsChecked = true
                    toast(T.screenshotDirFound + scrDir)
                }
            } else {
                var names2 = files.listDir(scrDir) || []
                for (var j = 0; j < names2.length; j++) {
                    var fname = names2[j]
                    var nameLower = fname.toLowerCase()
                    var isImg = false
                    for (var k = 0; k < imgExt.length; k++) {
                        if (nameLower.substring(nameLower.length - imgExt[k].length) === imgExt[k]) { isImg = true; break }
                    }
                    if (!isImg) continue
                    var fullPath = files.join(scrDir, fname)
                    if (!files.isFile(fullPath)) continue
                    var mtime = 0
                    try { mtime = files.getLastModified(fullPath) } catch (e) {}
                    if (uploadedFileMTimeMap[fname] === mtime) continue
                    if (uploadingNow.has(fname)) continue
                    if (screenshotInitFiles.has(fullPath)) continue
                    // 等待元数据稳定：首次检测或 mtime 变化时仅记录不上传，避免系统修改文件造成重复上传
                    if (screenshotLastState[fullPath] === undefined) {
                        screenshotLastState[fullPath] = mtime
                        continue
                    }
                    if (screenshotLastState[fullPath] !== mtime) {
                        screenshotLastState[fullPath] = mtime
                        continue
                    }
                    // mtime 已稳定（至少一个周期未变），获取元数据后再校验 hash 并上传
                    try {
                        var preBytes = files.readBytes(fullPath)
                        var preHash = computeFileHash(preBytes, fname)
                        var preHashUpper = preHash ? String(preHash).toUpperCase() : ''
                        if (preHashUpper && lastUploadedFileHashSet.has(preHashUpper)) {
                            var mtNow = 0
                            try { mtNow = files.getLastModified(fullPath) } catch (e2) {}
                            uploadedFileMTimeMap[fname] = mtNow
                            screenshotLastState[fullPath] = mtNow
                            continue
                        }
                    } catch (e) { /* 读取失败则继续走上传流程 */ }
                    screenshotLastState[fullPath] = mtime
                    ;(function(n, fp, mt) {
                        uploadingNow.add(n)
                        tasks.push(uploadFileItem(n, fp, mt, { profileType: 'Image', removeAfterUpload: false, isScreenshot: true })
                            .finally(function() { uploadingNow.delete(n) }))
                    })(fname, fullPath, mtime)
                }
                if (!screenshotDirsChecked && showToastNotification) {
                    screenshotDirsChecked = true
                    toast(T.screenshotDirFound + scrDir)
                }
            }
        } else if (enableScreenshotUpload && !scrDir && !screenshotDirsChecked && showToastNotification) {
            screenshotDirsChecked = true
            toast(T.screenshotDirNotFound)
        }
        if (tasks.length === 0) return Promise.resolve()
        return Promise.all(tasks).then(function() {})
    } catch (e) {
        return Promise.resolve()
    }
}

// 将文件夹打包为 zip 字节数组
function zipFolder(folderPath) {
    try {
        var baos = new java.io.ByteArrayOutputStream()
        var zos = new java.util.zip.ZipOutputStream(baos)
        var basePath = folderPath.replace(/\/+$/, '') + '/'
        var baseLen = basePath.length
        function addToZip(path) {
            var names = files.listDir(path) || []
            for (var i = 0; i < names.length; i++) {
                var name = names[i]
                var full = files.join(path, name)
                var rel = full.substring(baseLen).replace(/\\/g, '/')
                if (files.isFile(full)) {
                    var bytes = files.readBytes(full)
                    var ze = new java.util.zip.ZipEntry(rel)
                    zos.putNextEntry(ze)
                    zos.write(bytes)
                    zos.closeEntry()
                } else if (files.isDir(full)) {
                    var ze = new java.util.zip.ZipEntry(rel + '/')
                    zos.putNextEntry(ze)
                    zos.closeEntry()
                    addToZip(full)
                }
            }
        }
        addToZip(folderPath)
        zos.close()
        return baos.toByteArray()
    } catch (e) {
        return null
    }
}

function uploadGroupItem(dirName, dirPath, zipName, zipBytes, groupHash) {
    var encodedName = encodeURIComponent(zipName)
    var ghUpper = groupHash ? String(groupHash).toUpperCase() : ''
    uploadedFileThisCycle = true
    recentlyUploadedFiles.add(zipName)
    recentlyUploadedPaths.add(dirPath)
    if (groupHash) {
        lastUploadedFileHash[zipName] = groupHash
        lastUploadedFileHashSet.add(ghUpper)
    }
    lastUploadedClipboardFile = dirPath
    return httpRequest({ method: 'get', url: getApiUrl(), headers: { 'authorization': authHeader }, responseType: 'json' })
        .then(function(res) {
            if (res.status >= 200 && res.status < 300 && res.data) {
                var p = res.data
                if ((p.type === 'Group') && p.hash && groupHash && hashEqual(p.hash, groupHash)) {
                    recentlyUploadedFiles.add(zipName)
                    recentlyUploadedPaths.add(dirPath)
                    if (groupHash) lastUploadedFileHash[zipName] = groupHash
                    try {
                        function removeDir(p) {
                            var list = files.listDir(p) || []
                            for (var i = 0; i < list.length; i++) {
                                var fp = files.join(p, list[i])
                                if (files.isFile(fp)) files.remove(fp)
                                else if (files.isDir(fp)) removeDir(fp)
                            }
                            files.remove(p)
                        }
                        removeDir(dirPath)
                    } catch (e) {}
                    return Promise.resolve()
                }
            }
            return doUploadFile(zipName, dirPath, 0, zipBytes, groupHash, encodedName, 'Group', true, false)
        })
        .catch(function() { return doUploadFile(zipName, dirPath, 0, zipBytes, groupHash, encodedName, 'Group', true, false) })
}

// 获取应写入 uploadedFileMTimeMap 的 mtime：若文件仍存在则取当前值，避免系统修改 mtime 导致重复上传
function getMtimeToStore(fullPath, mtime, removeAfterUpload) {
    if (!removeAfterUpload) {
        try { return files.getLastModified(fullPath) } catch (e) {}
    }
    return mtime
}

function uploadFileItem(name, fullPath, mtime, opts) {
    opts = opts || {}
    var profileType = opts.profileType || 'File'
    var removeAfterUpload = opts.removeAfterUpload !== false
    var isScreenshot = opts.isScreenshot === true
    try {
        var bytes = files.readBytes(fullPath)
        var fileHash = computeFileHash(bytes, name)
        var fhUpper = fileHash ? String(fileHash).toUpperCase() : ''
        if (fhUpper && lastUploadedFileHashSet.has(fhUpper)) {
            uploadedFileMTimeMap[name] = getMtimeToStore(fullPath, mtime, opts.removeAfterUpload !== false)
            return Promise.resolve()
        }
        if (uploadedFileMTimeMap[name] === mtime) return Promise.resolve()
        if (recentlyUploadedPaths.has(fullPath)) {
            uploadedFileMTimeMap[name] = getMtimeToStore(fullPath, mtime, opts.removeAfterUpload !== false)
            return Promise.resolve()
        }
        uploadedFileThisCycle = true
        recentlyUploadedFiles.add(name)
        recentlyUploadedPaths.add(fullPath)
        if (fileHash) {
            lastUploadedFileHash[name] = fileHash
            lastUploadedFileHashSet.add(fhUpper)
        }
        // 按 SyncClipboard 设计：hash 为内容唯一标识，已上传内容不再清除
        var encodedName = encodeURIComponent(name)
        return httpRequest({ method: 'get', url: getApiUrl(), headers: { 'authorization': authHeader }, responseType: 'json' })
            .then(function(res) {
                if (res.status >= 200 && res.status < 300 && res.data) {
                    var p = res.data
                    if ((p.type === 'File' || p.type === 'Image' || p.type === 'Group') && p.hash && fileHash && hashEqual(p.hash, fileHash)) {
                        uploadedFileMTimeMap[name] = getMtimeToStore(fullPath, mtime, removeAfterUpload)
                        recentlyUploadedFiles.add(name)
                        recentlyUploadedPaths.add(fullPath)
                        lastUploadedClipboardFile = fullPath
                        if (fileHash) lastUploadedFileHash[name] = fileHash
                        if (removeAfterUpload) try { files.remove(fullPath) } catch (e) {}
                        return Promise.resolve()
                    }
                }
                return doUploadFile(name, fullPath, mtime, bytes, fileHash, encodedName, profileType, removeAfterUpload, isScreenshot)
            })
            .catch(function() { return doUploadFile(name, fullPath, mtime, bytes, fileHash, encodedName, profileType, removeAfterUpload, isScreenshot) })
    } catch (e) {
        return Promise.resolve()
    }
}

function doUploadFile(name, fullPath, mtime, bytes, fileHash, encodedName, profileType, removeAfterUpload, isScreenshot) {
    profileType = profileType || 'File'
    removeAfterUpload = removeAfterUpload !== false
    try {
        // 使用 BufferedSink 回调直接写入字节，避免 byte[] 在 JS 层被转换导致损坏
        let res
        let uploadSuccess = false
        
        try {
            res = http.request(getFileApiBaseUrl() + encodedName, {
                method: 'PUT',
                headers: { 'authorization': authHeader },
                contentType: 'application/octet-stream',
                body: function(sink) { sink.write(bytes) },
                timeout: 60000,
            })
            if (res && res.statusCode >= 200 && res.statusCode < 300) {
                uploadSuccess = true
            }
        } catch (e) {
            console.log('http.request BufferedSink failed, try direct body: ' + e.message)
            try {
                res = http.request(getFileApiBaseUrl() + encodedName, {
                    method: 'PUT',
                    headers: { 'authorization': authHeader, 'Content-Type': 'application/octet-stream' },
                    body: bytes,
                    timeout: 60000,
                })
                if (res && res.statusCode >= 200 && res.statusCode < 300) uploadSuccess = true
            } catch (e2) {
                console.log('http.request direct body failed: ' + e2.message)
            }
        }
        
        // 上传失败
        if (!uploadSuccess) {
            if (showToastNotification) toast(T.uploadFailed + name)
            return Promise.resolve()
        }
        
        // 处理成功上传的 http.request
        if (uploadSuccess) {
            uploadedFileThisCycle = true
            uploadedFileMTimeMap[name] = getMtimeToStore(fullPath, mtime, removeAfterUpload)
            recentlyUploadedFiles.add(name)
            recentlyUploadedPaths.add(fullPath)
            lastUploadedClipboardFile = fullPath
            if (fileHash) {
                lastUploadedFileHash[name] = fileHash
                lastUploadedFileHashSet.add(String(fileHash).toUpperCase())
            }
            if (removeAfterUpload) {
                try {
                    if (files.isDir(fullPath)) {
                        function removeDirRecur(p) {
                            var list = files.listDir(p) || []
                            for (var i = 0; i < list.length; i++) {
                                var fp = files.join(p, list[i])
                                if (files.isFile(fp)) files.remove(fp)
                                else if (files.isDir(fp)) removeDirRecur(fp)
                            }
                            files.remove(p)
                        }
                        removeDirRecur(fullPath)
                    } else {
                        files.remove(fullPath)
                    }
                } catch (e) {}
            }
            
            return httpRequest({
                method: 'put',
                url: getApiUrl(),
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                data: {
                    'type': profileType,
                    'text': '',
                    'hasData': true,
                    'dataName': name,
                    'hash': fileHash || ''
                }
            }).then(res2 => {
                if (res2.status < 200 || res2.status >= 300) {
                    throw res2.status + ' ' + res2.statusText
                }
                if (showToastNotification) toast(profileType === 'Image' ? T.screenshotUploaded + name : (profileType === 'Group' ? T.groupUploaded + name : T.uploaded + name))
            }).catch(() => {})
        }
    } catch (e) {
        return Promise.resolve()
    }
}

function downloadTextFile(dataName) {
    const encoded = encodeURIComponent(dataName)
    try {
        const res = http.get(getFileApiBaseUrl() + encoded, {
            headers: { 'authorization': authHeader },
            timeout: 10000,
        })
        if (!res || res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error('HTTP ' + (res && res.statusCode))
        }
        const bytes = res.body.bytes()
        let str
        try {
            str = new java.lang.String(bytes, 'UTF-8').toString()
        } catch (e) {
            const tempPath = files.join(files.cwd(), '.sync_temp_' + Date.now() + '.txt')
            files.writeBytes(tempPath, bytes)
            str = files.read(tempPath)
            try { files.remove(tempPath) } catch (e2) {}
        }
        return Promise.resolve(str)
    } catch (e) {
        if (showToastNotification) toast(T.textDownloadFailed + dataName)
        return Promise.resolve(null)
    }
}

function downloadFile(fileName, expectedHash, isGroup) {
    const safeName = fileName
    const encoded = encodeURIComponent(fileName)
    const targetPath = files.join(downloadDir, safeName)
    try {
        const res = http.get(getFileApiBaseUrl() + encoded, {
            headers: { 'authorization': authHeader },
            timeout: 60000,
        })
        if (!res || res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error('HTTP ' + (res && res.statusCode))
        }
        const bytes = res.body.bytes()
        if (expectedHash) {
            var actualHash = isGroup ? computeGroupHash(bytes) : computeFileHash(bytes, fileName)
            if (actualHash && !hashEqual(actualHash, expectedHash)) {
                if (showToastNotification) toast(T.hashVerifyFailed + safeName)
                return Promise.resolve(null)
            }
        }
        try { if (files.exists(targetPath)) files.remove(targetPath) } catch (e) {}
        files.writeBytes(targetPath, bytes)
        return Promise.resolve(targetPath)
    } catch (e) {
        if (showToastNotification) toast(T.downloadFailed + safeName)
        return Promise.resolve(null)
    }
}

function uploadNotificationContent(text) {
	if (text != null && text.length != 0) {
		return tryWithServers(() => httpRequest({
			method: 'put',
			url: getApiUrl(),
			headers: {
				'authorization': authHeader,
				'Content-Type': 'application/json',
			},
			data: {
				'type': 'Text',
				'text': text,
				'hasData': false
			}
		}).then(res => {
			if (res.status < 200 || res.status >= 300) {
				throw res.status + ' ' + res.statusText
			}
		}).then(() => {
			remoteCache = text; // 防止立即下载重新设置剪贴板
			lastUploadedNotification = text;
		})).catch(error => {
			let errMsg = '';
			try {
				if (error) {
					if (typeof error === 'string') {
						errMsg = error;
					} else if (error.message) {
						errMsg = error.message;
					} else if (error.stack) {
						errMsg = error.stack;
					} else {
						errMsg = JSON.stringify(error);
					}
				}
			} catch (e) {
				errMsg = String(error);
			}
		});
	}
}
