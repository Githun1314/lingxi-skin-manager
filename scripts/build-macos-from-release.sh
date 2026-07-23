#!/bin/zsh
set -euo pipefail

SOURCE_DIR="${0:A:h:h}"
BASE_ZIP="${1:?Usage: build-macos-from-release.sh <base-macOS.zip>}"
VERSION="$(node -p "JSON.parse(require('fs').readFileSync('${SOURCE_DIR}/package.json','utf8')).version")"
DIST_DIR="$SOURCE_DIR/dist"
OUTPUT_ZIP="$DIST_DIR/WPS-Lingxi-Skin-Manager-v${VERSION}-macOS.zip"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lingxi-macos-release.XXXXXX")"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

ditto -x -k "$BASE_ZIP" "$WORK_DIR"
APP_CANDIDATES=("$WORK_DIR"/*.app(N))
if (( ${#APP_CANDIDATES[@]} != 1 )); then
  print -u2 "Expected exactly one app bundle in the base archive."
  exit 1
fi

APP_PATH="$APP_CANDIDATES[1]"
MANAGER_DIR="$APP_PATH/Contents/Resources/manager"
mkdir -p "$MANAGER_DIR" "$DIST_DIR"
rsync -a --delete --delete-excluded \
  --exclude '.git' \
  --exclude '.github' \
  --exclude '.gitignore' \
  --exclude '.DS_Store' \
  --exclude 'dist' \
  --exclude 'node_modules' \
  --exclude 'scripts' \
  --exclude 'tmp' \
  "$SOURCE_DIR/" "$MANAGER_DIR/"

chmod +x "$APP_PATH/Contents/MacOS/launcher"
codesign --force --deep --sign - "$APP_PATH"
rm -f "$OUTPUT_ZIP"
ditto -c -k --sequesterRsrc --keepParent "$APP_PATH" "$OUTPUT_ZIP"
echo "$OUTPUT_ZIP"
