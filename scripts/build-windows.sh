#!/bin/zsh
set -euo pipefail

SOURCE_DIR="${0:A:h:h}"
WORKSPACE_DIR="${SOURCE_DIR:h}"
VERSION="$(node -p "JSON.parse(require('fs').readFileSync('${SOURCE_DIR}/package.json','utf8')).version")"
DIST_DIR="$WORKSPACE_DIR/dist"
ZIP_PATH="$DIST_DIR/WPS灵犀皮肤管理器-v${VERSION}-Windows-x64.zip"
BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lingxi-windows-build.XXXXXX")"
PACKAGE_DIR="$BUILD_DIR/Lingxi-Skin-Manager-Windows"

cleanup() {
  rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

mkdir -p "$DIST_DIR" "$PACKAGE_DIR/manager" "$PACKAGE_DIR/runtime"

rsync -a --delete \
  --exclude '.git' \
  --exclude '.github' \
  --exclude '.gitignore' \
  --exclude '.DS_Store' \
  --exclude 'node_modules' \
  --exclude 'scripts' \
  --exclude 'tmp' \
  "$SOURCE_DIR/" "$PACKAGE_DIR/manager/"

perl -pe 's/\r?\n/\r\n/g' "$SOURCE_DIR/scripts/windows/launcher.ps1" > "$PACKAGE_DIR/launcher.ps1"
perl -pe 's/\r?\n/\r\n/g' "$SOURCE_DIR/scripts/windows/stop-manager.ps1" > "$PACKAGE_DIR/stop-manager.ps1"
perl -pe 's/\r?\n/\r\n/g' "$SOURCE_DIR/scripts/windows/start.cmd" > "$PACKAGE_DIR/Start-Lingxi-Skin-Manager.cmd"
perl -pe 's/\r?\n/\r\n/g' "$SOURCE_DIR/scripts/windows/stop.cmd" > "$PACKAGE_DIR/Stop-Lingxi-Skin-Manager.cmd"
cp "$SOURCE_DIR/WINDOWS.md" "$PACKAGE_DIR/README-Windows.md"

rm -f "$ZIP_PATH"
(cd "$BUILD_DIR" && zip -qr "$ZIP_PATH" "$(basename "$PACKAGE_DIR")")
echo "$ZIP_PATH"
