# Windows 使用说明

推荐使用单文件版 `WPS-Lingxi-Skin-Manager-Windows-x64.exe`。它把管理器、运行环境和皮肤素材放在一个文件中，不修改 WPS 灵犀的安装文件，也不要求用户安装 Node.js 或解压其他文件。

## 快速开始

1. 下载 `WPS-Lingxi-Skin-Manager-Windows-x64.exe`。
2. 双击运行，管理页面会自动在默认浏览器中打开。
3. 浏览器打开管理页面后，点击“连接并重新启动灵犀”。
4. 选择皮肤并点击“应用皮肤”。

单文件版不会在首次启动时下载额外运行环境。主题配置和上传素材仍只保存在本机。

目前测试版未进行商业代码签名，Windows 可能显示 SmartScreen 提示。公开大范围分发前建议使用代码签名证书签署 `.exe`。

原有 ZIP 便携包仍保留为备用版本；它提供单独的启动和停止脚本。

## 灵犀路径识别

管理器会在以下位置自动寻找 `wpslingxi.exe`：

- `%LOCALAPPDATA%\Kingsoft\WPS Office\<版本号>\office6\wpslingxi.exe`
- `%ProgramFiles%\Kingsoft\WPS Office\<版本号>\office6\wpslingxi.exe`
- `%ProgramFiles(x86)%\Kingsoft\WPS Office\<版本号>\office6\wpslingxi.exe`
- `%LOCALAPPDATA%\Programs\Lingxi\`
- `%LOCALAPPDATA%\Programs\lingxi-desktop\`
- 常见的 WPS Lingxi 独立安装目录

如果 WPS 安装在其他磁盘或自定义目录，可以先在命令提示符中设置：

```bat
setx LINGXI_APP_PATH "D:\你的安装目录\灵犀主程序.exe"
```

重新打开皮肤管理器后生效。

## 个性化应用入口

上传 Logo、填写名称后点击“生成应用入口”，管理器会创建：

- Windows 桌面快捷方式；
- Windows 开始菜单快捷方式；
- 由上传形象生成的本地图标。

快捷方式只负责启动皮肤管理器和官方 WPS 灵犀，不会复制或修改官方程序。

## 当前验证状态

v0.7.0 已完成以下检查：

- Windows 包结构、首次运行下载和固定 SHA256 校验检查；
- Windows PowerShell 启动脚本语法检查；
- 安装路径发现、进程管理和快捷方式逻辑审查；
- macOS 原有能力回归检查。

由于当前开发环境是 macOS，Windows 灵犀客户端上的最终连接、启动页和界面选择器仍标记为预览状态。提交问题时请附上 Windows 版本、WPS 灵犀版本及隐藏个人内容后的截图。
