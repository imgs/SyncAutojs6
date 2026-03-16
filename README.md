### SyncClipboard Android 自动同步脚本  

此脚本由 SyncClipboard 项目 script 目录下的 SyncAutoxJs.js 文件衍生而来  
已实现无感同步剪贴板、文件、截图、通知等功能，支持 Android 16 等系统，安装 AutoJs6 后使用，无需 Root 权限

功能说明：  

0. 多服务器支持 - 可同时配置多个服务器地址，按顺序尝试，直到某个成功或全部失败（文件名后面带x的为多服务器版）
1. 剪贴板文本同步 - 自动上传/下载文本剪贴板，与 SyncClipboard 服务器保持同步
2. 文件同步 - 监控 Upload 目录，新文件自动上传后删除，同步下载的文件在 Download 目录，这两个目录默认在 /sdcard/SyncClipboard/中可以找到（可关闭 enableFileSync）
3. 截图上传 - 监控截图目录，新截图自动上传（可关闭 enableScreenshotUpload）
4. 通知上传 - 支持自定义通知上传白名单，例如将微信/短信等通知内容自动上传为剪贴板（可关闭 notificationUploadDefaultOn）
5. 剪贴板文件同步 - 监听剪贴板，检测到复制文件和 content URI 时自动上传（可关闭 enableClipboardFileSync）
6. Group 上传 - Upload 目录下的子文件夹会打包为 zip 并作为 Group 上传（可关闭 enableGroupUpload）

设计说明：
- 适配 SyncClipboard v3.x API，遵循 Hash.md 以 hash 作为内容唯一标识
- 截图上传前等待元数据稳定，避免系统修改文件导致重复上传
- 脚本启动时已存在的截图不参与上传，仅同步运行期间新产生的截图
- 上传过的内容（hash）永久记录，避免重复上传及误下载

使用说明：
1. 安装 [AutoJs6](https://github.com/SuperMonster003/AutoJs6)，并对AutoJs6授权和开启所有文件访问权限、剪贴板、悬浮窗、自启动、电池优化不受限等权限
2. 在 AutoJs6 中安装本脚本，并配置 User Config
3. 运行脚本，即可实现无感同步剪贴板、文件、截图、通知等功能
4. 需要搭配 SyncClipboard 服务器使用，服务器搭建请参考 SyncClipboard 项目 README.md
5. 息屏同步可能需要用到改版 [Shizuku](https://github.com/thedjchi/Shizuku)，如有root权限可尝试原版 [Shizuku](https://github.com/RikkaApps/Shizuku)，请自行安装测试

测试环境：
Android 16（小米 HyperOS 3.0）和 HarmonyOS 3.0（华为平板）系统中测试正常，其他设备/系统未测试

特别感谢：  
SyncClipboard 作者：Jeric-X，项目采用 MIT License  
项目地址：https://github.com/Jeric-X/SyncClipboard

AutoJs6 作者：SuperMonster003，项目采用 MPL-2.0 License  
项目地址：https://github.com/SuperMonster003/AutoJs6
