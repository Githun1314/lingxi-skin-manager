#!/bin/zsh
set -euo pipefail

SOURCE_DIR="${0:A:h:h}"
WORKSPACE_DIR="${SOURCE_DIR:h}"
APP_NAME="WPS灵犀皮肤管理器.app"
APP_PATH="$WORKSPACE_DIR/$APP_NAME"
RESOURCE_DIR="$APP_PATH/Contents/Resources/manager"
DIST_DIR="$WORKSPACE_DIR/dist"
ZIP_PATH="$DIST_DIR/WPS灵犀皮肤管理器-v0.6.2-macOS.zip"

mkdir -p "$RESOURCE_DIR" "$DIST_DIR"
rsync -a --delete --delete-excluded --exclude '.DS_Store' --exclude 'scripts' --exclude 'tmp' "$SOURCE_DIR/" "$RESOURCE_DIR/"
chmod +x "$APP_PATH/Contents/MacOS/launcher"
codesign --force --deep --sign - "$APP_PATH"
rm -f "$ZIP_PATH"
ditto -c -k --sequesterRsrc --keepParent "$APP_PATH" "$ZIP_PATH"
echo "$ZIP_PATH"
