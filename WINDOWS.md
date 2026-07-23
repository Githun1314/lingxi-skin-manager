# Windows 使用说明

推荐使用单文件版 `WPS-Lingxi-Skin-Manager-Windows-x64.exe`。它内置管理器运行环境和全部皮肤素材，不要求用户安装 Node.js，也不会修改 WPS 灵犀安装文件。

## 快速开始

1. 双击运行 EXE，管理页面会自动在默认浏览器中打开。
2. 第一次使用时点击“连接并重新启动灵犀”。
3. 选择主题，按需调整颜色或上传素材，然后点击“应用皮肤”。

主题配置保存在：

```text
%APPDATA%\Lingxi Skin Manager\theme.json
```

## 支持的客户端

Windows 版只连接 WPS 灵犀独立客户端，不会连接 WPS Office 安装目录中的 `wpslingxi.exe` 插件。管理器会自动识别常见的 `lingxi-desktop`、`WPS Lingxi` 和 `WPS 灵犀` 安装目录。

如果使用自定义安装目录，可以设置：

```bat
setx LINGXI_APP_PATH "D:\你的安装目录\WPS 灵犀.exe"
```

重新启动皮肤管理器后生效。

## 安全说明

管理服务只监听 `127.0.0.1`，不会向局域网或公网开放。当前测试版未进行商业代码签名，因此 Windows 可能显示 SmartScreen 提示；公开分发前建议为 EXE 添加代码签名。
