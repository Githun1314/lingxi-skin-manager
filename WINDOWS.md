# Windows 使用说明

Windows 版为独立便携包，不修改 WPS 灵犀的安装文件，也不要求用户另外安装 Node.js。

## 快速开始

1. 下载并完整解压 `WPS灵犀皮肤管理器-v0.7.0-Windows-x64.zip`。
2. 双击 `Start-Lingxi-Skin-Manager.cmd`。
3. 浏览器打开管理页面后，点击“连接并重新启动灵犀”。
4. 选择皮肤并点击“应用皮肤”。

需要关闭后台管理器时，双击包内的 `Stop-Lingxi-Skin-Manager.cmd`。

## 灵犀路径识别

管理器会在以下位置自动寻找 `wpslingxi.exe`：

- `%LOCALAPPDATA%\Kingsoft\WPS Office\<版本号>\office6\wpslingxi.exe`
- `%ProgramFiles%\Kingsoft\WPS Office\<版本号>\office6\wpslingxi.exe`
- `%ProgramFiles(x86)%\Kingsoft\WPS Office\<版本号>\office6\wpslingxi.exe`
- 常见的 WPS Lingxi 独立安装目录

如果 WPS 安装在其他磁盘或自定义目录，可以先在命令提示符中设置：

```bat
setx LINGXI_APP_PATH "D:\你的安装目录\office6\wpslingxi.exe"
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

- Windows 包结构和内置运行环境检查；
- Windows PowerShell 启动脚本语法检查；
- 安装路径发现、进程管理和快捷方式逻辑审查；
- macOS 原有能力回归检查。

由于当前开发环境是 macOS，Windows 灵犀客户端上的最终连接、启动页和界面选择器仍标记为预览状态。提交问题时请附上 Windows 版本、WPS 灵犀版本及隐藏个人内容后的截图。
