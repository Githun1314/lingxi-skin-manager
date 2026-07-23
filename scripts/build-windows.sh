#!/bin/zsh
set -euo pipefail

SOURCE_DIR="${0:A:h:h}"
WORKSPACE_DIR="${SOURCE_DIR:h}"
VERSION="$(node -p "JSON.parse(require('fs').readFileSync('${SOURCE_DIR}/package.json','utf8')).version")"
NODE_VERSION="${NODE_VERSION:-v24.15.0}"
NODE_ARCHIVE="node-${NODE_VERSION}-win-x64.zip"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_ARCHIVE}"
NODE_SHASUMS_URL="https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt"
CACHE_DIR="${TMPDIR:-/tmp}/lingxi-skin-manager-runtime"
CACHE_ARCHIVE="$CACHE_DIR/$NODE_ARCHIVE"
CACHE_SHASUMS="$CACHE_DIR/SHASUMS256-${NODE_VERSION}.txt"
DIST_DIR="$WORKSPACE_DIR/dist"
ZIP_PATH="$DIST_DIR/WPS灵犀皮肤管理器-v${VERSION}-Windows-x64.zip"
BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lingxi-windows-build.XXXXXX")"
PACKAGE_DIR="$BUILD_DIR/Lingxi-Skin-Manager-Windows"

cleanup() {
  rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

mkdir -p "$CACHE_DIR" "$DIST_DIR" "$PACKAGE_DIR/manager" "$PACKAGE_DIR/runtime"
if [[ ! -f "$CACHE_ARCHIVE" ]]; then
  curl -fL "$NODE_URL" -o "$CACHE_ARCHIVE"
fi
if [[ ! -f "$CACHE_SHASUMS" ]]; then
  curl -fsSL "$NODE_SHASUMS_URL" -o "$CACHE_SHASUMS"
fi

EXPECTED_SHA="$(awk -v file="$NODE_ARCHIVE" '$2 == file { print $1 }' "$CACHE_SHASUMS")"
ACTUAL_SHA="$(shasum -a 256 "$CACHE_ARCHIVE" | awk '{ print $1 }')"
if [[ -z "$EXPECTED_SHA" || "$EXPECTED_SHA" != "$ACTUAL_SHA" ]]; then
  echo "Node.js Windows runtime checksum verification failed" >&2
  exit 1
fi

unzip -q "$CACHE_ARCHIVE" -d "$BUILD_DIR/node"
NODE_DIR="$BUILD_DIR/node/node-${NODE_VERSION}-win-x64"
cp "$NODE_DIR/node.exe" "$PACKAGE_DIR/runtime/node.exe"
cp "$NODE_DIR/LICENSE" "$PACKAGE_DIR/runtime/NODE-LICENSE.txt"

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
